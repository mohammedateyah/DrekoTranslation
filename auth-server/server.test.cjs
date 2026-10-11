const assert = require("node:assert/strict");
const { once } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const updateFilesDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "dreko-update-test-"));
fs.writeFileSync(path.join(updateFilesDirectory, "latest.yml"), "version: 1.0.1\n");
fs.writeFileSync(path.join(updateFilesDirectory, "Dreko-Setup-1.0.1.exe"), "installer");
fs.writeFileSync(path.join(updateFilesDirectory, "private.txt"), "private");
fs.writeFileSync(path.join(updateFilesDirectory, ".private"), "private");
process.env.UPDATE_FILES_DIRECTORY = updateFilesDirectory;
process.once("exit", () => fs.rmSync(updateFilesDirectory, { recursive: true, force: true }));

Object.assign(process.env, {
  NODE_ENV: "test",
  PUBLIC_ORIGIN: "https://auth.dreko.example",
  DISCORD_CLIENT_ID: "234567890123456789",
  DISCORD_CLIENT_SECRET: "test-client-secret",
  DISCORD_REDIRECT_URI: "https://auth.dreko.example/discord/callback",
  DISCORD_BOT_TOKEN: "test-bot-token",
  DISCORD_GUILD_ID: "766985465323716649",
  DISCORD_GUILD_NAME: "Dreko Community",
  DISCORD_INVITE_URL: "https://discord.gg/dreko",
  DISCORD_AUTO_JOIN: "false",
  FIREBASE_PROJECT_ID: "drekotranslation"
});

const { app, discord, readAuthServerConfig } = require("./server.cjs");

function validEnvironment(overrides = {}) {
  return {
    NODE_ENV: "test",
    PUBLIC_ORIGIN: "https://auth.dreko.example",
    DISCORD_CLIENT_ID: "234567890123456789",
    DISCORD_CLIENT_SECRET: "client-secret",
    DISCORD_REDIRECT_URI: "https://auth.dreko.example/discord/callback",
    DISCORD_BOT_TOKEN: "bot-token",
    DISCORD_GUILD_ID: "766985465323716649",
    DISCORD_GUILD_NAME: "Dreko Community",
    DISCORD_INVITE_URL: "https://discord.gg/dreko",
    DISCORD_AUTO_JOIN: "false",
    FIREBASE_PROJECT_ID: "drekotranslation",
    ...overrides
  };
}

test("validates the public origin and callback as one HTTPS auth service", () => {
  assert.equal(readAuthServerConfig(validEnvironment()).guildId, "766985465323716649");
  assert.throws(() => readAuthServerConfig(validEnvironment({
    PUBLIC_ORIGIN: "https://auth.dreko.example/untrusted-path"
  })), /configured auth service callback/);
  assert.throws(() => readAuthServerConfig(validEnvironment({
    DISCORD_REDIRECT_URI: "https://attacker.example/discord/callback"
  })), /configured auth service callback/);
  assert.throws(() => readAuthServerConfig(validEnvironment({
    DISCORD_REDIRECT_URI: "https://auth.dreko.example/v1/discord/callback"
  })), /configured auth service callback/);
  assert.throws(() => readAuthServerConfig(validEnvironment({
    DISCORD_INVITE_URL: "https://example.com/invite"
  })), /DISCORD_INVITE_URL/);
});

test("serves update metadata without caching and release assets as immutable files", async (context) => {
  const server = app.listen(0, "127.0.0.1");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;

  const metadataResponse = await fetch(`${origin}/updates/latest.yml`);
  assert.equal(metadataResponse.status, 200);
  assert.equal(metadataResponse.headers.get("cache-control"), "no-cache");
  assert.match(await metadataResponse.text(), /version: 1\.0\.1/);

  const installerResponse = await fetch(`${origin}/updates/Dreko-Setup-1.0.1.exe`);
  assert.equal(installerResponse.status, 200);
  assert.equal(installerResponse.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.equal(await installerResponse.text(), "installer");

  assert.equal((await fetch(`${origin}/updates/`)).status, 404);
  assert.equal((await fetch(`${origin}/updates/.private`)).status, 404);
  assert.equal((await fetch(`${origin}/updates/private.txt`)).status, 404);
  assert.equal((await fetch(`${origin}/updates/missing.yml`)).status, 404);
});

test("accepts only the Discord app's registered localhost callback for desktop testing", () => {
  const localConfig = readAuthServerConfig(validEnvironment({
    PUBLIC_ORIGIN: "http://localhost:53178",
    DISCORD_REDIRECT_URI: "http://localhost:53178/callback"
  }));
  assert.equal(localConfig.redirectUri, "http://localhost:53178/callback");
  assert.throws(() => readAuthServerConfig(validEnvironment({
    PUBLIC_ORIGIN: "http://localhost:53178",
    DISCORD_REDIRECT_URI: "http://localhost:53179/callback"
  })), /registered local callback/);
});

test("exposes only public sign-in config and consumes OAuth cancellation state", async (context) => {
  discord.firebaseAuth = { createCustomToken: async () => "health-check-token" };
  discord.firebaseAdminReady = null;
  discord.discordConfigurationReady = null;
  discord.discordConfigurationCheckedAt = 0;
  discord.discordConfigurationError = "";
  discord.fetchImpl = async (input) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/users/@me")) {
      return new Response(JSON.stringify({ id: "345678901234567890" }), { status: 200 });
    }
    if (url.pathname.endsWith("/oauth2/applications/@me")) {
      return new Response(JSON.stringify({ id: "234567890123456789" }), { status: 200 });
    }
    if (url.pathname.endsWith("/guilds/766985465323716649")) {
      return new Response(JSON.stringify({ id: "766985465323716649" }), { status: 200 });
    }
    return new Response(JSON.stringify({}), { status: 404 });
  };
  const server = app.listen(0, "127.0.0.1");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;

  const configResponse = await fetch(`${origin}/v1/desktop/config`);
  const config = await configResponse.json();
  assert.equal(configResponse.status, 200);
  assert.equal(configResponse.headers.get("cache-control"), "no-store");
  assert.deepEqual(config, {
    ready: true,
    code: "",
    setupIssues: [],
    clientId: "234567890123456789",
    guildName: "Dreko Community",
    inviteUrl: "https://discord.gg/dreko",
    autoJoin: false
  });
  assert.equal(JSON.stringify(config).includes("test-client-secret"), false);
  assert.equal(JSON.stringify(config).includes("test-bot-token"), false);

  const startResponse = await fetch(`${origin}/v1/desktop/sessions`, { method: "POST" });
  const session = await startResponse.json();
  assert.equal(startResponse.status, 201);
  assert.match(session.sessionId, /^[a-f0-9-]{36}$/i);
  const authorizationUrl = new URL(session.authorizationUrl);
  assert.equal(authorizationUrl.hostname, "discord.com");

  const callback = await fetch(
    `${origin}/discord/callback?error=access_denied&state=${encodeURIComponent(authorizationUrl.searchParams.get("state"))}`
  );
  assert.equal(callback.status, 400);
  const pollResponse = await fetch(`${origin}/v1/desktop/sessions/${session.sessionId}`);
  const poll = await pollResponse.json();
  assert.deepEqual(poll, { status: "failed", code: "DISCORD_AUTHORIZATION_DECLINED" });
});
