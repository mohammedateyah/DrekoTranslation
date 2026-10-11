const path = require("node:path");
const fs = require("node:fs");
const {
  applicationDefault,
  cert,
  getApps,
  initializeApp
} = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const dotenv = require("dotenv");
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const helmet = require("helmet");
const { DiscordMembershipService } = require("./discord-auth.cjs");
const { FirestoreSessionStore } = require("./firestore-session-store.cjs");

dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
const SERVER_TIMEOUT_MS = 15000;
const configuredUpdateFilesDirectory = process.env.UPDATE_FILES_DIRECTORY?.trim() || "";
let updateFilesDirectory = "";
if (configuredUpdateFilesDirectory) {
  if (!path.isAbsolute(configuredUpdateFilesDirectory)) {
    console.error("UPDATE_FILES_DIRECTORY must be an absolute directory path.");
  } else {
    try {
      if (fs.statSync(configuredUpdateFilesDirectory).isDirectory()) {
        updateFilesDirectory = configuredUpdateFilesDirectory;
      } else {
        console.error("UPDATE_FILES_DIRECTORY must point to a directory.");
      }
    } catch (error) {
      console.error("Unable to access UPDATE_FILES_DIRECTORY:", error?.code || error?.name || "UNKNOWN");
    }
  }
}

function normalizeOrigin(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid HTTPS origin.`);
  }
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== "https:" &&
        !(process.env.NODE_ENV !== "production" &&
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "::1"].includes(url.hostname)))) {
    throw new Error(`${label} must use HTTPS, except for development on localhost.`);
  }
  return url;
}

function readAuthServerConfig(environment = process.env) {
  const publicUrl = normalizeOrigin(environment.PUBLIC_ORIGIN, "PUBLIC_ORIGIN");
  const callback = normalizeOrigin(environment.DISCORD_REDIRECT_URI, "DISCORD_REDIRECT_URI");
  const isRegisteredLocalCallback =
    callback.protocol === "http:" &&
    callback.hostname === "localhost" &&
    callback.port === "53178" &&
    callback.pathname === "/callback";
  const isHostedCallback =
    callback.origin === publicUrl.origin &&
    callback.pathname === "/discord/callback";
  if (publicUrl.pathname !== "/" ||
      (!isRegisteredLocalCallback && !isHostedCallback) ||
      callback.search || callback.hash) {
    throw new Error(
      "DISCORD_REDIRECT_URI must be the configured auth service callback or the registered local callback."
    );
  }

  const guildId = environment.DISCORD_GUILD_ID || "";
  if (!/^\d{17,20}$/.test(guildId)) {
    throw new Error("DISCORD_GUILD_ID must be the Discord server's numeric ID.");
  }
  if (environment.FIREBASE_PROJECT_ID !== "drekotranslation") {
    throw new Error("FIREBASE_PROJECT_ID must match the Dreko Firebase project.");
  }

  let inviteUrl = "";
  if (environment.DISCORD_INVITE_URL) {
    let invite;
    try {
      invite = new URL(environment.DISCORD_INVITE_URL);
    } catch {
      throw new Error("DISCORD_INVITE_URL must be a valid Discord invitation URL.");
    }
    if (invite.protocol !== "https:" ||
        !["discord.gg", "www.discord.gg", "discord.com", "www.discord.com"].includes(invite.hostname) ||
        (invite.hostname.includes("discord.com") && !invite.pathname.startsWith("/invite/"))) {
      throw new Error("DISCORD_INVITE_URL must link to discord.gg or discord.com/invite.");
    }
    inviteUrl = invite.href;
  }

  return {
    clientId: environment.DISCORD_CLIENT_ID || "",
    clientSecret: environment.DISCORD_CLIENT_SECRET || "",
    redirectUri: callback.href,
    botToken: environment.DISCORD_BOT_TOKEN || "",
    guildId,
    guildName: String(environment.DISCORD_GUILD_NAME || "").slice(0, 80),
    inviteUrl,
    autoJoin: environment.DISCORD_AUTO_JOIN === "true"
  };
}

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "drekotranslation";
if (!getApps().length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  let firebaseCredential = applicationDefault();
  if (serviceAccountPath || serviceAccountJson) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(
        serviceAccountJson || fs.readFileSync(serviceAccountPath, "utf8")
      );
    } catch (error) {
      throw new Error(
        `Unable to read Firebase Admin service-account credentials (${error?.code || error?.name || "UNKNOWN"}).`
      );
    }
    if (serviceAccount.type !== "service_account" ||
        typeof serviceAccount.private_key !== "string" ||
        typeof serviceAccount.client_email !== "string" ||
        serviceAccount.project_id !== firebaseProjectId) {
      throw new Error("Firebase Admin service-account credentials do not match the configured Firebase project.");
    }
    firebaseCredential = cert(serviceAccount);
  }
  initializeApp({
    credential: firebaseCredential,
    projectId: firebaseProjectId
  });
}

const authConfig = readAuthServerConfig();
const discordRedirectPath = new URL(authConfig.redirectUri).pathname;
const discord = new DiscordMembershipService({
  ...authConfig,
  firebaseAuth: getAuth(),
  sessionStore: process.env.OAUTH_SESSION_STORE === "firestore"
    ? new FirestoreSessionStore(getFirestore())
    : null
});

const app = express();
const trustProxy = process.env.TRUST_PROXY === "true";
if (trustProxy) app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'none'"],
      styleSrc: ["'unsafe-inline'"]
    }
  },
  referrerPolicy: { policy: "no-referrer" }
}));
app.use(express.json({ limit: "8kb", strict: true }));
if (updateFilesDirectory) {
  app.use("/updates", (request, response, next) => {
    const fileName = request.path.slice(1);
    if (!/^(?:latest\.yml|[A-Za-z0-9][A-Za-z0-9._-]*\.(?:exe|blockmap))$/.test(fileName)) {
      response.status(404).set("Cache-Control", "no-store").end();
      return;
    }
    next();
  });
  app.use("/updates", express.static(updateFilesDirectory, {
    dotfiles: "deny",
    fallthrough: true,
    index: false,
    redirect: false,
    setHeaders(response, filePath) {
      const fileName = path.basename(filePath);
      response.set(
        "Cache-Control",
        fileName === "latest.yml" ? "no-cache" : "public, max-age=31536000, immutable"
      );
    }
  }));
  app.use("/updates", (_request, response) => {
    response.status(404).set("Cache-Control", "no-store").end();
  });
} else {
  app.use("/updates", (_request, response) => {
    sendJson(response, 503, { code: "UPDATE_FEED_NOT_CONFIGURED" });
  });
}

const signInRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false
});
const pollingRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

function sendJson(response, status, body) {
  response.set("Cache-Control", "no-store");
  response.set("Pragma", "no-cache");
  response.status(status).json(body);
}

function callbackPage(response, message, succeeded) {
  response
    .status(succeeded ? 200 : 400)
    .set("Cache-Control", "no-store")
    .type("html")
    .send(`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Dreko Translation · Discord</title>
<style>body{background:#090b0f;color:#f5f6f8;font:16px system-ui,sans-serif;min-height:90vh;display:grid;place-items:center;text-align:center}main{max-width:30rem;padding:2rem}i{color:${succeeded ? "#42d2a0" : "#fb7486"}}p{color:#aeb4bd}</style>
<main><h1>Dreko Translation</h1><p><i>${succeeded ? "Discord verification complete" : "Discord sign-in was not completed"}</i></p><p>${message}</p><p>You may return to the Dreko desktop app.</p></main></html>`);
}

app.get("/healthz", async (_request, response) => {
  await discord.checkDiscordConfiguration();
  await discord.checkFirebaseAdminCredentials();
  sendJson(response, 200, {
    ready: discord.isConfigured(),
    service: "dreko-discord-membership"
  });
});

app.get("/v1/desktop/config", async (_request, response) => {
  sendJson(response, 200, await discord.publicConfig());
});

app.post("/v1/desktop/sessions", signInRateLimit, async (_request, response) => {
  try {
    await discord.checkDiscordConfiguration();
    await discord.checkFirebaseAdminCredentials();
    const session = await discord.createDesktopSession();
    sendJson(response, 201, {
      sessionId: session.sessionId,
      authorizationUrl: session.authorizationUrl
    });
  } catch (error) {
    sendJson(response, error?.code === "AUTH_SERVER_BUSY" ? 503 : 503, {
      code: error?.code || "AUTH_SERVER_NOT_CONFIGURED"
    });
  }
});

app.get("/v1/desktop/sessions/:sessionId", pollingRateLimit, async (request, response) => {
  if (!/^[a-f0-9-]{36}$/i.test(request.params.sessionId)) {
    sendJson(response, 400, { code: "INVALID_AUTH_SESSION" });
    return;
  }
  sendJson(response, 200, await discord.readSession(request.params.sessionId));
});

app.post("/v1/desktop/verify", pollingRateLimit, async (request, response) => {
  const bearer = request.get("authorization");
  const idToken = bearer?.startsWith("Bearer ") ? bearer.slice(7) : "";
  try {
    const membership = await discord.verifyFirebaseMembership(idToken);
    sendJson(response, 200, {
      ok: true,
      user: membership.user,
      customToken: membership.customToken
    });
  } catch (error) {
    const status = error?.code === "GUILD_MEMBERSHIP_REQUIRED"
      ? 403
      : error?.code === "INVALID_FIREBASE_TOKEN"
        ? 401
        : 503;
    sendJson(response, status, {
      ok: false,
      code: error?.code === "GUILD_MEMBERSHIP_REQUIRED" ||
          error?.code === "INVALID_FIREBASE_TOKEN"
        ? error.code
        : "AUTHENTICATION_UNAVAILABLE"
    });
  }
});

app.get("/v1/discord/authorize", signInRateLimit, async (request, response) => {
  try {
    response.redirect(302, await discord.createAuthorizationUrl(request.query.state));
  } catch {
    sendJson(response, 400, { code: "INVALID_OAUTH_STATE" });
  }
});

app.get(discordRedirectPath, signInRateLimit, async (request, response) => {
  const state = typeof request.query.state === "string" ? request.query.state : "";
  if (typeof request.query.error === "string") {
    const declined = await discord.failAuthorization(state, request.query.error);
    callbackPage(
      response,
      declined ? "Sign-in was cancelled. Return to Dreko and try again." : "This sign-in request has expired.",
      false
    );
    return;
  }

  try {
    const result = await discord.completeAuthorization({
      state,
      code: typeof request.query.code === "string" ? request.query.code : "",
      oauthError: ""
    });
    callbackPage(
      response,
      result.status === "not_member"
        ? "Join the Dreko Discord server, then return to the app and try again."
        : "Your Discord server membership has been verified.",
      result.status === "completed"
    );
  } catch (error) {
    callbackPage(
      response,
      error?.code === "DISCORD_AUTHORIZATION_DECLINED"
        ? "Discord authorization was declined."
        : "Please return to Dreko Translation and start sign-in again.",
      false
    );
  }
});

app.use((error, _request, response, _next) => {
  console.error("Discord authentication request failed:", error?.code || error?.name || "UNKNOWN");
  if (response.headersSent) return;
  sendJson(response, 500, { code: "AUTHENTICATION_UNAVAILABLE" });
});

function startAuthServer() {
  const server = app.listen(PORT, HOST, () => {
    console.log(`Dreko Discord auth server listening on ${HOST}:${PORT}.`);
    if (!discord.isConfigured()) {
      console.warn("Discord sign-in is disabled: configure the server-only environment variables.");
    }
    void discord.checkDiscordConfiguration();
    void discord.checkFirebaseAdminCredentials();
  });
  server.requestTimeout = SERVER_TIMEOUT_MS;
  return server;
}

if (require.main === module) {
  const server = startAuthServer();
  function shutdown(signal) {
    console.log(`Received ${signal}; shutting down the Discord auth server.`);
    server.close((error) => {
      if (error) {
        console.error("Unable to close the auth server cleanly:", error.message);
        process.exitCode = 1;
      }
    });
  }
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

module.exports = { app, discord, readAuthServerConfig, startAuthServer };
