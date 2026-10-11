import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { importSPKI, jwtVerify } from "jose";
import {
  createFirebaseAuth,
  imageSearchProviderStatus,
  isEnabledImageSearchAdministrator,
  serveUpdateRequest
} from "./cloudflare-worker.mjs";

test("image search provider status reports availability without exposing Cloudflare secrets", () => {
  const status = imageSearchProviderStatus({
    IGDB_CLIENT_ID: "private-client-id",
    IGDB_CLIENT_SECRET: "private-client-secret",
    THEGAMESDB_API_KEY: "private-games-key",
    STEAMGRIDDB_API_KEY: "private-grid-key"
  });

  assert.deepEqual(status, { igdb: true, thegamesdb: true, steamgriddb: true });
  assert.equal(JSON.stringify(status).includes("private"), false);
});

test("image search requires an enabled administrator document in Firestore", async () => {
  const idToken = "firebase-id-token";
  const firebaseAuth = {
    async verifyIdToken(token) {
      assert.equal(token, idToken);
      return { uid: "discord_12345678901234567" };
    }
  };
  const result = await isEnabledImageSearchAdministrator(
    idToken,
    firebaseAuth,
    "drekotranslation",
    async (url, options) => {
      assert.equal(
        url,
        "https://firestore.googleapis.com/v1/projects/drekotranslation/databases/(default)/documents/administrators/discord_12345678901234567"
      );
      assert.equal(options.headers.Authorization, `Bearer ${idToken}`);
      return new Response(JSON.stringify({ fields: { enabled: { booleanValue: true } } }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  );

  assert.equal(result, true);
});

test("update manifests route release downloads through GitHub's public asset URL", async () => {
  const releaseApiUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/latest?per_page=1&channel=stable";
  const manifestAssetUrl = "https://github.com/mohammedateyah/DrekoTranslation/releases/download/v1.0.2/latest.yml";
  const requestedUrls = [];
  const response = await serveUpdateRequest(
    new Request("https://dreko-discord-auth.example/updates/latest.yml"),
    async (url, options) => {
      requestedUrls.push(url);
      if (url === releaseApiUrl) {
        assert.equal(options.cf.cacheTtl, 30);
        return new Response(JSON.stringify({
          tag_name: "v1.0.2"
        }), { headers: { "Content-Type": "application/json" } });
      }
      assert.equal(url, manifestAssetUrl);
      assert.equal(options.redirect, "follow");
      return new Response([
          "version: 1.0.1",
          "files:",
          "  - url: Dreko-Translation-Setup-1.0.1.exe",
          "    sha512: example",
          "path: Dreko-Translation-Setup-1.0.1.exe"
        ].join("\n"));
    }
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/yaml/);
  assert.deepEqual(requestedUrls, [releaseApiUrl, manifestAssetUrl]);
  assert.match(
    await response.text(),
    /"https:\/\/dreko-discord-auth\.example\/updates\/Dreko-Translation-Setup-1\.0\.1\.exe"/g
  );
});

test("installer downloads stream through GitHub's public asset URL and preserve ranges", async () => {
  const releaseApiUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/latest?per_page=1&channel=stable";
  const installerAssetUrl = "https://github.com/mohammedateyah/DrekoTranslation/releases/download/v1.0.2/Dreko-Translation-Setup-1.0.2.exe";
  const response = await serveUpdateRequest(
    new Request("https://dreko-discord-auth.example/updates/Dreko-Translation-Setup-1.0.2.exe", {
      headers: { Range: "bytes=0-6" }
    }),
    async (url, options) => {
      if (url === releaseApiUrl) {
        return new Response(JSON.stringify({
          tag_name: "v1.0.2"
        }), { headers: { "Content-Type": "application/json" } });
      }
      assert.equal(url, installerAssetUrl);
      assert.equal(options.redirect, "follow");
      assert.equal(options.headers.Range, "bytes=0-6");
      return new Response("partial", {
        status: 206,
        headers: {
          "Content-Length": "7",
          "Content-Range": "bytes 0-6/100",
          "Content-Type": "application/octet-stream"
        }
      });
    }
  );

  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 0-6/100");
  assert.equal(await response.text(), "partial");
});

test("installer HEAD requests return asset headers without a body", async () => {
  const releaseApiUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/latest?per_page=1&channel=stable";
  const installerAssetUrl = "https://github.com/mohammedateyah/DrekoTranslation/releases/download/v1.0.2/Dreko-Translation-Setup-1.0.2.exe";
  const response = await serveUpdateRequest(
    new Request("https://dreko-discord-auth.example/updates/Dreko-Translation-Setup-1.0.2.exe", {
      method: "HEAD"
    }),
    async (url, options) => {
      if (url === releaseApiUrl) {
        return new Response(JSON.stringify({ tag_name: "v1.0.2" }), {
          headers: { "Content-Type": "application/json" }
        });
      }
      assert.equal(url, installerAssetUrl);
      assert.equal(options.method, "HEAD");
      return new Response(null, {
        status: 200,
        headers: {
          "Content-Length": "112925610",
          "Content-Type": "application/octet-stream"
        }
      });
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-length"), "112925610");
  assert.equal(response.body, null);
});

test("the legacy update feed rejects unsupported files", async () => {
  const response = await serveUpdateRequest(
    new Request("https://dreko-discord-auth.example/updates/private.txt")
  );

  assert.equal(response.status, 404);
});

test("Firebase custom tokens wrap developer claims in the claims field", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  });
  const serviceAccount = {
    type: "service_account",
    project_id: "drekotranslation",
    client_email: "firebase-admin@example.test",
    private_key_id: "test-key-id",
    private_key: privateKey
  };
  const auth = createFirebaseAuth({
    FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify(serviceAccount)
  }, "drekotranslation");

  const token = await auth.createCustomToken("discord_12345678901234567", {
    discordGuildMember: true,
    discordGuildId: "766985465323716649"
  });
  const verificationKey = await importSPKI(publicKey, "RS256");
  const { payload, protectedHeader } = await jwtVerify(token, verificationKey, {
    algorithms: ["RS256"],
    audience: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    issuer: serviceAccount.client_email,
    subject: serviceAccount.client_email
  });

  assert.equal(protectedHeader.kid, serviceAccount.private_key_id);
  assert.equal(payload.uid, "discord_12345678901234567");
  assert.deepEqual(payload.claims, {
    discordGuildMember: true,
    discordGuildId: "766985465323716649"
  });
  assert.equal(payload.discordGuildMember, undefined);
});

test("Firebase service-account credentials must match the configured project", async () => {
  const auth = createFirebaseAuth({
    FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify({
      type: "service_account",
      project_id: "another-project",
      client_email: "firebase-admin@example.test",
      private_key: "invalid"
    })
  }, "drekotranslation");

  await assert.rejects(
    auth.createCustomToken("discord_12345678901234567"),
    /do not match the configured project/
  );
});
