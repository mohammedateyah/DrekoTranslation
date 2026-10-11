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

module.exports = { discoverSteamGames, parseQuotedPairs };
