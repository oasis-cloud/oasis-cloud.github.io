/** 棋盘、镜头、阶段与兵种的共享常量。渲染与引擎都只依赖本文件，不互相 import Three。 */

export const FILES = 9;
export const RANKS = 10;

export const RED = "red"; // 汉军 · 红方
export const BLACK = "black"; // 楚军 · 黑方

export const KING = "king";
export const ADVISOR = "advisor";
export const ELEPHANT = "elephant";
export const HORSE = "horse";
export const CHARIOT = "chariot";
export const CANNON = "cannon";
export const PAWN = "pawn";

export const PIECE_TYPES = [KING, ADVISOR, ELEPHANT, HORSE, CHARIOT, CANNON, PAWN];

export const PIECE_LABEL = {
  red: {
    king: "帅",
    advisor: "仕",
    elephant: "相",
    horse: "马",
    chariot: "车",
    cannon: "炮",
    pawn: "兵",
  },
  black: {
    king: "将",
    advisor: "士",
    elephant: "象",
    horse: "马",
    chariot: "车",
    cannon: "炮",
    pawn: "卒",
  },
};

/** 篆书后备识别，刻在底座，不是主识别手段。 */
export const SEAL_LABEL = PIECE_LABEL;

export const TILE = 1.18;
export const BOARD_Y = 0.22;
export const RIVER_GAP = 0.72;
export const BASE_HEIGHT = 0.055;

/**
 * 默认镜头下的目标身高（世界单位）。对照剪影调校。
 * 将站抬高指挥台，炮站木座，马侧面要宽，车是最宽剪影。
 */
export const UNIT_SCALE = {
  pawn: { height: 0.62, width: 0.38, depth: 0.32, head: 0.22, shoulder: 0.82 },
  advisor: { height: 0.76, width: 0.46, depth: 0.36, head: 0.2, shoulder: 0.9 },
  king: { height: 1.14, width: 0.58, depth: 0.48, head: 0.18, shoulder: 1.05, platform: 0.16 },
  cannon: { height: 1.02, width: 0.72, depth: 0.7, head: 0.19, shoulder: 0.92, platform: 0.1 },
  horse: { height: 1.22, width: 0.52, depth: 0.92, head: 0.18, shoulder: 0.95 },
  elephant: { height: 1.5, width: 0.78, depth: 1.15, head: 0.17, shoulder: 1.1 },
  chariot: { height: 1.62, width: 0.95, depth: 1.05, head: 0.18, shoulder: 1.0 },
};

export const MATERIAL_KIND = {
  LACQUER: "lacquer",
  CLOTH: "cloth",
  LEATHER: "leather",
  GOLD: "gold",
  IVORY: "ivory",
  WOOD: "wood",
  INK: "ink",
  PIGMENT: "pigment",
};

export const PHASE = {
  BOOT: "boot",
  LOBBY: "lobby",
  PARADE: "parade",
  PLAYING: "playing",
  CAPTURE: "capture",
  CEREMONY: "ceremony",
  REVIEW: "review",
};

export const DIFFICULTY = {
  easy: { id: "easy", label: "弱社", depth: 3, timeMs: 220, noise: 90, pool: 4, secondBest: 0 },
  medium: { id: "medium", label: "对局", depth: 5, timeMs: 650, noise: 18, pool: 2, secondBest: 0.22 },
  hard: { id: "hard", label: "沉机", depth: 12, timeMs: 1400, noise: 0, pool: 1, secondBest: 0 },
};

export const STORAGE_KEY = "xiangqi-gongbi-v1";

export const CAM = {
  defaultPolar: 0.82, // ~47°，略俯，避免近处棋子挡住格点
  minPolar: 0.55,
  maxPolar: 1.18,
  minDist: 8.5, // 吃子/将军特写
  minUserDist: 12.4, // 滚轮拉近下限，避免钻进己方底线挡对手点选
  maxDist: 22,
  defaultDist: 16.8,
  openingPolar: 0.78,
  endgamePolar: 1.02,
  endgameDist: 13.2,
};
