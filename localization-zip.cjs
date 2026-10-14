const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const yazl = require("yazl");

const MAX_ARCHIVE_FILES = 20000;
const MAX_ARCHIVE_BYTES = 1024 * 1024 * 1024;

async function createTranslatedZipArchive({
  extractedRoot,
  translatedRelativePath,
  translatedContents,
  destination
}) {
  if (typeof extractedRoot !== "string" || typeof translatedRelativePath !== "string" ||
      !Buffer.isBuffer(translatedContents) || typeof destination !== "string") {
    throw Object.assign(new Error("INVALID_LOCALIZATION_ARCHIVE"), {
      code: "INVALID_LOCALIZATION_ARCHIVE"
    });
  }

  const root = await fs.realpath(extractedRoot);
  const relativePath = translatedRelativePath.replace(/[\\/]+/gu, path.sep);
  const translatedPath = path.resolve(root, relativePath);
  const resolvedRelative = path.relative(root, translatedPath);
  if (!resolvedRelative || resolvedRelative === ".." ||
      resolvedRelative.startsWith(`..${path.sep}`) || path.isAbsolute(resolvedRelative)) {
    throw Object.assign(new Error("INVALID_LOCALIZATION_ARCHIVE_PATH"), {
      code: "INVALID_LOCALIZATION_ARCHIVE_PATH"
    });
  }

  const archive = new yazl.ZipFile();
  const output = fsSync.createWriteStream(destination, { flags: "wx" });
  const outputPromise = pipeline(archive.outputStream, output);
  let fileCount = 0;
  let inputBytes = 0;
  let translatedFileAdded = false;

  async function addDirectory(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const filePath = path.join(directory, entry.name);
      if (path.resolve(directory) === root && entry.name === ".dreko-extracted") continue;
      const stat = await fs.lstat(filePath);
      if (stat.isSymbolicLink()) {
        throw Object.assign(new Error("LOCALIZATION_ARCHIVE_LINK_NOT_SUPPORTED"), {
          code: "LOCALIZATION_ARCHIVE_LINK_NOT_SUPPORTED"
        });
      }
      const archivePath = path.relative(root, filePath).split(path.sep).join("/");
      if (stat.isDirectory()) {
        archive.addEmptyDirectory(`${archivePath}/`);
        await addDirectory(filePath);
        continue;
      }
      if (!stat.isFile()) continue;
      fileCount += 1;
      inputBytes += stat.size;
      if (fileCount > MAX_ARCHIVE_FILES || inputBytes > MAX_ARCHIVE_BYTES) {
        throw Object.assign(new Error("LOCALIZATION_ARCHIVE_LIMIT"), {
          code: "LOCALIZATION_ARCHIVE_LIMIT"
        });
      }
      if (path.resolve(filePath) === translatedPath) {
        archive.addBuffer(translatedContents, archivePath);
        translatedFileAdded = true;
      } else {
        archive.addFile(filePath, archivePath);
      }
    }
  }

  try {
    await addDirectory(root);
    if (!translatedFileAdded) {
      throw Object.assign(new Error("LOCALIZATION_ARCHIVE_SOURCE_MISSING"), {
        code: "LOCALIZATION_ARCHIVE_SOURCE_MISSING"
      });
    }
    archive.end();
    await outputPromise;
    return { fileCount, inputBytes };
  } catch (error) {
    archive.outputStream.destroy(error);
    await outputPromise.catch(() => {});
    await fs.rm(destination, { force: true }).catch((cleanupError) => {
      console.error("Unable to remove partial localized ZIP:", cleanupError?.code || cleanupError?.name || "UNKNOWN");
    });
    throw error;
  }
}

module.exports = {
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_FILES,
  createTranslatedZipArchive
};
