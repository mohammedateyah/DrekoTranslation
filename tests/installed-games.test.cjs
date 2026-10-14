const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  discoverEpicGameFolders,
  discoverSteamGameFolders,
  discoverSteamGames,
  deduplicateInstalledGames,
  findMatchingGameFolders,
  matchInstalledGame,
  parseQuotedPairs
} = require("../installed-games.cjs");

test("quoted Steam values decode escaped Windows paths", () => {
  assert.deepEqual(
    parseQuotedPairs('"path" "C:\\\\Games\\\\Steam" "name" "A \\"quoted\\" game"'),
    [["path", "C:\\Games\\Steam"], ["name", 'A "quoted" game']]
  );
});

test("legacy Steam library folders with numeric path entries are recognized", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dreko-steam-legacy-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const steamRoot = path.join(directory, "Steam");
  const legacyLibrary = path.join(directory, "Legacy Library");
  await fs.mkdir(path.join(steamRoot, "steamapps"), { recursive: true });
  await fs.mkdir(path.join(legacyLibrary, "steamapps"), { recursive: true });
  await fs.writeFile(
    path.join(steamRoot, "steamapps", "libraryfolders.vdf"),
    `"libraryfolders" { "0" "${steamRoot.replace(/\\/g, "\\\\")}" "1" "${legacyLibrary.replace(/\\/g, "\\\\")}" }`
  );
  await fs.writeFile(
    path.join(legacyLibrary, "steamapps", "appmanifest_40.acf"),
    '"AppState" { "name" "Legacy Library Game" "installdir" "Legacy Game" "StateFlags" "4" }'
  );

  assert.deepEqual(discoverSteamGames([steamRoot]), [
    {
      appId: "40",
      title: "Legacy Library Game",
      platform: "Steam",
      installPath: path.join(legacyLibrary, "steamapps", "common", "Legacy Game")
    }
  ]);
});

test("installed games are discovered across Steam libraries and incomplete installs are skipped", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dreko-steam-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));

  const steamRoot = path.join(directory, "Steam");
  const secondLibrary = path.join(directory, "Games Library");
  await fs.mkdir(path.join(steamRoot, "steamapps"), { recursive: true });
  await fs.mkdir(path.join(secondLibrary, "steamapps"), { recursive: true });
  await fs.writeFile(
    path.join(steamRoot, "steamapps", "libraryfolders.vdf"),
    `"libraryfolders"\n{\n\t"0"\n\t{\n\t\t"path"\t\t"${steamRoot.replace(/\\/g, "\\\\")}"\n\t}\n\t"1"\n\t{\n\t\t"path"\t\t"${secondLibrary.replace(/\\/g, "\\\\")}"\n\t}\n}`
  );
  await fs.writeFile(
    path.join(steamRoot, "steamapps", "appmanifest_10.acf"),
    '"AppState" { "appid" "10" "name" "Installed Game" "installdir" "Installed Game" "StateFlags" "4" }'
  );
  await fs.writeFile(
    path.join(secondLibrary, "steamapps", "appmanifest_20.acf"),
    '"AppState" { "appid" "20" "name" "Another Game" "installdir" "Another Game" "StateFlags" "6" }'
  );
  await fs.writeFile(
    path.join(secondLibrary, "steamapps", "appmanifest_30.acf"),
    '"AppState" { "appid" "30" "name" "Incomplete Game" "StateFlags" "2" }'
  );

  assert.deepEqual(discoverSteamGames([steamRoot, secondLibrary]), [
    {
      appId: "20",
      title: "Another Game",
      platform: "Steam",
      installPath: path.join(secondLibrary, "steamapps", "common", "Another Game")
    },
    {
      appId: "10",
      title: "Installed Game",
      platform: "Steam",
      installPath: path.join(steamRoot, "steamapps", "common", "Installed Game")
    }
  ]);
});

test("missing Steam library directories produce an empty installed-games list", () => {
  assert.deepEqual(discoverSteamGames(["Z:\\missing-steam-library"]), []);
});

test("Steam game folders are found by directory name even without an app manifest", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dreko-steam-folders-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const steamRoot = path.join(directory, "Steam");
  const gameFolder = path.join(steamRoot, "steamapps", "common", "Clive Barker's Hellraiser - Revival");
  await fs.mkdir(gameFolder, { recursive: true });

  const folders = discoverSteamGameFolders([steamRoot]);
  assert.deepEqual(folders, [{
    title: "Clive Barker's Hellraiser - Revival",
    platform: "Steam",
    installPath: gameFolder
  }]);
  assert.equal(
    matchInstalledGame(folders, "Clive Barker's Hellraiser Revival").game.installPath,
    gameFolder
  );
});

test("Epic manifests provide the registered game installation path", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dreko-epic-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const manifests = path.join(directory, "Manifests");
  const installPath = path.join(directory, "Epic Games", "Example Game");
  await fs.mkdir(manifests, { recursive: true });
  await fs.mkdir(installPath, { recursive: true });
  await fs.writeFile(path.join(manifests, "example.item"), JSON.stringify({
    DisplayName: "Example Game",
    InstallLocation: installPath
  }));
  await fs.writeFile(path.join(manifests, "broken.item"), "{");

  assert.deepEqual(discoverEpicGameFolders([manifests]), [{
    title: "Example Game",
    platform: "Epic Games",
    installPath
  }]);
});

test("local game search finds a custom installation folder without scanning excluded system directories", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dreko-local-games-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const customGame = path.join(directory, "Custom", "Installed", "Local Adventure");
  const excludedGame = path.join(directory, "Windows", "Local Adventure");
  await fs.mkdir(customGame, { recursive: true });
  await fs.mkdir(excludedGame, { recursive: true });

  const result = await findMatchingGameFolders([directory], "Local Adventure", {
    fileSystem: fs,
    maxDepth: 5
  });
  assert.equal(result.searchLimited, false);
  assert.deepEqual(result.games.map((game) => game.installPath), [customGame]);
});

test("local game search reports multiple matching folders instead of choosing one", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dreko-local-ambiguous-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const first = path.join(directory, "Drive One", "Local Adventure");
  const second = path.join(directory, "Drive Two", "Local Adventure");
  await fs.mkdir(first, { recursive: true });
  await fs.mkdir(second, { recursive: true });

  const result = await findMatchingGameFolders([directory], "Local Adventure", {
    fileSystem: fs,
    maxDepth: 5
  });
  assert.equal(result.games.length, 2);
  assert.equal(matchInstalledGame(result.games, "Local Adventure").ambiguous, true);
});

test("the same installation reported by a manifest and folder scan is counted once", () => {
  const games = deduplicateInstalledGames([
    {
      title: "Hollow Knight",
      platform: "Steam",
      installPath: "C:\\Games\\Hollow Knight"
    },
    {
      title: "Hollow Knight",
      platform: "Steam",
      installPath: "c:\\games\\hollow knight"
    }
  ]);

  assert.equal(games.length, 1);
  assert.equal(matchInstalledGame(games, "Hollow Knight").game.installPath, "C:\\Games\\Hollow Knight");
});

test("different game installments with a shared title prefix do not match each other", () => {
  const games = deduplicateInstalledGames([
    {
      title: "Hollow Knight",
      platform: "Steam",
      installPath: "C:\\Games\\Hollow Knight"
    },
    {
      title: "Hollow Knight Silksong",
      platform: "Local",
      installPath: "D:\\Games\\Hollow Knight Silksong"
    }
  ]);

  const hollowKnight = matchInstalledGame(games, "Hollow Knight");
  assert.equal(hollowKnight.game.installPath, "C:\\Games\\Hollow Knight");
  assert.equal(hollowKnight.ambiguous, false);
  const silksong = matchInstalledGame(games, "Hollow Knight Silksong");
  assert.equal(silksong.game.installPath, "D:\\Games\\Hollow Knight Silksong");
  assert.equal(silksong.ambiguous, false);
});

test("installed Steam games are matched by exact title or a unique close title", () => {
  const games = [
    { appId: "1", title: "Shift At Midnight", installPath: "C:\\Steam\\common\\Shift At Midnight" },
    { appId: "2", title: "The Sinking City 2", installPath: "C:\\Steam\\common\\The Sinking City 2" }
  ];
  assert.equal(matchInstalledGame(games, "Shift At Midnight").game.appId, "1");
  assert.equal(matchInstalledGame(games, "Sinking City 2").game.appId, "2");
  assert.deepEqual(matchInstalledGame(games, "Uninstalled Game"), { game: null, ambiguous: false });
});

test("ambiguous installed game title matches are not selected automatically", () => {
  const games = [
    { appId: "1", title: "Shift At Midnight Deluxe" },
    { appId: "2", title: "Shift At Midnight Remastered" }
  ];
  assert.deepEqual(matchInstalledGame(games, "Shift At Midnight"), { game: null, ambiguous: true });
});
