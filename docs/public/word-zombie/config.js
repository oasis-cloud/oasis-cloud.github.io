export const STORAGE_WORDS = "oasis-word-zombie-words";
export const STORAGE_SETTINGS = "oasis-word-zombie-settings";
export const STORAGE_DEX = "oasis-word-zombie-dex";
export const STORAGE_STREAK = "oasis-word-zombie-streak";
export const SETTINGS_REV = 2;

export const MAX_HP = 120;
export const LEAK_DAMAGE = 22;
export const COMBO_HEAL = 16;
export const STUN_MS = 1200;
export const PEA_SPEED = 620;
export const MAX_ALIVE_LANES = 4;
/** 默写略快，回忆时更催 */
export const DICTATE_SPEED = 1.1;
export const SLOW_FACTOR = 0.35;
export const SLOW_MS = 3000;
export const STREAK_STEP = 1.08;
export const STREAK_CAP = 1.5;

/** 过半场后加速，贴木屋前最高 */
export const PROXIMITY_START = 0.45;
export const PROXIMITY_MAX = 1.75;
/** 进入危险区（距植株剩余路程比例） */
export const DANGER_RATIO = 0.28;
export const DANGER_BEEP_MS = 900;

export const BERSERK_CHANCE = 0.15;
export const BERSERK_SPEED = 1.3;
export const BERSERK_HEAL = 10;

export const LOW_HP_RATIO = 0.3;
export const WAVE_EARLY = 0.33;
export const WAVE_LATE = 0.66;
export const WAVE_EARLY_SPEED = 0.88;
export const WAVE_LATE_SPEED = 1.22;
export const WAVE_RUSH_BATCH_BONUS = 1;

export const VOICE = {
  start: "怪兽拿着单词牌冲过来了，点开始说字母，一个一个说，说完再点一次结束。",
  firstDictate: "有的牌子只剩中文了，英文要你自己想，点按钮一个字母一个字母说出来。",
  combo5: "拼得真准，墨水把它们的脚粘住了。",
  danger: "快挡住它，已经很近了！",
  lowHp: "木屋要撑不住了，加油！",
  rush: "最后冲刺了，它们跑得更快了！",
  win: "木屋保住了。",
  lose: "木屋要重修了，我们再试一次。",
};
