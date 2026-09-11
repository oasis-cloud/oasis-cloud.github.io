import { BLACK, FILES, PIECE_TYPES, RANKS } from "./rules.js";

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function rand64(rng) {
  const hi = Math.floor(rng() * 0x100000000);
  const lo = Math.floor(rng() * 0x100000000);
  return (BigInt(hi) << 32n) ^ BigInt(lo);
}

const TYPE_INDEX = Object.fromEntries(PIECE_TYPES.map((t, i) => [t, i]));

/**
 * 64 位 Zobrist：棋子×颜色×格子 + 行棋方。
 * 用两个 32 位拼 BigInt，避免 Number 精度问题。
 */
export function makeZobrist(seed = 0x9e3779b9) {
  const rng = mulberry32(seed);
  const piece = [new Array(PIECE_TYPES.length), new Array(PIECE_TYPES.length)];
  for (const sideIdx of [0, 1]) {
    for (let t = 0; t < PIECE_TYPES.length; t++) {
      const squares = new Array(RANKS * FILES);
      for (let i = 0; i < squares.length; i++) squares[i] = rand64(rng);
      piece[sideIdx][t] = squares;
    }
  }
  return {
    piece,
    sideToMove: rand64(rng),
    key(p, f, r) {
      const sideIdx = p.side === BLACK ? 1 : 0;
      return piece[sideIdx][TYPE_INDEX[p.type]][r * FILES + f];
    },
  };
}

const Z = makeZobrist();

export function hashPosition(board, side) {
  let h = 0n;
  for (let r = 0; r < RANKS; r++) {
    for (let f = 0; f < FILES; f++) {
      const p = board[r][f];
      if (p) h ^= Z.key(p, f, r);
    }
  }
  if (side === BLACK) h ^= Z.sideToMove;
  return h;
}

/** `board` 为走棋前局面；`captured` 为目标格被吃子或 null。 */
export function hashMove(hash, board, from, to, captured) {
  const piece = board[from.r][from.f];
  let h = hash;
  h ^= Z.key(piece, from.f, from.r);
  if (captured) h ^= Z.key(captured, to.f, to.r);
  h ^= Z.key(piece, to.f, to.r);
  h ^= Z.sideToMove;
  return h;
}
