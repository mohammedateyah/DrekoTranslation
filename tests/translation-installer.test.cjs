const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  downloadToFile,
  extractZip,
  getInstallRecord,
  installExtractedFiles,
  removeInstalledTranslation,
  safeArchivePath,
  validateDownloadUrl
} = require("../translation-installer.cjs");

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(contents) {
  let value = 0xffffffff;
  for (const byte of contents) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const [name, value, unixMode = 0] of entries) {
    const nameBytes = Buffer.from(name);
    const contents = Buffer.from(value);
    const checksum = crc32(contents);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(contents.length, 18);
    localHeader.writeUInt32LE(contents.length, 22);
    localHeader.writeUInt16LE(nameBytes.length, 26);
    localParts.push(localHeader, nameBytes, contents);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(contents.length, 20);
    centralHeader.writeUInt32LE(contents.length, 24);
    centralHeader.writeUInt16LE(nameBytes.length, 28);
    centralHeader.writeUInt32LE((unixMode << 16) >>> 0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, nameBytes);
    localOffset += localHeader.length + nameBytes.length + contents.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

async function createWorkspace(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "dreko-installer-test-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return {
    root,
    archive: path.join(root, "package.zip"),
    extracted: path.join(root, "extracted"),
    game: path.join(root, "game"),
    stateFile: path.join(root, "user-data", "installed-translations.json"),
    backupRoot: path.join(root, "user-data", "translation-backups")
  };
}

async function writeArchive(archivePath, entries) {
  await fs.writeFile(archivePath, createZip(entries));
}

test("validates HTTPS package URLs and rejects local or non-HTTPS targets", () => {
  assert.equal(validateDownloadUrl("https://example.com/translation.zip").hostname, "example.com");
  for (const value of [
    "http://example.com/translation.zip",
    "https://localhost/package.zip",
    "https://127.0.0.1/package.zip",
    "https://10.1.2.3/package.zip",
    "https://192.168.1.2/package.zip",
    "https://[::1]/package.zip",
    "https://user:password@example.com/package.zip"
  ]) {
    assert.equal(validateDownloadUrl(value), null, value);
  }
});

test("stops reading and removes a partial package when download is cancelled", async (t) => {
  const workspace = await createWorkspace(t);
  const controller = new AbortController();
  let chunksSent = 0;
  let bodyCancelled = false;
  let timer;
  let resolvePendingPull;
  const body = new ReadableStream({
    pull(streamController) {
      return new Promise((resolve) => {
        resolvePendingPull = resolve;
        timer = setTimeout(() => {
          chunksSent += 1;
          streamController.enqueue(Buffer.alloc(64 * 1024, 1));
          resolve();
        }, 10);
      });
    },
    cancel() {
      bodyCancelled = true;
      clearTimeout(timer);
      resolvePendingPull?.();
    }
  });

  await assert.rejects(downloadToFile(
    "https://downloads.example.com/translation.zip",
    path.join(workspace.root, "partial.zip"),
    {
      signal: controller.signal,
      fetchImpl: async () => ({
        ok: true,
        body,
        headers: new Headers({ "content-length": "10000000" })
      }),
      onProgress: () => controller.abort()
    }
  ), { name: "AbortError" });

  assert.equal(bodyCancelled, true);
  assert.equal(chunksSent, 1);
  await assert.rejects(fs.access(path.join(workspace.root, "partial.zip")), { code: "ENOENT" });
});

test("rejects archive paths that escape or cannot be represented safely on Windows", () => {
  const root = path.resolve(os.tmpdir(), "dreko-safe-archive-root");
  assert.equal(safeArchivePath("../outside.txt", root), null);
  assert.equal(safeArchivePath("folder/../../outside.txt", root), null);
  assert.equal(safeArchivePath("C:/outside.txt", root), null);
  assert.equal(safeArchivePath("folder\\outside.txt", root), null);
  assert.equal(safeArchivePath("CON.txt", root), null);
  assert.equal(safeArchivePath("valid/folder/file.txt", root).isDirectory, false);
});

test("extracts a ZIP and installs/removes files while restoring overwritten originals", async (t) => {
  const workspace = await createWorkspace(t);
  await fs.mkdir(workspace.game, { recursive: true });
  await fs.writeFile(path.join(workspace.game, "existing.txt"), "original");
  await writeArchive(workspace.archive, [
    ["existing.txt", "translated"],
    ["subfolder/new.txt", "new translation"]
  ]);
  const progress = [];
  const extracted = await extractZip(workspace.archive, workspace.extracted, (event) => progress.push(event));
  assert.equal(extracted.fileCount, 2);
  assert.equal(progress.length, 2);

  const installed = await installExtractedFiles({
    extractedDirectory: workspace.extracted,
    gameFolder: workspace.game,
    translationId: "translation-1",
    stateFile: workspace.stateFile,
    backupRoot: workspace.backupRoot
  });
  assert.equal(installed.fileCount, 2);
  assert.equal(await fs.readFile(path.join(workspace.game, "existing.txt"), "utf8"), "translated");
  assert.equal(await fs.readFile(path.join(workspace.game, "subfolder", "new.txt"), "utf8"), "new translation");
  assert.equal((await getInstallRecord({
    translationId: "translation-1",
    gameFolder: workspace.game,
    stateFile: workspace.stateFile
  })).files.length, 2);

  const removed = await removeInstalledTranslation({
    translationId: "translation-1",
    gameFolder: workspace.game,
    stateFile: workspace.stateFile
  });
  assert.equal(removed.removed, true);
  assert.equal(await fs.readFile(path.join(workspace.game, "existing.txt"), "utf8"), "original");
  await assert.rejects(fs.access(path.join(workspace.game, "subfolder", "new.txt")), { code: "ENOENT" });
  assert.equal(await getInstallRecord({
    translationId: "translation-1",
    gameFolder: workspace.game,
    stateFile: workspace.stateFile
  }), null);
});

test("rejects path traversal in ZIP entries without writing outside the extraction root", async (t) => {
  const workspace = await createWorkspace(t);
  await writeArchive(workspace.archive, [["../escape.txt", "not allowed"]]);
  await assert.rejects(extractZip(workspace.archive, workspace.extracted), { code: "INVALID_ARCHIVE_PATH" });
  await assert.rejects(fs.access(path.join(workspace.root, "escape.txt")), { code: "ENOENT" });
});

test("rejects symbolic-link entries in ZIP archives", async (t) => {
  const workspace = await createWorkspace(t);
  await writeArchive(workspace.archive, [["linked-file", "target", 0o120777]]);
  await assert.rejects(extractZip(workspace.archive, workspace.extracted), { code: "INVALID_ARCHIVE_PATH" });
});

test("cancels ZIP extraction and file installation without leaving partial game files", async (t) => {
  const workspace = await createWorkspace(t);
  await fs.mkdir(workspace.game, { recursive: true });
  await fs.writeFile(path.join(workspace.game, "existing.txt"), "original");
  await writeArchive(workspace.archive, [["existing.txt", "translated"]]);
  const archiveController = new AbortController();
  archiveController.abort();
  await assert.rejects(
    extractZip(workspace.archive, workspace.extracted, () => {}, { signal: archiveController.signal }),
    { name: "AbortError" }
  );
  await assert.rejects(fs.access(path.join(workspace.extracted, "existing.txt")), { code: "ENOENT" });

  await fs.mkdir(workspace.extracted, { recursive: true });
  await fs.writeFile(path.join(workspace.extracted, "existing.txt"), "translated");
  const installController = new AbortController();
  installController.abort();
  await assert.rejects(installExtractedFiles({
    extractedDirectory: workspace.extracted,
    gameFolder: workspace.game,
    translationId: "translation-cancelled",
    stateFile: workspace.stateFile,
    backupRoot: workspace.backupRoot,
    signal: installController.signal
  }), { name: "AbortError" });
  assert.equal(await fs.readFile(path.join(workspace.game, "existing.txt"), "utf8"), "original");
});

test("rolls back earlier files when a later target is not a regular file", async (t) => {
  const workspace = await createWorkspace(t);
  await fs.mkdir(workspace.game, { recursive: true });
  await fs.writeFile(path.join(workspace.game, "a.txt"), "original");
  await fs.mkdir(path.join(workspace.game, "z.txt"));
  await fs.mkdir(workspace.extracted, { recursive: true });
  await fs.writeFile(path.join(workspace.extracted, "a.txt"), "new");
  await fs.writeFile(path.join(workspace.extracted, "z.txt"), "blocked");

  await assert.rejects(installExtractedFiles({
    extractedDirectory: workspace.extracted,
    gameFolder: workspace.game,
    translationId: "translation-rollback",
    stateFile: workspace.stateFile,
    backupRoot: workspace.backupRoot
  }), { code: "UNSAFE_GAME_FOLDER" });
  assert.equal(await fs.readFile(path.join(workspace.game, "a.txt"), "utf8"), "original");
  assert.equal((await fs.stat(path.join(workspace.game, "z.txt"))).isDirectory(), true);
});

test("preserves files changed after installation instead of removing them", async (t) => {
  const workspace = await createWorkspace(t);
  await fs.mkdir(workspace.game, { recursive: true });
  await fs.mkdir(workspace.extracted, { recursive: true });
  await fs.writeFile(path.join(workspace.extracted, "game.ini"), "installed");
  await installExtractedFiles({
    extractedDirectory: workspace.extracted,
    gameFolder: workspace.game,
    translationId: "translation-changed",
    stateFile: workspace.stateFile,
    backupRoot: workspace.backupRoot
  });
  await fs.writeFile(path.join(workspace.game, "game.ini"), "user-edited");
  await assert.rejects(removeInstalledTranslation({
    translationId: "translation-changed",
    gameFolder: workspace.game,
    stateFile: workspace.stateFile
  }), { code: "INSTALLED_FILE_CHANGED" });
  assert.equal(await fs.readFile(path.join(workspace.game, "game.ini"), "utf8"), "user-edited");
});
