import {
  ADVISOR,
  BLACK,
  CANNON,
  CHARIOT,
  ELEPHANT,
  FILES,
  HORSE,
  KING,
  PAWN,
  RANKS,
  RED,
  crossedRiver,
  findKing,
  getRawMoves,
  opposite,
} from "./rules.js";

export const PIECE_VALUE = {
  [KING]: 0,
  [ADVISOR]: 200,
  [ELEPHANT]: 200,
  [HORSE]: 400,
  [CHARIOT]: 900,
  [CANNON]: 450,
  [PAWN]: 100,
};

const CROSSED_PAWN = 200;
const MOBILITY_W = 6;

/** 红方视角 10×9 PST，黑方用 r' = 9-r 镜像。 */
const PST = {
  [KING]: [
    [0, 0, 0, 8, 14, 8, 0, 0, 0],
    [0, 0, 0, 6, 10, 6, 0, 0, 0],
    [0, 0, 0, 2, 6, 2, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  [ADVISOR]: [
    [0, 0, 0, 16, 0, 16, 0, 0, 0],
    [0, 0, 0, 0, 18, 0, 0, 0, 0],
    [0, 0, 0, 12, 0, 12, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  [ELEPHANT]: [
    [0, 0, 14, 0, 0, 0, 14, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 16, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 10, 0, 0, 0, 10, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  [HORSE]: [
    [-20, -8, -6, -8, -8, -8, -6, -8, -20],
    [-8, 0, 4, 6, 8, 6, 4, 0, -8],
    [-6, 4, 10, 12, 14, 12, 10, 4, -6],
    [-8, 6, 12, 16, 18, 16, 12, 6, -8],
    [-8, 8, 14, 18, 20, 18, 14, 8, -8],
    [-8, 6, 12, 16, 18, 16, 12, 6, -8],
    [-6, 4, 10, 12, 14, 12, 10, 4, -6],
    [-8, 2, 8, 10, 12, 10, 8, 2, -8],
    [-12, 0, 4, 6, 8, 6, 4, 0, -8],
    [-20, -8, -6, -8, -8, -8, -6, -8, -20],
  ],
  [CHARIOT]: [
    [8, 10, 10, 12, 14, 12, 10, 10, 8],
    [8, 12, 12, 14, 16, 14, 12, 12, 8],
    [6, 10, 10, 12, 14, 12, 10, 10, 6],
    [4, 8, 8, 10, 12, 10, 8, 8, 4],
    [4, 8, 8, 10, 12, 10, 8, 8, 4],
    [4, 8, 8, 10, 12, 10, 8, 8, 4],
    [6, 10, 10, 12, 14, 12, 10, 10, 6],
    [8, 12, 12, 14, 16, 14, 12, 12, 8],
    [12, 16, 16, 18, 20, 18, 16, 16, 12],
    [10, 12, 12, 14, 16, 14, 12, 12, 10],
  ],
  [CANNON]: [
    [6, 4, 8, 6, 8, 6, 8, 4, 6],
    [4, 6, 8, 10, 12, 10, 8, 6, 4],
    [8, 10, 4, 8, 10, 8, 4, 10, 8],
    [6, 8, 8, 10, 12, 10, 8, 8, 6],
    [6, 8, 8, 10, 12, 10, 8, 8, 6],
    [6, 8, 8, 10, 12, 10, 8, 8, 6],
    [8, 10, 8, 10, 12, 10, 8, 10, 8],
    [4, 6, 10, 8, 10, 8, 10, 6, 4],
    [4, 6, 8, 8, 10, 8, 8, 6, 4],
    [2, 4, 6, 6, 8, 6, 6, 4, 2],
  ],
  [PAWN]: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 4, 0, 6, 0, 4, 0, 2],
    [8, 0, 10, 0, 12, 0, 10, 0, 8],
    [12, 4, 14, 6, 16, 6, 14, 4, 12],
    [18, 16, 22, 24, 28, 24, 22, 16, 18],
    [24, 22, 28, 30, 34, 30, 28, 22, 24],
    [30, 28, 32, 34, 38, 34, 32, 28, 30],
    [18, 16, 18, 20, 22, 20, 18, 16, 18],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

function pstAt(type, f, r, side) {
  const table = PST[type];
  if (!table) return 0;
  const rr = side === RED ? r : 9 - r;
  return table[rr][f];
}

function materialAndPst(board) {
  let score = 0;
  for (let r = 0; r < RANKS; r++) {
    for (let f = 0; f < FILES; f++) {
      const p = board[r][f];
      if (!p) continue;
      let v = PIECE_VALUE[p.type] || 0;
      if (p.type === PAWN && crossedRiver(r, p.side)) v = CROSSED_PAWN;
      v += pstAt(p.type, f, r, p.side);
      score += p.side === RED ? v : -v;
    }
  }
  return score;
}

function countActivity(board, side) {
  let n = 0;
  for (let r = 0; r < RANKS; r++) {
    for (let f = 0; f < FILES; f++) {
      const p = board[r][f];
      if (!p || p.side !== side) continue;
      n += getRawMoves(board, f, r).length;
    }
  }
  return n;
}

function kingSafety(board, side) {
  const king = findKing(board, side);
  if (!king) return -800;
  let s = 0;
  let advisors = 0;
  let elephants = 0;
  for (let r = 0; r < RANKS; r++) {
    for (let f = 0; f < FILES; f++) {
      const p = board[r][f];
      if (!p || p.side !== side) continue;
      if (p.type === ADVISOR) advisors++;
      if (p.type === ELEPHANT) elephants++;
    }
  }
  s += advisors * 28 + elephants * 22;

  const foe = opposite(side);
  for (const dir of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    let f = king.f + dir[0];
    let r = king.r + dir[1];
    let between = 0;
    let blockerSide = null;
    while (f >= 0 && f < FILES && r >= 0 && r < RANKS) {
      const p = board[r][f];
      if (p) {
        if (p.side === foe && (p.type === CHARIOT || p.type === CANNON)) {
          if (p.type === CHARIOT) {
            if (between === 0) s -= 55;
            else if (between === 1 && blockerSide === side) s -= 22;
          } else if (p.type === CANNON && between === 1) {
            s -= 40;
          }
        }
        between++;
        blockerSide = p.side;
        if (between >= 2) break;
      }
      f += dir[0];
      r += dir[1];
    }
  }
  return s;
}

export function evaluateRed(board) {
  const mat = materialAndPst(board);
  const mob = (countActivity(board, RED) - countActivity(board, BLACK)) * MOBILITY_W;
  const safe = kingSafety(board, RED) - kingSafety(board, BLACK);
  return mat + mob + safe;
}

/** 返回 `sideToMove` 视角的分，供搜索使用。 */
export function evaluate(board, sideToMove) {
  const red = evaluateRed(board);
  return sideToMove === RED ? red : -red;
}
