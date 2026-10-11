"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { searchGameArtwork, trustedImageUrl } = require("../image-search.cjs");

function jsonResponse(data, status = 200, url = "") {
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    json: async () => data
  };
}

test("image search validates query and skips unconfigured providers", async () => {
  let fetchCount = 0;
  const result = await searchGameArtwork("   ", {}, async () => {
    fetchCount += 1;
    return jsonResponse({});
  });

  assert.deepEqual(result, { ok: false, code: "INVALID_SEARCH_QUERY" });
  assert.equal(fetchCount, 0);

  const unconfigured = await searchGameArtwork("Example", {}, async () => {
    fetchCount += 1;
    return jsonResponse({});
  });
  assert.deepEqual(unconfigured, { ok: false, code: "IMAGE_SEARCH_NOT_CONFIGURED" });
  assert.equal(fetchCount, 0);
});

test("image search uses the first configured provider with artwork", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    const target = new URL(url);
    calls.push(target.hostname);
    if (target.hostname === "id.twitch.tv") {
      return jsonResponse({ access_token: "test-token", expires_in: 3600 });
    }
    if (target.hostname === "api.igdb.com") return jsonResponse([]);
    if (target.hostname === "api.thegamesdb.net") {
      return jsonResponse({
        data: { games: [{ id: 42, game_title: "Example Game" }] },
        include: {
          boxart: {
            base_url: { original: "https://cdn.thegamesdb.net/images/original/" },
            data: { "42": [{ filename: "boxart/front/42.jpg", side: "front" }] }
          }
        }
      });
    }
    throw new Error("Unexpected provider request");
  };

  const result = await searchGameArtwork("Example Game", {
    igdbClientId: "client",
    igdbClientSecret: "secret",
    theGamesDbApiKey: "games-key",
    steamGridDbApiKey: "steam-key"
  }, fetchImpl);

  assert.equal(result.ok, true);
  assert.equal(result.data.provider, "thegamesdb");
  assert.deepEqual(result.data.attempted, ["igdb", "thegamesdb"]);
  assert.equal(result.data.images[0].title, "Example Game");
  assert.equal(result.data.images[0].url, "https://cdn.thegamesdb.net/images/original/boxart/front/42.jpg");
  assert.deepEqual(calls, ["id.twitch.tv", "api.igdb.com", "api.thegamesdb.net"]);
});

test("image search returns IGDB images without querying fallback providers", async () => {
  const hosts = [];
  const fetchImpl = async (url) => {
    const target = new URL(url);
    hosts.push(target.hostname);
    if (target.hostname === "id.twitch.tv") {
      return jsonResponse({ access_token: "test-token-2", expires_in: 3600 });
    }
    return jsonResponse([{
      name: "Example Game",
      cover: { url: "//images.igdb.com/igdb/image/upload/t_thumb/coexample.jpg" },
      artworks: [{ url: "//images.igdb.com/igdb/image/upload/t_1080p/artexample.jpg" }],
      screenshots: []
    }]);
  };

  const result = await searchGameArtwork("Example Game", {
    igdbClientId: "second-client",
    igdbClientSecret: "second-secret",
    theGamesDbApiKey: "games-key"
  }, fetchImpl);

  assert.equal(result.ok, true);
  assert.equal(result.data.provider, "igdb");
  assert.equal(result.data.images.length, 2);
  assert.equal(result.data.images[0].url, "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/coexample.jpg");
  assert.deepEqual(hosts, ["id.twitch.tv", "api.igdb.com"]);
});

test("image search falls through when TheGamesDB finds a game without artwork", async () => {
  const fetchImpl = async (url) => {
    const target = new URL(url);
    if (target.hostname === "api.thegamesdb.net") {
      return jsonResponse({ data: { games: [{ id: 12, game_title: "Example Game" }] } });
    }
    if (target.hostname === "www.steamgriddb.com" &&
        target.pathname.includes("/search/autocomplete/")) {
      return jsonResponse({ data: [{ id: 73, name: "Example Game" }] });
    }
    if (target.hostname === "www.steamgriddb.com" && target.pathname.includes("/grids/game/")) {
      return jsonResponse({ data: [{ url: "https://cdn.steamgriddb.com/grid.jpg" }] });
    }
    if (target.hostname === "www.steamgriddb.com" && target.pathname.includes("/heroes/game/")) {
      return jsonResponse({ data: [] });
    }
    throw new Error("Unexpected provider request");
  };

  const result = await searchGameArtwork("Example Game", {
    theGamesDbApiKey: "games-key",
    steamGridDbApiKey: "steam-key"
  }, fetchImpl);

  assert.equal(result.ok, true);
  assert.equal(result.data.provider, "steamgriddb");
  assert.deepEqual(result.data.attempted, ["thegamesdb", "steamgriddb"]);
  assert.equal(result.data.images.length, 1);
});

test("SteamGridDB results include supported grid and hero artwork", async () => {
  const fetchImpl = async (url) => {
    const target = new URL(url);
    if (target.pathname.includes("/search/autocomplete/")) {
      return jsonResponse({ data: [{ id: 73, name: "Example Game" }] });
    }
    if (target.pathname.includes("/grids/game/")) {
      return jsonResponse({ data: [{ url: "https://cdn.steamgriddb.com/grid.jpg" }] });
    }
    if (target.pathname.includes("/heroes/game/")) {
      return jsonResponse({ data: [{ url: "https://cdn.steamgriddb.com/hero.jpg" }] });
    }
    throw new Error("Unexpected SteamGridDB endpoint");
  };
  const result = await searchGameArtwork("Example Game", {
    steamGridDbApiKey: "steam-key"
  }, fetchImpl);

  assert.equal(result.ok, true);
  assert.equal(result.data.provider, "steamgriddb");
  assert.deepEqual(result.data.images.map((image) => image.type), ["Grid", "Hero"]);
});

test("provider failures fall through and report when no provider is available", async () => {
  const result = await searchGameArtwork("Example Game", {
    theGamesDbApiKey: "bad-key"
  }, async () => jsonResponse({}, 403));

  assert.deepEqual(result, {
    ok: false,
    code: "IMAGE_SEARCH_PROVIDERS_UNAVAILABLE",
    data: { failures: [{ provider: "thegamesdb", code: "PROVIDER_HTTP_ERROR" }] }
  });
});

test("only provider image hosts are trusted", () => {
  assert.equal(trustedImageUrl("https://images.igdb.com/art.jpg"), "https://images.igdb.com/art.jpg");
  assert.equal(trustedImageUrl("https://cdn.thegamesdb.net/art.jpg"), "https://cdn.thegamesdb.net/art.jpg");
  assert.equal(trustedImageUrl("https://cdn.steamgriddb.com/art.jpg"), "https://cdn.steamgriddb.com/art.jpg");
  assert.equal(trustedImageUrl("http://images.igdb.com/art.jpg"), "");
  assert.equal(trustedImageUrl("https://images.igdb.com:444/art.jpg"), "");
  assert.equal(trustedImageUrl("https://attacker.example/art.jpg"), "");
});
