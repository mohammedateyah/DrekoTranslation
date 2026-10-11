"use strict";

const REQUEST_TIMEOUT_MS = 15000;
const MAX_RESULTS = 60;
let igdbTokenCache = { key: "", token: "", expiresAt: 0 };

class ImageSearchError extends Error {
  constructor(code) {
    super(code);
    this.name = "ImageSearchError";
    this.code = code;
  }
}

function trustedImageUrl(value) {
  try {
    const url = new URL(value);
    const allowedHosts = new Set([
      "images.igdb.com",
      "cdn.thegamesdb.net",
      "cdn.steamgriddb.com"
    ]);
    return url.protocol === "https:" &&
      (!url.port || url.port === "443") &&
      allowedHosts.has(url.hostname.toLowerCase()) &&
      !url.username &&
      !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function appendImage(images, seen, image) {
  const url = trustedImageUrl(image.url);
  if (!url || seen.has(url) || images.length >= MAX_RESULTS) return;
  seen.add(url);
  images.push({
    url,
    source: image.source,
    title: String(image.title || "").slice(0, 100),
    type: String(image.type || "").slice(0, 40)
  });
}

async function requestJson(fetchImpl, url, options = {}) {
  let response;
  try {
    response = await fetchImpl(url, {
      ...options,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch {
    throw new ImageSearchError("NETWORK_ERROR");
  }
  if (!response.ok) throw new ImageSearchError("PROVIDER_HTTP_ERROR");
  try {
    return await response.json();
  } catch {
    throw new ImageSearchError("INVALID_PROVIDER_RESPONSE");
  }
}

async function getIgdbToken(credentials, fetchImpl) {
  const cacheKey = `${credentials.igdbClientId}\u0000${credentials.igdbClientSecret}`;
  if (igdbTokenCache.key === cacheKey && igdbTokenCache.expiresAt > Date.now()) {
    return igdbTokenCache.token;
  }
  const tokenUrl = new URL("https://id.twitch.tv/oauth2/token");
  tokenUrl.searchParams.set("client_id", credentials.igdbClientId);
  tokenUrl.searchParams.set("client_secret", credentials.igdbClientSecret);
  tokenUrl.searchParams.set("grant_type", "client_credentials");
  const tokenResponse = await requestJson(fetchImpl, tokenUrl, { method: "POST" });
  if (typeof tokenResponse.access_token !== "string" ||
      !Number.isFinite(tokenResponse.expires_in) ||
      tokenResponse.expires_in <= 0) {
    throw new ImageSearchError("INVALID_PROVIDER_RESPONSE");
  }
  igdbTokenCache = {
    key: cacheKey,
    token: tokenResponse.access_token,
    expiresAt: Date.now() + Math.max(0, tokenResponse.expires_in - 60) * 1000
  };
  return igdbTokenCache.token;
}

async function searchIgdb(query, credentials, fetchImpl) {
  const token = await getIgdbToken(credentials, fetchImpl);
  const games = await requestJson(fetchImpl, "https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": credentials.igdbClientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain"
    },
    body: `search "${query.replace(/["\\;\r\n]/g, " ")}"; fields name,cover.url,artworks.url,screenshots.url; limit 10;`
  });
  if (!Array.isArray(games)) throw new ImageSearchError("INVALID_PROVIDER_RESPONSE");
  const images = [];
  const seen = new Set();
  for (const game of games) {
    const title = game?.name || "";
    for (const [type, group] of [
      ["Cover", game?.cover ? [game.cover] : []],
      ["Artwork", game?.artworks],
      ["Screenshot", game?.screenshots]
    ]) {
      if (!Array.isArray(group)) continue;
      for (const item of group) {
        const imageUrl = typeof item?.url === "string"
          ? `https:${item.url.startsWith("//") ? item.url : `//${item.url}`}`
            .replace(/\/t_[^/]+\//, `/t_${type === "Cover" ? "cover_big_2x" : "1080p"}/`)
          : "";
        appendImage(images, seen, { url: imageUrl, source: "igdb", title, type });
      }
    }
  }
  return images;
}

async function searchTheGamesDb(query, apiKey, fetchImpl) {
  const endpoint = new URL("https://api.thegamesdb.net/v1.1/Games/ByGameName");
  endpoint.searchParams.set("apikey", apiKey);
  endpoint.searchParams.set("name", query);
  endpoint.searchParams.set("include", "boxart");
  const result = await requestJson(fetchImpl, endpoint);
  const games = result?.data?.games;
  const boxart = result?.include?.boxart;
  if (!Array.isArray(games)) {
    throw new ImageSearchError("INVALID_PROVIDER_RESPONSE");
  }
  if (!boxart?.data || !boxart?.base_url?.original) return [];
  const images = [];
  const seen = new Set();
  for (const game of games) {
    const files = boxart.data[String(game.id)];
    if (!Array.isArray(files)) continue;
    for (const file of files) {
      if (typeof file?.filename !== "string" || file.filename.includes("..")) continue;
      appendImage(images, seen, {
        url: new URL(file.filename, boxart.base_url.original).href,
        source: "thegamesdb",
        title: game.game_title,
        type: file.side === "back" ? "Back cover" : "Box art"
      });
    }
  }
  return images;
}

async function searchSteamGridDb(query, apiKey, fetchImpl) {
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
  const search = await requestJson(
    fetchImpl,
    `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(query)}`,
    { headers }
  );
  if (!Array.isArray(search?.data)) throw new ImageSearchError("INVALID_PROVIDER_RESPONSE");
  const games = search.data.slice(0, 5);
  const requests = games.flatMap((game) => {
    if (!Number.isSafeInteger(game?.id) || game.id < 1) return [];
    const gameId = encodeURIComponent(String(game.id));
    return ["grids", "heroes"].map((kind) => ({
      game,
      kind,
      promise: requestJson(
        fetchImpl,
        `https://www.steamgriddb.com/api/v2/${kind}/game/${gameId}?mimes=jpg,png,webp&limit=20`,
        { headers }
      )
    }));
  });
  const responses = await Promise.allSettled(requests.map((request) => request.promise));
  const images = [];
  const seen = new Set();
  const failures = [];
  responses.forEach((result, index) => {
    const { game, kind } = requests[index];
    if (result.status === "rejected") {
      failures.push(result.reason);
      return;
    }
    if (!Array.isArray(result.value?.data)) {
      failures.push(new ImageSearchError("INVALID_PROVIDER_RESPONSE"));
      return;
    }
    for (const image of result.value.data) {
      appendImage(images, seen, {
        url: image?.url,
        source: "steamgriddb",
        title: game.name,
        type: kind === "heroes" ? "Hero" : "Grid"
      });
    }
  });
  if (!images.length && failures.length) throw failures[0];
  return images;
}

async function searchGameArtwork(query, credentials, fetchImpl = fetch) {
  const normalizedQuery = typeof query === "string" ? query.trim() : "";
  if (!normalizedQuery || normalizedQuery.length > 100) {
    return { ok: false, code: "INVALID_SEARCH_QUERY" };
  }

  const providers = [
    {
      id: "igdb",
      configured: Boolean(credentials?.igdbClientId && credentials?.igdbClientSecret),
      search: () => searchIgdb(normalizedQuery, credentials, fetchImpl)
    },
    {
      id: "thegamesdb",
      configured: Boolean(credentials?.theGamesDbApiKey),
      search: () => searchTheGamesDb(normalizedQuery, credentials.theGamesDbApiKey, fetchImpl)
    },
    {
      id: "steamgriddb",
      configured: Boolean(credentials?.steamGridDbApiKey),
      search: () => searchSteamGridDb(normalizedQuery, credentials.steamGridDbApiKey, fetchImpl)
    }
  ];
  const attempted = [];
  const failures = [];

  for (const provider of providers) {
    if (!provider.configured) continue;
    attempted.push(provider.id);
    try {
      const images = await provider.search();
      if (images.length) {
        return { ok: true, data: { provider: provider.id, images, attempted, failures } };
      }
    } catch (error) {
      failures.push({
        provider: provider.id,
        code: error instanceof ImageSearchError ? error.code : "PROVIDER_REQUEST_FAILED"
      });
    }
  }

  if (!attempted.length) return { ok: false, code: "IMAGE_SEARCH_NOT_CONFIGURED" };
  if (failures.length === attempted.length) {
    return { ok: false, code: "IMAGE_SEARCH_PROVIDERS_UNAVAILABLE", data: { failures } };
  }
  return { ok: true, data: { provider: "", images: [], attempted, failures } };
}

module.exports = { searchGameArtwork, trustedImageUrl };
