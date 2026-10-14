const PROTECTED_GAME_RULES = [
  {
    id: "counter-strike",
    titlePattern: /(?:\bcounter\s*strike\b|\bcs\s*go\b|\bcsgo\b|\bcs\s*2\b|\bcs2\b)/u
  },
  {
    id: "dead-by-daylight",
    titlePattern: /(?:\bdead\s+by\s+daylight\b|\bdbd\b)/u
  }
];

const ARABIC_SCRIPT = /\p{Script=Arabic}/u;
const ARABIC_LANGUAGE_NAME = /^(?:ar|ara|arab|arabic|ar[-_](?:sa|eg|ae|iq|kw|qa|bh|om|jo|lb|sy|ye|ma|dz|tn|ly|sd))$/iu;
const ARABIC_FILE_SUFFIX = /(?:^|[._-])(?:ar|ara|arab|arabic)(?:$|[._-])/iu;
const ARABIC_PATCH_MARKER = /(?:تعريب|ترجمة\s*(?:عربية|العاب)|arabic\s*(?:translation|locali[sz]ation|patch))/iu;
const LOCALIZATION_PATH_HINT = /locali[sz]ation|locali[sz]ations|locale|languages?|translations?|strings?|texts?/iu;
const LANGUAGE_SETTING_FILE = /(?:language|locale|settings|config|steam_emu|cream_api)/iu;
const ARABIC_LANGUAGE_SETTING = /(?:language|locale)\s*(?:=|:|\s)\s*["']?(?:arabic|ara|ar(?:[-_](?:sa|eg|ae|iq|kw|qa|bh|om|jo|lb|sy|ye|ma|dz|tn|ly|sd))?)\b/iu;
const ARABIC_TEXT_TIGER_ARCHIVE = /(?:^|[._-])alltxt_arabic_allplt(?:[._-]|$)/iu;

function normalizeGameTitle(title) {
  return typeof title === "string"
    ? title.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim()
    : "";
}

function getProtectedGameRule(gameTitle) {
  const normalized = normalizeGameTitle(gameTitle);
  for (const rule of PROTECTED_GAME_RULES) {
    if (rule.titlePattern.test(normalized)) return rule;
  }
  return null;
}

function hasArabicLocalizedPath(relativePath) {
  const segments = relativePath.replace(/\\/gu, "/").split("/");
  return segments.some((segment) => {
    const extension = segment.includes(".") ? segment.slice(segment.lastIndexOf(".")).toLowerCase() : "";
    const name = extension ? segment.slice(0, -extension.length) : segment;
    if (extension === ".tiger" && ARABIC_TEXT_TIGER_ARCHIVE.test(name)) return true;
    if (ARABIC_LANGUAGE_NAME.test(name)) return true;
    if (ARABIC_FILE_SUFFIX.test(name) &&
        [".json", ".csv", ".ini", ".cfg", ".xml", ".po", ".mo", ".loc", ".zip"].includes(extension)) {
      return true;
    }
    return ARABIC_PATCH_MARKER.test(name) && ![".txt", ".md", ".nfo", ".exe"].includes(extension);
  });
}

function containsMostlyArabic(entries) {
  const substantialEntries = entries.filter(({ text }) => /[\p{L}\p{N}]/u.test(text));
  if (substantialEntries.length < 3) return false;
  const arabicEntries = substantialEntries.filter(({ text }) => ARABIC_SCRIPT.test(text));
  return arabicEntries.length / substantialEntries.length >= 0.8;
}

function isLikelyLocalizationContent(entries) {
  const phraseEntries = entries.filter(({ text }) =>
    (text.match(/[\p{L}\p{N}]+/gu) || []).length >= 2
  );
  const totalWords = phraseEntries.reduce((total, { text }) =>
    total + (text.match(/[\p{L}\p{N}]+/gu) || []).length, 0);
  return phraseEntries.length >= 3 && totalWords >= 12;
}

function isArabicLanguageSetting(contents) {
  return ARABIC_LANGUAGE_SETTING.test(contents);
}

module.exports = {
  containsMostlyArabic,
  getProtectedGameRule,
  hasArabicLocalizedPath,
  isArabicTextTigerArchive: (relativePath) => {
    const fileName = relativePath.replace(/\\/gu, "/").split("/").pop() || "";
    return pathExtension(fileName) === ".tiger" && ARABIC_TEXT_TIGER_ARCHIVE.test(fileName.slice(0, -6));
  },
  isArabicLanguageSetting,
  isLanguageSettingFileName: (fileName) => LANGUAGE_SETTING_FILE.test(fileName),
  isLikelyLocalizationContent,
  normalizeGameTitle
};

function pathExtension(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex < 0 ? "" : fileName.slice(dotIndex).toLowerCase();
}
