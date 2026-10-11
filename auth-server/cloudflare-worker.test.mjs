import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { importSPKI, jwtVerify } from "jose";
import { createFirebaseAuth, serveUpdateRequest } from "./cloudflare-worker.mjs";

test("update manifests route release assets through the Worker", async () => {
  const releaseApiUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/latest?per_page=1&channel=stable";
  const taggedReleaseUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/tags/v1.0.2?channel=stable";
  const assetsApiUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/789/assets?per_page=100";
  const manifestAssetUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/assets/123";
  const requestedUrls = [];
  const response = await serveUpdateRequest(
    new Request("https://dreko-discord-auth.example/updates/latest.yml"),
    async (url, options) => {
      requestedUrls.push(url);
      if (url === releaseApiUrl) {
        assert.equal(options.cf.cacheTtl, 30);
        return new Response(JSON.stringify({
          tag_name: "v1.0.2",
          assets: [{ name: "Dreko-Translation-Setup-1.0.2.exe.blockmap", url: `${manifestAssetUrl}-blockmap` }]
        }), { headers: { "Content-Type": "application/json" } });
      }
      if (url === taggedReleaseUrl) {
        return new Response(JSON.stringify({
          tag_name: "v1.0.2",
          assets_url: "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/789/assets"
        }), { headers: { "Content-Type": "application/json" } });
      }
      if (url === assetsApiUrl) {
        return new Response(JSON.stringify([
          { name: "latest.yml", url: manifestAssetUrl }
        ]), { headers: { "Content-Type": "application/json" } });
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
  assert.deepEqual(requestedUrls, [releaseApiUrl, taggedReleaseUrl, assetsApiUrl, manifestAssetUrl]);
  assert.match(
    await response.text(),
    /"https:\/\/dreko-discord-auth\.example\/updates\/Dreko-Translation-Setup-1\.0\.1\.exe"/g
  );
});

test("installer downloads stream through GitHub's asset API and preserve ranges", async () => {
  const releaseApiUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/latest?per_page=1&channel=stable";
  const taggedReleaseUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/tags/v1.0.2?channel=stable";
  const assetsApiUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/789/assets?per_page=100";
  const installerAssetUrl = "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/assets/456";
  const response = await serveUpdateRequest(
    new Request("https://dreko-discord-auth.example/updates/Dreko-Translation-Setup-1.0.2.exe", {
      headers: { Range: "bytes=0-6" }
    }),
    async (url, options) => {
      if (url === releaseApiUrl) {
        return new Response(JSON.stringify({
          tag_name: "v1.0.2",
          assets: []
        }), { headers: { "Content-Type": "application/json" } });
      }
      if (url === taggedReleaseUrl) {
        return new Response(JSON.stringify({
          tag_name: "v1.0.2",
          assets_url: "https://api.github.com/repos/mohammedateyah/DrekoTranslation/releases/789/assets"
        }), { headers: { "Content-Type": "application/json" } });
      }
      if (url === assetsApiUrl) {
        return new Response(JSON.stringify([{
            name: "Dreko-Translation-Setup-1.0.2.exe",
            url: installerAssetUrl
          }]), { headers: { "Content-Type": "application/json" } });
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
