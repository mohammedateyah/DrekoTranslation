const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("drekoDesktop", Object.freeze({
  bootstrap: () => ipcRenderer.invoke("dreko:bootstrap"),
  listInstalledGames: () => ipcRenderer.invoke("games:list-installed"),
  chooseGameFolder: () => ipcRenderer.invoke("games:choose-folder"),
  installTranslationPackage: (request) => ipcRenderer.invoke("games:translation-install", request),
  confirmTranslationInstaller: (jobId, run) =>
    ipcRenderer.invoke("games:confirm-translation-installer", { jobId, run }),
  cancelTranslationInstall: (jobId) => ipcRenderer.invoke("games:cancel-translation-install", jobId),
  getTranslationInstallStatus: (translationId, gameFolder) =>
    ipcRenderer.invoke("games:translation-install-status", { translationId, gameFolder }),
  removeInstalledTranslation: (translationId, gameFolder) =>
    ipcRenderer.invoke("games:remove-translation", { translationId, gameFolder }),
  launchInstalledGame: (gameFolder) => ipcRenderer.invoke("games:launch-installed", gameFolder),
  chooseCover: () => ipcRenderer.invoke("admin:choose-cover"),
  getImageSearchConfig: (idToken) => ipcRenderer.invoke("admin:image-search-config", idToken),
  searchGameArtwork: (query, idToken) => ipcRenderer.invoke("admin:search-game-artwork", { query, idToken }),
  downloadGameArtwork: (url) => ipcRenderer.invoke("admin:download-game-artwork", url),
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
  }
}));
