const fs = require("node:fs");
const path = require("node:path");

function parseQuotedPairs(contents) {
  const pairs = [];
  const expression = /"((?:\\.|[^"\\])*)"\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = expression.exec(contents))) {
    pairs.push([
      match[1].replace(/\\\\/g, "\\").replace(/\\"/g, '"'),
      match[2].replace(/\\\\/g, "\\").replace(/\\"/g, '"')
    ]);
  }
  return pairs;
}

function readLibraryFolders(steamRoot, fileSystem) {
  const foldersPath = path.join(steamRoot, "steamapps", "libraryfolders.vdf");
  if (!fileSystem.existsSync(foldersPath)) return [];
  return parseQuotedPairs(fileSystem.readFileSync(foldersPath, "utf8"))
    .filter(([key, value]) => key.toLowerCase() === "path" ||
      (/^\d+$/.test(key) && /^(?:[a-z]:[\\/]|\\\\)/i.test(value)))
    .map(([, libraryPath]) => libraryPath);
}

function discoverSteamGames(steamRoots, fileSystem = fs) {
  const libraries = new Map();
  for (const root of steamRoots) {
    if (typeof root !== "string" || !root.trim()) continue;
    const normalizedRoot = path.resolve(root);
    libraries.set(normalizedRoot.toLowerCase(), normalizedRoot);
    for (const library of readLibraryFolders(normalizedRoot, fileSystem)) {
      const normalizedLibrary = path.resolve(library);
      libraries.set(normalizedLibrary.toLowerCase(), normalizedLibrary);
    }
  }

  const games = new Map();
  for (const library of libraries.values()) {
    const steamAppsPath = path.join(library, "steamapps");
    let entries;
    try {
      entries = fileSystem.readdirSync(steamAppsPath);
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") continue;
      throw error;
    }

    for (const entry of entries) {
      const manifestMatch = /^appmanifest_(\d+)\.acf$/i.exec(entry);
      if (!manifestMatch) continue;
      const manifestPath = path.join(steamAppsPath, entry);
      const pairs = parseQuotedPairs(fileSystem.readFileSync(manifestPath, "utf8"));
      const values = new Map(pairs);
      const appId = manifestMatch[1];
      const title = values.get("name");
      const installDirectory = values.get("installdir");
      const stateFlags = Number(values.get("StateFlags"));
      if (!title || !Number.isSafeInteger(stateFlags) || (stateFlags & 4) !== 4) continue;
      const hasSafeInstallDirectory = typeof installDirectory === "string" &&
        installDirectory.trim() &&
        installDirectory !== "." &&
        installDirectory !== ".." &&
        !path.isAbsolute(installDirectory) &&
        path.basename(installDirectory) === installDirectory;
      games.set(appId, {
        appId,
        title,
        platform: "Steam",
        ...(hasSafeInstallDirectory
          ? { installPath: path.join(steamAppsPath, "common", installDirectory) }
          : {})
      });
    }
  }

  return [...games.values()].sort((left, right) =>
    left.title.localeCompare(right.title, undefined, { sensitivity: "base" }));
}

function discoverSteamGameFolders(steamRoots, fileSystem = fs) {
  const libraries = new Map();
  for (const root of steamRoots) {
    if (typeof root !== "string" || !root.trim()) continue;
    const normalizedRoot = path.resolve(root);
    libraries.set(normalizedRoot.toLowerCase(), normalizedRoot);
    for (const library of readLibraryFolders(normalizedRoot, fileSystem)) {
      const normalizedLibrary = path.resolve(library);
      libraries.set(normalizedLibrary.toLowerCase(), normalizedLibrary);
    }
  }

  const folders = new Map();
  for (const library of libraries.values()) {
    const commonPath = path.join(library, "steamapps", "common");
    let entries;
    try {
      entries = fileSystem.readdirSync(commonPath, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") continue;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const installPath = path.join(commonPath, entry.name);
      folders.set(installPath.toLowerCase(), {
        title: entry.name,
        platform: "Steam",
        installPath
      });
    }
  }

  return [...folders.values()].sort((left, right) =>
    left.title.localeCompare(right.title, undefined, { sensitivity: "base" }));
}

function discoverEpicGameFolders(manifestRoots, fileSystem = fs) {
  const games = new Map();
  for (const manifestRoot of manifestRoots) {
    if (typeof manifestRoot !== "string" || !manifestRoot.trim()) continue;
    let entries;
    try {
      entries = fileSystem.readdirSync(manifestRoot, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") continue;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !/\.item$/iu.test(entry.name)) continue;
      try {
        const manifest = JSON.parse(fileSystem.readFileSync(path.join(manifestRoot, entry.name), "utf8"));
        const title = typeof manifest.DisplayName === "string" ? manifest.DisplayName.trim() : "";
        const installPath = typeof manifest.InstallLocation === "string"
          ? manifest.InstallLocation.trim()
          : "";
        if (!title || !installPath || !path.isAbsolute(installPath) ||
            !fileSystem.statSync(installPath).isDirectory()) continue;
        games.set(path.resolve(installPath).toLowerCase(), {
          title,
          platform: "Epic Games",
          installPath: path.resolve(installPath)
        });
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "ENOTDIR" && !(error instanceof SyntaxError)) {
          throw error;
        }
      }
    }
  }
  return [...games.values()].sort((left, right) =>
    left.title.localeCompare(right.title, undefined, { sensitivity: "base" }));
}

const GAME_SEARCH_EXCLUDED_DIRECTORIES = new Set([
  "$recycle.bin", "system volume information", "windows", "windows.old",
  "programdata", "appdata", "node_modules", "windowsapps", "perflogs",
  "config.msi", "recovery", "packages"
]);

async function findMatchingGameFolders(searchRoots, requestedTitle, options = {}) {
  const fileSystem = options.fileSystem || fs.promises;
  const maxVisited = Number.isSafeInteger(options.maxVisited) ? options.maxVisited : 30000;
  const maxDepth = Number.isSafeInteger(options.maxDepth) ? options.maxDepth : 7;
  const pending = [];
  for (const root of searchRoots) {
    if (typeof root !== "string" || !root.trim()) continue;
    pending.push({ directory: path.resolve(root), depth: 0 });
  }

  const visited = new Set();
  const candidates = new Map();
  let visitedCount = 0;
  let pendingIndex = 0;
  while (pendingIndex < pending.length && visitedCount < maxVisited) {
    const current = pending[pendingIndex++];
    const normalizedPath = current.directory.toLowerCase();
    if (visited.has(normalizedPath)) continue;
    visited.add(normalizedPath);
    let entries;
    try {
      entries = await fileSystem.readdir(current.directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR" || error.code === "EACCES" ||
          error.code === "EPERM") continue;
      throw error;
    }
    visitedCount += entries.length;
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      if (current.depth >= maxDepth) continue;
      const installPath = path.join(current.directory, entry.name);
      const candidate = { title: entry.name, platform: "Local", installPath };
      const match = matchInstalledGame([candidate], requestedTitle);
      if (match.game) {
        candidates.set(installPath.toLowerCase(), candidate);
        continue;
      }
      if (GAME_SEARCH_EXCLUDED_DIRECTORIES.has(entry.name.toLowerCase())) {
        continue;
      }
      pending.push({ directory: installPath, depth: current.depth + 1 });
    }
  }

  const matches = [...candidates.values()];
  if (visitedCount >= maxVisited && !matches.length) return { games: [], searchLimited: true };
  return { games: matches, searchLimited: visitedCount >= maxVisited };
}

const GENERIC_TITLE_TOKENS = new Set([
  "the", "a", "an", "game", "edition", "definitive", "enhanced",
  "remastered", "remaster", "complete", "collection", "deluxe"
]);

function normalizeGameTitle(value) {
  return typeof value === "string"
    ? value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ").trim()
    : "";
}

function deduplicateInstalledGames(games) {
    const byInstallPath = new Map();
    for (const game of games) {
      if (!game || typeof game.installPath !== "string" || !game.installPath.trim()) continue;
      const installPath = path.resolve(game.installPath);
      const key = installPath.toLowerCase();
      const existing = byInstallPath.get(key);
      if (!existing) {
        byInstallPath.set(key, { ...game, installPath });
        continue;
      }
      const aliases = new Set([
        existing.title,
        ...(Array.isArray(existing.aliases) ? existing.aliases : []),
        game.title,
        ...(Array.isArray(game.aliases) ? game.aliases : [])
      ].filter((title) => typeof title === "string" && title.trim()));
      byInstallPath.set(key, {
        ...existing,
        aliases: [...aliases].filter((title) => title !== existing.title)
      });
    }
    return [...byInstallPath.values()];
}

function matchInstalledGame(games, requestedTitle) {
  if (!Array.isArray(games) || typeof requestedTitle !== "string" || !requestedTitle.trim()) {
    return { game: null, ambiguous: false };
  }
  const requested = normalizeGameTitle(requestedTitle);
  const getCandidateTitles = (game) => [
    game.title,
    ...(Array.isArray(game.aliases) ? game.aliases : []),
    path.basename(game.installPath || "")
  ].filter((title) => typeof title === "string");
  const exactMatches = games.filter((game) =>
    getCandidateTitles(game).some((title) => normalizeGameTitle(title) === requested)
  );
  if (exactMatches.length === 1) return { game: exactMatches[0], ambiguous: false };
  if (exactMatches.length > 1) return { game: null, ambiguous: true };

  const requestedTokens = new Set(requested.split(/\s+/u)
    .filter((token) => token && !GENERIC_TITLE_TOKENS.has(token)));
  if (requestedTokens.size < 2) return { game: null, ambiguous: false };

  const scored = games.map((game) => {
    return getCandidateTitles(game).reduce((best, title) => {
      const candidateTokens = new Set(normalizeGameTitle(title).split(/\s+/u)
        .filter((token) => token && !GENERIC_TITLE_TOKENS.has(token)));
      const shared = [...requestedTokens].filter((token) => candidateTokens.has(token)).length;
      const score = shared / Math.max(requestedTokens.size, candidateTokens.size);
      return score > best.score ? { game, score, shared } : best;
    }, { game, score: 0, shared: 0 });
  }).filter(({ score, shared }) => shared >= 2 && score >= 0.8)
    .sort((left, right) => right.score - left.score);

  if (!scored.length) return { game: null, ambiguous: false };
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    return { game: null, ambiguous: true };
  }
  return { game: scored[0].game, ambiguous: false };
}

module.exports = {
  discoverSteamGameFolders,
  discoverSteamGames,
  discoverEpicGameFolders,
  findMatchingGameFolders,
  deduplicateInstalledGames,
  matchInstalledGame,
  parseQuotedPairs
};
