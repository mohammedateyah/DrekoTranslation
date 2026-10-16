const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const crypto = require("node:crypto");
const { execFileSync, spawn } = require("node:child_process");
const dns = require("node:dns/promises");
const { isIP } = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, dialog, ipcMain, Menu, shell, Tray } = require("electron");
const DiscordRPC = require("discord-rpc");
const { autoUpdater } = require("electron-updater");
const { TranslationDatabase } = require("./database.cjs");
const {
  discoverEpicGameFolders,
  discoverSteamGameFolders,
  discoverSteamGames,
  deduplicateInstalledGames,
  findMatchingGameFolders,
  matchInstalledGame
} = require("./installed-games.cjs");
const { trustedImageUrl } = require("./image-search.cjs");
const { AiLocalizationJobs } = require("./ai-localization-jobs.cjs");
const { DEFAULT_MODEL, requestBatchViaService } = require("./gemini-translation.cjs");
const { scanLocalizationDirectory } = require("./localization-scanner.cjs");
const { createTranslatedZipArchive } = require("./localization-zip.cjs");
const {
  downloadToFile,
  extractZip,
  getInstallRecord,
  installExtractedFiles,
  isExecutableFile,
  isZipFile,
  recordExternalInstallerInstallation,
  removeInstalledTranslation,
  validateDownloadUrl
} = require("./translation-installer.cjs");

if (!app.isPackaged) {
  const developmentDataPath = path.join(app.getPath("appData"), "dreko-translation-dev");
  app.setPath("userData", developmentDataPath);
  app.setPath("cache", path.join(developmentDataPath, "Cache"));
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
const COVER_SIZE_LIMIT = 8 * 1024 * 1024;
const activeTranslationInstalls = new Map();
let mainWindow;
let tray;
let discordPresenceClient;
let discordPresenceRetry;
let discordPresenceConnecting = false;
let discordApplicationId = "";
let database;
let aiLocalizationJobs;
let aiSessionIdToken = "";
let isQuitting = false;
let pendingAlreadyRunningNotice = false;
let mainPageUrl;
let discordServerOrigin = "";
let discordInviteUrl = "";
let updateFeedUrl = "";
let updateDownloaded = false;
let downloadedUpdateVersion = "";
let updateCheckInProgress = false;
let updateInstallScheduled = false;
let installerLocale = null;

function detectArtworkExtension(contents) {
  if (contents.length >= 8 &&
      contents.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return "png";
  }
  if (contents.length >= 3 &&
      contents[0] === 0xff &&
      contents[1] === 0xd8 &&
      contents[2] === 0xff) {
    return "jpg";
  }
  if (contents.length >= 12 &&
      contents.toString("ascii", 0, 4) === "RIFF" &&
      contents.toString("ascii", 8, 12) === "WEBP") {
    return "webp";
  }
  return "";
}

function createArtworkResult(contents, extension) {
  const contentType = `image/${extension === "jpg" ? "jpeg" : extension}`;
  const base64 = contents.toString("base64");
  return {
    canceled: false,
    src: `data:${contentType};base64,${base64}`,
    base64,
    contentType,
    size: contents.length
  };
}

async function readBoundedResponse(response, sizeLimit) {
  const reader = response.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks = [];
  let totalSize = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.byteLength;
    if (totalSize > sizeLimit) {
      await reader.cancel();
      return null;
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, totalSize);
}

function isPublicArtworkAddress(address) {
  const addressType = isIP(address);
  if (addressType === 4) {
    const octets = address.split(".").map(Number);
    const [first, second, third] = octets;
    return !(first === 0 || first === 10 || first === 127 || first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 192 && second === 0) ||
      (first === 192 && second === 88 && third === 99) ||
      (first === 198 && (second === 18 || second === 19 || second === 51)) ||
      (first === 203 && second === 0 && third === 113));
  }
  if (addressType !== 6) return false;

  const normalized = address.toLowerCase().split("%")[0];
  if (normalized.startsWith("::ffff:")) {
    const mappedAddress = normalized.slice("::ffff:".length);
    if (isIP(mappedAddress) === 4) return isPublicArtworkAddress(mappedAddress);
    const groups = mappedAddress.split(":");
    if (groups.length === 2 && groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) {
      const high = Number.parseInt(groups[0], 16);
      const low = Number.parseInt(groups[1], 16);
      return isPublicArtworkAddress([
        high >> 8,
        high & 0xff,
        low >> 8,
        low & 0xff
      ].join("."));
    }
    return false;
  }
  const firstGroup = Number.parseInt(normalized.split(":")[0] || "0", 16);
  return firstGroup >= 0x2000 && firstGroup < 0x4000 &&
    !normalized.startsWith("2001:db8:") &&
    !normalized.startsWith("2001:10:") &&
    !normalized.startsWith("2002:");
}

async function validateExternalArtworkUrl(value) {
  let url;
  try {
    url = new URL(typeof value === "string" ? value.trim() : "");
  } catch {
    return "";
  }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || (url.port && url.port !== "443") ||
      url.username || url.password || url.hash || isIP(hostname) ||
      hostname === "localhost" || hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return "";
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => !isPublicArtworkAddress(address))) {
      return "";
    }
    return url.href;
  } catch {
    return "";
  }
}

async function downloadArtworkFromUrl(imageUrl, validateFinalUrl) {
  try {
    const response = await fetch(imageUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok || response.status >= 300) {
      return { ok: false, code: "ARTWORK_DOWNLOAD_FAILED" };
    }
    if (!validateFinalUrl(response.url || imageUrl)) {
      return { ok: false, code: "INVALID_ARTWORK_URL" };
    }
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > COVER_SIZE_LIMIT) {
      return { ok: false, code: "COVER_SIZE_LIMIT" };
    }
    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
      return { ok: false, code: "UNSUPPORTED_COVER" };
    }
    const contents = await readBoundedResponse(response, COVER_SIZE_LIMIT);
    if (contents === null) return { ok: false, code: "COVER_SIZE_LIMIT" };
    if (!contents.length) return { ok: false, code: "ARTWORK_DOWNLOAD_FAILED" };
    const extension = detectArtworkExtension(contents);
    if (!extension) return { ok: false, code: "UNSUPPORTED_COVER" };
    return { ok: true, data: createArtworkResult(contents, extension) };
  } catch (error) {
    console.error("Unable to download selected game artwork:", error?.name || "UNKNOWN");
    return { ok: false, code: "ARTWORK_DOWNLOAD_FAILED" };
  }
}

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  function assertTrustedWindow(event) {
    if (!mainWindow ||
        mainWindow.isDestroyed() ||
        event.sender !== mainWindow.webContents ||
        !event.senderFrame ||
        !(event.senderFrame.url === mainPageUrl ||
          event.senderFrame.url.startsWith(`${mainPageUrl}#`))) {
      throw new Error("Blocked an IPC request from an untrusted page.");
    }
  }

  function safeDiscordInviteUrl(value) {
    try {
      const invite = new URL(value);
      if (invite.protocol !== "https:" ||
          !["discord.gg", "www.discord.gg", "discord.com", "www.discord.com"].includes(invite.hostname) ||
          (invite.hostname.includes("discord.com") && !invite.pathname.startsWith("/invite/")) ||
          invite.username || invite.password) return "";
      return invite.href;
    } catch {
      return "";
    }
  }

  function consumeInstallerLocale() {
    if (process.platform !== "win32") return null;
    const registryKey = "HKCU\\Software\\Dreko Translation";
    try {
      const result = execFileSync("reg.exe", ["query", registryKey, "/v", "InstallerLanguage"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        windowsHide: true
      });
      const match = /InstallerLanguage\s+REG_SZ\s+(ar|en)\s*$/im.exec(result);
      if (!match) return null;
      execFileSync("reg.exe", ["delete", registryKey, "/v", "InstallerLanguage", "/f"], {
        stdio: "ignore",
        windowsHide: true
      });
      return match[1];
    } catch (error) {
      if (error?.status !== 1) {
        console.error("Unable to read the selected installer language:", error?.code || error?.name || "UNKNOWN");
      }
      return null;
    }
  }

  function findSteamInstallRoots() {
    const roots = new Set([
      process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Steam"),
      process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Steam"),
      process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Programs", "Steam")
    ].filter(Boolean));

    for (const registryKey of [
      "HKCU\\Software\\Valve\\Steam",
      "HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam",
      "HKLM\\SOFTWARE\\Valve\\Steam"
    ]) {
      try {
        const result = execFileSync("reg.exe", ["query", registryKey, "/v", "SteamPath"], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
          windowsHide: true
        });
        const match = /SteamPath\s+REG_(?:EXPAND_)?SZ\s+(.+)/i.exec(result);
        if (match && match[1].trim()) roots.add(match[1].trim());
      } catch {
        // Registry entries are optional; the standard installation paths are checked too.
      }
    }
    return [...roots].filter((root) => fsSync.existsSync(root));
  }

  function findEpicManifestRoots() {
    const programData = process.env.ProgramData || "C:\\ProgramData";
    const localAppData = process.env.LOCALAPPDATA;
    return [
      path.join(programData, "Epic", "EpicGamesLauncher", "Data", "Manifests"),
      localAppData && path.join(localAppData, "EpicGamesLauncher", "Data", "Manifests")
    ].filter((root) => root && fsSync.existsSync(root));
  }

  function findLocalGameSearchRoots() {
    const roots = new Set();
    for (const drive of "CDEFGHIJKLMNOPQRSTUVWXYZ") {
      const driveRoot = `${drive}:\\`;
      if (fsSync.existsSync(driveRoot)) roots.add(driveRoot);
    }
    return [...roots];
  }

  async function requestDiscordService(route, options = {}, timeoutMs = 12000) {
    if (!discordServerOrigin) return { ok: false, code: "AUTH_SERVER_NOT_CONFIGURED" };
    try {
      const response = await fetch(new URL(route, `${discordServerOrigin}/`), {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.headers || {})
        },
        signal: AbortSignal.timeout(timeoutMs)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { ok: false, code: typeof data.code === "string" ? data.code : "AUTH_SERVER_UNAVAILABLE" };
      }
      return { ok: true, data };
    } catch (error) {
      console.error("Discord membership service request failed:", error?.name || "UNKNOWN");
      return { ok: false, code: "AUTH_SERVER_UNAVAILABLE" };
    }
  }

  function createMainWindow() {
    const indexPath = path.join(__dirname, "index.html");
    mainPageUrl = pathToFileURL(indexPath).href;

    mainWindow = new BrowserWindow({
      width: 1540,
      height: 1020,
      minWidth: 1080,
      minHeight: 720,
      show: false,
      autoHideMenuBar: true,
      backgroundColor: "#090b0f",
      title: "Dreko Translation",
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: "#090a0d",
        symbolColor: "#858891",
        height: 30
      },
      icon: path.join(__dirname, "assets", "dreko.ico"),
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true
      }
    });

    mainWindow.maximize();
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    mainWindow.webContents.on("will-navigate", (event, url) => {
      if (url === mainPageUrl || url.startsWith(`${mainPageUrl}#`)) return;
      event.preventDefault();
    });
    mainWindow.webContents.on("render-process-gone", (_event, details) => {
      console.error("The Dreko Translation renderer exited unexpectedly:", details.reason);
    });

    mainWindow.once("ready-to-show", () => {
      mainWindow.show();
      if (pendingAlreadyRunningNotice) {
        pendingAlreadyRunningNotice = false;
        showAlreadyRunningNotice();
      }
    });
    mainWindow.on("close", (event) => {
      if (isQuitting) return;
      event.preventDefault();
      mainWindow.hide();
    });
    mainWindow.on("closed", () => { mainWindow = null; });

    mainWindow.loadFile(indexPath).catch((error) => {
      console.error("Unable to load the Dreko Translation window:", error);
      app.exit(1);
    });
  }

  function showMainWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createMainWindow();
      return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }

  function showAlreadyRunningNotice() {
    if (!mainWindow || mainWindow.isDestroyed()) {
      pendingAlreadyRunningNotice = true;
      return;
    }
    showMainWindow();
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Dreko Translation",
      message: "التطبيق يعمل بالفعل.",
      buttons: ["حسنًا"],
      noLink: true
    }).catch((error) => {
      console.error("Unable to show the already-running notice:", error?.code || error?.name || "UNKNOWN");
    });
  }

  function createTray() {
    tray = new Tray(path.join(__dirname, "assets", "dreko.ico"));
    tray.setToolTip("Dreko Translation");
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: "إظهار Dreko Translation", click: showMainWindow },
      { type: "separator" },
      { label: "إغلاق Dreko Translation", click: () => app.quit() }
    ]));
    tray.on("click", showMainWindow);
    tray.on("double-click", showMainWindow);
  }

  function scheduleDiscordPresenceRetry() {
    if (discordPresenceRetry || isQuitting) return;
    discordPresenceRetry = setTimeout(() => {
      discordPresenceRetry = null;
      void connectDiscordPresence();
    }, 15000);
    discordPresenceRetry.unref();
  }

  async function connectDiscordPresence() {
    if (discordPresenceConnecting || isQuitting) return;
    discordPresenceConnecting = true;
    try {
      let clientId = discordApplicationId;
      if (!clientId && discordServerOrigin) {
        const config = await requestDiscordService("/v1/desktop/config");
        if (!config.ok) throw new Error(`DISCORD_CONFIG_${config.code || "UNAVAILABLE"}`);
        clientId = config.data?.clientId || "";
      }
      if (typeof clientId !== "string" || !/^\d{17,20}$/.test(clientId)) {
        console.error("Discord Rich Presence is disabled because no valid public application ID is configured.");
        return;
      }

      const client = new DiscordRPC.Client({ transport: "ipc" });
      discordPresenceClient = client;
      client.on("error", (error) => {
        console.error("Discord Rich Presence connection failed:", error?.message || error?.name || "UNKNOWN");
      });
      client.on("disconnected", () => {
        if (discordPresenceClient === client) discordPresenceClient = null;
        scheduleDiscordPresenceRetry();
      });
      await client.login({ clientId });
      await client.setActivity({
        state: "عالم الألعاب… بلغتك العربية",
        buttons: [{ label: "تحميل التطبيق", url: "https://dreko8u.web.app" }],
        instance: false
      });
      console.info("Dreko Discord Activity is active.");
    } catch (error) {
      if (discordPresenceClient) {
        const client = discordPresenceClient;
        discordPresenceClient = null;
        await client.destroy().catch(() => {});
      }
      console.error("Unable to publish Dreko activity to Discord:", error?.message || error?.name || "UNKNOWN");
      scheduleDiscordPresenceRetry();
    } finally {
      discordPresenceConnecting = false;
    }
  }

  function sendUpdateStatus(status) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("updates:status", status);
    }
  }

  function scheduleDownloadedUpdateInstall() {
    if (!app.isPackaged || !updateDownloaded || updateInstallScheduled) return;
    updateInstallScheduled = true;
    setTimeout(() => {
      if (isQuitting) return;
      console.info(`Installing Dreko update ${downloadedUpdateVersion} and restarting.`);
      autoUpdater.quitAndInstall(false, true);
    }, 1500);
  }

  function configureAutoUpdater() {
    if (updateFeedUrl) {
      autoUpdater.setFeedURL({ provider: "generic", url: updateFeedUrl });
    }
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.autoRunAppAfterInstall = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.on("checking-for-update", () => {
      updateCheckInProgress = true;
      sendUpdateStatus({ type: "checking" });
    });
    autoUpdater.on("update-available", (info) => {
      sendUpdateStatus({ type: "available", version: info.version });
    });
    autoUpdater.on("update-not-available", (info) => {
      updateCheckInProgress = false;
      sendUpdateStatus({ type: "not-available", version: info.version });
    });
    autoUpdater.on("download-progress", (progress) => {
      sendUpdateStatus({
        type: "progress",
        percent: Math.max(0, Math.min(100, progress.percent))
      });
    });
    autoUpdater.on("update-downloaded", (info) => {
      updateCheckInProgress = false;
      updateDownloaded = true;
      downloadedUpdateVersion = info.version;
      sendUpdateStatus({ type: "downloaded", version: info.version });
      scheduleDownloadedUpdateInstall();
    });
    autoUpdater.on("error", (error) => {
      updateCheckInProgress = false;
      console.error("Dreko update check failed:", error?.message || error?.name || "UNKNOWN");
      sendUpdateStatus({ type: "error" });
    });

    ipcMain.handle("updates:check", (event) => {
      assertTrustedWindow(event);
      if (!app.isPackaged) return { ok: false, code: "UPDATES_REQUIRE_INSTALLED_APP" };
      if (!updateFeedUrl) return { ok: false, code: "UPDATE_FEED_NOT_CONFIGURED" };
      if (updateDownloaded) {
        sendUpdateStatus({ type: "downloaded", version: downloadedUpdateVersion });
        scheduleDownloadedUpdateInstall();
        return { ok: true, code: "UPDATE_ALREADY_DOWNLOADED" };
      }
      if (updateCheckInProgress) return { ok: true, code: "UPDATE_CHECK_IN_PROGRESS" };
      autoUpdater.checkForUpdates().catch((error) => {
        updateCheckInProgress = false;
        console.error("Dreko update request failed:", error?.message || error?.name || "UNKNOWN");
        sendUpdateStatus({ type: "error" });
      });
      return { ok: true };
    });

    ipcMain.handle("updates:install", (event) => {
      assertTrustedWindow(event);
      if (!app.isPackaged || !updateDownloaded) {
        return { ok: false, code: "UPDATE_NOT_READY" };
      }
      autoUpdater.quitAndInstall(false, true);
      return { ok: true };
    });
  }

  app.whenReady().then(async () => {
    app.setAppUserModelId("com.dreko.translation");
    installerLocale = consumeInstallerLocale();
    if (process.platform === "win32") {
      try {
        app.setLoginItemSettings({
          openAtLogin: true,
          path: process.execPath,
          args: app.isPackaged ? [] : [app.getAppPath()]
        });
      } catch (error) {
        console.error("Unable to enable Dreko Translation at Windows startup:", error?.code || error?.name || "UNKNOWN");
      }
    }
    const allowLocalDevelopmentServer = !app.isPackaged ||
      process.argv.includes("--allow-local-auth-server");
    try {
      const authConfigPath = path.join(__dirname, "discord-auth-config.json");
      const authConfig = JSON.parse(await fs.readFile(authConfigPath, "utf8"));
      discordApplicationId = typeof authConfig.discordApplicationId === "string" &&
          /^\d{17,20}$/.test(authConfig.discordApplicationId)
        ? authConfig.discordApplicationId
        : "";
      const candidate = new URL(authConfig.serverUrl);
      const localDevelopmentHost = ["localhost", "127.0.0.1", "::1"].includes(candidate.hostname);
      if (!candidate.username && !candidate.password && !candidate.search && !candidate.hash &&
          candidate.pathname === "/" &&
          (candidate.protocol === "https:" ||
            (allowLocalDevelopmentServer && candidate.protocol === "http:" && localDevelopmentHost))) {
        discordServerOrigin = candidate.origin;
        if (candidate.protocol === "https:" ||
            (allowLocalDevelopmentServer && localDevelopmentHost)) {
          updateFeedUrl = new URL("/updates/", candidate.origin).href;
        }
      } else {
        console.error("Discord auth server URL must be an HTTPS origin (localhost is allowed during development).");
      }
    } catch (error) {
      console.error("Unable to read Discord auth server configuration:", error?.code || error?.name || "UNKNOWN");
    }
    const dataDirectory = app.getPath("userData");
    database = new TranslationDatabase(path.join(dataDirectory, "dreko.sqlite"));
    aiLocalizationJobs = new AiLocalizationJobs({
      stateFile: path.join(dataDirectory, "ai-localization-jobs.json"),
      getSessionToken: () => aiSessionIdToken,
      translateBatch: (request) => {
        if (!discordServerOrigin) {
          throw Object.assign(new Error("The AI translation service is not configured."), {
            code: "GEMINI_SERVICE_NOT_CONFIGURED"
          });
        }
        return requestBatchViaService({
          ...request,
          endpoint: new URL("/v1/desktop/ai/translate", `${discordServerOrigin}/`).href
        });
      },
      onProgress: (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("ai-localization:progress", progress);
        }
      }
    });
    await aiLocalizationJobs.initialize();
    configureAutoUpdater();

    ipcMain.handle("dreko:bootstrap", (event) => {
      assertTrustedWindow(event);
      return {
        version: app.getVersion(),
        installerLocale,
        packaged: app.isPackaged
      };
    });

    const selectedAiSources = new Map();
    ipcMain.handle("ai-localization:scan-game-folder", async (event, value) => {
      assertTrustedWindow(event);
      try {
        if (!value || typeof value !== "object" ||
            typeof value.gameFolder !== "string" || value.gameFolder.length > 2048 ||
            typeof value.gameTitle !== "string" || !value.gameTitle.trim() || value.gameTitle.length > 120) {
          return { ok: false, code: "INVALID_GAME_FOLDER" };
        }
        const { sourcePath, adapter, candidateCount } =
          await scanLocalizationDirectory(value.gameFolder, value.gameTitle, {
            archiveWorkspace: path.join(dataDirectory, "ai-localization-archives")
          });
        const sourceToken = crypto.randomUUID();
        selectedAiSources.set(sourceToken, { sourcePath, adapter });
        while (selectedAiSources.size > 5) {
          selectedAiSources.delete(selectedAiSources.keys().next().value);
        }
        return {
          ok: true,
          data: {
            sourceToken,
            fileName: adapter.fileName,
            format: adapter.format,
            entryCount: adapter.entries.length,
            candidateCount
          }
        };
      } catch (error) {
        const code = error?.code || error?.message;
        if (code === "INVALID_GAME_FOLDER" || code === "LOCALIZATION_SCAN_LIMIT" ||
            code === "LOCALIZATION_GAME_MISMATCH" ||
            code === "UNSUPPORTED_PROTECTED_GAME" || code === "ARABIC_LOCALIZATION_PRESENT" ||
            code === "UNSUPPORTED_UNREAL_RESOURCE_FORMAT" ||
            code === "UNSUPPORTED_GAME_RESOURCE_FORMAT" ||
            code === "LOCALIZATION_SOURCE_NOT_FOUND") {
          return { ok: false, code };
        }
        console.error("Unable to scan selected game folder:", error?.code || error?.name || "UNKNOWN");
        return { ok: false, code: "LOCALIZATION_FILE_READ_FAILED" };
      }
    });

    ipcMain.handle("ai-localization:start", async (event, value) => {
      assertTrustedWindow(event);
      if (!value || typeof value !== "object" ||
          typeof value.sourceToken !== "string" || !/^[a-f0-9-]{36}$/iu.test(value.sourceToken) ||
          typeof value.idToken !== "string" || value.idToken.length < 100 || value.idToken.length > 16000 ||
          typeof value.gameId !== "string" || value.gameId.length < 1 || value.gameId.length > 128 ||
          typeof value.gameTitle !== "string" || value.gameTitle.trim().length < 1 || value.gameTitle.length > 120 ||
          typeof value.gameDescription !== "string" || value.gameDescription.length > 1000 ||
          typeof value.glossary !== "string" || value.glossary.length > 10000) {
        return { ok: false, code: "INVALID_TRANSLATION_OPTIONS" };
      }
      const source = selectedAiSources.get(value.sourceToken);
      if (!source) return { ok: false, code: "LOCALIZATION_SOURCE_EXPIRED" };
      try {
        aiSessionIdToken = value.idToken;
        const job = await aiLocalizationJobs.create({
          ...source,
          gameId: value.gameId,
          gameTitle: value.gameTitle.trim(),
          gameDescription: value.gameDescription.trim(),
          model: DEFAULT_MODEL,
          sourceLanguage: "auto",
          category: "general",
          glossary: value.glossary
        });
        selectedAiSources.delete(value.sourceToken);
        return { ok: true, data: job };
      } catch (error) {
        return { ok: false, code: error?.code || "TRANSLATION_JOB_START_FAILED" };
      }
    });

    ipcMain.handle("ai-localization:list-jobs", (event, gameId) => {
      assertTrustedWindow(event);
      if (typeof gameId !== "string" || gameId.length < 1 || gameId.length > 128) {
        return { ok: false, code: "INVALID_GAME_ID" };
      }
      return { ok: true, data: { jobs: aiLocalizationJobs.listForGame(gameId) } };
    });

    ipcMain.handle("ai-localization:resume", async (event, jobId) => {
      assertTrustedWindow(event);
      if (!jobId || typeof jobId !== "object" ||
          typeof jobId.jobId !== "string" || !/^[a-f0-9-]{36}$/iu.test(jobId.jobId) ||
          typeof jobId.idToken !== "string" || jobId.idToken.length < 100 || jobId.idToken.length > 16000) {
        return { ok: false, code: "INVALID_TRANSLATION_JOB" };
      }
      try {
        aiSessionIdToken = jobId.idToken;
        return { ok: true, data: await aiLocalizationJobs.resume(jobId.jobId) };
      } catch (error) {
        return { ok: false, code: error?.code || "TRANSLATION_JOB_RESUME_FAILED" };
      }
    });

    ipcMain.handle("ai-localization:cancel", (event, jobId) => {
      assertTrustedWindow(event);
      if (typeof jobId !== "string" || !/^[a-f0-9-]{36}$/iu.test(jobId)) {
        return { ok: false, code: "INVALID_TRANSLATION_JOB" };
      }
      return aiLocalizationJobs.cancel(jobId)
        ? { ok: true }
        : { ok: false, code: "TRANSLATION_JOB_NOT_RUNNING" };
    });

    ipcMain.handle("ai-localization:export", async (event, jobId) => {
      assertTrustedWindow(event);
      if (typeof jobId !== "string" || !/^[a-f0-9-]{36}$/iu.test(jobId)) {
        return { ok: false, code: "INVALID_TRANSLATION_JOB" };
      }
      let exported;
      try {
        exported = aiLocalizationJobs.export(jobId);
      } catch (error) {
        return { ok: false, code: error?.code || "LOCALIZATION_EXPORT_FAILED" };
      }
      const extension = exported.archive ? ".zip" : path.extname(exported.fileName).toLowerCase();
      const parsedName = path.basename(exported.fileName, extension);
      const result = await dialog.showSaveDialog(mainWindow, {
        title: "Export Arabic localization",
        defaultPath: path.join(app.getPath("downloads"), `${parsedName}.ar${extension}`),
        buttonLabel: "Export localization",
        filters: [{
          name: `${extension.slice(1).toUpperCase()} localization file`,
          extensions: [extension.slice(1)]
        }]
      });
      if (result.canceled || !result.filePath) return { ok: true, data: { canceled: true } };
      try {
        const destination = path.resolve(result.filePath);
        if (destination.toLowerCase() === path.resolve(exported.sourcePath).toLowerCase()) {
          return { ok: false, code: "CANNOT_OVERWRITE_SOURCE_FILE" };
        }
        try {
          const realDestination = await fs.realpath(destination);
          const realSource = await fs.realpath(exported.sourcePath);
          if (realDestination.toLowerCase() === realSource.toLowerCase()) {
            return { ok: false, code: "CANNOT_OVERWRITE_SOURCE_FILE" };
          }
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
        }
        const temporaryFile = path.join(
          path.dirname(destination),
          `.dreko-localization-${crypto.randomUUID()}.tmp`
        );
        try {
          if (exported.archive) {
            const currentArchiveStat = await fs.stat(exported.archive.sourceArchivePath);
            if (currentArchiveStat.size !== exported.archive.sourceSize ||
                currentArchiveStat.mtimeMs !== exported.archive.sourceModifiedAt) {
              return { ok: false, code: "LOCALIZATION_ARCHIVE_SOURCE_CHANGED" };
            }
            await createTranslatedZipArchive({
              extractedRoot: exported.archive.extractedRoot,
              translatedRelativePath: exported.archive.memberPath,
              translatedContents: exported.contents,
              destination: temporaryFile
            });
          } else {
            await fs.writeFile(temporaryFile, exported.contents, { flag: "wx", mode: 0o600 });
          }
          await fs.rename(temporaryFile, destination);
        } catch (error) {
          await fs.rm(temporaryFile, { force: true }).catch((cleanupError) => {
            console.error("Unable to clean up a temporary localization export:", cleanupError?.code || cleanupError?.name || "UNKNOWN");
          });
          throw error;
        }
        return { ok: true, data: { filePath: destination } };
      } catch (error) {
        console.error("Unable to export AI localization:", error?.code || error?.name || "UNKNOWN");
        return {
          ok: false,
          code: error?.code && /^[A-Z0-9_]+$/u.test(error.code)
            ? error.code
            : "LOCALIZATION_EXPORT_FAILED"
        };
      }
    });

    ipcMain.handle("games:list-installed", (event) => {
      assertTrustedWindow(event);
      try {
        const steamRoots = findSteamInstallRoots();
        return {
          ok: true,
          data: {
            games: discoverSteamGames(steamRoots),
            steamDetected: steamRoots.length > 0
          }
        };
      } catch (error) {
        console.error("Unable to scan installed Steam games:", error?.code || error?.name || "UNKNOWN");
        return { ok: false, code: "GAME_SCAN_FAILED" };
      }
    });

    ipcMain.handle("games:find-installed", async (event, gameTitle) => {
      assertTrustedWindow(event);
      if (typeof gameTitle !== "string" || !gameTitle.trim() || gameTitle.length > 120) {
        return { ok: false, code: "INVALID_GAME_TITLE" };
      }
      try {
        const steamRoots = findSteamInstallRoots();
        const epicGames = discoverEpicGameFolders(findEpicManifestRoots());
        const games = deduplicateInstalledGames([
          ...discoverSteamGames(steamRoots),
          ...discoverSteamGameFolders(steamRoots),
          ...epicGames
        ]);
        let match = matchInstalledGame(games, gameTitle);
        if (match.ambiguous) return { ok: false, code: "INSTALLED_GAME_MATCH_AMBIGUOUS" };
        let installPath = "";
        if (match.game?.installPath) {
          try {
            installPath = await fs.realpath(match.game.installPath);
            const folderStat = await fs.stat(installPath);
            if (!folderStat.isDirectory()) installPath = "";
          } catch (error) {
            if (error?.code !== "ENOENT" && error?.code !== "ENOTDIR") throw error;
          }
        }
        if (!installPath) {
          const localSearch = await findMatchingGameFolders(findLocalGameSearchRoots(), gameTitle);
          if (localSearch.searchLimited && localSearch.games.length) {
            return { ok: false, code: "GAME_SEARCH_LIMIT_REACHED" };
          }
          match = matchInstalledGame(
            deduplicateInstalledGames([...games, ...localSearch.games]),
            gameTitle
          );
          if (match.ambiguous) return { ok: false, code: "INSTALLED_GAME_MATCH_AMBIGUOUS" };
          if (!match.game?.installPath) {
            return {
              ok: false,
              code: localSearch.searchLimited ? "GAME_SEARCH_LIMIT_REACHED" : "INSTALLED_GAME_NOT_FOUND"
            };
          }
          installPath = await fs.realpath(match.game.installPath);
          const folderStat = await fs.stat(installPath);
          if (!folderStat.isDirectory()) return { ok: false, code: "INSTALLED_GAME_NOT_FOUND" };
        }
        return {
          ok: true,
          data: {
            title: match.game.title,
            installPath,
            platform: match.game.platform
          }
        };
      } catch (error) {
        if (error?.code === "ENOENT" || error?.code === "ENOTDIR") {
          return { ok: false, code: "INSTALLED_GAME_NOT_FOUND" };
        }
        console.error("Unable to detect installed game folder:", error?.code || error?.name || "UNKNOWN");
        return { ok: false, code: "GAME_SCAN_FAILED" };
      }
    });

    ipcMain.handle("games:choose-folder", async (event) => {
      assertTrustedWindow(event);
      const result = await dialog.showOpenDialog(mainWindow, {
        title: "Choose game installation folder",
        buttonLabel: "Select folder",
        properties: ["openDirectory"]
      });
      if (result.canceled) return { ok: true, data: { canceled: true } };
      const folderPath = result.filePaths[0];
      if (!folderPath) return { ok: false, code: "GAME_FOLDER_NOT_FOUND" };
      return { ok: true, data: { folderPath } };
    });

    const translationInstallStateFile = path.join(dataDirectory, "installed-translations.json");
    const translationBackupRoot = path.join(dataDirectory, "translation-backups");
    const sendTranslationInstallProgress = (jobId, progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("games:translation-install-progress", { jobId, ...progress });
      }
    };
    const validateInstallRequest = (value) => value &&
      typeof value === "object" &&
      /^[A-Za-z0-9-]{1,64}$/.test(value.translationId || "") &&
      /^[a-f0-9-]{36}$/i.test(value.jobId || "") &&
      typeof value.gameFolder === "string" &&
      value.gameFolder.length <= 2048;

    ipcMain.handle("games:translation-install", async (event, value) => {
      assertTrustedWindow(event);
      if (!validateInstallRequest(value)) return { ok: false, code: "INVALID_INSTALL_REQUEST" };
      const packageUrl = value.translationUrl
        ? validateDownloadUrl(value.translationUrl)
        : null;
      const installerProgramUrl = value.installerProgramUrl
        ? validateDownloadUrl(value.installerProgramUrl)
        : null;
      if ((!packageUrl && !installerProgramUrl) ||
          (value.translationUrl && !packageUrl) ||
          (value.installerProgramUrl && !installerProgramUrl)) {
        return { ok: false, code: "INVALID_DOWNLOAD_URL" };
      }
      if (activeTranslationInstalls.has(value.jobId)) {
        return { ok: false, code: "INSTALL_ALREADY_RUNNING" };
      }
      const job = {
        controller: new AbortController(),
        confirmation: null,
        child: null,
        cancelRequested: false
      };
      activeTranslationInstalls.set(value.jobId, job);
      let temporaryDirectory = "";
      let installedPackage = false;
      let gameFolder = "";
      try {
        gameFolder = await fs.realpath(value.gameFolder);
        const folderStat = await fs.stat(gameFolder);
        if (!folderStat.isDirectory()) return { ok: false, code: "INVALID_GAME_FOLDER" };
        temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "dreko-translation-"));
        let download = { downloadedBytes: 0, totalBytes: 0 };
        if (packageUrl) {
          const archivePath = path.join(temporaryDirectory, "translation-package");
          sendTranslationInstallProgress(value.jobId, { stage: "downloading", downloadedBytes: 0, totalBytes: null });
          download = await downloadToFile(packageUrl.href, archivePath, {
            signal: job.controller.signal,
            onProgress: (progress) => {
              if (!job.cancelRequested) {
                sendTranslationInstallProgress(value.jobId, { stage: "downloading", ...progress });
              }
            }
          });
          const header = await fs.open(archivePath, "r");
          let signature;
          try {
            signature = Buffer.alloc(8);
            await header.read(signature, 0, signature.length, 0);
          } finally {
            await header.close();
          }
          if (isExecutableFile(signature)) {
            return { ok: false, code: "EXECUTABLE_PACKAGE_NOT_SUPPORTED" };
          }
          if (!isZipFile(signature)) {
            return { ok: false, code: "INVALID_TRANSLATION_PACKAGE" };
          }

          const extractedDirectory = path.join(temporaryDirectory, "extracted");
          sendTranslationInstallProgress(value.jobId, { stage: "extracting", percent: 0 });
          const extracted = await extractZip(archivePath, extractedDirectory, (progress) => {
            if (!job.cancelRequested) {
              sendTranslationInstallProgress(value.jobId, { stage: "extracting", ...progress });
            }
          }, { signal: job.controller.signal });
          sendTranslationInstallProgress(value.jobId, { stage: "installing-files", completedFiles: 0, totalFiles: extracted.fileCount });
          await installExtractedFiles({
            extractedDirectory,
            gameFolder,
            translationId: value.translationId,
            stateFile: translationInstallStateFile,
            backupRoot: translationBackupRoot,
            signal: job.controller.signal,
            onProgress: (progress) => {
              if (!job.cancelRequested) {
                sendTranslationInstallProgress(value.jobId, { stage: "installing-files", ...progress });
              }
            }
          });
          installedPackage = true;
        }

        if (installerProgramUrl) {
          if (job.controller.signal.aborted) {
            throw Object.assign(new Error("INSTALL_CANCELLED"), { name: "AbortError" });
          }
          const installerPath = path.join(temporaryDirectory, "translation-installer.exe");
          sendTranslationInstallProgress(value.jobId, { stage: "downloading-installer", downloadedBytes: 0, totalBytes: null });
          await downloadToFile(installerProgramUrl.href, installerPath, {
            signal: job.controller.signal,
            onProgress: (progress) => {
              if (!job.cancelRequested) {
                sendTranslationInstallProgress(value.jobId, { stage: "downloading-installer", ...progress });
              }
            }
          });
          const installerHeader = await fs.open(installerPath, "r");
          let installerSignature;
          try {
            installerSignature = Buffer.alloc(2);
            await installerHeader.read(installerSignature, 0, installerSignature.length, 0);
          } finally {
            await installerHeader.close();
          }
          if (!isExecutableFile(installerSignature)) {
            throw Object.assign(new Error("INVALID_INSTALLER_PROGRAM"), { code: "INVALID_INSTALLER_PROGRAM" });
          }
          if (process.platform !== "win32") {
            throw Object.assign(new Error("INSTALLER_PROGRAM_REQUIRES_WINDOWS"), { code: "INSTALLER_PROGRAM_REQUIRES_WINDOWS" });
          }
          let installerName = "Translation installer.exe";
          try {
            installerName = decodeURIComponent(path.basename(installerProgramUrl.pathname)) || installerName;
          } catch {}
          sendTranslationInstallProgress(value.jobId, {
            stage: "installer-confirmation",
            installerName: installerName.slice(0, 120)
          });
          const confirmed = await new Promise((resolve) => {
            job.confirmation = resolve;
            if (job.controller.signal.aborted) {
              job.confirmation = null;
              resolve(false);
            }
          });
          job.confirmation = null;
          if (!confirmed) {
            throw Object.assign(new Error("INSTALLER_CANCELLED"), { code: "INSTALLER_CANCELLED" });
          }
          sendTranslationInstallProgress(value.jobId, { stage: "running-installer" });
          await new Promise((resolve, reject) => {
            const child = spawn(installerPath, [], {
              cwd: gameFolder,
              windowsHide: false,
              shell: false,
              stdio: "ignore"
            });
            job.child = child;
            child.once("error", reject);
            child.once("exit", (code, signal) => {
              if (code === 0) resolve();
              else reject(Object.assign(new Error("INSTALLER_PROGRAM_FAILED"), {
                code: signal ? "INSTALLER_PROGRAM_CANCELLED" : "INSTALLER_PROGRAM_FAILED"
              }));
            });
          });
          job.child = null;
        }
        if (!packageUrl && installerProgramUrl) {
          await recordExternalInstallerInstallation({
            translationId: value.translationId,
            gameFolder,
            stateFile: translationInstallStateFile
          });
        }
        const record = await getInstallRecord({
          translationId: value.translationId,
          gameFolder,
          stateFile: translationInstallStateFile
        });
        sendTranslationInstallProgress(value.jobId, {
          stage: "completed",
          downloadedBytes: download.downloadedBytes,
          totalBytes: download.totalBytes,
          installedFiles: record?.files.length || 0
        });
        return {
          ok: true,
          data: {
            downloadedBytes: download.downloadedBytes,
            installedFiles: record?.files.length || 0
          }
        };
      } catch (error) {
        let rollbackFailed = false;
        if (installedPackage) {
          try {
            const rollback = await removeInstalledTranslation({
              translationId: value.translationId,
              gameFolder,
              stateFile: translationInstallStateFile
            });
            if (!rollback.removed) {
              throw Object.assign(new Error("INSTALL_ROLLBACK_FAILED"), { code: "INSTALL_ROLLBACK_FAILED" });
            }
          } catch (rollbackError) {
            rollbackFailed = true;
            console.error("Unable to roll back a failed translation installation:", rollbackError?.code || rollbackError?.name || "UNKNOWN");
          }
        }
        const code = rollbackFailed
          ? "INSTALL_ROLLBACK_FAILED"
          : job.controller.signal.aborted || error?.name === "AbortError"
            ? "INSTALL_CANCELLED"
            : error?.code || "TRANSLATION_INSTALL_FAILED";
        console.error("Translation installation failed:", code);
        sendTranslationInstallProgress(value.jobId, { stage: "failed", code });
        return { ok: false, code };
      } finally {
        job.confirmation?.(false);
        if (job.child && !job.child.killed) job.child.kill();
        activeTranslationInstalls.delete(value.jobId);
        if (temporaryDirectory) {
          await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch((error) => {
            console.error("Unable to clean up temporary translation files:", error?.code || error?.name || "UNKNOWN");
          });
        }
      }
    });

    ipcMain.handle("games:confirm-translation-installer", (event, value) => {
      assertTrustedWindow(event);
      if (!value || !/^[a-f0-9-]{36}$/i.test(value.jobId || "") || typeof value.run !== "boolean") {
        return { ok: false, code: "INVALID_INSTALLER_CONFIRMATION" };
      }
      const job = activeTranslationInstalls.get(value.jobId);
      if (!job?.confirmation) return { ok: false, code: "INSTALLER_CONFIRMATION_EXPIRED" };
      job.confirmation(value.run);
      job.confirmation = null;
      return { ok: true };
    });

    ipcMain.handle("games:cancel-translation-install", (event, jobId) => {
      assertTrustedWindow(event);
      if (typeof jobId !== "string") return { ok: false, code: "INVALID_INSTALL_JOB" };
      const job = activeTranslationInstalls.get(jobId);
      if (!job) return { ok: false, code: "INSTALL_JOB_NOT_FOUND" };
      if (job.cancelRequested) return { ok: true, data: { cancelling: true } };
      job.cancelRequested = true;
      sendTranslationInstallProgress(jobId, { stage: "cancelling" });
      job.controller.abort();
      job.confirmation?.(false);
      if (job.child && !job.child.killed) job.child.kill();
      return { ok: true };
    });

    ipcMain.handle("games:translation-install-status", async (event, value) => {
      assertTrustedWindow(event);
      if (!value || !/^[A-Za-z0-9-]{1,64}$/.test(value.translationId || "") ||
          typeof value.gameFolder !== "string" || value.gameFolder.length > 2048) {
        return { ok: false, code: "INVALID_INSTALL_STATUS_REQUEST" };
      }
      try {
        const record = await getInstallRecord({
          translationId: value.translationId,
          gameFolder: value.gameFolder,
          stateFile: translationInstallStateFile
        });
        return {
          ok: true,
          data: {
            installed: Boolean(record),
            externalInstaller: record?.kind === "external-installer"
          }
        };
      } catch (error) {
        console.error("Unable to read translation installation status:", error?.code || error?.name || "UNKNOWN");
        return { ok: false, code: "INSTALL_STATUS_UNAVAILABLE" };
      }
    });

    ipcMain.handle("games:record-external-translation-installed", async (event, value) => {
      assertTrustedWindow(event);
      if (!value || !/^[A-Za-z0-9-]{1,64}$/.test(value.translationId || "") ||
          typeof value.gameFolder !== "string" || value.gameFolder.length > 2048) {
        return { ok: false, code: "INVALID_INSTALL_STATUS_REQUEST" };
      }
      try {
        const gameFolder = await fs.realpath(value.gameFolder);
        const folderStat = await fs.stat(gameFolder);
        if (!folderStat.isDirectory()) return { ok: false, code: "INVALID_GAME_FOLDER" };
        await recordExternalInstallerInstallation({
          translationId: value.translationId,
          gameFolder,
          stateFile: translationInstallStateFile
        });
        return { ok: true };
      } catch (error) {
        console.error("Unable to record external translation installation:", error?.code || error?.name || "UNKNOWN");
        return { ok: false, code: error?.code || "INSTALL_STATUS_UNAVAILABLE" };
      }
    });

    ipcMain.handle("games:remove-translation", async (event, value) => {
      assertTrustedWindow(event);
      if (!value || !/^[A-Za-z0-9-]{1,64}$/.test(value.translationId || "") ||
          typeof value.gameFolder !== "string" || value.gameFolder.length > 2048) {
        return { ok: false, code: "INVALID_REMOVE_REQUEST" };
      }
      try {
        const result = await removeInstalledTranslation({
          translationId: value.translationId,
          gameFolder: value.gameFolder,
          stateFile: translationInstallStateFile,
          confirmExternalUninstall: value.confirmExternalUninstall === true
        });
        return { ok: true, data: result };
      } catch (error) {
        console.error("Unable to remove installed translation:", error?.code || error?.name || "UNKNOWN");
        return { ok: false, code: error?.code || "TRANSLATION_REMOVE_FAILED" };
      }
    });

    ipcMain.handle("games:launch-installed", async (event, gameFolder) => {
      assertTrustedWindow(event);
      if (typeof gameFolder !== "string" || gameFolder.length > 2048) {
        return { ok: false, code: "INVALID_GAME_FOLDER" };
      }
      try {
        const targetFolder = await fs.realpath(gameFolder);
        const steamGame = discoverSteamGames(findSteamInstallRoots()).find((game) =>
          game.installPath && path.resolve(game.installPath).toLowerCase() === targetFolder.toLowerCase()
        );
        if (steamGame) {
          await shell.openExternal(`steam://run/${steamGame.appId}`);
          return { ok: true, data: { launched: true } };
        }
        const error = await shell.openPath(targetFolder);
        if (error) return { ok: false, code: "GAME_FOLDER_OPEN_FAILED" };
        return { ok: true, data: { launched: false } };
      } catch (error) {
        console.error("Unable to launch installed game:", error?.code || error?.name || "UNKNOWN");
        return { ok: false, code: "GAME_LAUNCH_FAILED" };
      }
    });

    ipcMain.handle("discord:config", async (event) => {
      assertTrustedWindow(event);
      const result = await requestDiscordService("/v1/desktop/config");
      if (!result.ok) return result;
      discordInviteUrl = safeDiscordInviteUrl(result.data.inviteUrl);
      return {
        ok: true,
        data: {
          ready: result.data.ready === true,
          clientId: typeof result.data.clientId === "string" &&
              /^\d{17,20}$/.test(result.data.clientId)
            ? result.data.clientId
            : discordApplicationId,
          code: result.data.code === "AUTH_SERVER_NOT_CONFIGURED"
            ? result.data.code
            : "",
          setupIssues: Array.isArray(result.data.setupIssues)
            ? result.data.setupIssues.filter((issue) => [
              "DISCORD_CLIENT_ID",
              "DISCORD_CLIENT_SECRET",
              "DISCORD_BOT_TOKEN",
              "DISCORD_INVITE_URL",
              "DISCORD_GUILD_ID",
              "DISCORD_REDIRECT_URI",
              "DISCORD_BOT_TOKEN_INVALID",
              "DISCORD_BOT_CHECK_FAILED",
              "DISCORD_APPLICATION_CHECK_FAILED",
              "DISCORD_CLIENT_ID_MISMATCH",
              "DISCORD_BOT_GUILD_ACCESS_REQUIRED",
              "DISCORD_GUILD_CHECK_FAILED",
              "DISCORD_CONFIGURATION_CHECK_FAILED",
              "FIREBASE_ADMIN_CREDENTIALS"
            ].includes(issue))
            : [],
          guildName: String(result.data.guildName || "").slice(0, 80),
          inviteAvailable: Boolean(discordInviteUrl)
        }
      };
    });

    ipcMain.handle("discord:start-login", async (event) => {
      assertTrustedWindow(event);
      const result = await requestDiscordService("/v1/desktop/sessions", { method: "POST" });
      if (!result.ok) return result;
      const sessionId = result.data.sessionId;
      let authorizationUrl;
      try {
        authorizationUrl = new URL(result.data.authorizationUrl);
      } catch {
        return { ok: false, code: "INVALID_AUTHORIZATION_URL" };
      }
      if (!/^[a-f0-9-]{36}$/i.test(sessionId || "") ||
          authorizationUrl.protocol !== "https:" ||
          authorizationUrl.hostname !== "discord.com" ||
          authorizationUrl.pathname !== "/oauth2/authorize" ||
          authorizationUrl.searchParams.get("response_type") !== "code") {
        return { ok: false, code: "INVALID_AUTHORIZATION_URL" };
      }
      try {
        await shell.openExternal(authorizationUrl.href);
      } catch (error) {
        console.error("Unable to open Discord authorization:", error?.name || "UNKNOWN");
        return { ok: false, code: "DISCORD_BROWSER_UNAVAILABLE" };
      }
      return { ok: true, data: { sessionId } };
    });

    ipcMain.handle("discord:poll-login", async (event, sessionId) => {
      assertTrustedWindow(event);
      if (typeof sessionId !== "string" || !/^[a-f0-9-]{36}$/i.test(sessionId)) {
        return { ok: false, code: "INVALID_AUTH_SESSION" };
      }
      return requestDiscordService(`/v1/desktop/sessions/${encodeURIComponent(sessionId)}`);
    });

    ipcMain.handle("discord:verify-membership", async (event, idToken) => {
      assertTrustedWindow(event);
      if (typeof idToken !== "string" || idToken.length > 16000) {
        return { ok: false, code: "INVALID_FIREBASE_TOKEN" };
      }
      return requestDiscordService("/v1/desktop/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json"
        },
        body: "{}"
      });
    });

    ipcMain.handle("discord:open-invite", async (event) => {
      assertTrustedWindow(event);
      const invite = safeDiscordInviteUrl(discordInviteUrl);
      if (!invite) return { ok: false, code: "DISCORD_INVITE_UNAVAILABLE" };
      try {
        await shell.openExternal(invite);
        return { ok: true };
      } catch (error) {
        console.error("Unable to open the Discord invitation:", error?.name || "UNKNOWN");
        return { ok: false, code: "DISCORD_BROWSER_UNAVAILABLE" };
      }
    });

    ipcMain.handle("translation:open-link", async (event, value) => {
      assertTrustedWindow(event);
      if (typeof value !== "string" || value.length > 2048) {
        return { ok: false, code: "INVALID_TRANSLATION_URL" };
      }
      let target;
      try {
        target = new URL(value);
      } catch {
        return { ok: false, code: "INVALID_TRANSLATION_URL" };
      }
      if (target.protocol !== "https:" || !target.hostname ||
          target.username || target.password) {
        return { ok: false, code: "INVALID_TRANSLATION_URL" };
      }
      try {
        await shell.openExternal(target.href);
        return { ok: true };
      } catch (error) {
        console.error("Unable to open the translation download link:", error?.name || "UNKNOWN");
        return { ok: false, code: "EXTERNAL_LINK_UNAVAILABLE" };
      }
    });

    ipcMain.handle("admin:image-search-config", async (event, idToken) => {
      assertTrustedWindow(event);
      if (typeof idToken !== "string" || idToken.length > 16000) {
        return { ok: false, code: "INVALID_FIREBASE_TOKEN" };
      }
      const result = await requestDiscordService("/v1/desktop/image-search/config", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      return result.ok ? result.data : result;
    });

    ipcMain.handle("admin:search-game-artwork", async (event, value) => {
      assertTrustedWindow(event);
      if (!value || typeof value.query !== "string" ||
          value.query.trim().length < 1 || value.query.trim().length > 100 ||
          typeof value.idToken !== "string" || value.idToken.length > 16000) {
        return { ok: false, code: "INVALID_SEARCH_QUERY" };
      }
      const result = await requestDiscordService("/v1/desktop/image-search/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${value.idToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: value.query })
      }, 60000);
      return result.ok ? result.data : result;
    });

    ipcMain.handle("admin:download-game-artwork", async (event, value) => {
      assertTrustedWindow(event);
      const imageUrl = trustedImageUrl(value);
      if (!imageUrl) return { ok: false, code: "INVALID_ARTWORK_URL" };
      return downloadArtworkFromUrl(
        imageUrl,
        (responseUrl) => trustedImageUrl(responseUrl) === imageUrl
      );
    });

    ipcMain.handle("admin:download-cover-from-url", async (event, value) => {
      assertTrustedWindow(event);
      const imageUrl = await validateExternalArtworkUrl(value);
      if (!imageUrl) return { ok: false, code: "INVALID_ARTWORK_URL" };
      return downloadArtworkFromUrl(imageUrl, (responseUrl) => responseUrl === imageUrl);
    });

    ipcMain.handle("admin:choose-cover", async (event) => {
      assertTrustedWindow(event);

      const result = await dialog.showOpenDialog(mainWindow, {
        title: "Choose game artwork",
        buttonLabel: "Use artwork",
        properties: ["openFile"],
        filters: [{ name: "Game artwork", extensions: ["png", "jpg", "jpeg", "webp"] }]
      });
      if (result.canceled) return { ok: true, data: { canceled: true } };
      const chosenFile = result.filePaths[0];
      if (!chosenFile) return { ok: false, code: "COVER_NOT_FOUND" };

      const stat = await fs.stat(chosenFile);
      if (!stat.isFile() || stat.size < 1 || stat.size > COVER_SIZE_LIMIT) {
        return { ok: false, code: "COVER_SIZE_LIMIT" };
      }

      const contents = await fs.readFile(chosenFile);
      const extension = detectArtworkExtension(contents);
      if (!extension) return { ok: false, code: "UNSUPPORTED_COVER" };

      return { ok: true, data: createArtworkResult(contents, extension) };
    });

    createTray();
    void connectDiscordPresence();
    createMainWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  }).catch((error) => {
    console.error("Unable to start Dreko Translation:", error);
    app.exit(1);
  });

  app.on("second-instance", () => {
    console.info("A second Dreko Translation launch was blocked.");
    showAlreadyRunningNotice();
  });

  app.on("before-quit", () => {
    isQuitting = true;
    if (discordPresenceRetry) clearTimeout(discordPresenceRetry);
    if (discordPresenceClient) {
      const client = discordPresenceClient;
      discordPresenceClient = null;
      void client.clearActivity().finally(() => client.destroy());
    }
    if (!database) return;
    database.close();
    database = null;
  });
}
