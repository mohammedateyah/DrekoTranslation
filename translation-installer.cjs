const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const { isIP } = require("node:net");
const path = require("node:path");
const { Transform, Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const yauzl = require("yauzl");

const DOWNLOAD_LIMIT = 2 * 1024 * 1024 * 1024;
const EXTRACTED_LIMIT = 8 * 1024 * 1024 * 1024;
const FILE_COUNT_LIMIT = 20000;

function normalizeArchiveError(error) {
  if (error?.code) return error;
  if (/invalid (?:relative )?path|file name/i.test(error?.message || "")) {
    return Object.assign(error, { code: "INVALID_ARCHIVE_PATH" });
  }
  return error;
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw signal.reason || Object.assign(new Error("INSTALL_CANCELLED"), { name: "AbortError" });
  }
}

function isPrivateIpv4(hostname) {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [first, second, third] = octets;
  return first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 0 || second === 168)) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 198 && (second === 18 || second === 19 || (second === 51 && third === 100))) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224;
}

function validateDownloadUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const ipAddress = hostname.replace(/^\[|\]$/g, "");
    const ipVersion = isIP(ipAddress);
    const ipv6Prefix = Number.parseInt(ipAddress.split(":")[0] || "0", 16);
    const isPrivateIpv6 = ipVersion === 6 &&
      (ipv6Prefix < 0x2000 || ipv6Prefix > 0x3fff || ipAddress.startsWith("2001:db8:"));
    if (url.protocol !== "https:" ||
        !hostname ||
        url.username ||
        url.password ||
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal") ||
        (ipVersion === 4 && isPrivateIpv4(ipAddress)) ||
        isPrivateIpv6 ||
        hostname.endsWith(".invalid")) return null;
    return url;
  } catch {
    return null;
  }
}

function safeArchivePath(entryName, rootDirectory) {
  if (typeof entryName !== "string" ||
      !entryName ||
      entryName.includes("\0") ||
      entryName.includes("\\") ||
      entryName.startsWith("/") ||
      /^[a-z]:/i.test(entryName)) return null;
  const parts = entryName.split("/").filter((part) => part && part !== ".");
  const invalidWindowsPart = (part) =>
    part === ".." ||
    part.includes(":") ||
    /[. ]$/.test(part) ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(part);
  if (!parts.length || parts.some(invalidWindowsPart)) return null;
  const destination = path.resolve(rootDirectory, ...parts);
  const relative = path.relative(rootDirectory, destination);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return null;
  }
  return { destination, relative: parts.join(path.sep), isDirectory: entryName.endsWith("/") };
}

function openZip(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true, autoClose: false, decodeStrings: true }, (error, zipFile) => {
      if (error) reject(normalizeArchiveError(error));
      else resolve(zipFile);
    });
  });
}

function openZipEntry(zipFile, entry) {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error) reject(error);
      else resolve(stream);
    });
  });
}

async function extractZip(archivePath, destination, onProgress = () => {}, {
  signal,
  maxExtractedBytes = EXTRACTED_LIMIT,
  maxFileCount = FILE_COUNT_LIMIT
} = {}) {
  if (!Number.isSafeInteger(maxExtractedBytes) || maxExtractedBytes < 1 ||
      !Number.isSafeInteger(maxFileCount) || maxFileCount < 1) {
    throw Object.assign(new Error("INVALID_ARCHIVE_LIMITS"), { code: "INVALID_ARCHIVE_LIMITS" });
  }
  const rootDirectory = path.resolve(destination);
  await fs.mkdir(rootDirectory, { recursive: true });
  const zipFile = await openZip(archivePath);
  let totalBytes = 0;
  let fileCount = 0;

  try {
    await new Promise((resolve, reject) => {
      let settled = false;
      const fail = (error) => {
        if (settled) return;
        settled = true;
        reject(normalizeArchiveError(error));
      };
      zipFile.on("error", fail);
      zipFile.on("end", () => {
        if (settled) return;
        settled = true;
        resolve();
      });
      zipFile.on("entry", (entry) => {
        void (async () => {
          throwIfAborted(signal);
          const safePath = safeArchivePath(entry.fileName, rootDirectory);
          const unixMode = (entry.externalFileAttributes >>> 16) & 0o170000;
              if (!safePath || unixMode === 0o120000) {
            throw Object.assign(new Error("INVALID_ARCHIVE_PATH"), { code: "INVALID_ARCHIVE_PATH" });
          }
          if (safePath.isDirectory) {
            await fs.mkdir(safePath.destination, { recursive: true });
          } else {
            fileCount += 1;
            totalBytes += entry.uncompressedSize;
            if (fileCount > maxFileCount || totalBytes > maxExtractedBytes) {
              throw Object.assign(new Error("ARCHIVE_SIZE_LIMIT"), { code: "ARCHIVE_SIZE_LIMIT" });
            }
            await fs.mkdir(path.dirname(safePath.destination), { recursive: true });
            const source = await openZipEntry(zipFile, entry);
            let copiedBytes = 0;
            const meter = new Transform({
              transform(chunk, _encoding, callback) {
                copiedBytes += chunk.length;
                if (copiedBytes > entry.uncompressedSize) {
                  callback(Object.assign(new Error("INVALID_ARCHIVE_SIZE"), { code: "INVALID_ARCHIVE_SIZE" }));
                  return;
                }
                callback(null, chunk);
              }
            });
            await pipeline(
              source,
              meter,
              fsSync.createWriteStream(safePath.destination, { flags: "wx" }),
              { signal }
            );
            if (copiedBytes !== entry.uncompressedSize) {
              throw Object.assign(new Error("INVALID_ARCHIVE_SIZE"), { code: "INVALID_ARCHIVE_SIZE" });
            }
            onProgress({ completedFiles: fileCount, totalFiles: null, extractedBytes: totalBytes });
          }
          throwIfAborted(signal);
          zipFile.readEntry();
        })().catch(fail);
      });
      zipFile.readEntry();
    });
  } finally {
    zipFile.close();
  }
  return { fileCount, totalBytes };
}

async function downloadToFile(value, destination, {
  signal,
  onProgress = () => {},
  fetchImpl = fetch
} = {}) {
  let url = validateDownloadUrl(value);
  if (!url) throw Object.assign(new Error("INVALID_DOWNLOAD_URL"), { code: "INVALID_DOWNLOAD_URL" });
  let response;
  let requestSignal = signal;
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const timeoutSignal = AbortSignal.timeout(15 * 60 * 1000);
    requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
    try {
      response = await fetchImpl(url, {
        redirect: "manual",
        signal: requestSignal
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw Object.assign(new Error("PACKAGE_DOWNLOAD_FAILED", { cause: error }), {
        code: "PACKAGE_DOWNLOAD_FAILED"
      });
    }
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    await response.body?.cancel();
    if (!location || redirects === 5) {
      throw Object.assign(new Error("DOWNLOAD_REDIRECT_LIMIT"), { code: "DOWNLOAD_REDIRECT_LIMIT" });
    }
    let redirectedUrl;
    try {
      redirectedUrl = new URL(location, url).href;
    } catch {
      throw Object.assign(new Error("INVALID_DOWNLOAD_URL"), { code: "INVALID_DOWNLOAD_URL" });
    }
    url = validateDownloadUrl(redirectedUrl);
    if (!url) throw Object.assign(new Error("INVALID_DOWNLOAD_URL"), { code: "INVALID_DOWNLOAD_URL" });
  }
  if (!response?.ok || !response.body) {
    await response?.body?.cancel();
    throw Object.assign(new Error("PACKAGE_DOWNLOAD_FAILED"), { code: "PACKAGE_DOWNLOAD_FAILED" });
  }
  const totalBytes = Number(response.headers.get("content-length")) || null;
  if (totalBytes && totalBytes > DOWNLOAD_LIMIT) {
    await response.body.cancel();
    throw Object.assign(new Error("PACKAGE_SIZE_LIMIT"), { code: "PACKAGE_SIZE_LIMIT" });
  }
  let downloadedBytes = 0;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const reader = response.body.getReader();
  const cancelResponseBody = () => {
    void reader.cancel(requestSignal.reason).catch(() => {});
  };
  requestSignal.addEventListener("abort", cancelResponseBody, { once: true });
  const source = Readable.from((async function* readResponseBody() {
    try {
      while (true) {
        throwIfAborted(requestSignal);
        const { done, value } = await reader.read();
        throwIfAborted(requestSignal);
        if (done) return;
        downloadedBytes += value.byteLength;
        if (downloadedBytes > DOWNLOAD_LIMIT) {
          throw Object.assign(new Error("PACKAGE_SIZE_LIMIT"), { code: "PACKAGE_SIZE_LIMIT" });
        }
        onProgress({ downloadedBytes, totalBytes });
        yield Buffer.from(value);
      }
    } finally {
      if (requestSignal.aborted) {
        await reader.cancel(requestSignal.reason).catch(() => {});
      }
      reader.releaseLock();
    }
  })());
  try {
    await pipeline(
      source,
      fsSync.createWriteStream(destination, { flags: "wx" }),
      { signal: requestSignal }
    );
  } catch (error) {
    await fs.rm(destination, { force: true }).catch((cleanupError) => {
      console.error("Unable to remove an incomplete translation download:", cleanupError?.code || cleanupError?.name || "UNKNOWN");
    });
    if (signal?.aborted || error?.code === "PACKAGE_SIZE_LIMIT") throw error;
    throw Object.assign(new Error("PACKAGE_DOWNLOAD_FAILED", { cause: error }), {
      code: "PACKAGE_DOWNLOAD_FAILED"
    });
  } finally {
    requestSignal.removeEventListener("abort", cancelResponseBody);
  }
  return { downloadedBytes, totalBytes };
}

function isZipFile(header) {
  return Buffer.isBuffer(header) &&
    header.length >= 4 &&
    header[0] === 0x50 &&
    header[1] === 0x4b &&
    [0x03, 0x05, 0x07].includes(header[2]) &&
    [0x04, 0x06, 0x08].includes(header[3]);
}

function isExecutableFile(header) {
  return Buffer.isBuffer(header) && header.length >= 2 && header[0] === 0x4d && header[1] === 0x5a;
}

function installKey(translationId, gameFolder) {
  const folderHash = crypto.createHash("sha256").update(path.resolve(gameFolder).toLowerCase()).digest("hex");
  return `${translationId}:${folderHash}`;
}

async function writeJsonAtomically(filePath, value) {
  const temporaryPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(temporaryPath, JSON.stringify(value), { flag: "wx" });
  await fs.rename(temporaryPath, filePath);
}

async function assertNoSymlinkParents(rootDirectory, destinationDirectory) {
  const relative = path.relative(rootDirectory, destinationDirectory);
  let current = rootDirectory;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw Object.assign(new Error("UNSAFE_GAME_FOLDER"), { code: "UNSAFE_GAME_FOLDER" });
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await fs.mkdir(current);
    }
  }
}

async function listFiles(directory, root = directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw Object.assign(new Error("INVALID_ARCHIVE_PATH"), { code: "INVALID_ARCHIVE_PATH" });
    }
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath, root));
    } else if (entry.isFile()) {
      files.push({ fullPath, relative: path.relative(root, fullPath) });
    }
  }
  return files;
}

async function installExtractedFiles({
  extractedDirectory,
  gameFolder,
  translationId,
  stateFile,
  backupRoot,
  onProgress = () => {},
  signal
}) {
  if (typeof translationId !== "string" || !/^[A-Za-z0-9-]{1,64}$/.test(translationId)) {
    throw Object.assign(new Error("INVALID_TRANSLATION_ID"), { code: "INVALID_TRANSLATION_ID" });
  }
  const gameRoot = await fs.realpath(gameFolder);
  const key = installKey(translationId, gameRoot);
  let state = {};
  try {
    state = JSON.parse(await fs.readFile(stateFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (state[key]) {
    throw Object.assign(new Error("TRANSLATION_ALREADY_INSTALLED"), { code: "TRANSLATION_ALREADY_INSTALLED" });
  }
  const files = await listFiles(extractedDirectory);
  if (!files.length) {
    throw Object.assign(new Error("EMPTY_TRANSLATION_PACKAGE"), { code: "EMPTY_TRANSLATION_PACKAGE" });
  }
  const backupDirectory = path.join(backupRoot, crypto.randomUUID());
  const installedFiles = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      throwIfAborted(signal);
      const file = files[index];
      const destination = path.resolve(gameRoot, file.relative);
      const relativeToRoot = path.relative(gameRoot, destination);
      if (relativeToRoot === ".." || relativeToRoot.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToRoot)) {
        throw Object.assign(new Error("INVALID_ARCHIVE_PATH"), { code: "INVALID_ARCHIVE_PATH" });
      }
      await assertNoSymlinkParents(gameRoot, path.dirname(destination));
      let backup = null;
      try {
        const destinationStat = await fs.lstat(destination);
        if (!destinationStat.isFile() || destinationStat.isSymbolicLink()) {
          throw Object.assign(new Error("UNSAFE_GAME_FOLDER"), { code: "UNSAFE_GAME_FOLDER" });
        }
        await fs.mkdir(backupDirectory, { recursive: true });
        backup = `${index}.bak`;
        await fs.copyFile(destination, path.join(backupDirectory, backup));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      installedFiles.push({ relative: file.relative, backup });
      await pipeline(
        fsSync.createReadStream(file.fullPath),
        fsSync.createWriteStream(destination, { flags: "w" }),
        { signal }
      );
      installedFiles.at(-1).installedHash = await hashFile(destination);
      onProgress({ completedFiles: index + 1, totalFiles: files.length });
    }
    state[key] = {
      translationId,
      gameFolder: gameRoot,
      backupDirectory,
      files: installedFiles,
      installedAt: new Date().toISOString()
    };
    await writeJsonAtomically(stateFile, state);
  } catch (error) {
    let rollbackFailed = false;
    for (const file of installedFiles.reverse()) {
      const destination = path.resolve(gameRoot, file.relative);
      try {
        await fs.rm(destination, { force: true });
        if (file.backup) {
          await assertNoSymlinkParents(gameRoot, path.dirname(destination));
          await fs.copyFile(path.join(backupDirectory, file.backup), destination);
        }
      } catch {
        rollbackFailed = true;
      }
    }
    if (!rollbackFailed) await fs.rm(backupDirectory, { recursive: true, force: true });
    if (rollbackFailed) {
      throw Object.assign(new Error("INSTALL_ROLLBACK_FAILED"), { code: "INSTALL_ROLLBACK_FAILED" });
    }
    throw error;
  }
  return { key, fileCount: installedFiles.length };
}

async function getInstallRecord({ translationId, gameFolder, stateFile }) {
  let state;
  try {
    state = JSON.parse(await fs.readFile(stateFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  return state[installKey(translationId, gameFolder)] || null;
}

async function recordExternalInstallerInstallation({ translationId, gameFolder, stateFile }) {
  if (typeof translationId !== "string" || !/^[A-Za-z0-9-]{1,64}$/.test(translationId)) {
    throw Object.assign(new Error("INVALID_TRANSLATION_ID"), { code: "INVALID_TRANSLATION_ID" });
  }
  const gameRoot = await fs.realpath(gameFolder);
  const key = installKey(translationId, gameRoot);
  let state = {};
  try {
    state = JSON.parse(await fs.readFile(stateFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (state[key]) {
    throw Object.assign(new Error("TRANSLATION_ALREADY_INSTALLED"), { code: "TRANSLATION_ALREADY_INSTALLED" });
  }
  state[key] = {
    translationId,
    gameFolder: gameRoot,
    kind: "external-installer",
    files: [],
    installedAt: new Date().toISOString()
  };
  await writeJsonAtomically(stateFile, state);
  return state[key];
}

async function hashFile(filePath) {
  const hash = crypto.createHash("sha256");
  for await (const chunk of require("node:fs").createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function removeInstalledTranslation({
  translationId,
  gameFolder,
  stateFile,
  confirmExternalUninstall = false
}) {
  let state;
  try {
    state = JSON.parse(await fs.readFile(stateFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { removed: false };
    throw error;
  }
  const key = installKey(translationId, gameFolder);
  const record = state[key];
  if (!record) return { removed: false };
  const rootDirectory = await fs.realpath(record.gameFolder);
  if (path.resolve(gameFolder).toLowerCase() !== rootDirectory.toLowerCase()) {
    throw Object.assign(new Error("INSTALL_FOLDER_CHANGED"), { code: "INSTALL_FOLDER_CHANGED" });
  }
  if (record.kind === "external-installer") {
    if (!confirmExternalUninstall) {
      return { removed: false, requiresExternalUninstall: true };
    }
    delete state[key];
    await writeJsonAtomically(stateFile, state);
    return { removed: true, externalInstaller: true };
  }
  const backupRoot = path.resolve(path.dirname(stateFile), "translation-backups");
  const backupDirectory = path.resolve(record.backupDirectory || "");
  const backupRelative = path.relative(backupRoot, backupDirectory);
  if (!Array.isArray(record.files) ||
      !record.files.length ||
      backupRelative === ".." ||
      backupRelative === "." ||
      !backupRelative ||
      backupRelative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(backupRelative) ||
      record.files.some((file) =>
        !file ||
        typeof file.relative !== "string" ||
        safeArchivePath(file.relative.split(path.sep).join("/"), rootDirectory) === null ||
        !/^[a-f0-9]{64}$/i.test(file.installedHash || "") ||
        (file.backup !== null && (typeof file.backup !== "string" || !/^\d+\.bak$/.test(file.backup))))) {
    throw Object.assign(new Error("INVALID_INSTALL_RECORD"), { code: "INVALID_INSTALL_RECORD" });
  }
  for (const file of record.files) {
    const destination = path.resolve(rootDirectory, file.relative);
    const currentHash = await hashFile(destination).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (currentHash !== file.installedHash) {
      throw Object.assign(new Error("INSTALLED_FILE_CHANGED"), { code: "INSTALLED_FILE_CHANGED" });
    }
  }
  for (const file of [...record.files].reverse()) {
    const destination = path.resolve(rootDirectory, file.relative);
    const relativeToRoot = path.relative(rootDirectory, destination);
    if (relativeToRoot === ".." || relativeToRoot.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToRoot)) {
      throw Object.assign(new Error("INVALID_INSTALL_RECORD"), { code: "INVALID_INSTALL_RECORD" });
    }
    await assertNoSymlinkParents(rootDirectory, path.dirname(destination));
    await fs.rm(destination, { force: true });
    if (file.backup) {
      await fs.copyFile(path.join(record.backupDirectory, file.backup), destination);
    }
  }
  await fs.rm(backupDirectory, { recursive: true, force: true });
  delete state[key];
  await writeJsonAtomically(stateFile, state);
  return { removed: true };
}

module.exports = {
  downloadToFile,
  extractZip,
  getInstallRecord,
  installExtractedFiles,
  isExecutableFile,
  isZipFile,
  recordExternalInstallerInstallation,
  removeInstalledTranslation,
  safeArchivePath,
  validateDownloadUrl
};
