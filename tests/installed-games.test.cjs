const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { discoverSteamGames, parseQuotedPairs } = require("../installed-games.cjs");

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
