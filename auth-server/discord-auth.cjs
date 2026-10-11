const { randomBytes, randomUUID, timingSafeEqual } = require("node:crypto");

const OAUTH_SESSION_LIFETIME_MS = 5 * 60 * 1000;
const MEMBERSHIP_LEASE_MS = 6 * 60 * 1000;
const MEMBERSHIP_RENEWAL_WINDOW_MS = 3 * 60 * 1000;
const DISCORD_CONFIG_CACHE_MS = 30 * 1000;
const MIN_STATE_LENGTH = 40;
const USER_ID_PATTERN = /^\d{17,20}$/;

function secureState() {
  return randomBytes(32).toString("base64url");
}

function newIdentifier() {
  return randomUUID();
}

function makeAuthError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function safeEquals(left, right) {
  if (typeof left !== "string" ||
      typeof right !== "string" ||
      left.length < MIN_STATE_LENGTH ||
      left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

class DiscordMembershipService {
  constructor({
    clientId,
    clientSecret,
    redirectUri,
    botToken,
    guildId,
    guildName,
    inviteUrl,
    autoJoin = false,
    firebaseAuth,
    sessionStore = null,
    fetchImpl = (input, options) => globalThis.fetch(input, options),
    clock = () => Date.now(),
    sessionLifetimeMs = OAUTH_SESSION_LIFETIME_MS
  }) {
    Object.assign(this, {
      clientId,
      clientSecret,
      redirectUri,
      botToken,
      guildId,
      guildName,
      inviteUrl,
      autoJoin,
      firebaseAuth,
      sessionStore,
      fetchImpl,
      clock,
      sessionLifetimeMs
    });
    this.sessions = new Map();
    this.oauthStates = new Map();
    this.firebaseAdminReady = null;
    this.discordConfigurationReady = null;
    this.discordConfigurationError = "";
    this.discordConfigurationCheckedAt = 0;
  }

  isConfigured() {
    return Boolean(
      USER_ID_PATTERN.test(this.clientId || "") &&
      this.clientSecret &&
      this.botToken &&
      USER_ID_PATTERN.test(this.guildId || "") &&
      this.redirectUri &&
      this.firebaseAuth &&
      (this.autoJoin || this.inviteUrl) &&
      this.discordConfigurationReady === true &&
      this.firebaseAdminReady === true
    );
  }

  async checkDiscordConfiguration() {
    const staticConfigurationIsReady = Boolean(
      USER_ID_PATTERN.test(this.clientId || "") &&
      this.clientSecret &&
      this.botToken &&
      USER_ID_PATTERN.test(this.guildId || "") &&
      this.redirectUri
    );
    if (!staticConfigurationIsReady) return false;
    if (this.discordConfigurationReady !== null &&
        this.clock() - this.discordConfigurationCheckedAt < DISCORD_CONFIG_CACHE_MS) {
      return this.discordConfigurationReady;
    }

    let checkStage = "BOT";
    try {
      const botResponse = await this.fetchImpl("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bot ${this.botToken}` },
        signal: AbortSignal.timeout(10000)
      });
      if (botResponse.status === 401 || botResponse.status === 403) {
        throw makeAuthError("DISCORD_BOT_TOKEN_INVALID");
      }
      if (!botResponse.ok) throw makeAuthError("DISCORD_BOT_CHECK_FAILED");

      checkStage = "APPLICATION";
      const applicationResponse = await this.fetchImpl(
        "https://discord.com/api/v10/oauth2/applications/@me",
        {
          headers: { Authorization: `Bot ${this.botToken}` },
          signal: AbortSignal.timeout(10000)
        }
      );
      if (applicationResponse.status === 401 || applicationResponse.status === 403) {
        throw makeAuthError("DISCORD_BOT_TOKEN_INVALID");
      }
      if (!applicationResponse.ok) throw makeAuthError("DISCORD_APPLICATION_CHECK_FAILED");
      const application = await applicationResponse.json().catch(() => ({}));
      if (application.id !== this.clientId) {
        throw makeAuthError("DISCORD_CLIENT_ID_MISMATCH");
      }

      checkStage = "GUILD";
      const guildResponse = await this.fetchImpl(
        `https://discord.com/api/v10/guilds/${this.guildId}`,
        {
          headers: { Authorization: `Bot ${this.botToken}` },
          signal: AbortSignal.timeout(10000)
        }
      );
      if (guildResponse.status === 404) {
        throw makeAuthError("DISCORD_BOT_GUILD_ACCESS_REQUIRED");
      }
      if (guildResponse.status === 401 || guildResponse.status === 403) {
        throw makeAuthError("DISCORD_BOT_GUILD_ACCESS_REQUIRED");
      }
      if (!guildResponse.ok) throw makeAuthError("DISCORD_GUILD_CHECK_FAILED");
      const guild = await guildResponse.json().catch(() => ({}));
      if (guild.id !== this.guildId) throw makeAuthError("DISCORD_GUILD_CHECK_FAILED");

      this.discordConfigurationReady = true;
      this.discordConfigurationError = "";
    } catch (error) {
      this.discordConfigurationReady = false;
      this.discordConfigurationError = [
        "DISCORD_BOT_TOKEN_INVALID",
        "DISCORD_BOT_CHECK_FAILED",
        "DISCORD_APPLICATION_CHECK_FAILED",
        "DISCORD_CLIENT_ID_MISMATCH",
        "DISCORD_BOT_GUILD_ACCESS_REQUIRED",
        "DISCORD_GUILD_CHECK_FAILED"
      ].includes(error?.code)
        ? error.code
        : `DISCORD_${checkStage}_CHECK_FAILED`;
      if (this.discordConfigurationError !== "DISCORD_BOT_GUILD_ACCESS_REQUIRED") {
        const causeCode = typeof error?.cause?.code === "string" &&
            /^[A-Za-z0-9_-]{1,64}$/.test(error.cause.code)
          ? error.cause.code
          : "NO_CAUSE_CODE";
        const diagnosticMessage = String(error?.message || "")
          .replaceAll(this.botToken || "\u0000", "[redacted]")
          .replaceAll(this.clientSecret || "\u0000", "[redacted]")
          .replace(/[\r\n]/g, " ")
          .slice(0, 120);
        console.error(
          "Discord configuration validation failed:",
          this.discordConfigurationError,
          error?.name || "UNKNOWN",
          causeCode,
          diagnosticMessage || "NO_MESSAGE"
        );
      }
    }
    this.discordConfigurationCheckedAt = this.clock();
    return this.discordConfigurationReady;
  }

  async checkFirebaseAdminCredentials() {
    if (!this.firebaseAuth) return false;
    if (this.firebaseAdminReady !== null) return this.firebaseAdminReady;

    this.firebaseAdminReady = await Promise.resolve().then(() =>
      this.firebaseAuth.createCustomToken(
        "dreko_auth_health_check",
        { drekoAuthHealthCheck: true }
      )
    ).then(() => true, (error) => {
      console.error(
        "Firebase Admin cannot sign custom tokens:",
        error?.code || error?.name || "UNKNOWN"
      );
      return false;
    });
    return this.firebaseAdminReady;
  }

  async publicConfig() {
    await this.checkDiscordConfiguration();
    await this.checkFirebaseAdminCredentials();
    return {
      ready: this.isConfigured(),
      code: this.isConfigured() ? "" : "AUTH_SERVER_NOT_CONFIGURED",
      setupIssues: this.getSetupIssues(),
      clientId: USER_ID_PATTERN.test(this.clientId || "") ? this.clientId : "",
      guildName: this.guildName || "",
      inviteUrl: this.inviteUrl || "",
      autoJoin: Boolean(this.autoJoin)
    };
  }

  getSetupIssues() {
    const issues = [];
    if (!USER_ID_PATTERN.test(this.clientId || "")) issues.push("DISCORD_CLIENT_ID");
    if (!this.clientSecret) issues.push("DISCORD_CLIENT_SECRET");
    if (!this.botToken) issues.push("DISCORD_BOT_TOKEN");
    if (!USER_ID_PATTERN.test(this.guildId || "")) issues.push("DISCORD_GUILD_ID");
    if (!this.redirectUri) issues.push("DISCORD_REDIRECT_URI");
    if (!this.firebaseAuth) issues.push("FIREBASE_ADMIN_CREDENTIALS");
    if (!this.autoJoin && !this.inviteUrl) issues.push("DISCORD_INVITE_URL");
    if (this.discordConfigurationReady === false && this.discordConfigurationError) {
      issues.push(this.discordConfigurationError);
    }
    if (this.firebaseAdminReady !== true) issues.push("FIREBASE_ADMIN_CREDENTIALS");
    return issues;
  }

  async createDesktopSession() {
    if (!this.isConfigured()) throw makeAuthError("AUTH_SERVER_NOT_CONFIGURED");
    if (this.sessionStore) {
      await this.sessionStore.deleteExpiredSessions(this.clock());
    } else {
      this.deleteExpiredSessions();
      if (this.sessions.size >= 5000) throw makeAuthError("AUTH_SERVER_BUSY");
    }

    const sessionId = newIdentifier();
    const state = secureState();
    const session = {
      id: sessionId,
      state,
      status: "pending",
      expiresAt: this.clock() + this.sessionLifetimeMs
    };
    if (this.sessionStore) {
      await this.sessionStore.create(session);
    } else {
      this.sessions.set(sessionId, session);
      this.oauthStates.set(state, sessionId);
    }

    return {
      sessionId,
      authorizationUrl: await this.createAuthorizationUrl(state)
    };
  }

  async createAuthorizationUrl(state) {
    const stateIsPending = typeof state === "string" && (this.sessionStore
      ? await this.sessionStore.isPendingState(state, this.clock())
      : this.oauthStates.has(state));
    if (!stateIsPending) {
      throw makeAuthError("INVALID_OAUTH_STATE");
    }
    const authorizationUrl = new URL("https://discord.com/oauth2/authorize");
    authorizationUrl.searchParams.set("client_id", this.clientId);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("redirect_uri", this.redirectUri);
    authorizationUrl.searchParams.set(
      "scope",
      this.autoJoin ? "identify guilds.join" : "identify"
    );
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("prompt", "consent");
    return authorizationUrl.href;
  }

  async readSession(sessionId) {
    if (this.sessionStore) {
      const session = typeof sessionId === "string"
        ? await this.sessionStore.read(sessionId, this.clock())
        : null;
      if (!session) return { status: "expired" };
      if (session.status === "not_member") {
        return {
          status: "not_member",
          inviteUrl: this.inviteUrl,
          guildName: this.guildName
        };
      }
      if (session.status === "completed") {
        return { status: "completed", ...session.result };
      }
      if (session.status === "failed") {
        return { status: "failed", code: session.code };
      }
      return { status: session.status };
    }
    this.deleteExpiredSessions();
    if (typeof sessionId !== "string" || !this.sessions.has(sessionId)) {
      return { status: "expired" };
    }
    const session = this.sessions.get(sessionId);
    if (session.status === "completed") {
      this.sessions.delete(sessionId);
      return { status: "completed", ...session.result };
    }
    if (session.status === "not_member") {
      return {
        status: "not_member",
        inviteUrl: this.inviteUrl,
        guildName: this.guildName
      };
    }
    if (session.status === "failed") {
      this.sessions.delete(sessionId);
      return { status: "failed", code: session.code };
    }
    return { status: session.status };
  }

  async completeAuthorization({ state, code, oauthError }) {
    if (this.sessionStore) {
      const session = typeof state === "string"
        ? await this.sessionStore.claimState(state, this.clock())
        : null;
      if (!session) throw makeAuthError("INVALID_OAUTH_STATE");
      return this.completeClaimedAuthorization(session, { code, oauthError });
    }
    this.deleteExpiredSessions();
    if (typeof state !== "string" || !this.oauthStates.has(state)) {
      throw makeAuthError("INVALID_OAUTH_STATE");
    }

    const sessionId = this.oauthStates.get(state);
    const session = this.sessions.get(sessionId);
    if (!session || !safeEquals(session.state, state) || session.status !== "pending") {
      this.oauthStates.delete(state);
      throw makeAuthError("INVALID_OAUTH_STATE");
    }
    this.oauthStates.delete(state);
    session.status = "verifying";

    return this.completeClaimedAuthorization(session, { code, oauthError });
  }

  async completeClaimedAuthorization(session, { code, oauthError }) {
    let accessToken = null;
    try {
      if (oauthError) throw makeAuthError("DISCORD_AUTHORIZATION_DECLINED");
      if (typeof code !== "string" || !code) {
        throw makeAuthError("DISCORD_AUTHORIZATION_FAILED");
      }
      accessToken = await this.exchangeAuthorizationCode(code);
      const discordUser = await this.getDiscordUser(accessToken);
      if (!USER_ID_PATTERN.test(discordUser.id || "")) {
        throw makeAuthError("INVALID_DISCORD_USER");
      }

      let membership = await this.verifyGuildMember(discordUser.id);
      if (!membership && this.autoJoin) {
        await this.addUserToGuild(discordUser.id, accessToken);
        membership = await this.verifyGuildMember(discordUser.id);
      }
      if (!membership) {
        session.status = "not_member";
        await this.saveSession(session);
        return { status: "not_member" };
      }

      const user = {
        id: discordUser.id,
        username: String(discordUser.global_name || discordUser.username || "").slice(0, 80),
        avatar: typeof discordUser.avatar === "string" ? discordUser.avatar.slice(0, 128) : ""
      };
      const customToken = await this.createFirebaseMembershipToken({
        ...discordUser,
        ...user
      });
      session.status = "completed";
      session.result = {
        customToken,
        user
      };
      await this.saveSession(session);
      return { status: "completed" };
    } catch (error) {
      console.error("Discord sign-in failed:", error?.code || error?.name || "UNKNOWN");
      session.status = "failed";
      session.code = [
        "DISCORD_BOT_MISCONFIGURED",
        "DISCORD_OAUTH_MISCONFIGURED"
      ].includes(error?.code)
        ? error.code
        : "DISCORD_SIGN_IN_FAILED";
      await this.saveSession(session);
      throw error;
    } finally {
      if (accessToken) await this.revokeDiscordToken(accessToken);
    }
  }

  async failAuthorization(state, code) {
    let session;
    if (this.sessionStore) {
      session = typeof state === "string"
        ? await this.sessionStore.claimState(state, this.clock())
        : null;
    } else {
      this.deleteExpiredSessions();
      if (typeof state !== "string" || !this.oauthStates.has(state)) return false;
      const sessionId = this.oauthStates.get(state);
      session = this.sessions.get(sessionId);
      this.oauthStates.delete(state);
      if (!session || !safeEquals(session.state, state) || session.status !== "pending") return false;
    }
    if (!session) return false;
    session.status = "failed";
    session.code = code === "access_denied"
      ? "DISCORD_AUTHORIZATION_DECLINED"
      : "DISCORD_AUTHORIZATION_FAILED";
    await this.saveSession(session);
    return true;
  }

  async saveSession(session) {
    if (this.sessionStore) {
      await this.sessionStore.update(session);
    }
  }

  createFirebaseMembershipToken(discordUser) {
    const userId = discordUser.id;
    return this.firebaseAuth.createCustomToken(`discord_${userId}`, {
      discordUserId: userId,
      discordGuildId: this.guildId,
      discordGuildMember: true,
      discordMembershipExpiresAt: Math.floor((this.clock() + MEMBERSHIP_LEASE_MS) / 1000),
      discordUsername: String(discordUser.global_name || discordUser.username || "")
        .slice(0, 80),
      discordAvatar: typeof discordUser.avatar === "string"
        ? discordUser.avatar.slice(0, 128)
        : ""
    });
  }

  async exchangeAuthorizationCode(code) {
    const response = await this.fetchImpl("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri
      }),
      signal: AbortSignal.timeout(12000)
    });
    const tokenResult = await response.json().catch(() => ({}));
    if (!response.ok || typeof tokenResult.access_token !== "string") {
      throw makeAuthError("DISCORD_TOKEN_EXCHANGE_FAILED");
    }
    return tokenResult.access_token;
  }

  async getDiscordUser(accessToken) {
    const response = await this.fetchImpl("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(12000)
    });
    const user = await response.json().catch(() => ({}));
    if (!response.ok || !USER_ID_PATTERN.test(user.id || "")) {
      throw makeAuthError("DISCORD_USER_LOOKUP_FAILED");
    }
    return user;
  }

  async verifyGuildMember(userId) {
    return Boolean(await this.getGuildMember(userId));
  }

  async getGuildMember(userId) {
    if (!USER_ID_PATTERN.test(userId || "")) return null;
    const response = await this.fetchImpl(
      `https://discord.com/api/v10/guilds/${this.guildId}/members/${userId}`,
      {
        headers: { Authorization: `Bot ${this.botToken}` },
        signal: AbortSignal.timeout(12000)
      }
    );
    if (response.status === 404) return null;
    if (response.status === 401 || response.status === 403) {
      throw makeAuthError("DISCORD_BOT_MISCONFIGURED");
    }
    if (!response.ok) throw makeAuthError("DISCORD_MEMBERSHIP_CHECK_FAILED");
    const member = await response.json();
    return member && typeof member === "object" ? member : null;
  }

  async addUserToGuild(userId, accessToken) {
    const response = await this.fetchImpl(
      `https://discord.com/api/v10/guilds/${this.guildId}/members/${userId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${this.botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ access_token: accessToken }),
        signal: AbortSignal.timeout(12000)
      }
    );
    if (response.status !== 201 && response.status !== 204 && response.status !== 200) {
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        throw makeAuthError("DISCORD_AUTO_JOIN_FAILED");
      }
      throw makeAuthError("DISCORD_MEMBERSHIP_CHECK_FAILED");
    }
  }

  async verifyFirebaseMembership(firebaseIdToken) {
    if (typeof firebaseIdToken !== "string" || firebaseIdToken.length > 16000) {
      throw makeAuthError("INVALID_FIREBASE_TOKEN");
    }
    const decoded = await this.firebaseAuth.verifyIdToken(firebaseIdToken);
    if (decoded.discordGuildMember !== true ||
        decoded.discordGuildId !== this.guildId ||
        !USER_ID_PATTERN.test(decoded.discordUserId || "") ||
        decoded.uid !== `discord_${decoded.discordUserId}`) {
      throw makeAuthError("GUILD_MEMBERSHIP_REQUIRED");
    }
    const guildMember = await this.getGuildMember(decoded.discordUserId);
    if (!guildMember) {
      throw makeAuthError("GUILD_MEMBERSHIP_REQUIRED");
    }
    const user = {
      id: decoded.discordUserId,
      username: String(decoded.discordUsername || "").slice(0, 80),
      avatar: String(decoded.discordAvatar || "").slice(0, 128),
      joinedAt: typeof guildMember.joined_at === "string" &&
          Number.isFinite(Date.parse(guildMember.joined_at))
        ? new Date(guildMember.joined_at).toISOString()
        : null
    };
    const leaseExpiresAt = Number(decoded.discordMembershipExpiresAt);
    const needsRenewal = !Number.isSafeInteger(leaseExpiresAt) ||
      leaseExpiresAt * 1000 <= this.clock() + MEMBERSHIP_RENEWAL_WINDOW_MS;
    return {
      user,
      customToken: needsRenewal
        ? await this.createFirebaseMembershipToken({
          id: user.id,
          username: user.username,
          avatar: user.avatar
        })
        : null
    };
  }

  async revokeDiscordToken(accessToken) {
    try {
      const response = await this.fetchImpl("https://discord.com/api/v10/oauth2/token/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          token: accessToken
        }),
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) {
        console.error("Discord OAuth token revocation returned HTTP", response.status);
      }
    } catch (error) {
      console.error("Discord OAuth token revocation failed:", error?.name || "UNKNOWN");
    }
  }

  deleteExpiredSessions() {
    const now = this.clock();
    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt <= now) this.sessions.delete(sessionId);
    }
    for (const [state, sessionId] of this.oauthStates) {
      if (!this.sessions.has(sessionId)) this.oauthStates.delete(state);
    }
  }
}

module.exports = {
  DiscordMembershipService,
  MEMBERSHIP_LEASE_MS,
  MEMBERSHIP_RENEWAL_WINDOW_MS,
  OAUTH_SESSION_LIFETIME_MS
};
