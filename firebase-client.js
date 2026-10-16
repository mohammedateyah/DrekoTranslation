import { initializeApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithCustomToken,
  signOut
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBZ70J3x5x8HHG8vho-16yWjWFWQkF3vJs",
  authDomain: "drekotranslation.firebaseapp.com",
  projectId: "drekotranslation",
  storageBucket: "drekotranslation.firebasestorage.app",
  messagingSenderId: "901080861860",
  appId: "1:901080861860:web:bb598e7298891a7ee5ea31"
};

const DISCORD_GUILD_ID = "766985465323716649";
const DISCORD_USER_ID_PATTERN = /^\d{17,20}$/;

const BUILT_IN_COVERS = new Set([
  "astral-observer",
  "paper-moon",
  "last-orchard",
  "velvet-noir",
  "nocturne",
  "lantern-keep",
  "city-of-glass",
  "forgotten-passage",
  "clockwork-cafe",
  "midnight-repairs",
  "wilds",
  "quiet-thunder"
]);
const CATEGORIES = new Set(["full", "interface"]);
const STATUSES = new Set(["ready", "progress"]);
const VISIBILITIES = new Set(["published", "draft"]);
const REPORT_UPDATE_STATUSES = new Set(["yes", "no", "unsure"]);
const REPORT_ISSUE_TYPES = new Set([
  "translation",
  "missing",
  "display",
  "font",
  "language",
  "crash",
  "install",
  "other"
]);
const GENRES = new Set([
  "adventure",
  "action",
  "rpg",
  "horror",
  "simulator",
  "puzzle",
  "strategy",
  "other"
]);
const TEXT_LIMITS = {
  title: 100,
  titleEn: 100,
  developer: 80,
  genre: 36,
  packageVersion: 32,
  description: 1000
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const authPersistenceReady = setPersistence(auth, indexedDBLocalPersistence).catch(async (error) => {
  if (error?.code !== "auth/unsupported-persistence-type") throw error;
  console.warn("IndexedDB auth persistence is unavailable; falling back to browser local persistence.");
  await setPersistence(auth, browserLocalPersistence);
});
const storage = getStorage(app);
const database = getFirestore(app);

function normalizeTimestamp(value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : new Date().toISOString();
}

function nullableTimestamp(value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

function accountFromSnapshot(snapshot) {
  const value = snapshot.data();
  return {
    id: snapshot.id,
    discordUserId: value.discordUserId,
    username: value.username || "",
    avatar: value.avatar || "",
    accountType: value.accountType === "premium" ? "premium" : "standard",
    premiumExpiresAt: nullableTimestamp(value.premiumExpiresAt),
    createdAt: normalizeTimestamp(value.createdAt),
    lastLoginAt: normalizeTimestamp(value.lastLoginAt)
  };
}

function compareUpdatedAt(left, right) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime() ||
    left.id.localeCompare(right.id);
}

function compareTranslationOrder(left, right) {
  if (Number.isFinite(left.sortOrder) && Number.isFinite(right.sortOrder)) {
    return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id);
  }
  return compareUpdatedAt(left, right);
}

function translationFromSnapshot(snapshot) {
  const value = snapshot.data();
  return {
    ...value,
    id: snapshot.id,
    premium: value.premium === true,
    titleEn: value.titleEn || value.title_en || "",
    updatedAt: normalizeTimestamp(value.updatedAt)
  };
}

function translationRequestFromSnapshot(snapshot) {
  const value = snapshot.data();
  return {
    id: snapshot.id,
    uid: value.uid,
    discordUserId: value.discordUserId || "",
    username: value.username || "",
    avatar: value.avatar || "",
    gameName: value.gameName || "",
    steamAppId: value.steamAppId || "",
    platform: value.platform || "Steam",
    status: value.status || "pending",
    createdAt: normalizeTimestamp(value.createdAt)
  };
}

function translationReportFromSnapshot(snapshot) {
  const value = snapshot.data();
  return {
    id: snapshot.id,
    uid: value.uid || "",
    discordUserId: value.discordUserId || "",
    username: value.username || "",
    avatar: value.avatar || "",
    translationId: value.translationId || "",
    gameName: value.gameName || "",
    latestUpdate: value.latestUpdate || "unsure",
    issueType: value.issueType || "other",
    details: value.details || "",
    status: value.status === "resolved" ? "resolved" : "pending",
    createdAt: normalizeTimestamp(value.createdAt),
    resolvedAt: nullableTimestamp(value.resolvedAt),
    resolvedBy: value.resolvedBy || ""
  };
}

function translationTitleKey(value) {
  return typeof value === "string"
    ? value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, "")
    : "";
}

function requireAdministrator(user = auth.currentUser) {
  if (!user) {
    const error = new Error("ADMIN_REQUIRED");
    error.code = "ADMIN_REQUIRED";
    throw error;
  }
  return getDoc(doc(database, "administrators", user.uid)).then((snapshot) => {
    if (!snapshot.exists() || snapshot.data().enabled !== true) {
      const error = new Error("ADMIN_REQUIRED");
      error.code = "ADMIN_REQUIRED";
      throw error;
    }
    return user;
  });
}

function isStorageCover(cover) {
  return typeof cover === "string" && cover.startsWith("storage:covers/");
}

function firestoreCoverId(cover) {
  if (typeof cover !== "string" || !cover.startsWith("firestore:covers/")) return null;
  const coverId = cover.slice("firestore:covers/".length);
  if (!/^[A-Za-z0-9-]{36}$/.test(coverId)) {
    const error = new Error("INVALID_COVER");
    error.code = "INVALID_COVER";
    throw error;
  }
  return coverId;
}

function normalizeTranslationUrl(value) {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate) return "";
  if (candidate.length > 2048) {
    const error = new Error("INVALID_TRANSLATION_URL");
    error.code = error.message;
    throw error;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
      throw new Error("INVALID_TRANSLATION_URL");
    }
    return url.href;
  } catch {
    const error = new Error("INVALID_TRANSLATION_URL");
    error.code = error.message;
    throw error;
  }
}

function coverStoragePath(cover) {
  if (!isStorageCover(cover)) return null;
  const storagePath = cover.slice("storage:".length);
  if (!/^covers\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9-]{1,64}\/[A-Za-z0-9._-]{1,128}$/.test(storagePath)) {
    const error = new Error("INVALID_COVER");
    error.code = "INVALID_COVER";
    throw error;
  }
  return storagePath;
}

function isRemoteCoverUrl(value) {
  if (typeof value !== "string" || value.length < 10 || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function normalizeTranslation(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    const error = new Error("INVALID_TRANSLATION");
    error.code = "INVALID_TRANSLATION";
    throw error;
  }

  const record = {
    title: typeof input.title === "string" ? input.title.normalize("NFKC").trim() : "",
    titleEn: typeof input.titleEn === "string" ? input.titleEn.normalize("NFKC").trim() : "",
    developer: typeof input.developer === "string" ? input.developer.normalize("NFKC").trim() : "",
    genre: typeof input.genre === "string" ? input.genre : "",
    category: input.category,
    status: input.status,
    visibility: input.visibility,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : null,
    premium: input.premium === true,
    year: input.year,
    popularity: input.popularity ?? 0,
    translationUrl: normalizeTranslationUrl(input.translationUrl),
    installerProgramUrl: normalizeTranslationUrl(input.installerProgramUrl),
    packageVersion: typeof input.packageVersion === "string" ? input.packageVersion.normalize("NFKC").trim() : "",
    cover: typeof input.cover === "string" ? input.cover : "",
    description: typeof input.description === "string"
      ? input.description.normalize("NFKC").trim()
      : ""
  };

  for (const [field, maxLength] of Object.entries(TEXT_LIMITS)) {
    const value = record[field];
    const minLength = ["description", "packageVersion"].includes(field) ? 0 : 1;
    if (typeof value !== "string" || value.length < minLength || value.length > maxLength) {
      const error = new Error(field === "titleEn" ? "TITLE_EN_REQUIRED" : field === "description"
        ? "DESCRIPTION_TOO_LONG"
        : field === "developer" ? "DEVELOPER_REQUIRED" : field === "genre"
          ? "GENRE_REQUIRED" : "TITLE_REQUIRED");
      error.code = field === "titleEn" ? "TITLE_EN_REQUIRED" : field === "description"
        ? "DESCRIPTION_TOO_LONG"
        : field === "developer" ? "DEVELOPER_REQUIRED" : field === "genre"
          ? "GENRE_REQUIRED" : "TITLE_REQUIRED";
      throw error;
    }
  }

  if (!GENRES.has(record.genre)) {
    const error = new Error("GENRE_REQUIRED");
    error.code = "GENRE_REQUIRED";
    throw error;
  }
  if (!CATEGORIES.has(record.category)) {
    const error = new Error("INVALID_CATEGORY");
    error.code = "INVALID_CATEGORY";
    throw error;
  }
  if (!STATUSES.has(record.status)) {
    const error = new Error("INVALID_STATUS");
    error.code = "INVALID_STATUS";
    throw error;
  }
  if (!VISIBILITIES.has(record.visibility)) {
    const error = new Error("INVALID_VISIBILITY");
    error.code = "INVALID_VISIBILITY";
    throw error;
  }
  if ((!BUILT_IN_COVERS.has(record.cover) &&
       !isStorageCover(record.cover) &&
       !record.cover.startsWith("firestore:covers/") &&
       !isRemoteCoverUrl(record.cover)) ||
      (isStorageCover(record.cover) && !coverStoragePath(record.cover)) ||
      (record.cover.startsWith("firestore:covers/") && !firestoreCoverId(record.cover))) {
    const error = new Error("INVALID_COVER");
    error.code = "INVALID_COVER";
    throw error;
  }
  if (!Number.isSafeInteger(record.year) || record.year < 1970 || record.year > 2200) {
    const error = new Error("INVALID_YEAR");
    error.code = "INVALID_YEAR";
    throw error;
  }
  if (!Number.isSafeInteger(record.popularity) || record.popularity < 0 ||
      record.popularity > 100_000_000) {
    const error = new Error("INVALID_POPULARITY");
    error.code = "INVALID_POPULARITY";
    throw error;
  }

  return record;
}

async function collectUnreferencedCover(cover, user, excludedId = null) {
  const storagePath = coverStoragePath(cover);
  const coverId = firestoreCoverId(cover);
  if (!storagePath && !coverId) return;

  const references = await getDocs(query(
    collection(database, "translations"),
    where("cover", "==", cover),
    limit(2)
  ));
  if (references.docs.some((snapshot) => snapshot.id !== excludedId)) return;

  if (storagePath) {
    const ownerUid = storagePath.split("/")[1];
    if (ownerUid !== user.uid) return;
    await deleteObject(ref(storage, storagePath));
    return;
  }

  const coverReference = doc(database, "translationCovers", coverId);
  const coverSnapshot = await getDoc(coverReference);
  if (!coverSnapshot.exists() || coverSnapshot.data().uploadedBy !== user.uid) return;
  await deleteDoc(coverReference);
}

export function currentUser() {
  return auth.currentUser;
}

export async function waitForAuthentication() {
  await authPersistenceReady;
  await auth.authStateReady();
}

export function onUserChanged(callback, onError) {
  return onAuthStateChanged(auth, callback, onError);
}

export async function isDiscordGuildMember(user) {
  if (!user) return false;
  const token = await user.getIdTokenResult();
  const discordUserId = token.claims.discordUserId;
  return token.claims.discordGuildMember === true
    && token.claims.discordGuildId === DISCORD_GUILD_ID
    && typeof discordUserId === "string"
    && DISCORD_USER_ID_PATTERN.test(discordUserId)
    && user.uid === `discord_${discordUserId}`;
}

export async function signInWithDiscordToken(customToken) {
  await authPersistenceReady;
  if (typeof customToken !== "string" || customToken.length > 12000) {
    const error = new Error("INVALID_DISCORD_TOKEN");
    error.code = "INVALID_DISCORD_TOKEN";
    throw error;
  }
  const credentials = await signInWithCustomToken(auth, customToken);
  if (!await isDiscordGuildMember(credentials.user)) {
    await signOut(auth);
    const error = new Error("GUILD_MEMBERSHIP_REQUIRED");
    error.code = error.message;
    throw error;
  }
  return credentials.user;
}

export function isAdministrator(user) {
  return requireAdministrator(user).then(() => true, (error) => {
    if (error.code === "ADMIN_REQUIRED") return false;
    throw error;
  });
}

export async function saveDiscordAccount(user = auth.currentUser, { recordLogin = false } = {}) {
  if (!user || !await isDiscordGuildMember(user)) {
    const error = new Error("GUILD_MEMBERSHIP_REQUIRED");
    error.code = error.message;
    throw error;
  }

  try {
    const token = await user.getIdTokenResult();
    const discordUserId = token.claims.discordUserId;
    if (typeof discordUserId !== "string" || !DISCORD_USER_ID_PATTERN.test(discordUserId)) {
      const error = new Error("INVALID_DISCORD_USER");
      error.code = error.message;
      throw error;
    }

    const accountReference = doc(database, "accounts", user.uid);
    const existing = await getDoc(accountReference);
    const previous = existing.exists() ? existing.data() : null;
    const username = String(token.claims.discordUsername || "").slice(0, 80);
    const avatar = String(token.claims.discordAvatar || "").slice(0, 128);
    if (previous && !recordLogin &&
        previous.discordUserId === discordUserId &&
        previous.username === username &&
        previous.avatar === avatar &&
        previous.guildId === DISCORD_GUILD_ID) return accountFromSnapshot(existing);

    const accountData = {
      discordUserId,
      username,
      avatar,
      guildId: DISCORD_GUILD_ID,
      createdAt: previous?.createdAt || serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };
    if (!previous) {
      accountData.accountType = "standard";
      accountData.premiumExpiresAt = null;
    }
    await setDoc(accountReference, accountData, { merge: true });
    return accountFromSnapshot(await getDoc(accountReference));
  } catch (cause) {
    if (["GUILD_MEMBERSHIP_REQUIRED", "INVALID_DISCORD_USER"].includes(cause?.code)) {
      throw cause;
    }
    console.error("Unable to save the verified Discord account:", cause?.code || cause?.name || "UNKNOWN");
    const error = new Error("ACCOUNT_STORAGE_UNAVAILABLE", { cause });
    error.code = error.message;
    throw error;
  }
}

export async function submitTranslationRequest(game, user = auth.currentUser) {
  if (!user || !await isDiscordGuildMember(user)) {
    const error = new Error("GUILD_MEMBERSHIP_REQUIRED");
    error.code = error.message;
    throw error;
  }
  const appId = typeof game?.appId === "string" ? game.appId : "";
  const gameName = typeof game?.title === "string" ? game.title.normalize("NFKC").trim() : "";
  if (!/^\d{1,10}$/.test(appId) || !gameName || gameName.length > 120) {
    const error = new Error("INVALID_TRANSLATION_REQUEST");
    error.code = error.message;
    throw error;
  }

  const token = await user.getIdTokenResult();
  const discordUserId = token.claims.discordUserId;
  const username = token.claims.discordUsername;
  const avatar = typeof token.claims.discordAvatar === "string"
    ? token.claims.discordAvatar.slice(0, 128)
    : "";
  if (typeof discordUserId !== "string" || !DISCORD_USER_ID_PATTERN.test(discordUserId) ||
      typeof username !== "string" || !username.trim()) {
    const error = new Error("INVALID_DISCORD_USER");
    error.code = error.message;
    throw error;
  }

  const publicTranslations = await getDocs(query(
    collection(database, "translations"),
    where("visibility", "==", "published")
  ));
  const requestedTitle = translationTitleKey(gameName);
  const translationExists = publicTranslations.docs.some((snapshot) => {
    const translation = snapshot.data();
    return translation.steamAppId === appId ||
      [translation.title, translation.titleEn, translation.title_en]
        .some((title) => translationTitleKey(title) === requestedTitle);
  });
  if (translationExists) {
    const error = new Error("GAME_TRANSLATION_AVAILABLE");
    error.code = error.message;
    throw error;
  }

  const availabilitySnapshot = await getDoc(
    doc(database, "translationAvailability", appId)
  );
  if (availabilitySnapshot.exists()) {
    const error = new Error("GAME_TRANSLATION_AVAILABLE");
    error.code = error.message;
    throw error;
  }

  const requestReference = doc(collection(database, "translationRequests"));
  const lockReference = doc(database, "translationRequestLocks", user.uid);
  await runTransaction(database, async (transaction) => {
    const lockSnapshot = await transaction.get(lockReference);
    if (lockSnapshot.exists() && lockSnapshot.data().status === "pending") {
      const error = new Error("USER_HAS_PENDING_TRANSLATION_REQUEST");
      error.code = error.message;
      throw error;
    }
    transaction.set(requestReference, {
      uid: user.uid,
      discordUserId,
      username: username.trim().slice(0, 80),
      avatar,
      gameName,
      steamAppId: appId,
      platform: "Steam",
      status: "pending",
      createdAt: serverTimestamp()
    });
    transaction.set(lockReference, {
      uid: user.uid,
      status: "pending",
      activeRequestId: requestReference.id
    });
  });
}

export async function signOutAdministrator() {
  await authPersistenceReady;
  await signOut(auth);
}

export async function signOutCurrentUser() {
  await authPersistenceReady;
  await signOut(auth);
}

export async function listPublicTranslations() {
  const snapshot = await getDocs(query(
    collection(database, "translations"),
    where("visibility", "==", "published")
  ));
  return snapshot.docs.map(translationFromSnapshot).sort(compareTranslationOrder);
}

export async function subscribeToPublicTranslations(onChange, onError) {
  return onSnapshot(query(
    collection(database, "translations"),
    where("visibility", "==", "published")
  ), (snapshot) => {
    onChange(snapshot.docs.map(translationFromSnapshot).sort(compareTranslationOrder));
  }, onError);
}

export async function listAdminTranslations(user = auth.currentUser) {
  await requireAdministrator(user);
  const snapshot = await getDocs(collection(database, "translations"));
  return snapshot.docs.map(translationFromSnapshot).sort(compareTranslationOrder);
}

export async function listAdminAccounts(user = auth.currentUser) {
  await requireAdministrator(user);
  const snapshot = await getDocs(collection(database, "accounts"));
  return snapshot.docs.map(accountFromSnapshot)
    .sort((left, right) => left.username.localeCompare(right.username));
}

export async function listAdminTranslationRequests(user = auth.currentUser) {
  await requireAdministrator(user);
  const [requestsSnapshot, accountsSnapshot] = await Promise.all([
    getDocs(collection(database, "translationRequests")),
    getDocs(collection(database, "accounts"))
  ]);
  const accountAvatars = new Map(accountsSnapshot.docs.map((snapshot) => [
    snapshot.id,
    typeof snapshot.data().avatar === "string" ? snapshot.data().avatar : ""
  ]));
  const requests = requestsSnapshot.docs.map((snapshot) => {
    const request = translationRequestFromSnapshot(snapshot);
    return {
      ...request,
      avatar: request.avatar || accountAvatars.get(request.uid) || ""
    };
  });
  const archivedByGame = new Map();
  for (const request of requests) {
    if (request.status === "archived" && /^\d{1,10}$/.test(request.steamAppId) &&
        !archivedByGame.has(request.steamAppId)) {
      archivedByGame.set(request.steamAppId, request);
    }
  }
  await Promise.all([...archivedByGame].map(async ([steamAppId, request]) => {
    const availabilityReference = doc(database, "translationAvailability", steamAppId);
    await runTransaction(database, async (transaction) => {
      const availabilitySnapshot = await transaction.get(availabilityReference);
      if (availabilitySnapshot.exists()) return;
      const requestReference = doc(database, "translationRequests", request.id);
      const requestSnapshot = await transaction.get(requestReference);
      if (!requestSnapshot.exists() || requestSnapshot.data().status !== "archived") return;
      transaction.set(availabilityReference, {
        steamAppId,
        gameName: request.gameName,
        requestId: request.id,
        updatedAt: serverTimestamp()
      });
    });
  }));
  return requests
    .sort((left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() ||
      left.id.localeCompare(right.id));
}

export async function submitTranslationReport(input, user = auth.currentUser) {
  if (!user || !await isDiscordGuildMember(user)) {
    const error = new Error("GUILD_MEMBERSHIP_REQUIRED");
    error.code = error.message;
    throw error;
  }
  const translationId = typeof input?.translationId === "string" ? input.translationId : "";
  const latestUpdate = input?.latestUpdate;
  const issueType = input?.issueType;
  const details = typeof input?.details === "string" ? input.details.trim() : "";
  if (!/^[A-Za-z0-9-]{1,64}$/.test(translationId) ||
      !REPORT_UPDATE_STATUSES.has(latestUpdate) ||
      !REPORT_ISSUE_TYPES.has(issueType) ||
      details.length > 500) {
    const error = new Error("INVALID_TRANSLATION_REPORT");
    error.code = error.message;
    throw error;
  }

  const translationSnapshot = await getDoc(doc(database, "translations", translationId));
  if (!translationSnapshot.exists() || translationSnapshot.data().visibility !== "published") {
    const error = new Error("TRANSLATION_NOT_FOUND");
    error.code = error.message;
    throw error;
  }
  const translation = translationSnapshot.data();
  const token = await user.getIdTokenResult();
  const discordUserId = token.claims.discordUserId;
  const username = String(token.claims.discordUsername || "").trim().slice(0, 80);
  const avatar = String(token.claims.discordAvatar || "").slice(0, 128);
  if (typeof discordUserId !== "string" || !DISCORD_USER_ID_PATTERN.test(discordUserId) || !username) {
    const error = new Error("INVALID_DISCORD_USER");
    error.code = error.message;
    throw error;
  }
  const reportReference = doc(collection(database, "translationReports"));
  const reportLockReference = doc(
    database,
    "translationReportLocks",
    `${user.uid}_${translationId}`
  );
  await runTransaction(database, async (transaction) => {
    const lockSnapshot = await transaction.get(reportLockReference);
    if (lockSnapshot.exists()) {
      const previousReportReference = doc(
        database,
        "translationReports",
        lockSnapshot.data().reportId
      );
      const previousReportSnapshot = await transaction.get(previousReportReference);
      if (previousReportSnapshot.exists() && previousReportSnapshot.data().status !== "resolved") {
        const error = new Error("TRANSLATION_REPORT_ALREADY_EXISTS");
        error.code = error.message;
        throw error;
      }
    }
    transaction.set(reportLockReference, {
      uid: user.uid,
      translationId,
      reportId: reportReference.id,
      createdAt: serverTimestamp()
    });
    transaction.set(reportReference, {
      uid: user.uid,
      discordUserId,
      username,
      avatar,
      translationId,
      gameName: translation.titleEn,
      latestUpdate,
      issueType,
      details,
      status: "pending",
      createdAt: serverTimestamp(),
      resolvedAt: null,
      resolvedBy: null
    });
  });
}

export async function listAdminTranslationReports(user = auth.currentUser) {
  await requireAdministrator(user);
  const snapshot = await getDocs(collection(database, "translationReports"));
  return snapshot.docs.map(translationReportFromSnapshot)
    .sort((left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() ||
      left.id.localeCompare(right.id));
}

export async function setAdminTranslationReportStatus(reportId, status, user = auth.currentUser) {
  await requireAdministrator(user);
  if (typeof reportId !== "string" || !/^[A-Za-z0-9_-]{20,150}$/.test(reportId) ||
      !["pending", "resolved"].includes(status)) {
    const error = new Error("INVALID_TRANSLATION_REPORT_STATUS");
    error.code = error.message;
    throw error;
  }
  await updateDoc(doc(database, "translationReports", reportId), {
    status,
    resolvedAt: status === "resolved" ? serverTimestamp() : null,
    resolvedBy: status === "resolved" ? user.uid : null
  });
}

export async function deleteAdminTranslationReport(reportId, user = auth.currentUser) {
  await requireAdministrator(user);
  if (typeof reportId !== "string" || !/^[A-Za-z0-9_-]{20,150}$/.test(reportId)) {
    const error = new Error("INVALID_TRANSLATION_REPORT");
    error.code = error.message;
    throw error;
  }
  const reportReference = doc(database, "translationReports", reportId);
  await runTransaction(database, async (transaction) => {
    const reportSnapshot = await transaction.get(reportReference);
    if (!reportSnapshot.exists()) return;
    const report = reportSnapshot.data();
    const reportLockReference = doc(
      database,
      "translationReportLocks",
      `${report.uid}_${report.translationId}`
    );
    const lockSnapshot = await transaction.get(reportLockReference);
    transaction.delete(reportReference);
    if (lockSnapshot.exists() && lockSnapshot.data().reportId === reportId) {
      transaction.delete(reportLockReference);
    }
  });
}

export async function setAdminTranslationRequestStatus(requestId, status, user = auth.currentUser) {
  await requireAdministrator(user);
  if (typeof requestId !== "string" || !/^[A-Za-z0-9_-]{1,150}$/.test(requestId) ||
      !["pending", "archived"].includes(status)) {
    const error = new Error("INVALID_TRANSLATION_REQUEST_STATUS");
    error.code = error.message;
    throw error;
  }
  const requestReference = doc(database, "translationRequests", requestId);
  await runTransaction(database, async (transaction) => {
    const requestSnapshot = await transaction.get(requestReference);
    if (!requestSnapshot.exists()) {
      const error = new Error("TRANSLATION_REQUEST_NOT_FOUND");
      error.code = error.message;
      throw error;
    }
    const requestData = requestSnapshot.data();
    const lockReference = doc(database, "translationRequestLocks", requestData.uid);
    const availabilityReference = doc(database, "translationAvailability", requestData.steamAppId);
    const lockSnapshot = await transaction.get(lockReference);
    const availabilitySnapshot = await transaction.get(availabilityReference);
    const lockData = lockSnapshot.exists() ? lockSnapshot.data() : {};
    const availabilityData = availabilitySnapshot.exists() ? availabilitySnapshot.data() : {};
    let archivedSiblings = [];
    if (status === "pending" && requestData.status === "archived" &&
        availabilityData.requestId === requestId) {
      const siblingsQuery = query(
        collection(database, "translationRequests"),
        where("steamAppId", "==", requestData.steamAppId)
      );
      const siblingsSnapshot = await transaction.get(siblingsQuery);
      archivedSiblings = siblingsSnapshot.docs.filter((snapshot) =>
        snapshot.id !== requestId && snapshot.data().status === "archived");
    }
    if (status === "archived" && requestData.status !== "pending") {
      const error = new Error("TRANSLATION_REQUEST_STATE_CONFLICT");
      error.code = error.message;
      throw error;
    }
    if (status === "pending" && requestData.status === "archived" &&
        lockData.status === "pending" && lockData.activeRequestId !== requestId) {
      const error = new Error("USER_HAS_PENDING_TRANSLATION_REQUEST");
      error.code = error.message;
      throw error;
    }
    transaction.update(requestReference, { status });
    if (status === "archived") {
      if (!(lockData.status === "pending" && lockData.activeRequestId !== requestId)) {
        transaction.set(lockReference, {
          uid: requestData.uid,
          status: "archived",
          lastRequestId: requestId
        });
      }
      if (!availabilitySnapshot.exists() || availabilityData.requestId === requestId) {
        transaction.set(availabilityReference, {
          steamAppId: requestData.steamAppId,
          gameName: requestData.gameName,
          requestId,
          updatedAt: serverTimestamp()
        });
      }
    } else {
      transaction.set(lockReference, {
        uid: requestData.uid,
        status: "pending",
        activeRequestId: requestId
      });
      if (requestData.status === "archived" &&
          availabilityData.requestId === requestId) {
        const sibling = archivedSiblings[0];
        if (sibling) {
          transaction.set(availabilityReference, {
            steamAppId: requestData.steamAppId,
            gameName: sibling.data().gameName,
            requestId: sibling.id,
            updatedAt: serverTimestamp()
          });
        } else {
          transaction.delete(availabilityReference);
        }
      }
    }
  });
}

export async function deleteAdminTranslationRequest(requestId, user = auth.currentUser) {
  await requireAdministrator(user);
  if (typeof requestId !== "string" || !/^[A-Za-z0-9_-]{1,150}$/.test(requestId)) {
    const error = new Error("INVALID_TRANSLATION_REQUEST");
    error.code = error.message;
    throw error;
  }
  const requestReference = doc(database, "translationRequests", requestId);
  await runTransaction(database, async (transaction) => {
    const requestSnapshot = await transaction.get(requestReference);
    if (!requestSnapshot.exists()) return;
    const requestData = requestSnapshot.data();
    const lockReference = doc(database, "translationRequestLocks", requestData.uid);
    const availabilityReference = doc(database, "translationAvailability", requestData.steamAppId);
    const lockSnapshot = await transaction.get(lockReference);
    const availabilitySnapshot = await transaction.get(availabilityReference);
    const availabilityData = availabilitySnapshot.exists() ? availabilitySnapshot.data() : {};
    let archivedSiblings = [];
    if (requestData.status === "archived" && availabilityData.requestId === requestId) {
      const siblingsQuery = query(
        collection(database, "translationRequests"),
        where("steamAppId", "==", requestData.steamAppId)
      );
      const siblingsSnapshot = await transaction.get(siblingsQuery);
      archivedSiblings = siblingsSnapshot.docs.filter((snapshot) =>
        snapshot.id !== requestId && snapshot.data().status === "archived");
    }
    if (!lockSnapshot.exists() ||
        lockSnapshot.data().activeRequestId === requestId ||
        lockSnapshot.data().lastRequestId === requestId) {
      transaction.set(lockReference, {
        uid: requestData.uid,
        status: "none",
        lastRequestId: requestId
      });
    }
    transaction.delete(requestReference);
    if (requestData.status === "archived" && availabilityData.requestId === requestId) {
      const sibling = archivedSiblings[0];
      if (sibling) {
        transaction.set(availabilityReference, {
          steamAppId: requestData.steamAppId,
          gameName: sibling.data().gameName,
          requestId: sibling.id,
          updatedAt: serverTimestamp()
        });
      } else {
        transaction.delete(availabilityReference);
      }
    }
  });
}

export async function setAdminAccountType(uid, accountType, durationDays, user = auth.currentUser) {
  await requireAdministrator(user);
  if (!/^discord_\d{17,20}$/.test(uid) ||
      !["standard", "premium"].includes(accountType) ||
      (accountType === "premium" && ![null, 30, 90, 180, 365].includes(durationDays)) ||
      (accountType === "standard" && durationDays !== null)) {
    const error = new Error("INVALID_ACCOUNT_PLAN");
    error.code = error.message;
    throw error;
  }

  const accountReference = doc(database, "accounts", uid);
  const existing = await getDoc(accountReference);
  if (!existing.exists()) {
    const error = new Error("ACCOUNT_NOT_FOUND");
    error.code = error.message;
    throw error;
  }
  const premiumExpiresAt = accountType === "premium" && durationDays !== null
    ? Timestamp.fromDate(new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000))
    : null;
  await setDoc(accountReference, { accountType, premiumExpiresAt }, { merge: true });
}

export async function saveTranslation(input, user = auth.currentUser, artwork = null) {
  await requireAdministrator(user);
  const record = normalizeTranslation(artwork
    ? { ...input, cover: "astral-observer" }
    : input);
  const documentId = input.id || crypto.randomUUID();
  if (!/^[A-Za-z0-9-]{1,64}$/.test(documentId)) {
    const error = new Error("INVALID_TRANSLATION_ID");
    error.code = "INVALID_TRANSLATION_ID";
    throw error;
  }

  const translationReference = doc(database, "translations", documentId);
  const previousSnapshot = input.id ? await getDoc(translationReference) : null;
  if (previousSnapshot && !previousSnapshot.exists()) {
    const error = new Error("TRANSLATION_NOT_FOUND");
    error.code = "TRANSLATION_NOT_FOUND";
    throw error;
  }
  const previousCover = previousSnapshot?.data().cover || null;
  let uploadedFirestoreCoverId = null;

  try {
    if (artwork) {
      if (typeof artwork.base64 !== "string" ||
          artwork.contentType !== "image/webp" ||
          !Number.isSafeInteger(artwork.size) ||
          artwork.size < 1 ||
          artwork.size > 300 * 1024 ||
          artwork.base64.length > 420_000) {
        const error = new Error("INVALID_COVER");
        error.code = "INVALID_COVER";
        throw error;
      }
      const encodedBytes = atob(artwork.base64);
      const bytes = Uint8Array.from(encodedBytes, (character) => character.charCodeAt(0));
      if (bytes.byteLength !== artwork.size) {
        const error = new Error("INVALID_COVER");
        error.code = "INVALID_COVER";
        throw error;
      }
      const coverId = crypto.randomUUID();
      const coverPath = `firestore:covers/${coverId}`;
      uploadedFirestoreCoverId = coverId;
      await setDoc(doc(database, "translationCovers", coverId), {
        uploadedBy: user.uid,
        translationId: documentId,
        imageBase64: artwork.base64,
        contentType: artwork.contentType,
        updatedAt: serverTimestamp()
      });
      record.cover = coverPath;
    }

    const translationData = { ...record };
    const previousSortOrder = previousSnapshot?.data().sortOrder;
    if (Number.isFinite(previousSortOrder)) {
      translationData.sortOrder = previousSortOrder;
    } else if (!Number.isFinite(translationData.sortOrder)) {
      delete translationData.sortOrder;
    }
    if (!translationData.installerProgramUrl) delete translationData.installerProgramUrl;
    if (!translationData.packageVersion) delete translationData.packageVersion;
    await setDoc(translationReference, {
      ...translationData,
      createdAt: previousSnapshot?.data().createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    if (uploadedFirestoreCoverId) {
      try {
        await deleteDoc(doc(database, "translationCovers", uploadedFirestoreCoverId));
      } catch (cleanupError) {
        console.error("Unable to clean up an unreferenced Firestore cover after a failed translation write:", cleanupError);
      }
    }
    throw error;
  }

  if (previousCover && previousCover !== record.cover) {
    try {
      await collectUnreferencedCover(previousCover, user, documentId);
    } catch (error) {
      console.error("Unable to remove a replaced, unreferenced cloud cover:", error);
    }
  }

  return {
    id: documentId,
    ...record,
    updatedAt: new Date().toISOString()
  };
}

export async function setTranslationVisibility(documentId, visibility, user = auth.currentUser) {
  await requireAdministrator(user);
  if (typeof documentId !== "string" || !/^[A-Za-z0-9-]{1,64}$/.test(documentId)) {
    const error = new Error("INVALID_TRANSLATION_ID");
    error.code = "INVALID_TRANSLATION_ID";
    throw error;
  }
  if (!VISIBILITIES.has(visibility)) {
    const error = new Error("INVALID_VISIBILITY");
    error.code = "INVALID_VISIBILITY";
    throw error;
  }

  await updateDoc(doc(database, "translations", documentId), { visibility });
}

export async function moveTranslation(documentId, direction, adminTranslations, user = auth.currentUser) {
  await requireAdministrator(user);
  if (typeof documentId !== "string" || !/^[A-Za-z0-9-]{1,64}$/.test(documentId)) {
    const error = new Error("INVALID_TRANSLATION_ID");
    error.code = "INVALID_TRANSLATION_ID";
    throw error;
  }
  if (direction !== "up" && direction !== "down") {
    const error = new Error("INVALID_TRANSLATION_ORDER");
    error.code = "INVALID_TRANSLATION_ORDER";
    throw error;
  }
  if (!Array.isArray(adminTranslations)) {
    const error = new Error("INVALID_TRANSLATION_LIST");
    error.code = "INVALID_TRANSLATION_LIST";
    throw error;
  }

  const translations = adminTranslations.map((translation) => ({ ...translation }));
  const sortOrders = translations.map((translation) => translation.sortOrder);
  const hasCompleteOrder = sortOrders.every((sortOrder) =>
    Number.isSafeInteger(sortOrder) && sortOrder >= -1000000000 && sortOrder <= 1000000000
  ) &&
    new Set(sortOrders).size === translations.length;

  if (hasCompleteOrder) {
    translations.sort(compareTranslationOrder);
  } else {
    translations.sort(compareUpdatedAt);
    for (let index = 0; index < translations.length; index += 1) {
      const sortOrder = index * 10;
      if (translations[index].sortOrder !== sortOrder) {
        await updateDoc(doc(database, "translations", translations[index].id), { sortOrder });
        translations[index].sortOrder = sortOrder;
      }
    }
  }

  const currentIndex = translations.findIndex((translation) => translation.id === documentId);
  if (currentIndex < 0) {
    const error = new Error("TRANSLATION_NOT_FOUND");
    error.code = "TRANSLATION_NOT_FOUND";
    throw error;
  }
  const nextIndex = currentIndex + (direction === "up" ? -1 : 1);
  if (nextIndex < 0 || nextIndex >= translations.length) return false;

  const neighbor = translations[nextIndex].sortOrder;
  const outerNeighborIndex = direction === "up" ? currentIndex - 2 : currentIndex + 2;
  const outerNeighbor = translations[outerNeighborIndex]?.sortOrder;
  const lowerBound = direction === "up"
    ? (outerNeighborIndex >= 0 ? outerNeighbor : neighbor - 10)
    : neighbor;
  const upperBound = direction === "up"
    ? neighbor
    : (outerNeighborIndex < translations.length ? outerNeighbor : neighbor + 10);
  let sortOrder = Math.floor((lowerBound + upperBound) / 2);

  if (sortOrder <= lowerBound || sortOrder >= upperBound ||
      sortOrder < -1000000000 || sortOrder > 1000000000) {
    for (let index = 0; index < translations.length; index += 1) {
      const normalizedOrder = index * 10;
      if (translations[index].sortOrder !== normalizedOrder) {
        await updateDoc(doc(database, "translations", translations[index].id), {
          sortOrder: normalizedOrder
        });
        translations[index].sortOrder = normalizedOrder;
      }
    }
    const normalizedNeighbor = translations[nextIndex].sortOrder;
    const normalizedOuterNeighbor = translations[outerNeighborIndex]?.sortOrder;
    const normalizedLowerBound = direction === "up"
      ? (outerNeighborIndex >= 0 ? normalizedOuterNeighbor : normalizedNeighbor - 10)
      : normalizedNeighbor;
    const normalizedUpperBound = direction === "up"
      ? normalizedNeighbor
      : (outerNeighborIndex < translations.length ? normalizedOuterNeighbor : normalizedNeighbor + 10);
    sortOrder = Math.floor((normalizedLowerBound + normalizedUpperBound) / 2);
  }

  await updateDoc(doc(database, "translations", documentId), { sortOrder });
  return {
    sortOrder,
    sortOrders: translations.map((translation) => ({
      id: translation.id,
      sortOrder: translation.id === documentId ? sortOrder : translation.sortOrder
    }))
  };
}

export async function deleteTranslation(documentId, user = auth.currentUser) {
  await requireAdministrator(user);
  if (typeof documentId !== "string" || !/^[A-Za-z0-9-]{1,64}$/.test(documentId)) {
    const error = new Error("INVALID_TRANSLATION_ID");
    error.code = "INVALID_TRANSLATION_ID";
    throw error;
  }

  const translationReference = doc(database, "translations", documentId);
  const existing = await getDoc(translationReference);
  if (!existing.exists()) {
    const error = new Error("TRANSLATION_NOT_FOUND");
    error.code = "TRANSLATION_NOT_FOUND";
    throw error;
  }
  const cover = existing.data().cover;
  await deleteDoc(translationReference);
  if (cover) {
    try {
      await collectUnreferencedCover(cover, user);
    } catch (error) {
      console.error("Unable to remove the deleted translation's unreferenced cloud cover:", error);
    }
  }
}

export function downloadCover(cover) {
  const storagePath = coverStoragePath(cover);
  if (storagePath) return getDownloadURL(ref(storage, storagePath));

  const coverId = firestoreCoverId(cover);
  if (!coverId) return Promise.resolve(null);
  return getDoc(doc(database, "translationCovers", coverId)).then((snapshot) => {
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    if (data.contentType !== "image/webp" ||
        typeof data.imageBase64 !== "string" ||
    data.imageBase64.length > 420_000) {
      const error = new Error("INVALID_COVER");
      error.code = "INVALID_COVER";
      throw error;
    }
    return `data:${data.contentType};base64,${data.imageBase64}`;
  });
}

export async function getAppInfo() {
  return window.drekoDesktop.bootstrap();
}
