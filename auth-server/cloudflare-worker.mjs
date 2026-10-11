import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";
import discordAuthModule from "./discord-auth.cjs";
import { D1SessionStore } from "./cloudflare-session-store.mjs";

const { DiscordMembershipService } = discordAuthModule;
const OAUTH_AUDIENCE =
  "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
const FIREBASE_KEYS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);
const FIREBASE_UID_PATTERN = /^discord_\d{17,20}$/;
const GITHUB_RELEASE_DOWNLOAD_URL =
  "https://github.com/mohammedateyah/DrekoTranslation/releases/latest/download/";
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
  if (request.method !== "GET" || !url.pathname.startsWith("/updates/")) {
    return response(null, 404);
  }

  let fileName;
  try {
    fileName = decodeURIComponent(url.pathname.slice("/updates/".length));
  } catch {
    return response(null, 404);
  }

  if (fileName === "latest.yml") {
    try {
      const upstream = await fetcher(`${GITHUB_RELEASE_DOWNLOAD_URL}latest.yml`, {
        headers: { "User-Agent": "Dreko-Translation-Updater" }
      });
      if (!upstream.ok) return response(null, upstream.status === 404 ? 404 : 502);

      const releaseBase = upstream.url
        ? new URL(".", upstream.url)
        : new URL(GITHUB_RELEASE_DOWNLOAD_URL);
      const manifest = (await upstream.text()).replace(
        /^(\s*(?:-\s*)?(?:url|path):\s*)(?:"([^"]*)"|'([^']*)'|([^\r\n]+))\s*$/gm,
        (_line, prefix, doubleQuoted, singleQuoted, unquoted) => {
          const assetUrl = new URL(
            doubleQuoted ?? singleQuoted ?? unquoted.trim(),
            releaseBase
          );
          return `${prefix}${JSON.stringify(assetUrl.href)}`;
        }
      );
      return response(manifest, 200, {
        "Cache-Control": "no-store",
        "Content-Type": "text/yaml; charset=utf-8"
      });
    } catch {
      return response(null, 502);
    }
  }

  if (!UPDATE_ASSET_PATTERN.test(fileName)) return response(null, 404);
  const assetUrl = new URL(encodeURIComponent(fileName), GITHUB_RELEASE_DOWNLOAD_URL);
  return response(null, 302, { Location: assetUrl.href });
}

function json(body, status = 200) {
  return response(JSON.stringify(body), status, {
    "Content-Type": "application/json; charset=utf-8"
  });
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
