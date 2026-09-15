import {
  DANGER_RATIO,
  PROXIMITY_MAX,
  PROXIMITY_START,
  WAVE_EARLY,
  WAVE_EARLY_SPEED,
  WAVE_LATE,
  WAVE_LATE_SPEED,
  WAVE_RUSH_BATCH_BONUS,
} from "./config.js";

/** 本关进度 0..1 */
export function levelProgress(kills, total) {
  if (!total) return 0;
  return Math.min(1, Math.max(0, kills / total));
}

/** early | mid | rush */
export function waveName(progress) {
  if (progress < WAVE_EARLY) return "early";
  if (progress < WAVE_LATE) return "mid";
  return "rush";
}

export function waveSpeedMul(progress) {
  const w = waveName(progress);
  if (w === "early") return WAVE_EARLY_SPEED;
  if (w === "rush") return WAVE_LATE_SPEED;
  return 1;
}

export function waveBatchSize(parentBatch, progress) {
  const base = Math.max(1, parentBatch | 0);
  if (waveName(progress) === "rush") return Math.min(12, base + WAVE_RUSH_BATCH_BONUS);
  return base;
}

/**
 * 距植株越近越快。progressAlong：0 刚出场，1 贴植株。
 */
export function proximitySpeedMul(progressAlong) {
  const t = Math.min(1, Math.max(0, progressAlong));
  if (t < PROXIMITY_START) return 1;
  const u = (t - PROXIMITY_START) / (1 - PROXIMITY_START);
  return 1 + (PROXIMITY_MAX - 1) * u * u;
}

export function approachProgress(x, plantX, rightEdge) {
  const span = Math.max(80, rightEdge - plantX);
  return Math.min(1, Math.max(0, (rightEdge - x) / span));
}

export function isInDanger(x, plantX, rightEdge) {
  const left = Math.max(0, (x - plantX) / Math.max(80, rightEdge - plantX));
  return left <= DANGER_RATIO;
}

/** 牌子随靠近略放大 */
export function cardScale(progressAlong) {
  return 1 + Math.min(0.35, Math.max(0, progressAlong - 0.35) * 0.7);
}
