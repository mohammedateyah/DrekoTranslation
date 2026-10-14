const fs = require("node:fs/promises");
const crypto = require("node:crypto");
const path = require("node:path");
const { MAX_SOURCE_BYTES, parseLocalizationFile } = require("./localization-adapters.cjs");
const { extractZip } = require("./translation-installer.cjs");
const {
  containsMostlyArabic,
  getProtectedGameRule,
  hasArabicLocalizedPath,
  isArabicTextTigerArchive,
  isArabicLanguageSetting,
  isLanguageSettingFileName,
  isLikelyLocalizationContent,
  normalizeGameTitle
} = require("./localization-safety.cjs");

const MAX_SCAN_DEPTH = 10;
const MAX_DIRECTORIES = 3000;
const MAX_CANDIDATE_FILES = 1500;
const MAX_TOTAL_SOURCE_BYTES = 50 * 1024 * 1024;
const MAX_ZIP_SOURCE_BYTES = 1024 * 1024 * 1024;
const MAX_ZIP_EXTRACTED_BYTES = 1024 * 1024 * 1024;
const MAX_ZIP_FILES = 20000;
const UNREAL_RESOURCE_EXTENSIONS = new Set([".pak", ".utoc", ".ucas", ".uasset", ".uexp", ".locres"]);
const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  "binaries",
  "cache",
  "caches",
  "crashdumps",
  "logs",
  "node_modules",
  "redistributables",
  "redist",
  "saves",
  "shadercache",
  "temp",
  "tmp"
]);
const LOCALIZATION_HINT = /locali[sz]ation|locali[sz]ations|locale|languages?|translations?|strings?|texts?/iu;
const ENGLISH_FILENAME_HINT = /(?:^|[._-])(?:en|eng|english)(?:$|[._-])/iu;
const ENGLISH_PATH_HINT = /(?:^|\/)(?:en|eng|english)(?:[-_.\/]|$)/iu;
const GENERIC_GAME_NAME_TOKENS = new Set([
  "the", "a", "an", "game", "games", "edition", "definitive", "remastered",
  "remaster", "remake", "complete", "collection", "director", "cut", "version",
  "steam", "epic", "rockstar", "ubisoft", "launcher", "install", "installed",
  "common", "content", "data", "bin", "binaries", "win64", "windows"
]);

function gameNameTokens(value) {
  const expanded = value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\bg\.?\s*t\.?\s*a\.?\b/gu, " grand theft auto ")
    .replace(/[^a-z0-9]+/gu, " ");
  return expanded.split(/\s+/u).filter((token) =>
    token.length > 0 && !GENERIC_GAME_NAME_TOKENS.has(token)
  );
}

function isClearlyDifferentGameFolder(folderName, gameTitle) {
  if (typeof gameTitle !== "string" || !gameTitle.trim()) return false;
  const folderTokens = gameNameTokens(folderName);
  const titleTokens = gameNameTokens(gameTitle);
  if (folderTokens.length < 2 || titleTokens.length < 2) return false;
  return !folderTokens.some((token) => titleTokens.includes(token));
}

function localizationScore(relativePath) {
  const normalized = relativePath.replace(/\\/gu, "/");
  const segments = normalized.split("/");
  const filename = segments.pop() || "";
  let score = segments.some((segment) => LOCALIZATION_HINT.test(segment)) ? 4 : 0;
  if (ENGLISH_PATH_HINT.test(normalized)) score += 3;
  if (LOCALIZATION_HINT.test(filename)) score += 2;
  if (ENGLISH_FILENAME_HINT.test(path.basename(filename, path.extname(filename)))) score += 3;
  return score;
}

function isShadowOfTheTombRaider(gameTitle) {
  return /^shadow of the tomb raider(?:\b|$)/u.test(normalizeGameTitle(gameTitle));
}

async function scanLocalizationDirectory(gameFolder, gameTitle = "", {
  archiveWorkspace,
  scanArchives = true,
  skipRootTitleCheck = false
} = {}) {
  if (typeof gameFolder !== "string" || !gameFolder.trim() || gameFolder.length > 2048) {
    throw new Error("INVALID_GAME_FOLDER");
  }

  let root;
  try {
    root = await fs.realpath(path.resolve(gameFolder));
    const rootStat = await fs.stat(root);
    if (!rootStat.isDirectory()) throw new Error("INVALID_GAME_FOLDER");
  } catch (error) {
    if (error?.message === "INVALID_GAME_FOLDER") throw error;
    throw Object.assign(new Error("INVALID_GAME_FOLDER"), { code: "INVALID_GAME_FOLDER" });
  }
  if (getProtectedGameRule(gameTitle)) {
    throw Object.assign(new Error("UNSUPPORTED_PROTECTED_GAME"), { code: "UNSUPPORTED_PROTECTED_GAME" });
  }
  if (!skipRootTitleCheck && isClearlyDifferentGameFolder(path.basename(root), gameTitle)) {
    throw Object.assign(new Error("LOCALIZATION_GAME_MISMATCH"), { code: "LOCALIZATION_GAME_MISMATCH" });
  }

  const pendingDirectories = [{ directory: root, depth: 0 }];
  let visitedDirectories = 0;
  let candidateFiles = 0;
  let compatibleFiles = 0;
  let totalSourceBytes = 0;
  let bestCandidate = null;
  let containsGameArchives = false;
  let containsUnrealResources = false;

  while (pendingDirectories.length) {
    const { directory, depth } = pendingDirectories.pop();
    visitedDirectories += 1;
    if (visitedDirectories > MAX_DIRECTORIES) {
      throw Object.assign(new Error("LOCALIZATION_SCAN_LIMIT"), { code: "LOCALIZATION_SCAN_LIMIT" });
    }

    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (["EACCES", "EPERM", "EBUSY"].includes(error?.code)) continue;
      throw error;
    }

    if (hasArabicLocalizedPath(path.relative(root, directory)) && directory !== root) {
      throw Object.assign(new Error("ARABIC_LOCALIZATION_PRESENT"), {
        code: "ARABIC_LOCALIZATION_PRESENT"
      });
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (depth < MAX_SCAN_DEPTH && !EXCLUDED_DIRECTORIES.has(entry.name.toLowerCase())) {
          pendingDirectories.push({ directory: entryPath, depth: depth + 1 });
        }
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      const relativePath = path.relative(root, entryPath);
      if (isShadowOfTheTombRaider(gameTitle) && isArabicTextTigerArchive(relativePath)) {
        throw Object.assign(new Error("SOTTR_ARABIC_LOCALIZATION_PRESENT"), {
          code: "SOTTR_ARABIC_LOCALIZATION_PRESENT"
        });
      }
      if (hasArabicLocalizedPath(relativePath)) {
        throw Object.assign(new Error("ARABIC_LOCALIZATION_PRESENT"), {
          code: "ARABIC_LOCALIZATION_PRESENT"
        });
      }
      if (UNREAL_RESOURCE_EXTENSIONS.has(extension)) {
        containsUnrealResources = true;
        containsGameArchives = true;
      }
      if ([".rpf", ".bundle", ".assets", ".7z", ".rar", ".tiger"].includes(extension)) {
        containsGameArchives = true;
      }
      if (extension === ".zip") {
        containsGameArchives = true;
        if (!scanArchives || !archiveWorkspace) continue;
        const archiveStat = await fs.lstat(entryPath);
        if (!archiveStat.isFile() || archiveStat.isSymbolicLink() ||
            archiveStat.size < 1 || archiveStat.size > MAX_ZIP_SOURCE_BYTES) continue;
        candidateFiles += 1;
        if (candidateFiles > MAX_CANDIDATE_FILES) {
          throw Object.assign(new Error("LOCALIZATION_SCAN_LIMIT"), { code: "LOCALIZATION_SCAN_LIMIT" });
        }
        const realArchivePath = await fs.realpath(entryPath);
        const archiveId = crypto.createHash("sha256").update(JSON.stringify([
          realArchivePath,
          archiveStat.size,
          archiveStat.mtimeMs
        ])).digest("hex");
        const workspaceRoot = path.resolve(archiveWorkspace);
        const extractedRoot = path.join(workspaceRoot, archiveId);
        const relativeWorkspacePath = path.relative(workspaceRoot, extractedRoot);
        if (relativeWorkspacePath.startsWith("..") || path.isAbsolute(relativeWorkspacePath)) {
          throw Object.assign(new Error("INVALID_LOCALIZATION_ARCHIVE"), {
            code: "INVALID_LOCALIZATION_ARCHIVE"
          });
        }
        await fs.mkdir(workspaceRoot, { recursive: true });
        let extractionComplete = false;
        try {
          const marker = await fs.readFile(path.join(extractedRoot, ".dreko-extracted"), "utf8");
          extractionComplete = marker === archiveId;
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
        }
        if (!extractionComplete) {
          await fs.rm(extractedRoot, { recursive: true, force: true });
          try {
            await extractZip(realArchivePath, extractedRoot, () => {}, {
              maxExtractedBytes: MAX_ZIP_EXTRACTED_BYTES,
              maxFileCount: MAX_ZIP_FILES
            });
          } catch (error) {
            if ([
              "ARCHIVE_SIZE_LIMIT",
              "INVALID_ARCHIVE_PATH",
              "INVALID_ARCHIVE_SIZE",
              "BAD_PASSWORD",
              "FILE_ENDED",
              "Z_DATA_ERROR",
              "INVALID_ARCHIVE",
              "UNSUPPORTED_COMPRESSION_METHOD"
            ].includes(error?.code)) {
              throw Object.assign(new Error("UNSUPPORTED_GAME_RESOURCE_FORMAT"), {
                code: "UNSUPPORTED_GAME_RESOURCE_FORMAT"
              });
            }
            if (error?.code === "ENOENT") continue;
            throw error;
          }
          await fs.writeFile(path.join(extractedRoot, ".dreko-extracted"), archiveId, {
            encoding: "utf8",
            flag: "wx",
            mode: 0o600
          });
        }
        try {
          const nested = await scanLocalizationDirectory(extractedRoot, gameTitle, {
            archiveWorkspace,
            scanArchives: false,
            skipRootTitleCheck: true
          });
          nested.adapter.archive = {
            sourceArchivePath: realArchivePath,
            extractedRoot,
            memberPath: nested.relativePath,
            sourceSize: archiveStat.size,
            sourceModifiedAt: archiveStat.mtimeMs
          };
          nested.adapter.resourceFileName = nested.adapter.fileName;
          nested.adapter.fileName = path.basename(realArchivePath);
          nested.adapter.displayFileName = path.basename(realArchivePath);
          nested.relativePath = `${relativePath}!/${nested.relativePath}`;
          nested.score += localizationScore(relativePath);
          compatibleFiles += nested.candidateCount;
          const candidate = {
            sourcePath: nested.sourcePath,
            adapter: nested.adapter,
            relativePath: nested.relativePath,
            score: nested.score
          };
          if (!bestCandidate || candidate.score > bestCandidate.score ||
              (candidate.score === bestCandidate.score &&
                candidate.adapter.entries.length > bestCandidate.adapter.entries.length) ||
              (candidate.score === bestCandidate.score &&
                candidate.adapter.entries.length === bestCandidate.adapter.entries.length &&
                candidate.relativePath.localeCompare(bestCandidate.relativePath) < 0)) {
            bestCandidate = candidate;
          }
        } catch (error) {
          if (error?.code === "ARABIC_LOCALIZATION_PRESENT" ||
              error?.code === "UNSUPPORTED_PROTECTED_GAME" ||
              error?.code === "LOCALIZATION_GAME_MISMATCH") throw error;
          if (!["LOCALIZATION_SOURCE_NOT_FOUND", "UNSUPPORTED_GAME_RESOURCE_FORMAT"].includes(error?.code)) {
            throw error;
          }
        }
        continue;
      }
      if ([".ini", ".cfg", ".vdf", ".xml"].includes(extension) &&
          isLanguageSettingFileName(entry.name)) {
        const configStat = await fs.lstat(entryPath);
        if (configStat.isFile() && !configStat.isSymbolicLink() &&
            configStat.size > 0 && configStat.size <= 256 * 1024) {
          try {
            if (isArabicLanguageSetting(await fs.readFile(entryPath, "utf8"))) {
              throw Object.assign(new Error("ARABIC_LOCALIZATION_PRESENT"), {
                code: "ARABIC_LOCALIZATION_PRESENT"
              });
            }
          } catch (error) {
            if (error?.code === "ARABIC_LOCALIZATION_PRESENT") throw error;
            if (error?.code !== "ENOENT") {
              console.error("Unable to inspect a game language setting:", error?.code || error?.name || "UNKNOWN");
            }
          }
        }
      }
      if (![".json", ".csv"].includes(extension)) continue;

      const score = localizationScore(relativePath);
      candidateFiles += 1;
      if (candidateFiles > MAX_CANDIDATE_FILES) {
        throw Object.assign(new Error("LOCALIZATION_SCAN_LIMIT"), { code: "LOCALIZATION_SCAN_LIMIT" });
      }

      const fileStat = await fs.lstat(entryPath);
      if (!fileStat.isFile() || fileStat.isSymbolicLink() ||
          fileStat.size < 1 || fileStat.size > MAX_SOURCE_BYTES) continue;
      totalSourceBytes += fileStat.size;
      if (totalSourceBytes > MAX_TOTAL_SOURCE_BYTES) {
        throw Object.assign(new Error("LOCALIZATION_SCAN_LIMIT"), { code: "LOCALIZATION_SCAN_LIMIT" });
      }

      let realFile;
      try {
        realFile = await fs.realpath(entryPath);
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
      }
      const relativeRealPath = path.relative(root, realFile);
      if (relativeRealPath === ".." ||
          relativeRealPath.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relativeRealPath)) continue;

      try {
        const adapter = parseLocalizationFile(entryPath, await fs.readFile(realFile));
        if (adapter.entries.length > 10000) continue;
        if (containsMostlyArabic(adapter.entries)) {
          throw Object.assign(new Error("ARABIC_LOCALIZATION_PRESENT"), {
            code: "ARABIC_LOCALIZATION_PRESENT"
          });
        }
        if (score === 0 && !isLikelyLocalizationContent(adapter.entries)) continue;
        compatibleFiles += 1;
        const candidate = {
          sourcePath: realFile,
          adapter,
          relativePath,
          score: score || 1
        };
        if (!bestCandidate ||
            candidate.score > bestCandidate.score ||
            (candidate.score === bestCandidate.score &&
              candidate.adapter.entries.length > bestCandidate.adapter.entries.length) ||
            (candidate.score === bestCandidate.score &&
              candidate.adapter.entries.length === bestCandidate.adapter.entries.length &&
              candidate.relativePath.localeCompare(bestCandidate.relativePath) < 0)) {
          bestCandidate = candidate;
        }
      } catch (error) {
        if (error?.code === "ARABIC_LOCALIZATION_PRESENT") throw error;
        continue;
      }
    }
  }

  if (!bestCandidate) {
    if (containsUnrealResources) {
      throw Object.assign(new Error("UNSUPPORTED_UNREAL_RESOURCE_FORMAT"), {
        code: "UNSUPPORTED_UNREAL_RESOURCE_FORMAT"
      });
    }
    if (containsGameArchives) {
      throw Object.assign(new Error("UNSUPPORTED_GAME_RESOURCE_FORMAT"), {
        code: "UNSUPPORTED_GAME_RESOURCE_FORMAT"
      });
    }
    throw Object.assign(new Error("LOCALIZATION_SOURCE_NOT_FOUND"), { code: "LOCALIZATION_SOURCE_NOT_FOUND" });
  }
  return {
    ...bestCandidate,
    candidateCount: compatibleFiles
  };
}

module.exports = {
  MAX_CANDIDATE_FILES,
  MAX_DIRECTORIES,
  MAX_SCAN_DEPTH,
  localizationScore,
  isShadowOfTheTombRaider,
  isClearlyDifferentGameFolder,
  scanLocalizationDirectory
};
