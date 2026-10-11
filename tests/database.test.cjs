const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const test = require("node:test");
const { StoreError, TranslationDatabase } = require("../database.cjs");

const GOOD_PASSWORD = "S0me-Unique!Admin#Password";
const NEW_TRANSLATION = {
  title: "بوابة الفجر",
  titleEn: "The Dawn Gate",
  developer: "North Lantern",
  genre: "adventure",
  category: "full",
  status: "ready",
  visibility: "published",
  year: 2026,
  popularity: 27,
  cover: "astral-observer",
  description: "رحلة قصيرة لاكتشاف طريق جديد."
};

async function makeDatabase(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dreko-translation-"));
  const databases = new Set();
  t.after(async () => {
    for (const database of [...databases].reverse()) database.close();
    await fs.rm(directory, { recursive: true, force: true });
  });
  return {
    directory,
    databasePath: path.join(directory, "dreko.sqlite"),
    track(database) {
      databases.add(database);
      return database;
    },
    close(database) {
      if (!databases.delete(database)) return;
      database.close();
    }
  };
}

test("the local catalogue starts empty and excludes drafts from public browsing", async (t) => {
  const environment = await makeDatabase(t);
  const database = environment.track(new TranslationDatabase(environment.databasePath));

  assert.equal(database.isAdminConfigured(), false);
  assert.equal(database.listAdminTranslations().length, 0);
  assert.equal(database.listPublicTranslations().length, 0);
  assert.throws(
    () => database.saveTranslation({ ...NEW_TRANSLATION, visibility: "secret" }),
    (error) => error instanceof StoreError && error.code === "INVALID_VISIBILITY"
  );

  database.saveTranslation(NEW_TRANSLATION);
  assert.equal(database.listAdminTranslations().length, 1);
  assert.equal(database.listPublicTranslations().length, 1);

  const draft = database.saveTranslation({
    ...NEW_TRANSLATION,
    title: "مسودة مخفية",
    titleEn: "Hidden Draft",
    visibility: "draft"
  }).translation;

  assert.equal(database.listAdminTranslations().length, 2);
  assert.equal(database.listPublicTranslations().length, 1);
  assert.ok(!database.listPublicTranslations().some((item) => item.id === draft.id));
});

test("legacy demo translations are removed when opening an existing local database", async (t) => {
  const environment = await makeDatabase(t);
  const database = environment.track(new TranslationDatabase(environment.databasePath));
  database.database.prepare(`
    INSERT INTO translations
      (id, title, title_en, developer, genre, category, status, visibility, year, popularity, cover)
    VALUES ('demo-astral', 'أرشيف النجوم', 'The Astral Archive', 'Silver Comet Studio',
      'adventure', 'full', 'ready', 'published', 2026, 938, 'astral-observer')
  `).run();
  database.saveTranslation(NEW_TRANSLATION);
  database.database.prepare("INSERT INTO metadata (key, value) VALUES (?, ?)").run("demo-catalog-seeded", "yes");
  environment.close(database);

  const reopened = environment.track(new TranslationDatabase(environment.databasePath));
  assert.equal(reopened.listAdminTranslations().length, 1);
  assert.equal(reopened.listPublicTranslations().length, 1);
  assert.equal(reopened.listPublicTranslations()[0].title, NEW_TRANSLATION.title);
  assert.equal(
    reopened.database.prepare("SELECT 1 FROM metadata WHERE key = ?").get("demo-catalog-seeded"),
    undefined
  );
});

test("the first administrator is created exactly once and passwords are checked case-insensitively", async (t) => {
  const environment = await makeDatabase(t);
  const database = environment.track(new TranslationDatabase(environment.databasePath));

  assert.equal(database.verifyAdmin({ username: "anything", password: GOOD_PASSWORD }), false);
  assert.deepEqual(
    database.createAdmin({
      username: "Dreko.Owner",
      password: GOOD_PASSWORD,
      confirmPassword: GOOD_PASSWORD
    }),
    { username: "Dreko.Owner" }
  );
  assert.equal(database.isAdminConfigured(), true);
  assert.equal(database.verifyAdmin({ username: "dreko.owner", password: GOOD_PASSWORD }), true);
  assert.equal(database.verifyAdmin({ username: "dreko.owner", password: "not-the-password" }), false);
  assert.equal(database.verifyAdmin({ username: "another-user", password: GOOD_PASSWORD }), false);
  assert.throws(
    () => database.createAdmin({ username: "Replacement", password: GOOD_PASSWORD, confirmPassword: GOOD_PASSWORD }),
    (error) => error instanceof StoreError && error.code === "ADMIN_ALREADY_CONFIGURED"
  );
  assert.throws(
    () => database.createAdmin({ username: "Another.Owner", password: GOOD_PASSWORD, confirmPassword: "different-password" }),
    (error) => error instanceof StoreError && error.code === "PASSWORD_MISMATCH"
  );
});

test("published entries can be created, edited, kept private, and deleted", async (t) => {
  const environment = await makeDatabase(t);
  const database = environment.track(new TranslationDatabase(environment.databasePath));

  const created = database.saveTranslation(NEW_TRANSLATION).translation;
  assert.equal(created.title, NEW_TRANSLATION.title);
  assert.equal(created.title_en, NEW_TRANSLATION.titleEn);
  assert.ok(database.listPublicTranslations().some((item) => item.id === created.id));

  const updated = database.saveTranslation({
    ...NEW_TRANSLATION,
    id: created.id,
    title: "فجرٌ جديد",
    titleEn: "A Brighter Dawn",
    visibility: "draft",
    popularity: 48
  });
  assert.equal(updated.previousCover, NEW_TRANSLATION.cover);
  assert.equal(updated.translation.title_en, "A Brighter Dawn");
  assert.equal(updated.translation.popularity, 48);
  assert.ok(!database.listPublicTranslations().some((item) => item.id === created.id));

  assert.equal(database.deleteTranslation(created.id), NEW_TRANSLATION.cover);
  assert.ok(!database.listAdminTranslations().some((item) => item.id === created.id));
  assert.throws(
    () => database.deleteTranslation(created.id),
    (error) => error instanceof StoreError && error.code === "TRANSLATION_NOT_FOUND"
  );
});

test("invalid records and unknown image uploads never enter the catalogue", async (t) => {
  const environment = await makeDatabase(t);
  const database = environment.track(new TranslationDatabase(environment.databasePath));

  for (const [input, expectedCode] of [
    [{ ...NEW_TRANSLATION, title: "" }, "TITLE_REQUIRED"],
    [{ ...NEW_TRANSLATION, titleEn: "" }, "TITLE_EN_REQUIRED"],
    [{ ...NEW_TRANSLATION, developer: " ".repeat(8) }, "DEVELOPER_REQUIRED"],
    [{ ...NEW_TRANSLATION, year: 1960 }, "INVALID_YEAR"],
    [{ ...NEW_TRANSLATION, popularity: -1 }, "INVALID_POPULARITY"],
    [{ ...NEW_TRANSLATION, category: "root" }, "INVALID_CATEGORY"],
    [{ ...NEW_TRANSLATION, cover: "../cover.png" }, "INVALID_COVER"],
    [{ ...NEW_TRANSLATION, description: "x".repeat(1001) }, "DESCRIPTION_TOO_LONG"],
    [{ ...NEW_TRANSLATION, id: "../outside-file" }, "INVALID_TRANSLATION_ID"],
    [{ ...NEW_TRANSLATION, cover: `uploaded:${randomUUID()}` }, "COVER_NOT_FOUND"]
  ]) {
    assert.throws(
      () => database.saveTranslation(input),
      (error) => error instanceof StoreError && error.code === expectedCode
    );
  }

  assert.equal(database.listAdminTranslations().length, 0);
  assert.throws(
    () => database.createAdmin({ username: "x!", password: GOOD_PASSWORD, confirmPassword: GOOD_PASSWORD }),
    (error) => error instanceof StoreError && error.code === "INVALID_USERNAME"
  );
});

test("uploaded artwork stays available while referenced and is collected after its last translation is deleted", async (t) => {
  const environment = await makeDatabase(t);
  const database = environment.track(new TranslationDatabase(environment.databasePath));
  const { directory } = environment;

  const coverId = randomUUID();
  database.addCover(coverId, "webp", 512);
  const uploadedCover = `uploaded:${coverId}`;
  const uploadedTranslation = database.saveTranslation({
    ...NEW_TRANSLATION,
    title: "لون الغروب",
    titleEn: "Colors at Sunset",
    cover: uploadedCover
  }).translation;

  assert.equal(
    database.getCoverPath(coverId),
    path.join(directory, "covers", `${coverId}.webp`)
  );

  database.saveTranslation({
    ...NEW_TRANSLATION,
    title: "ضوء المساء",
    titleEn: "Evening Light",
    cover: uploadedCover
  });
  database.deleteTranslation(uploadedTranslation.id);
  assert.equal(database.removeUnreferencedCover(uploadedCover), null);

  const second = database.listAdminTranslations().find((item) => item.cover === uploadedCover);
  assert.ok(second);
  database.deleteTranslation(second.id);
  assert.equal(
    database.removeUnreferencedCover(uploadedCover),
    path.join(directory, "covers", `${coverId}.webp`)
  );
  assert.equal(database.getCoverPath(coverId), null);
  assert.equal(database.removeUnreferencedCover(uploadedCover), null);
});

test("catalogue changes and the first-admin lock persist after reopening the SQLite database", async (t) => {
  const environment = await makeDatabase(t);
  const { databasePath } = environment;
  const database = environment.track(new TranslationDatabase(databasePath));
  database.saveTranslation(NEW_TRANSLATION);
  database.createAdmin({
    username: "Owner-Dreko",
    password: GOOD_PASSWORD,
    confirmPassword: GOOD_PASSWORD
  });
  environment.close(database);

  const reopened = environment.track(new TranslationDatabase(databasePath));
  assert.equal(reopened.isAdminConfigured(), true);
  assert.equal(reopened.verifyAdmin({ username: "owner-dreko", password: GOOD_PASSWORD }), true);
  assert.equal(reopened.listPublicTranslations().length, 1);
  assert.throws(
    () => reopened.createAdmin({ username: "AnotherOwner", password: GOOD_PASSWORD, confirmPassword: GOOD_PASSWORD }),
    (error) => error instanceof StoreError && error.code === "ADMIN_ALREADY_CONFIGURED"
  );
});
