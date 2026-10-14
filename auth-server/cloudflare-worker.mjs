import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";
import discordAuthModule from "./discord-auth.cjs";
import imageSearchModule from "../image-search.cjs";
import geminiTranslationModule from "../gemini-translation.cjs";
import { D1SessionStore } from "./cloudflare-session-store.mjs";

const { DiscordMembershipService } = discordAuthModule;
const { searchGameArtwork } = imageSearchModule;
const { requestBatch } = geminiTranslationModule;
const OAUTH_AUDIENCE =
  "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
const FIREBASE_KEYS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);
const FIREBASE_UID_PATTERN = /^discord_\d{17,20}$/;
const IMAGE_SEARCH_REQUEST_LIMIT = 4096;
const GEMINI_REQUEST_LIMIT = 128 * 1024;
const GEMINI_BATCH_ENTRY_LIMIT = 20;
const GEMINI_BATCH_CHARACTER_LIMIT = 18000;
const GEMINI_BATCH_ENTRY_CHARACTER_LIMIT = 16000;
const GEMINI_MODEL_PATTERN = /^[A-Za-z0-9.-]{1,80}$/;
const GEMINI_SOURCE_LANGUAGES = new Set([
  "auto", "en", "ja", "ko", "zh", "fr", "de", "es", "it", "pt", "ru", "tr", "pl", "other"
]);
const GEMINI_CATEGORIES = new Set([
  "dialogue", "subtitle", "ui", "quest", "item", "lore", "general"
]);
const GITHUB_RELEASE_API_URL =
  "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/latest?per_page=1&channel=stable";
const UPDATE_ASSET_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._ -]*\.(?:exe|blockmap)$/;

function response(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Pragma": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...headers
    }
  });
}

export async function serveUpdateRequest(request, fetcher = fetch) {
  const url = new URL(request.url);
  const isHeadRequest = request.method === "HEAD";
  if ((request.method !== "GET" && !isHeadRequest) || !url.pathname.startsWith("/updates/")) {
    return response(null, 404);
  }

  let fileName;
  try {
    fileName = decodeURIComponent(url.pathname.slice("/updates/".length));
  } catch {
    return response(null, 404);
  }

  if (fileName !== "latest.yml" && !UPDATE_ASSET_PATTERN.test(fileName)) {
    return response(null, 404);
  }

  let updateStage = "latest-release-api";
  try {
    const releaseResponse = await fetcher(GITHUB_RELEASE_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Dreko-Translation-Updater"
      },
      cf: { cacheEverything: true, cacheTtl: 30 }
    });
    if (!releaseResponse.ok) {
      console.error("Update feed GitHub response failed", updateStage, releaseResponse.status);
      return response(null, releaseResponse.status === 404 ? 404 : 502);
    }

    const release = await releaseResponse.json();
    if (typeof release.tag_name !== "string" || !/^v\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(release.tag_name)) {
      return response(null, 404);
    }
    updateStage = "release-asset-download";
    const assetUrl = new URL(
      `/mohammedateyah/DrekoTranslation/releases/download/${encodeURIComponent(release.tag_name)}/${encodeURIComponent(fileName)}`,
      "https://github.com"
    );
    const assetResponse = await fetcher(assetUrl.href, {
      method: request.method,
      headers: {
        ...(request.headers.has("range") ? { Range: request.headers.get("range") } : {})
      },
      redirect: "follow"
    });
    if (!assetResponse.ok) {
      console.error("Update feed GitHub response failed", updateStage, assetResponse.status);
      return response(null, assetResponse.status === 404 ? 404 : 502);
    }

    if (fileName === "latest.yml") {
      if (isHeadRequest) {
        return response(null, assetResponse.status, {
          "Cache-Control": "no-store",
          "Content-Type": "text/yaml; charset=utf-8"
        });
      }
      const updateManifest = (await assetResponse.text()).replace(
        /^(\s*(?:-\s*)?(?:url|path):\s*)(?:"([^"]*)"|'([^']*)'|([^\r\n]+))\s*$/gm,
        (_line, prefix, doubleQuoted, singleQuoted, unquoted) => {
          const assetName = doubleQuoted ?? singleQuoted ?? unquoted.trim();
          const workerAssetUrl = new URL(
            `/updates/${encodeURIComponent(assetName)}`,
            url.origin
          );
          return `${prefix}${JSON.stringify(workerAssetUrl.href)}`;
        }
      );
      return response(updateManifest, 200, {
        "Cache-Control": "no-store",
        "Content-Type": "text/yaml; charset=utf-8"
      });
    }

    if (assetResponse.status !== 200 && assetResponse.status !== 206) return response(null, 502);
    const downloadHeaders = {
      "Cache-Control": "no-store",
      "Content-Type": assetResponse.headers.get("content-type") || "application/octet-stream"
    };
    for (const header of ["accept-ranges", "content-length", "content-range", "etag", "last-modified"]) {
      const value = assetResponse.headers.get(header);
      if (value) downloadHeaders[header] = value;
    }
    return response(isHeadRequest ? null : assetResponse.body, assetResponse.status, downloadHeaders);
  } catch (error) {
    console.error("Update feed request failed", updateStage, error?.name || "UNKNOWN");
    return response(null, 502);
  }
}

function json(body, status = 200) {
  return response(JSON.stringify(body), status, {
    "Content-Type": "application/json; charset=utf-8"
  });
}

export function imageSearchProviderStatus(env) {
  return {
    igdb: Boolean(env.IGDB_CLIENT_ID && env.IGDB_CLIENT_SECRET),
    thegamesdb: Boolean(env.THEGAMESDB_API_KEY),
    steamgriddb: Boolean(env.STEAMGRIDDB_API_KEY)
  };
}

function imageSearchCredentials(env) {
  return {
    igdbClientId: env.IGDB_CLIENT_ID || "",
    igdbClientSecret: env.IGDB_CLIENT_SECRET || "",
    theGamesDbApiKey: env.THEGAMESDB_API_KEY || "",
    steamGridDbApiKey: env.STEAMGRIDDB_API_KEY || ""
  };
}

export async function isEnabledImageSearchAdministrator(idToken, firebaseAuth, projectId, fetchImpl = fetch) {
  let decoded;
  try {
    decoded = await firebaseAuth.verifyIdToken(idToken);
  } catch {
    return false;
  }
  if (!FIREBASE_UID_PATTERN.test(decoded?.uid || "")) return false;

  const adminResponse = await fetchImpl(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/administrators/${decoded.uid}`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  if (adminResponse.status === 403 || adminResponse.status === 404) return false;
  if (!adminResponse.ok) throw new Error("IMAGE_SEARCH_ADMIN_CHECK_FAILED");
  const adminDocument = await adminResponse.json();
  return adminDocument.fields?.enabled?.booleanValue === true;
}

export async function translateGeminiRequest({
  request,
  env,
  firebaseAuth,
  database,
  fetchImpl = fetch
}) {
  if (!await allowRequest(database, request, "gemini-translation", 60 * 1000, 12)) {
    return json({ code: "API_RATE_LIMITED" }, 429);
  }
  if (typeof env.GEMINI_API_KEY !== "string" || env.GEMINI_API_KEY.length < 20) {
    return json({ code: "GEMINI_SERVICE_NOT_CONFIGURED" }, 503);
  }
  const idToken = bearerToken(request);
  if (idToken.length < 100 || idToken.length > 16000) {
    return json({ code: "AUTH_REQUIRED" }, 401);
  }

  let decoded;
  try {
    decoded = await firebaseAuth.verifyIdToken(idToken);
  } catch {
    return json({ code: "AUTH_REQUIRED" }, 401);
  }
  const discordUserId = decoded?.claims?.discordUserId;
  if (!FIREBASE_UID_PATTERN.test(decoded?.uid || "") ||
      typeof discordUserId !== "string" ||
      decoded.uid !== `discord_${discordUserId}` ||
      decoded.claims?.discordGuildMember !== true ||
      decoded.claims?.discordGuildId !== env.DISCORD_GUILD_ID) {
    return json({ code: "GUILD_MEMBERSHIP_REQUIRED" }, 403);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > GEMINI_REQUEST_LIMIT) return json({ code: "INVALID_TRANSLATION_REQUEST" }, 413);
  let body;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > GEMINI_REQUEST_LIMIT) {
      return json({ code: "INVALID_TRANSLATION_REQUEST" }, 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return json({ code: "INVALID_TRANSLATION_REQUEST" }, 400);
  }
  const { model, sourceLanguage, category, glossary, gameTitle, gameDescription, entries } = body || {};
  if (!GEMINI_MODEL_PATTERN.test(model || "") ||
      !GEMINI_SOURCE_LANGUAGES.has(sourceLanguage) ||
      !GEMINI_CATEGORIES.has(category) ||
      typeof gameTitle !== "string" || gameTitle.length > 120 ||
      typeof gameDescription !== "string" || gameDescription.length > 1000 ||
      typeof glossary !== "string" || glossary.length > 10000 ||
      !Array.isArray(entries) || entries.length < 1 ||
      entries.length > GEMINI_BATCH_ENTRY_LIMIT) {
    return json({ code: "INVALID_TRANSLATION_REQUEST" }, 400);
  }

  let totalCharacters = glossary.length;
  const identifiers = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry.id !== "string" || !entry.id.length ||
        entry.id.length > 256 || identifiers.has(entry.id) ||
        typeof entry.text !== "string" || !entry.text.length ||
        entry.text.length > GEMINI_BATCH_ENTRY_CHARACTER_LIMIT ||
        typeof entry.previous !== "string" || entry.previous.length > 16000 ||
        typeof entry.following !== "string" || entry.following.length > 16000) {
      return json({ code: "INVALID_TRANSLATION_REQUEST" }, 400);
    }
    identifiers.add(entry.id);
    totalCharacters += entry.id.length + entry.text.length +
      entry.previous.length + entry.following.length;
  }
  if (totalCharacters > 60000 + glossary.length) {
    return json({ code: "INVALID_TRANSLATION_REQUEST" }, 413);
  }

  try {
    const result = await requestBatch({
      apiKey: env.GEMINI_API_KEY,
      model,
      entries,
      options: { sourceLanguage, category, glossary, gameTitle, gameDescription },
      signal: AbortSignal.timeout(55000),
      fetchImpl
    });
    return json(result);
  } catch (error) {
    const safeCodes = new Set([
      "API_KEY_NOT_CONFIGURED",
      "INVALID_API_KEY",
      "API_QUOTA_EXHAUSTED",
      "API_RATE_LIMITED",
      "MODEL_UNAVAILABLE",
      "INVALID_API_REQUEST",
      "GEMINI_SERVICE_UNAVAILABLE",
      "GEMINI_REQUEST_FAILED",
      "GEMINI_NETWORK_ERROR",
      "TRANSLATION_CANCELLED",
      "INVALID_GEMINI_RESPONSE"
    ]);
    const code = safeCodes.has(error?.code) ? error.code : "GEMINI_REQUEST_FAILED";
    const status = code === "API_QUOTA_EXHAUSTED" || code === "API_RATE_LIMITED" ? 429 :
      code === "INVALID_API_KEY" ? 502 :
        code === "MODEL_UNAVAILABLE" || code === "INVALID_API_REQUEST" ? 400 : 502;
    return json({ code }, status);
  }
}

function bearerToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function loadConfiguration(env) {
  const publicOrigin = new URL(env.PUBLIC_ORIGIN);
  const redirectUri = new URL(env.DISCORD_REDIRECT_URI);
  if (publicOrigin.protocol !== "https:" ||
      publicOrigin.pathname !== "/" ||
      publicOrigin.search ||
      publicOrigin.hash ||
      redirectUri.origin !== publicOrigin.origin ||
      redirectUri.pathname !== "/discord/callback" ||
      redirectUri.search ||
      redirectUri.hash) {
    throw new Error("Cloudflare Worker origin and Discord callback URL do not match.");
  }
  if (env.FIREBASE_PROJECT_ID !== "drekotranslation") {
    throw new Error("FIREBASE_PROJECT_ID must be drekotranslation.");
  }
  return {
    publicOrigin: publicOrigin.origin,
    clientId: env.DISCORD_CLIENT_ID || "",
    clientSecret: env.DISCORD_CLIENT_SECRET || "",
    redirectUri: redirectUri.href,
    botToken: env.DISCORD_BOT_TOKEN || "",
    guildId: env.DISCORD_GUILD_ID || "",
    guildName: String(env.DISCORD_GUILD_NAME || "").slice(0, 80),
    inviteUrl: env.DISCORD_INVITE_URL || "",
    autoJoin: env.DISCORD_AUTO_JOIN === "true",
    projectId: env.FIREBASE_PROJECT_ID
  };
}

export function createFirebaseAuth(env, projectId) {
  let serviceAccount;
  let signingKey;
  let verifiedKeyPromise;

  function getServiceAccount() {
    if (!serviceAccount) {
      try {
        serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON || "");
      } catch {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing or invalid JSON.");
      }
      if (serviceAccount.type !== "service_account" ||
          serviceAccount.project_id !== projectId ||
          typeof serviceAccount.client_email !== "string" ||
          typeof serviceAccount.private_key !== "string") {
        throw new Error("Firebase service-account credentials do not match the configured project.");
      }
    }
    return serviceAccount;
  }

  async function getSigningKey() {
    if (!signingKey) {
      const account = getServiceAccount();
      signingKey = await importPKCS8(
        account.private_key.replace(/\\n/g, "\n"),
        "RS256"
      );
    }
    return signingKey;
  }

  return {
    async createCustomToken(uid, claims = {}) {
      if (!FIREBASE_UID_PATTERN.test(uid) && uid !== "dreko_auth_health_check") {
        throw new Error("Invalid Firebase custom-token subject.");
      }
      const account = getServiceAccount();
      const now = Math.floor(Date.now() / 1000);
      return new SignJWT({ uid, claims })
        .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: account.private_key_id })
        .setIssuer(account.client_email)
        .setSubject(account.client_email)
        .setAudience(OAUTH_AUDIENCE)
        .setIssuedAt(now)
        .setExpirationTime(now + 3600)
        .setJti(crypto.randomUUID())
        .sign(await getSigningKey());
    },

    async verifyIdToken(token) {
      if (typeof token !== "string" || token.length > 16000) {
        throw Object.assign(new Error("INVALID_FIREBASE_TOKEN"), {
          code: "INVALID_FIREBASE_TOKEN"
        });
      }
      const project = getServiceAccount().project_id;
      verifiedKeyPromise ||= Promise.resolve(FIREBASE_KEYS);
      const { payload } = await jwtVerify(token, await verifiedKeyPromise, {
        algorithms: ["RS256"],
        audience: project,
        issuer: `https://securetoken.google.com/${project}`
      });
      return { ...payload, uid: payload.sub };
    }
  };
}

async function allowRequest(database, request, bucket, windowMs, maximum) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const ipHash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const result = await database.prepare(
    `INSERT INTO auth_rate_limits (rate_key, window_start, count)
     VALUES (?, ?, 1)
     ON CONFLICT(rate_key) DO UPDATE SET
       window_start = excluded.window_start,
       count = CASE
         WHEN auth_rate_limits.window_start = excluded.window_start
         THEN auth_rate_limits.count + 1 ELSE 1
       END
     RETURNING count`
  ).bind(`${bucket}:${ipHash}`, windowStart).first();
  return result.count <= maximum;
}

function callbackPage(message, succeeded) {
  const color = succeeded ? "#42d2a0" : "#fb7486";
  const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Dreko Translation · Discord</title>
<style>body{background:#090b0f;color:#f5f6f8;font:16px system-ui,sans-serif;min-height:90vh;display:grid;place-items:center;text-align:center}main{max-width:30rem;padding:2rem}i{color:${color}}p{color:#aeb4bd}</style>
<main><h1>Dreko Translation</h1><p><i>${succeeded ? "Discord verification complete" : "Discord sign-in was not completed"}</i></p><p>${message}</p><p>You may return to the Dreko desktop app.</p></main></html>`;
  return response(html, succeeded ? 200 : 400, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  });
}

function statusForAuthError(error) {
  if (error?.code === "GUILD_MEMBERSHIP_REQUIRED") return 403;
  if (error?.code === "INVALID_FIREBASE_TOKEN") return 401;
  return 503;
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    if (requestUrl.pathname.startsWith("/updates/")) {
      return serveUpdateRequest(request);
    }

    try {
      const configuration = loadConfiguration(env);
      const sessionStore = new D1SessionStore(env.OAUTH_DB);
      const firebaseAuth = createFirebaseAuth(env, configuration.projectId);
      const discord = new DiscordMembershipService({
        ...configuration,
        firebaseAuth,
        sessionStore
      });
      const url = requestUrl;
      const path = url.pathname;

      if (request.method === "GET" && path === "/") {
        return response(
          "<!doctype html><title>Dreko Translation Authentication</title><h1>Dreko Translation Authentication</h1>",
          200,
          { "Content-Type": "text/html; charset=utf-8" }
        );
      }

      if (request.method === "GET" && path === "/healthz") {
        await discord.checkDiscordConfiguration();
        await discord.checkFirebaseAdminCredentials();
        return json({
          ready: discord.isConfigured(),
          service: "dreko-discord-membership"
        });
      }

      if (request.method === "GET" && path === "/v1/desktop/config") {
        return json(await discord.publicConfig());
      }

      const imageSearchConfigPath = path === "/v1/desktop/image-search/config";
      const imageSearchRequestPath = path === "/v1/desktop/image-search/search";
      if (request.method === "POST" && path === "/v1/desktop/ai/translate") {
        return translateGeminiRequest({
          request,
          env,
          firebaseAuth,
          database: env.OAUTH_DB
        });
      }
      if ((request.method === "GET" && imageSearchConfigPath) ||
          (request.method === "POST" && imageSearchRequestPath)) {
        const maximumRequests = imageSearchConfigPath ? 60 : 20;
        if (!await allowRequest(env.OAUTH_DB, request, "image-search", 60 * 1000, maximumRequests)) {
          return json({ code: "IMAGE_SEARCH_RATE_LIMITED" }, 429);
        }

        const idToken = bearerToken(request);
        if (idToken.length < 100 || idToken.length > 16000) {
          return json({ code: "ADMIN_REQUIRED" }, 401);
        }
        try {
          if (!await isEnabledImageSearchAdministrator(idToken, firebaseAuth, configuration.projectId)) {
            return json({ code: "ADMIN_REQUIRED" }, 403);
          }
        } catch (error) {
          console.error("Image search administrator check failed:", error?.name || "UNKNOWN");
          return json({ code: "IMAGE_SEARCH_UNAVAILABLE" }, 503);
        }

        if (imageSearchConfigPath) {
          return json({ ok: true, data: imageSearchProviderStatus(env) });
        }

        const contentLength = Number(request.headers.get("Content-Length") || 0);
        if (contentLength > IMAGE_SEARCH_REQUEST_LIMIT) {
          return json({ code: "INVALID_SEARCH_QUERY" }, 413);
        }
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ code: "INVALID_SEARCH_QUERY" }, 400);
        }
        if (typeof body?.query !== "string" ||
            body.query.trim().length < 1 ||
            body.query.trim().length > 100) {
          return json({ code: "INVALID_SEARCH_QUERY" }, 400);
        }
        return json(await searchGameArtwork(body.query, imageSearchCredentials(env)));
      }

      if (request.method === "POST" && path === "/v1/desktop/sessions") {
        if (!await allowRequest(env.OAUTH_DB, request, "signin", 15 * 60 * 1000, 30)) {
          return json({ code: "AUTH_SERVER_BUSY" }, 429);
        }
        try {
          await discord.checkDiscordConfiguration();
          await discord.checkFirebaseAdminCredentials();
          const session = await discord.createDesktopSession();
          return json(session, 201);
        } catch (error) {
          return json({ code: error?.code || "AUTH_SERVER_NOT_CONFIGURED" }, 503);
        }
      }

      const sessionMatch = path.match(/^\/v1\/desktop\/sessions\/([a-f0-9-]{36})$/i);
      if (request.method === "GET" && sessionMatch) {
        if (!await allowRequest(env.OAUTH_DB, request, "poll", 60 * 1000, 90)) {
          return json({ code: "AUTH_SERVER_BUSY" }, 429);
        }
        return json(await discord.readSession(sessionMatch[1]));
      }

      if (request.method === "POST" && path === "/v1/desktop/verify") {
        if (!await allowRequest(env.OAUTH_DB, request, "verify", 60 * 1000, 90)) {
          return json({ ok: false, code: "AUTHENTICATION_UNAVAILABLE" }, 429);
        }
        const authorization = request.headers.get("Authorization") || "";
        const idToken = authorization.startsWith("Bearer ")
          ? authorization.slice(7)
          : "";
        try {
          const membership = await discord.verifyFirebaseMembership(idToken);
          return json({
            ok: true,
            user: membership.user,
            customToken: membership.customToken
          });
        } catch (error) {
          const code = error?.code === "GUILD_MEMBERSHIP_REQUIRED" ||
              error?.code === "INVALID_FIREBASE_TOKEN"
            ? error.code
            : "AUTHENTICATION_UNAVAILABLE";
          return json({ ok: false, code }, statusForAuthError(error));
        }
      }

      if (request.method === "GET" && path === "/discord/authorize") {
        if (!await allowRequest(env.OAUTH_DB, request, "signin", 15 * 60 * 1000, 30)) {
          return json({ code: "AUTH_SERVER_BUSY" }, 429);
        }
        try {
          const authorizationUrl = await discord.createAuthorizationUrl(
            url.searchParams.get("state")
          );
          return Response.redirect(authorizationUrl, 302);
        } catch {
          return json({ code: "INVALID_OAUTH_STATE" }, 400);
        }
      }

      if (request.method === "GET" && path === "/discord/callback") {
        if (!await allowRequest(env.OAUTH_DB, request, "callback", 15 * 60 * 1000, 60)) {
          return callbackPage("Too many sign-in attempts. Return to Dreko and try again.", false);
        }
        const state = url.searchParams.get("state") || "";
        const oauthError = url.searchParams.get("error") || "";
        if (oauthError) {
          const declined = await discord.failAuthorization(state, oauthError);
          return callbackPage(
            declined
              ? "Sign-in was cancelled. Return to Dreko and try again."
              : "This sign-in request has expired.",
            false
          );
        }
        try {
          const result = await discord.completeAuthorization({
            state,
            code: url.searchParams.get("code") || "",
            oauthError: ""
          });
          return callbackPage(
            result.status === "not_member"
              ? "Join the Dreko Discord server, then return to the app and try again."
              : "Your Discord server membership has been verified.",
            result.status === "completed"
          );
        } catch {
          return callbackPage(
            "Please return to Dreko Translation and start sign-in again.",
            false
          );
        }
      }

      return json({ code: "NOT_FOUND" }, 404);
    } catch (error) {
      console.error("Cloudflare auth request failed:", error?.code || error?.name || "UNKNOWN");
      return json({ code: "AUTHENTICATION_UNAVAILABLE" }, 503);
    }
  }
};
