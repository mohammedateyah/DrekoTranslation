const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("drekoDesktop", Object.freeze({
  bootstrap: () => ipcRenderer.invoke("dreko:bootstrap"),
  listInstalledGames: () => ipcRenderer.invoke("games:list-installed"),
  findInstalledGame: (gameTitle) => ipcRenderer.invoke("games:find-installed", gameTitle),
  chooseGameFolder: () => ipcRenderer.invoke("games:choose-folder"),
  installTranslationPackage: (request) => ipcRenderer.invoke("games:translation-install", request),
  confirmTranslationInstaller: (jobId, run) =>
    ipcRenderer.invoke("games:confirm-translation-installer", { jobId, run }),
  cancelTranslationInstall: (jobId) => ipcRenderer.invoke("games:cancel-translation-install", jobId),
  getTranslationInstallStatus: (translationId, gameFolder) =>
    ipcRenderer.invoke("games:translation-install-status", { translationId, gameFolder }),
  recordExternalTranslationInstalled: (translationId, gameFolder) =>
    ipcRenderer.invoke("games:record-external-translation-installed", { translationId, gameFolder }),
  scanGameFolderForLocalization: (gameFolder, gameTitle) =>
    ipcRenderer.invoke("ai-localization:scan-game-folder", { gameFolder, gameTitle }),
  startAiLocalization: (request) => ipcRenderer.invoke("ai-localization:start", request),
  listAiLocalizationJobs: (gameId) => ipcRenderer.invoke("ai-localization:list-jobs", gameId),
  resumeAiLocalizationJob: (jobId, idToken) =>
    ipcRenderer.invoke("ai-localization:resume", { jobId, idToken }),
  cancelAiLocalizationJob: (jobId) => ipcRenderer.invoke("ai-localization:cancel", jobId),
  exportAiLocalizationJob: (jobId) => ipcRenderer.invoke("ai-localization:export", jobId),
  removeInstalledTranslation: (translationId, gameFolder, confirmExternalUninstall = false) =>
    ipcRenderer.invoke("games:remove-translation", {
      translationId,
      gameFolder,
      confirmExternalUninstall
    }),
  launchInstalledGame: (gameFolder) => ipcRenderer.invoke("games:launch-installed", gameFolder),
  chooseCover: () => ipcRenderer.invoke("admin:choose-cover"),
  getImageSearchConfig: (idToken) => ipcRenderer.invoke("admin:image-search-config", idToken),
  searchGameArtwork: (query, idToken) => ipcRenderer.invoke("admin:search-game-artwork", { query, idToken }),
  downloadGameArtwork: (url) => ipcRenderer.invoke("admin:download-game-artwork", url),
  downloadCoverFromUrl: (url) => ipcRenderer.invoke("admin:download-cover-from-url", url),
  getDiscordConfig: () => ipcRenderer.invoke("discord:config"),
  startDiscordLogin: () => ipcRenderer.invoke("discord:start-login"),
  pollDiscordLogin: (sessionId) => ipcRenderer.invoke("discord:poll-login", sessionId),
  verifyDiscordMembership: (idToken) => ipcRenderer.invoke("discord:verify-membership", idToken),
  openDiscordInvite: () => ipcRenderer.invoke("discord:open-invite"),
  openTranslationLink: (url) => ipcRenderer.invoke("translation:open-link", url),
  checkForUpdates: () => ipcRenderer.invoke("updates:check"),
  installUpdate: () => ipcRenderer.invoke("updates:install"),
  onUpdateStatus: (callback) => {
    if (typeof callback !== "function") throw new TypeError("Update callback must be a function.");
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("updates:status", listener);
    return () => ipcRenderer.removeListener("updates:status", listener);
  },
  onTranslationInstallProgress: (callback) => {
    if (typeof callback !== "function") throw new TypeError("Translation install callback must be a function.");
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on("games:translation-install-progress", listener);
    return () => ipcRenderer.removeListener("games:translation-install-progress", listener);
  },
  onAiLocalizationProgress: (callback) => {
    if (typeof callback !== "function") throw new TypeError("AI localization callback must be a function.");
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on("ai-localization:progress", listener);
    return () => ipcRenderer.removeListener("ai-localization:progress", listener);
  }
}));
