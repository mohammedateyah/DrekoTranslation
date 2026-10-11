import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { importSPKI, jwtVerify } from "jose";
import { createFirebaseAuth, serveUpdateRequest } from "./cloudflare-worker.mjs";

test("legacy update clients receive absolute GitHub release asset URLs", async () => {
  const response = await serveUpdateRequest(
    new Request("https://dreko-discord-auth.example/updates/latest.yml"),
    async (url) => {
      assert.equal(
        url,
        "https://github.com/mohammedateyah/DrekoTranslation/releases/latest/download/latest.yml"
      );
      return {
        ok: true,
        url: "https://github.com/mohammedateyah/DrekoTranslation/releases/download/v1.0.1/latest.yml",
        text: async () => [
          "version: 1.0.1",
          "files:",
          "  - url: Dreko Translation Setup 1.0.1.exe",
          "    sha512: example",
          "path: Dreko Translation Setup 1.0.1.exe"
        ].join("\n")
      };
    }
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/yaml/);
  assert.match(
    await response.text(),
    /"https:\/\/github\.com\/mohammedateyah\/DrekoTranslation\/releases\/download\/v1\.0\.1\/Dreko%20Translation%20Setup%201\.0\.1\.exe"/g
  );
});

test("legacy update clients are redirected only to installer and blockmap assets", async () => {
  const response = await serveUpdateRequest(
    new Request("https://dreko-discord-auth.example/updates/Dreko%20Translation%20Setup%201.0.1.exe")
  );

  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("location"),
    "https://github.com/mohammedateyah/DrekoTranslation/releases/latest/download/Dreko%20Translation%20Setup%201.0.1.exe"
  );
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
