const assert = require("node:assert/strict");
const test = require("node:test");
const { DiscordMembershipService } = require("./discord-auth.cjs");

const DISCORD_USER_ID = "123456789012345678";
const GUILD_ID = "766985465323716649";

function response(status, body = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function createService({
  member = true,
  autoJoin = false,
  now = () => Date.now()
} = {}) {
  const requests = [];
  const createdTokens = [];
  const verifiedClaims = {
    uid: `discord_${DISCORD_USER_ID}`,
    discordUserId: DISCORD_USER_ID,
    discordGuildId: GUILD_ID,
    discordGuildMember: true,
    discordUsername: "Dreko member",
    discordAvatar: ""
  };
  let guildMember = member;
  const fetchImpl = async (input, options = {}) => {
    const url = new URL(input);
    requests.push({ url, options });
    if (url.pathname.endsWith("/oauth2/token/revoke")) return response(200);
    if (url.pathname.endsWith("/oauth2/token")) return response(200, { access_token: "access-token" });
    if (url.pathname === "/api/v10/users/@me") {
      return options.headers?.Authorization?.startsWith("Bearer ")
        ? response(200, {
          id: DISCORD_USER_ID,
          username: "dreko",
          global_name: "Dreko member"
        })
        : response(200, { id: "345678901234567890" });
    }
    if (url.pathname === "/api/v10/oauth2/applications/@me") {
      return response(200, { id: "234567890123456789" });
    }
    if (url.pathname === `/api/v10/guilds/${GUILD_ID}`) {
      return response(200, { id: GUILD_ID });
    }
    if (url.pathname.endsWith("/users/@me")) {
      return response(200, { id: DISCORD_USER_ID, username: "dreko", global_name: "Dreko member" });
    }
    if (url.pathname.endsWith(`/members/${DISCORD_USER_ID}`)) {
      if (options.method === "PUT") {
        guildMember = true;
        return response(201);
      }
      return guildMember
        ? response(200, {
          user: { id: DISCORD_USER_ID },
          joined_at: "2020-06-15T12:30:00.000Z"
        })
        : response(404);
    }
    return response(404);
  };
  const firebaseAuth = {
    createCustomToken: async (uid, claims) => {
      createdTokens.push({ uid, claims });
      return "firebase-custom-token";
    },
    verifyIdToken: async () => verifiedClaims
  };
  const service = new DiscordMembershipService({
    clientId: "234567890123456789",
    clientSecret: "oauth-client-secret",
    redirectUri: "https://auth.dreko.example/v1/discord/callback",
    botToken: "server-only-bot-token",
    guildId: GUILD_ID,
    inviteUrl: "",
    guildName: "Dreko",
    inviteUrl: "https://discord.gg/dreko",
    autoJoin,
    firebaseAuth,
    fetchImpl,
    clock: now
  });
  service.discordConfigurationReady = true;
  service.firebaseAdminReady = true;
  return { service, requests, createdTokens, verifiedClaims };
}

function sessionState(session) {
  return new URL(session.authorizationUrl).searchParams.get("state");
}

test("creates a single-use Discord authorization state with only required scopes", async () => {
  const { service } = createService();
  const session = await service.createDesktopSession();
  const authorization = new URL(session.authorizationUrl);
  const state = authorization.searchParams.get("state");

  assert.equal(authorization.origin, "https://discord.com");
  assert.equal(authorization.searchParams.get("client_id"), "234567890123456789");
  assert.equal(authorization.searchParams.get("scope"), "identify");
  assert.equal(await service.createAuthorizationUrl(state), session.authorizationUrl);
  await assert.rejects(service.createAuthorizationUrl("untrusted-state"), {
    code: "INVALID_OAUTH_STATE"
  });
});

test("reports missing setup requirements without publishing secret values", async () => {
  const service = new DiscordMembershipService({
    clientId: "",
    clientSecret: "private-client-secret",
    botToken: "",
    guildId: GUILD_ID,
    redirectUri: "http://127.0.0.1:8787/v1/discord/callback",
    firebaseAuth: {
      createCustomToken: async () => {
        throw Object.assign(new Error("credentials unavailable"), { code: "app/invalid-credential" });
      }
    }
  });

  const config = await service.publicConfig();
  assert.deepEqual(config.setupIssues, [
    "DISCORD_CLIENT_ID",
    "DISCORD_BOT_TOKEN",
    "DISCORD_INVITE_URL",
    "FIREBASE_ADMIN_CREDENTIALS"
  ]);
  assert.equal(config.ready, false);
  assert.equal(config.clientId, "");
  assert.equal(JSON.stringify(config).includes("private-client-secret"), false);
});

test("detects when the bot cannot access the configured Discord server", async () => {
  const { service } = createService();
  service.fetchImpl = async (input) => {
    const path = new URL(input).pathname;
    if (path.endsWith("/users/@me")) return response(200, { id: "345678901234567890" });
    if (path.endsWith("/oauth2/applications/@me")) return response(200, { id: service.clientId });
    if (path === `/api/v10/guilds/${GUILD_ID}`) return response(404);
    return response(404);
  };
  service.discordConfigurationReady = null;

  const ready = await service.checkDiscordConfiguration();
  assert.equal(ready, false);
  assert.equal(service.discordConfigurationError, "DISCORD_BOT_GUILD_ACCESS_REQUIRED");
});

test("detects a Discord application ID that does not belong to the bot", async () => {
  const { service } = createService();
  service.fetchImpl = async (input) => {
    const path = new URL(input).pathname;
    if (path.endsWith("/users/@me")) return response(200, { id: "345678901234567890" });
    if (path.endsWith("/oauth2/applications/@me")) return response(200, { id: "999999999999999999" });
    throw new Error("The mismatched application ID must fail before the guild check.");
  };
  service.discordConfigurationReady = null;

  assert.equal(await service.checkDiscordConfiguration(), false);
  assert.equal(service.discordConfigurationError, "DISCORD_CLIENT_ID_MISMATCH");
});

test("reports which Discord API check failed without logging sensitive request data", async () => {
  const { service } = createService();
  service.fetchImpl = async () => {
    throw new TypeError("network unavailable");
  };
  service.discordConfigurationReady = null;

  assert.equal(await service.checkDiscordConfiguration(), false);
  assert.equal(service.discordConfigurationError, "DISCORD_BOT_CHECK_FAILED");
});

test("calls the platform fetch function with its required global receiver", async () => {
  const originalFetch = globalThis.fetch;
  const receivers = [];
  const service = new DiscordMembershipService({
    clientId: "234567890123456789",
    clientSecret: "oauth-client-secret",
    redirectUri: "https://auth.dreko.example/discord/callback",
    botToken: "server-only-bot-token",
    guildId: GUILD_ID,
    guildName: "Dreko",
    inviteUrl: "https://discord.gg/dreko"
  });

  globalThis.fetch = async function (input) {
    receivers.push(this);
    const path = new URL(input).pathname;
    if (path.endsWith("/users/@me")) return response(200, { id: "345678901234567890" });
    if (path.endsWith("/oauth2/applications/@me")) {
      return response(200, { id: service.clientId });
    }
    return response(200, { id: service.guildId });
  };

  try {
    assert.equal(await service.checkDiscordConfiguration(), true);
    assert.equal(receivers.length, 3);
    assert.ok(receivers.every((receiver) => receiver === globalThis));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("verifies a server member and issues a Firebase token bound to the Discord identity", async () => {
  const { service, createdTokens } = createService();
  const session = await service.createDesktopSession();
  const result = await service.completeAuthorization({
    state: sessionState(session),
    code: "oauth-code"
  });
  const stored = await service.readSession(session.sessionId);

  assert.equal(result.status, "completed");
  assert.equal(stored.status, "completed");
  assert.equal(stored.customToken, "firebase-custom-token");
  assert.equal(createdTokens[0].uid, `discord_${DISCORD_USER_ID}`);
  assert.equal(createdTokens[0].claims.discordGuildId, GUILD_ID);
  assert.equal(createdTokens[0].claims.discordGuildMember, true);
  const membership = await service.verifyFirebaseMembership("id-token");
  assert.deepEqual(membership.user, {
    id: DISCORD_USER_ID,
    username: "Dreko member",
    avatar: "",
    joinedAt: "2020-06-15T12:30:00.000Z"
  });
  assert.equal(membership.customToken, "firebase-custom-token");
  await assert.rejects(
    service.completeAuthorization({ state: sessionState(session), code: "oauth-code" }),
    { code: "INVALID_OAUTH_STATE" }
  );
});

test("returns a join-required result for nonmembers without issuing a Firebase token", async () => {
  const { service, createdTokens } = createService({ member: false });
  const session = await service.createDesktopSession();
  const result = await service.completeAuthorization({
    state: sessionState(session),
    code: "oauth-code"
  });

  assert.deepEqual(result, { status: "not_member" });
  assert.equal(createdTokens.length, 0);
  assert.equal((await service.readSession(session.sessionId)).status, "not_member");
  assert.equal((await service.readSession(session.sessionId)).inviteUrl, "https://discord.gg/dreko");
});

test("auto-joins through the bot only when the server enables that option", async () => {
  const { service, requests } = createService({ member: false, autoJoin: true });
  const session = await service.createDesktopSession();
  const authorization = new URL(session.authorizationUrl);

  assert.equal(authorization.searchParams.get("scope"), "identify guilds.join");
  await service.completeAuthorization({
    state: sessionState(session),
    code: "oauth-code"
  });
  assert.ok(requests.some(({ options }) => options.method === "PUT"));
  assert.equal((await service.readSession(session.sessionId)).status, "completed");
});

test("cancellation consumes the OAuth state and marks the desktop session failed", async () => {
  const { service } = createService();
  const session = await service.createDesktopSession();
  const state = sessionState(session);

  assert.equal(await service.failAuthorization(state, "access_denied"), true);
  assert.equal((await service.readSession(session.sessionId)).code, "DISCORD_AUTHORIZATION_DECLINED");
  assert.equal(await service.failAuthorization(state, "access_denied"), false);
});

test("expires sessions and rejects Firebase tokens with altered membership claims", async () => {
  let now = 10_000;
  const { service, verifiedClaims } = createService({ now: () => now });
  const session = await service.createDesktopSession();
  now += 5 * 60 * 1000 + 1;

  assert.deepEqual(await service.readSession(session.sessionId), { status: "expired" });
  await assert.rejects(
    service.completeAuthorization({ state: sessionState(session), code: "oauth-code" }),
    { code: "INVALID_OAUTH_STATE" }
  );
  verifiedClaims.discordGuildId = "999999999999999999";
  await assert.rejects(
    service.verifyFirebaseMembership("id-token"),
    { code: "GUILD_MEMBERSHIP_REQUIRED" }
  );
});

test("rejects an otherwise valid Firebase token after Discord removes the user", async () => {
  const { service } = createService({ member: false });
  await assert.rejects(
    service.verifyFirebaseMembership("id-token"),
    { code: "GUILD_MEMBERSHIP_REQUIRED" }
  );
});

test("renews a short membership lease after rechecking Discord", async () => {
  const now = 1_700_000_000_000;
  const { service, verifiedClaims, createdTokens } = createService({ now: () => now });
  verifiedClaims.discordMembershipExpiresAt = Math.floor((now + 30_000) / 1000);

  const membership = await service.verifyFirebaseMembership("id-token");
  assert.equal(membership.customToken, "firebase-custom-token");
  assert.equal(createdTokens[0].claims.discordMembershipExpiresAt, Math.floor((now + 6 * 60 * 1000) / 1000));

  verifiedClaims.discordMembershipExpiresAt = Math.floor((now + 5 * 60 * 1000) / 1000);
  const freshMembership = await service.verifyFirebaseMembership("id-token");
  assert.equal(freshMembership.customToken, null);
});
