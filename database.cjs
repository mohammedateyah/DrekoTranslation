const {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual
} = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const CATEGORIES = new Set(["full", "interface"]);
const STATUSES = new Set(["ready", "progress"]);
const VISIBILITIES = new Set(["published", "draft"]);
const BUILT_IN_COVERS = new Set([
  "astral-observer",
  "paper-moon",
  "last-orchard",
  "velvet-noir",
  "nocturne",
  "lantern-keep",
  "city-of-glass",
  "forgotten-passage",
  "clockwork-cafe",
  "midnight-repairs",
  "wilds",
  "quiet-thunder"
]);
const UPLOADED_COVER_PATTERN = /^uploaded:[0-9a-f-]{36}$/i;
const REMOTE_COVER_PATTERN = /^https?:\/\/[^\s"'<>]+$/i;
const SCRYPT_OPTIONS = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const HASH_LENGTH = 64;
class StoreError extends Error {
  constructor(code) {
    super(code);
    this.name = "StoreError";
    this.code = code;
  }
}

function normalizeText(value, code, minLength, maxLength, collapseWhitespace = true) {
  if (typeof value !== "string") throw new StoreError(code);
  const normalized = collapseWhitespace
    ? value.normalize("NFKC").trim().replace(/\s+/gu, " ")
    : value.normalize("NFKC").trim();
  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new StoreError(code);
  }
  return normalized;
}

function toPublicTranslation(row) {
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en,
    developer: row.developer,
    genre: row.genre,
    category: row.category,
    status: row.status,
    year: row.year,
    popularity: row.popularity,
    cover: row.cover,
    description: row.description,
    updatedAt: row.updated_at
  };
}

function isRemoteCoverUrl(value) {
  if (typeof value !== "string" || value.length < 10 || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function normalizeTranslation(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new StoreError("INVALID_TRANSLATION");
  }

  const title = normalizeText(input.title, "TITLE_REQUIRED", 1, 100);
  const titleEn = normalizeText(input.titleEn, "TITLE_EN_REQUIRED", 1, 100);
  const developer = normalizeText(input.developer, "DEVELOPER_REQUIRED", 1, 80);
  const genre = normalizeText(input.genre, "GENRE_REQUIRED", 1, 36);
  const description = normalizeText(input.description ?? "", "DESCRIPTION_TOO_LONG", 0, 1000, false);
  const { category, status, visibility, cover, year, popularity } = input;

  if (!CATEGORIES.has(category)) throw new StoreError("INVALID_CATEGORY");
  if (!STATUSES.has(status)) throw new StoreError("INVALID_STATUS");
  if (!VISIBILITIES.has(visibility)) throw new StoreError("INVALID_VISIBILITY");
  if (typeof cover !== "string" ||
      (!BUILT_IN_COVERS.has(cover) &&
       !UPLOADED_COVER_PATTERN.test(cover) &&
       !REMOTE_COVER_PATTERN.test(cover) &&
       !isRemoteCoverUrl(cover))) {
    throw new StoreError("INVALID_COVER");
  }
  if (!Number.isSafeInteger(year) || year < 1970 || year > 2200) {
    throw new StoreError("INVALID_YEAR");
  }
  if (!Number.isSafeInteger(popularity) || popularity < 0 || popularity > 100_000_000) {
    throw new StoreError("INVALID_POPULARITY");
  }

  return {
    title,
    titleEn,
    developer,
    genre,
    category,
    status,
    visibility,
    year,
    popularity,
    cover,
    description
  };
}

class TranslationDatabase {
  constructor(databasePath) {
    if (typeof databasePath !== "string" || databasePath.length === 0) {
      throw new StoreError("INVALID_DATABASE_PATH");
    }

    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.databasePath = databasePath;
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
      PRAGMA secure_delete = ON;
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS administrator (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        salt BLOB NOT NULL,
        password_hash BLOB NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE TABLE IF NOT EXISTS covers (
        id TEXT PRIMARY KEY,
        extension TEXT NOT NULL CHECK(extension IN ('png', 'jpg', 'webp')),
        byte_length INTEGER NOT NULL CHECK(byte_length > 0),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE TABLE IF NOT EXISTS translations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        title_en TEXT NOT NULL,
        developer TEXT NOT NULL,
        genre TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        visibility TEXT NOT NULL,
        year INTEGER NOT NULL,
        popularity INTEGER NOT NULL DEFAULT 0,
        cover TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
    `);

    this.removeLegacyDemoCatalog();
    this.dummySalt = randomBytes(16);
    this.dummyHash = scryptSync("not-a-dreko-administrator-password", this.dummySalt, HASH_LENGTH, SCRYPT_OPTIONS);
  }

  removeLegacyDemoCatalog() {
    const legacyRows = this.database.prepare(
      "SELECT cover FROM translations WHERE id GLOB 'demo-*'"
    ).all();
    const seedMarker = this.database.prepare(
      "SELECT 1 FROM metadata WHERE key = ?"
    ).get("demo-catalog-seeded");
    if (legacyRows.length === 0 && !seedMarker) return;

    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.exec("DELETE FROM translations WHERE id GLOB 'demo-*'");
      this.database.prepare("DELETE FROM metadata WHERE key = ?").run("demo-catalog-seeded");
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }

    for (const cover of new Set(legacyRows.map((row) => row.cover))) {
      const coverPath = this.removeUnreferencedCover(cover);
      if (coverPath) fs.rmSync(coverPath, { force: true });
    }
  }

  isAdminConfigured() {
    return Boolean(this.database.prepare("SELECT 1 AS present FROM administrator WHERE id = 1").get());
  }

  createAdmin(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new StoreError("INVALID_CREDENTIALS");
    }

    const username = normalizeText(input.username, "INVALID_USERNAME", 3, 32)
      .normalize("NFKC");
    if (!/^[\p{L}\p{N}_.-]+$/u.test(username)) throw new StoreError("INVALID_USERNAME");
    if (typeof input.password !== "string" ||
        input.password.length < 10 ||
        input.password.length > 128) {
      throw new StoreError("PASSWORD_LENGTH");
    }
    if (input.password !== input.confirmPassword) throw new StoreError("PASSWORD_MISMATCH");

    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (this.isAdminConfigured()) throw new StoreError("ADMIN_ALREADY_CONFIGURED");

      const salt = randomBytes(16);
      const passwordHash = scryptSync(input.password, salt, HASH_LENGTH, SCRYPT_OPTIONS);
      this.database.prepare(
        "INSERT INTO administrator (id, username, salt, password_hash) VALUES (1, ?, ?, ?)"
      ).run(username, salt, passwordHash);
      this.database.exec("COMMIT");
      return { username };
    } catch (error) {
      this.database.exec("ROLLBACK");
      if (error instanceof StoreError) throw error;
      if (error && error.code === "ERR_SQLITE_CONSTRAINT_UNIQUE") {
        throw new StoreError("USERNAME_EXISTS");
      }
      throw error;
    }
  }

  verifyAdmin(input) {
    const username = typeof input?.username === "string"
      ? input.username.normalize("NFKC").trim()
      : "";
    const password = typeof input?.password === "string" ? input.password : "";
    const account = this.database.prepare(
      "SELECT username, salt, password_hash FROM administrator WHERE id = 1"
    ).get();
    const salt = account?.salt || this.dummySalt;
    const expectedHash = account?.password_hash || this.dummyHash;
    const candidateHash = scryptSync(password, salt, HASH_LENGTH, SCRYPT_OPTIONS);
    const passwordMatches = timingSafeEqual(expectedHash, candidateHash);

    if (!account || account.username.toLocaleLowerCase("en-US") !== username.toLocaleLowerCase("en-US") ||
        !passwordMatches) {
      return false;
    }
    return true;
  }

  listPublicTranslations() {
    return this.database.prepare(`
      SELECT * FROM translations
      WHERE visibility = 'published'
      ORDER BY updated_at DESC, id ASC
    `).all().map(toPublicTranslation);
  }

  listAdminTranslations() {
    return this.database.prepare(`
      SELECT * FROM translations
      ORDER BY updated_at DESC, id ASC
    `).all().map((row) => ({
      ...toPublicTranslation(row),
      visibility: row.visibility
    }));
  }

  addCover(id, extension, byteLength) {
    if (!/^[0-9a-f-]{36}$/i.test(id) || !["png", "jpg", "webp"].includes(extension) ||
        !Number.isSafeInteger(byteLength) || byteLength < 1 || byteLength > 8 * 1024 * 1024) {
      throw new StoreError("INVALID_COVER");
    }
    this.database.prepare(
      "INSERT INTO covers (id, extension, byte_length) VALUES (?, ?, ?)"
    ).run(id, extension, byteLength);
  }

  getCoverPath(id) {
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
      throw new StoreError("INVALID_COVER");
    }
    const cover = this.database.prepare("SELECT extension FROM covers WHERE id = ?").get(id);
    if (!cover) return null;
    return path.join(path.dirname(this.databasePath), "covers", `${id}.${cover.extension}`);
  }

  saveTranslation(input) {
    const record = normalizeTranslation(input);
    if (UPLOADED_COVER_PATTERN.test(record.cover) &&
        !this.database.prepare("SELECT 1 AS present FROM covers WHERE id = ?").get(record.cover.slice(9))) {
      throw new StoreError("COVER_NOT_FOUND");
    }

    if (input.id !== undefined && input.id !== null && typeof input.id !== "string") {
      throw new StoreError("INVALID_TRANSLATION_ID");
    }

    if (input.id) {
      if (!/^[A-Za-z0-9-]{1,64}$/.test(input.id)) throw new StoreError("INVALID_TRANSLATION_ID");
      const existing = this.database.prepare(
        "SELECT cover FROM translations WHERE id = ?"
      ).get(input.id);
      if (!existing) throw new StoreError("TRANSLATION_NOT_FOUND");
      const result = this.database.prepare(`
        UPDATE translations SET
          title = @title,
          title_en = @titleEn,
          developer = @developer,
          genre = @genre,
          category = @category,
          status = @status,
          visibility = @visibility,
          year = @year,
          popularity = @popularity,
          cover = @cover,
          description = @description,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = @id
      `).run({ ...record, id: input.id });
      if (result.changes !== 1) throw new StoreError("TRANSLATION_NOT_FOUND");
      return {
        translation: this.database.prepare("SELECT * FROM translations WHERE id = ?").get(input.id),
        previousCover: existing.cover
      };
    }

    const id = randomUUID();
    this.database.prepare(`
      INSERT INTO translations
        (id, title, title_en, developer, genre, category, status, visibility, year, popularity, cover, description)
      VALUES
        (@id, @title, @titleEn, @developer, @genre, @category, @status, @visibility, @year, @popularity, @cover, @description)
    `).run({ ...record, id });
    return {
      translation: this.database.prepare("SELECT * FROM translations WHERE id = ?").get(id),
      previousCover: null
    };
  }

  deleteTranslation(id) {
    if (typeof id !== "string" || !/^[A-Za-z0-9-]{1,64}$/.test(id)) {
      throw new StoreError("INVALID_TRANSLATION_ID");
    }
    const translation = this.database.prepare(
      "SELECT cover FROM translations WHERE id = ?"
    ).get(id);
    if (!translation) throw new StoreError("TRANSLATION_NOT_FOUND");

    this.database.prepare("DELETE FROM translations WHERE id = ?").run(id);
    return translation.cover;
  }

  removeUnreferencedCover(cover) {
    if (typeof cover !== "string" || !UPLOADED_COVER_PATTERN.test(cover)) return null;
    const coverId = cover.slice(9);
    if (this.database.prepare("SELECT 1 AS present FROM translations WHERE cover = ?").get(cover)) {
      return null;
    }

    const row = this.database.prepare("SELECT extension FROM covers WHERE id = ?").get(coverId);
    if (!row) return null;
    this.database.prepare("DELETE FROM covers WHERE id = ?").run(coverId);
    return path.join(path.dirname(this.databasePath), "covers", `${coverId}.${row.extension}`);
  }

  close() {
    this.database.close();
  }
}

module.exports = {
  BUILT_IN_COVERS,
  StoreError,
  TranslationDatabase
};
