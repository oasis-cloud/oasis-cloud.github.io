import {
  STORAGE_DEX,
  STORAGE_SETTINGS,
  STORAGE_STREAK,
  STORAGE_WORDS,
  SETTINGS_REV,
} from "./config.js";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadWordsText(fallback) {
  try {
    const saved = localStorage.getItem(STORAGE_WORDS);
    return saved && saved.trim() ? saved : fallback;
  } catch {
    return fallback;
  }
}

export function saveWordsText(text) {
  try {
    localStorage.setItem(STORAGE_WORDS, text);
  } catch {
    /* ignore */
  }
}

export function loadSettings(defaults) {
  const saved = readJson(STORAGE_SETTINGS, null);
  if (!saved || saved.rev !== SETTINGS_REV) return { ...defaults };
  return {
    batch: Number.isFinite(saved.batch) ? saved.batch : defaults.batch,
    speed: Number.isFinite(saved.speed) ? saved.speed : defaults.speed,
  };
}

export function saveSettings(settings) {
  writeJson(STORAGE_SETTINGS, { rev: SETTINGS_REV, ...settings });
}

export function loadStreak() {
  const n = Number(readJson(STORAGE_STREAK, 0));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function saveStreak(n) {
  writeJson(STORAGE_STREAK, Math.max(0, Math.floor(n)));
}

export function loadDex() {
  const saved = readJson(STORAGE_DEX, { seen: [], defeated: [] });
  return {
    seen: new Set(saved.seen || []),
    defeated: new Set(saved.defeated || []),
  };
}

export function saveDex(dex) {
  writeJson(STORAGE_DEX, {
    seen: [...dex.seen],
    defeated: [...dex.defeated],
  });
}
