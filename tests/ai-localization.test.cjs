const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const test = require("node:test");
const yazl = require("yazl");
const { AiLocalizationJobs } = require("../ai-localization-jobs.cjs");
const {
  buildLocalizationFile,
  parseLocalizationFile,
  tokenizeCsv
} = require("../localization-adapters.cjs");
const {
  isClearlyDifferentGameFolder,
  scanLocalizationDirectory
} = require("../localization-scanner.cjs");
const { createTranslatedZipArchive } = require("../localization-zip.cjs");
const { extractZip } = require("../translation-installer.cjs");
const {
  getProtectedGameRule,
  hasArabicLocalizedPath
} = require("../localization-safety.cjs");
const {
  createBatches,
  hasSameProtectedTokens,
  requestBatch,
  requestBatchViaService
} = require("../gemini-translation.cjs");

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function translationResponse(entries) {
  return jsonResponse(200, {
    candidates: [{
      content: {
        parts: [{
          text: JSON.stringify({
            translations: entries.map((entry) => ({
              id: entry.id,
              text: `مرحبا ${entry.source}`
            }))
          })
        }]
      }
    }]
  });
}

function entriesFromRequest(options) {
  const prompt = JSON.parse(options.body).contents[0].parts[0].text;
  const marker = "Entries with neighboring dialogue context:\n";
  return JSON.parse(prompt.slice(prompt.indexOf(marker) + marker.length));
}

function testTranslateBatch(fetchImpl) {
  return (request) => requestBatch({
    ...request,
    apiKey: "test-api-key-that-is-never-real",
    fetchImpl
  });
}

async function waitForJob(manager, jobId) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const job = manager.get(jobId);
    if (job && job.status !== "running") {
      await manager.saveChain;
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Timed out waiting for localization job.");
}

async function createWorkspace() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "dreko-ai-localization-"));
  return {
    directory,
    stateFile: path.join(directory, "jobs.json"),
    sourcePath: path.join(directory, "source.json")
  };
}

async function writeZipArchive(archivePath, entries) {
  const archive = new yazl.ZipFile();
  const output = fsSync.createWriteStream(archivePath, { flags: "wx" });
  const outputPromise = pipeline(archive.outputStream, output);
  for (const [fileName, contents] of entries) {
    archive.addBuffer(Buffer.from(contents), fileName);
  }
  archive.end();
  await outputPromise;
}

test("JSON adapter preserves keys, Unicode, indentation, BOM, and final newline", () => {
  const source = Buffer.from('\uFEFF{\r\n  "quest.start": "Begin the quest",\r\n  "item.name": "Moon Key"\r\n}\r\n');
  const adapter = parseLocalizationFile("strings.json", source);
  const output = buildLocalizationFile(adapter, {
    "quest.start": "ابدأ المهمة",
    "item.name": "مفتاح القمر"
  });
  assert.equal(output.toString("utf8"), '\uFEFF{\r\n  "quest.start": "ابدأ المهمة",\r\n  "item.name": "مفتاح القمر"\r\n}\r\n');
});

test("CSV adapter handles commas, quotes, embedded line breaks, and untouched columns", () => {
  const source = Buffer.from('key,text,note\r\nhello,"Hello, ""world""\nagain",leave me\r\nbye,Goodbye,unchanged\r\n');
  const adapter = parseLocalizationFile("strings.csv", source);
  const output = buildLocalizationFile(adapter, {
    hello: 'مرحبًا، "يا عالم"\nمجدداً',
    bye: "إلى اللقاء"
  });
  const rows = tokenizeCsv(output.toString("utf8"));
  assert.deepEqual(rows[0], ["key", "text", "note"]);
  assert.deepEqual(rows[1], ["hello", 'مرحبًا، "يا عالم"\nمجدداً', "leave me"]);
  assert.deepEqual(rows[2], ["bye", "إلى اللقاء", "unchanged"]);
  assert.ok(output.toString("utf8").endsWith("\r\n"));
});

test("adapters reject unsupported formats, malformed data, and ambiguous CSV identifiers", () => {
  assert.throws(() => parseLocalizationFile("archive.bin", Buffer.from("data")), {
    message: "UNSUPPORTED_FILE_FORMAT"
  });
  assert.throws(() => parseLocalizationFile("nested.json", Buffer.from('{"strings":{"a":"Hello"}}')), {
    message: "UNSUPPORTED_JSON_SCHEMA"
  });
  assert.throws(() => parseLocalizationFile("broken.json", Buffer.from("{")), {
    message: "INVALID_JSON"
  });
  assert.throws(() => parseLocalizationFile("duplicate.json", Buffer.from('{"line":"First","line":"Second"}')), {
    message: "DUPLICATE_LOCALIZATION_KEY"
  });
  assert.throws(() => parseLocalizationFile("duplicate.csv", Buffer.from("id,text\na,One\na,Two")), {
    message: "DUPLICATE_OR_EMPTY_LOCALIZATION_KEY"
  });
  assert.throws(() => parseLocalizationFile("bad.csv", Buffer.from('id,text\na,"unfinished')), {
    message: "MALFORMED_CSV"
  });
});

test("folder scan selects the strongest localization candidate without reading excluded folders", async () => {
  const { directory } = await createWorkspace();
  try {
    const englishDirectory = path.join(directory, "Localization", "English");
    const frenchDirectory = path.join(directory, "Localization", "French");
    const excludedDirectory = path.join(directory, "node_modules", "Localization");
    await Promise.all([
      fs.mkdir(englishDirectory, { recursive: true }),
      fs.mkdir(frenchDirectory, { recursive: true }),
      fs.mkdir(excludedDirectory, { recursive: true })
    ]);
    await Promise.all([
      fs.writeFile(path.join(englishDirectory, "strings.json"), '{"hello":"Hello"}'),
      fs.writeFile(path.join(frenchDirectory, "strings.json"), '{"bonjour":"Bonjour"}'),
      fs.writeFile(path.join(excludedDirectory, "strings.json"), '{"hidden":"Do not scan"}')
    ]);

    const result = await scanLocalizationDirectory(directory);
    assert.equal(result.adapter.fileName, "strings.json");
    assert.equal(result.relativePath, path.join("Localization", "English", "strings.json"));
    assert.equal(result.candidateCount, 2);
    assert.deepEqual(result.adapter.entries, [{ id: "hello", text: "Hello" }]);
    assert.equal(await fs.readFile(path.join(englishDirectory, "strings.json"), "utf8"), '{"hello":"Hello"}');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("folder scan rejects unsupported folders and invalid paths with explicit codes", async () => {
  const { directory } = await createWorkspace();
  try {
    await fs.writeFile(path.join(directory, "settings.json"), '{"volume":"high"}');
    await assert.rejects(scanLocalizationDirectory(directory), {
      code: "LOCALIZATION_SOURCE_NOT_FOUND"
    });
    await assert.rejects(scanLocalizationDirectory(path.join(directory, "missing")), {
      code: "INVALID_GAME_FOLDER"
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("folder scan rejects a clearly different game's folder and accepts GTA name variants", async () => {
  const { directory } = await createWorkspace();
  try {
    const wrongGameFolder = path.join(directory, "Silent Hill");
    const matchingGameFolder = path.join(directory, "Grand Theft Auto V");
    await Promise.all([
      fs.mkdir(path.join(wrongGameFolder, "Localization"), { recursive: true }),
      fs.mkdir(path.join(matchingGameFolder, "Localization"), { recursive: true })
    ]);
    await Promise.all([
      fs.writeFile(path.join(wrongGameFolder, "Localization", "strings.json"), '{"hello":"Hello"}'),
      fs.writeFile(path.join(matchingGameFolder, "Localization", "strings.json"), '{"hello":"Hello"}')
    ]);

    await assert.rejects(scanLocalizationDirectory(wrongGameFolder, "GTA V"), {
      code: "LOCALIZATION_GAME_MISMATCH"
    });
    const matching = await scanLocalizationDirectory(matchingGameFolder, "GTA V");
    assert.equal(matching.adapter.fileName, "strings.json");
    assert.equal(isClearlyDifferentGameFolder("common", "Grand Theft Auto V"), false);
    assert.equal(isClearlyDifferentGameFolder("Silent Hill", "Grand Theft Auto V"), true);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("folder scan discovers ordinary dialogue JSON without localization-named paths", async () => {
  const { directory } = await createWorkspace();
  try {
    const gameDirectory = path.join(directory, "An Example Game");
    const resourceDirectory = path.join(gameDirectory, "x64", "data");
    await fs.mkdir(resourceDirectory, { recursive: true });
    const resourcePath = path.join(resourceDirectory, "dialogue.json");
    await fs.writeFile(resourcePath, JSON.stringify({
      intro: "Welcome to the old city",
      quest: "Find the hidden key",
      warning: "The gate closes at midnight"
    }));

    const result = await scanLocalizationDirectory(gameDirectory, "An Example Game");
    assert.equal(result.adapter.fileName, "dialogue.json");
    assert.equal(result.relativePath, path.join("x64", "data", "dialogue.json"));
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("folder scan stops for protected online games and detected Arabic localizations", async () => {
  const { directory } = await createWorkspace();
  try {
    const gameDirectory = path.join(directory, "An Example Game");
    const localizationDirectory = path.join(gameDirectory, "Localization");
    await fs.mkdir(localizationDirectory, { recursive: true });
    await fs.writeFile(path.join(localizationDirectory, "strings.json"), JSON.stringify({
      intro: "Welcome to the old city",
      quest: "Find the hidden key",
      warning: "The gate closes at midnight"
    }));
    await assert.rejects(scanLocalizationDirectory(directory, "Dead by Daylight"), {
      code: "UNSUPPORTED_PROTECTED_GAME"
    });
    await assert.rejects(scanLocalizationDirectory(directory, "Counter-Strike 2"), {
      code: "UNSUPPORTED_PROTECTED_GAME"
    });

    await fs.writeFile(path.join(localizationDirectory, "strings_ar.json"), JSON.stringify({
      intro: "مرحبًا بك",
      quest: "اعثر على المفتاح",
      warning: "سيغلق الباب"
    }));
    await assert.rejects(scanLocalizationDirectory(gameDirectory, "An Example Game"), {
      code: "ARABIC_LOCALIZATION_PRESENT"
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("folder scan rejects an Arabic language selection in a game configuration", async () => {
  const { directory } = await createWorkspace();
  try {
    const gameDirectory = path.join(directory, "An Example Game");
    const localizationDirectory = path.join(gameDirectory, "Localization");
    await fs.mkdir(localizationDirectory, { recursive: true });
    await fs.writeFile(path.join(gameDirectory, "language.ini"), "Language=arabic\n");
    await fs.writeFile(path.join(localizationDirectory, "strings.json"), JSON.stringify({
      intro: "Welcome to the old city",
      quest: "Find the hidden key",
      warning: "The gate closes at midnight"
    }));
    await assert.rejects(scanLocalizationDirectory(gameDirectory, "An Example Game"), {
      code: "ARABIC_LOCALIZATION_PRESENT"
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("folder scan identifies unsupported game archives instead of reporting no files", async () => {
  const { directory } = await createWorkspace();
  try {
    const gameDirectory = path.join(directory, "An Example Game");
    await fs.mkdir(gameDirectory, { recursive: true });
    await fs.writeFile(path.join(gameDirectory, "game.rpf"), Buffer.from("binary archive"));
    await assert.rejects(scanLocalizationDirectory(gameDirectory, "An Example Game"), {
      code: "UNSUPPORTED_GAME_RESOURCE_FORMAT"
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("folder scan recognizes Shadow of the Tomb Raider Arabic text TIGER archives without claiming to unpack them", async () => {
  const { directory } = await createWorkspace();
  try {
    const gameDirectory = path.join(directory, "Shadow of the Tomb Raider");
    await fs.mkdir(gameDirectory, { recursive: true });
    await fs.writeFile(
      path.join(gameDirectory, "bigfile_alltxt_arabic_allplt.000.tiger"),
      Buffer.from("TIGER archive fixture")
    );
    await assert.rejects(scanLocalizationDirectory(gameDirectory, "Shadow of the Tomb Raider"), {
      code: "SOTTR_ARABIC_LOCALIZATION_PRESENT"
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("TIGER archives without Arabic text resources are reported as unsupported formats", async () => {
  const { directory } = await createWorkspace();
  try {
    const gameDirectory = path.join(directory, "An Example Game");
    await fs.mkdir(gameDirectory, { recursive: true });
    await fs.writeFile(path.join(gameDirectory, "bigfile.000.tiger"), Buffer.from("TIGER archive fixture"));
    await assert.rejects(scanLocalizationDirectory(gameDirectory, "An Example Game"), {
      code: "UNSUPPORTED_GAME_RESOURCE_FORMAT"
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("folder scan identifies Unreal IoStore containers without attempting to decrypt or extract them", async () => {
  const { directory } = await createWorkspace();
  try {
    const gameDirectory = path.join(directory, "The Sinking City 2");
    const packagesDirectory = path.join(gameDirectory, "PlayGround", "Content", "Paks");
    await fs.mkdir(packagesDirectory, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(packagesDirectory, "pakchunk0-Windows.pak"), Buffer.from("PAK fixture")),
      fs.writeFile(path.join(packagesDirectory, "pakchunk0-Windows.utoc"), Buffer.from("UTOC fixture")),
      fs.writeFile(path.join(packagesDirectory, "pakchunk0-Windows.ucas"), Buffer.from("UCAS fixture"))
    ]);
    await assert.rejects(scanLocalizationDirectory(gameDirectory, "The Sinking City 2"), {
      code: "UNSUPPORTED_UNREAL_RESOURCE_FORMAT"
    });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("ZIP localization resources can be scanned and exported as a separate translated ZIP", async (t) => {
  const { directory } = await createWorkspace();
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const gameDirectory = path.join(directory, "An Example Game");
  const archiveDirectory = path.join(gameDirectory, "Localization");
  const archivePath = path.join(archiveDirectory, "resources.zip");
  const archiveWorkspace = path.join(directory, "archive-workspace");
  const translatedArchive = path.join(directory, "resources.ar.zip");
  const extractedOutput = path.join(directory, "translated-output");
  await fs.mkdir(archiveDirectory, { recursive: true });
  const originalResource = JSON.stringify({
    intro: "Welcome to the old city",
    quest: "Find the hidden key",
    warning: "The gate closes at midnight"
  });
  await writeZipArchive(archivePath, [
    ["Localization/en/strings.json", originalResource],
    ["readme.txt", "Unchanged archive content"]
  ]);
  const originalArchiveBytes = await fs.readFile(archivePath);

  const scanned = await scanLocalizationDirectory(gameDirectory, "An Example Game", {
    archiveWorkspace
  });
  assert.equal(scanned.adapter.archive.sourceArchivePath, archivePath);
  assert.equal(scanned.adapter.archive.memberPath, path.join("Localization", "en", "strings.json"));
  assert.equal(scanned.adapter.fileName, "resources.zip");

  const translatedContents = buildLocalizationFile(scanned.adapter, {
    intro: "مرحبًا بك في المدينة القديمة",
    quest: "اعثر على المفتاح المخفي",
    warning: "ستُغلق البوابة عند منتصف الليل"
  });
  await createTranslatedZipArchive({
    extractedRoot: scanned.adapter.archive.extractedRoot,
    translatedRelativePath: scanned.adapter.archive.memberPath,
    translatedContents,
    destination: translatedArchive
  });
  await extractZip(translatedArchive, extractedOutput);
  const outputEntries = JSON.parse(await fs.readFile(
    path.join(extractedOutput, "Localization", "en", "strings.json"),
    "utf8"
  ));
  assert.equal(outputEntries.intro, "مرحبًا بك في المدينة القديمة");
  assert.equal(
    await fs.readFile(path.join(extractedOutput, "readme.txt"), "utf8"),
    "Unchanged archive content"
  );
  await assert.rejects(fs.access(path.join(extractedOutput, ".dreko-extracted")), {
    code: "ENOENT"
  });
  assert.deepEqual(await fs.readFile(archivePath), originalArchiveBytes);
  assert.equal(await fs.stat(translatedArchive).then((stat) => stat.isFile()), true);
});

test("a game with community localizations is not treated as a protected game by title alone", () => {
  assert.equal(getProtectedGameRule("Pacify"), null);
  assert.equal(getProtectedGameRule("Counter-Strike: Global Offensive").id, "counter-strike");
  assert.equal(getProtectedGameRule("Dead by Daylight").id, "dead-by-daylight");
});

test("Arabic patch readme names are not mistaken for installed Arabic resources", () => {
  assert.equal(hasArabicLocalizedPath("اقرأني - تعريب GTA V Enhanced.txt"), false);
  assert.equal(hasArabicLocalizedPath(path.join("Localization", "Arabic", "strings.json")), true);
  assert.equal(hasArabicLocalizedPath(path.join("Localization", "strings_ar.json")), true);
  assert.equal(hasArabicLocalizedPath("bigfile_alltxt_arabic_allplt.000.tiger"), true);
  assert.equal(hasArabicLocalizedPath("bigfile_alltxt_allvo_arabic.000.tiger"), false);
});

test("protected placeholders and markup are validated without losing Arabic Unicode", () => {
  const source = "Hello {player_name} {{name}} ${variable} %1$s\\n <b>hero</b> [color=red]";
  const good = "مرحبًا {player_name} {{name}} ${variable} %1$s\\n <b>بطل</b> [color=red]";
  assert.equal(hasSameProtectedTokens(source, good), true);
  assert.equal(hasSameProtectedTokens(source, good.replace("%1$s", "%s")), false);
  assert.equal(hasSameProtectedTokens(source, good.replace("\\n", "")), false);
  assert.equal(hasSameProtectedTokens("<b>text</b>", "</b>نص<b>"), false);
});

test("batching respects both entry and character limits", () => {
  const entries = Array.from({ length: 45 }, (_, index) => ({ id: `id-${index}`, text: "hello" }));
  const batches = createBatches(entries);
  assert.equal(batches.flat().length, entries.length);
  assert.ok(batches.every((batch) => batch.length <= 20));
  const characterBatches = createBatches([
    { id: "first", text: "x".repeat(9000) },
    { id: "second", text: "y".repeat(9000) },
    { id: "third", text: "z".repeat(9000) }
  ]);
  assert.equal(characterBatches.length, 3);
  assert.throws(() => createBatches([{ id: "large", text: "x".repeat(16001) }]), {
    code: "LOCALIZATION_ENTRY_TOO_LARGE"
  });
});

test("Gemini request keeps the API key in a header and validates structured output", async () => {
  let seenUrl;
  let seenOptions;
  const result = await requestBatch({
    apiKey: "test-api-key-that-is-never-real",
    model: "gemini-test-model",
    entries: [{ id: "hello", text: "Hello {player}" }],
    options: {
      sourceLanguage: "en",
      category: "dialogue",
      glossary: "",
      gameTitle: "Example Game",
      gameDescription: "An adventurer searches for a lost city."
    },
    signal: new AbortController().signal,
    fetchImpl: async (url, options) => {
      seenUrl = url;
      seenOptions = options;
      return jsonResponse(200, {
        candidates: [{
          content: {
            parts: [{ text: JSON.stringify({ translations: [{ id: "hello", text: "مرحبًا {player}" }] }) }]
          }
        }]
      });
    }
  });
  assert.equal(result.translations.hello, "مرحبًا {player}");
  assert.deepEqual(result.errors, []);
  assert.equal(new URL(seenUrl).search, "");
  assert.equal(seenOptions.headers["x-goog-api-key"], "test-api-key-that-is-never-real");
  assert.equal(JSON.parse(seenOptions.body).generationConfig.responseMimeType, "application/json");
  const prompt = JSON.parse(seenOptions.body).contents[0].parts[0].text;
  assert.match(prompt, /Target language: Arabic/);
  assert.match(prompt, /all game text categories/i);
  assert.match(prompt, /dialogue, subtitles, menus, quests/i);
  assert.match(prompt, /Game title: Example Game/);
  assert.match(prompt, /An adventurer searches for a lost city/);
});

test("Gemini missing entries, changed tokens, invalid keys, and quota errors are surfaced", async () => {
  const base = {
    apiKey: "test-api-key-that-is-never-real",
    model: "gemini-test-model",
    entries: [{ id: "entry", text: "Hello {name}" }],
    options: { sourceLanguage: "en", category: "ui", glossary: "" },
    signal: new AbortController().signal
  };
  const missing = await requestBatch({
    ...base,
    fetchImpl: async () => jsonResponse(200, {
      candidates: [{ content: { parts: [{ text: '{"translations":[]}' }] } }]
    })
  });
  assert.deepEqual(missing.errors, [{ code: "INCOMPLETE_GEMINI_RESPONSE", id: "entry" }]);
  assert.deepEqual(Object.keys(missing.translations), []);
  const tokenMismatch = await requestBatch({
    ...base,
    fetchImpl: async () => jsonResponse(200, {
      candidates: [{
        content: { parts: [{ text: '{"translations":[{"id":"entry","text":"مرحبًا"}]}' }] }
      }]
    })
  });
  assert.deepEqual(tokenMismatch.errors, [{ code: "PROTECTED_TOKEN_MISMATCH", id: "entry" }]);
  await assert.rejects(requestBatch({
    ...base,
    fetchImpl: async () => jsonResponse(403, { error: { message: "API key is invalid" } })
  }), { code: "INVALID_API_KEY" });
  await assert.rejects(requestBatch({
    ...base,
    fetchImpl: async () => jsonResponse(429, { error: { message: "Quota exceeded" } })
  }), { code: "API_QUOTA_EXHAUSTED" });
});

test("Gemini rate limits retry a bounded number of times and return a useful failure code", async () => {
  let calls = 0;
  await assert.rejects(requestBatch({
    apiKey: "test-api-key-that-is-never-real",
    model: "gemini-test-model",
    entries: [{ id: "line", text: "Hello" }],
    options: {
      sourceLanguage: "en",
      category: "dialogue",
      glossary: "",
      gameTitle: "Example Game",
      gameDescription: "A story about a lost city."
    },
    signal: new AbortController().signal,
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse(429, { error: { message: "Too many requests" } });
    }
  }), { code: "API_RATE_LIMITED" });
  assert.equal(calls, 4);
});

test("service proxy sends the user's short-lived token without exposing a Gemini key", async () => {
  let captured;
  const result = await requestBatchViaService({
    endpoint: "https://service.example/v1/desktop/ai/translate",
    idToken: "firebase-test-token".padEnd(120, "x"),
    model: "gemini-2.5-flash",
    entries: [{ id: "hello", text: "Hello {player}", previous: "", following: "" }],
    options: {
      sourceLanguage: "en",
      category: "dialogue",
      glossary: "",
      gameTitle: "Example Game",
      gameDescription: "A story about a lost city."
    },
    signal: new AbortController().signal,
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return jsonResponse(200, {
        translations: { hello: "مرحبًا {player}" },
        errors: []
      });
    }
  });
  assert.equal(result.translations.hello, "مرحبًا {player}");
  assert.equal(captured.url, "https://service.example/v1/desktop/ai/translate");
  assert.equal(captured.options.headers.Authorization, `Bearer ${"firebase-test-token".padEnd(120, "x")}`);
  assert.equal(captured.options.body.includes("apiKey"), false);
  const requestBody = JSON.parse(captured.options.body);
  assert.equal(requestBody.gameTitle, "Example Game");
  assert.equal(requestBody.gameDescription, "A story about a lost city.");
  assert.equal(captured.options.headers["x-goog-api-key"], undefined);
});

test("jobs persist progress, resume interrupted work, and reuse cached translations", async (t) => {
  const workspace = await createWorkspace();
  t.after(() => fs.rm(workspace.directory, { recursive: true, force: true }));
  const originalSource = '{"greeting":"Hello"}';
  await fs.writeFile(workspace.sourcePath, originalSource, "utf8");
  const adapter = parseLocalizationFile("source.json", Buffer.from('{"greeting":"Hello"}'));
  let callCount = 0;
  let shouldFail = true;
  const fetchImpl = async (_url, options) => {
    callCount += 1;
    if (shouldFail) {
      shouldFail = false;
      return jsonResponse(400, { error: { message: "bad request" } });
    }
    return translationResponse(entriesFromRequest(options));
  };
  const createManager = async () => {
    const manager = new AiLocalizationJobs({
      stateFile: workspace.stateFile,
      getSessionToken: () => "test-firebase-token".padEnd(120, "x"),
      translateBatch: testTranslateBatch(fetchImpl)
    });
    await manager.initialize();
    return manager;
  };

  const manager = await createManager();
  const first = await manager.create({
    adapter,
    sourcePath: workspace.sourcePath,
    model: "gemini-test-model",
    sourceLanguage: "en",
    category: "dialogue",
    glossary: ""
  });
  assert.equal((await waitForJob(manager, first.id)).status, "failed");
  const restarted = await createManager();
  assert.equal(restarted.get(first.id).status, "failed");
  assert.equal((await restarted.resume(first.id)).status, "running");
  assert.equal((await waitForJob(restarted, first.id)).status, "completed");
  assert.equal(restarted.export(first.id).contents.toString("utf8"), '{\n  "greeting": "مرحبا Hello"\n}');
  assert.equal(callCount, 2);

  const second = await restarted.create({
    adapter,
    sourcePath: workspace.sourcePath,
    model: "gemini-test-model",
    sourceLanguage: "en",
    category: "dialogue",
    glossary: ""
  });
  assert.equal((await waitForJob(restarted, second.id)).status, "completed");
  assert.equal(callCount, 2);
  assert.equal(await fs.readFile(workspace.sourcePath, "utf8"), originalSource);
});

test("translation cache is scoped to the game's title and description", async (t) => {
  const workspace = await createWorkspace();
  t.after(() => fs.rm(workspace.directory, { recursive: true, force: true }));
  const adapter = parseLocalizationFile("source.json", Buffer.from('{"line":"Open the gate"}'));
  let calls = 0;
  const manager = new AiLocalizationJobs({
    stateFile: workspace.stateFile,
    getSessionToken: () => "test-firebase-token".padEnd(120, "x"),
    translateBatch: async ({ entries }) => {
      calls += 1;
      return {
        translations: Object.fromEntries(entries.map((entry) => [entry.id, "افتح البوابة"])),
        errors: []
      };
    }
  });
  await manager.initialize();

  for (const game of [
    { gameTitle: "Moon Gate", gameDescription: "A quiet fantasy adventure." },
    { gameTitle: "Iron Gate", gameDescription: "A science-fiction war." }
  ]) {
    const job = await manager.create({
      adapter,
      sourcePath: workspace.sourcePath,
      gameId: game.gameTitle,
      ...game,
      model: "gemini-test-model",
      sourceLanguage: "auto",
      category: "general",
      glossary: ""
    });
    assert.equal((await waitForJob(manager, job.id)).status, "completed");
  }

  assert.equal(calls, 2);
});

test("oversized individual entries fail cleanly without leaving a locked running job", async (t) => {
  const workspace = await createWorkspace();
  t.after(() => fs.rm(workspace.directory, { recursive: true, force: true }));
  const adapter = parseLocalizationFile(
    "large.json",
    Buffer.from(JSON.stringify({ line: "x".repeat(16001) }))
  );
  let requests = 0;
  const manager = new AiLocalizationJobs({
    stateFile: workspace.stateFile,
    getSessionToken: () => "test-firebase-token".padEnd(120, "x"),
    translateBatch: testTranslateBatch(async () => {
      requests += 1;
      throw new Error("A too-large entry must never be sent.");
    })
  });
  await manager.initialize();
  const job = await manager.create({
    adapter,
    sourcePath: workspace.sourcePath,
    model: "gemini-test-model",
    sourceLanguage: "en",
    category: "general",
    glossary: ""
  });
  const failed = await waitForJob(manager, job.id);
  assert.equal(failed.status, "failed");
  assert.equal(failed.errors[0].code, "LOCALIZATION_ENTRY_TOO_LARGE");
  assert.equal(manager.activeJobId, null);
  assert.equal(requests, 0);
});

test("valid entries from a suspicious response persist and are not translated again on resume", async (t) => {
  const workspace = await createWorkspace();
  t.after(() => fs.rm(workspace.directory, { recursive: true, force: true }));
  const adapter = parseLocalizationFile("source.json", Buffer.from('{"good":"Hello","bad":"Welcome {name}"}'));
  const requestedIds = [];
  let callCount = 0;
  const manager = new AiLocalizationJobs({
    stateFile: workspace.stateFile,
    getSessionToken: () => "test-firebase-token".padEnd(120, "x"),
    translateBatch: testTranslateBatch(async (_url, options) => {
      callCount += 1;
      const entries = entriesFromRequest(options);
      requestedIds.push(entries.map((entry) => entry.id));
      const translations = callCount === 1
        ? [
            { id: "good", text: "مرحبًا" },
            { id: "bad", text: "مرحبًا دون الرمز" }
          ]
        : entries.map((entry) => ({ id: entry.id, text: "مرحبًا {name}" }));
      return jsonResponse(200, {
        candidates: [{
          content: { parts: [{ text: JSON.stringify({ translations }) }] }
        }]
      });
    })
  });
  await manager.initialize();
  const job = await manager.create({
    adapter,
    sourcePath: workspace.sourcePath,
    model: "gemini-test-model",
    sourceLanguage: "en",
    category: "dialogue",
    glossary: ""
  });
  await waitForJob(manager, job.id);
  const failed = manager.list().find((entry) => entry.id === job.id);
  assert.equal(failed.status, "failed");
  assert.equal(failed.completed, 1);
  assert.deepEqual(failed.errors[0].remainingEntries, ["bad"]);
  await manager.resume(job.id);
  assert.equal((await waitForJob(manager, job.id)).status, "completed");
  assert.deepEqual(requestedIds, [["good", "bad"], ["bad"]]);
});

test("running jobs can be cancelled and resumed without repeating completed entries", async (t) => {
  const workspace = await createWorkspace();
  t.after(() => fs.rm(workspace.directory, { recursive: true, force: true }));
  const adapter = parseLocalizationFile("source.json", Buffer.from('{"a":"A"}'));
  let calls = 0;
  const manager = new AiLocalizationJobs({
    stateFile: workspace.stateFile,
    getSessionToken: () => "test-firebase-token".padEnd(120, "x"),
    translateBatch: testTranslateBatch(async (_url, options) => {
      calls += 1;
      if (calls === 1) {
        return new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            reject(Object.assign(new Error("cancelled"), { name: "AbortError" }));
          }, { once: true });
        });
      }
      return translationResponse(entriesFromRequest(options));
    })
  });
  await manager.initialize();
  const job = await manager.create({
    adapter,
    sourcePath: workspace.sourcePath,
    model: "gemini-test-model",
    sourceLanguage: "auto",
    category: "general",
    glossary: ""
  });
  assert.equal(manager.cancel(job.id), true);
  assert.equal((await waitForJob(manager, job.id)).status, "cancelled");
  assert.equal((await manager.resume(job.id)).status, "running");
  assert.equal((await waitForJob(manager, job.id)).status, "completed");
  assert.equal(calls, 2);
});
