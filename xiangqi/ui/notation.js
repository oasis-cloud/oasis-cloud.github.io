import {
  ADVISOR,
  ELEPHANT,
  HORSE,
  PIECE_LABEL,
  RED,
} from "../core/constants.js";

const CN = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const DEST_FILE_TYPES = new Set([HORSE, ELEPHANT, ADVISOR]);

function cell(c) {
  if (c == null) return null;
  if (Array.isArray(c)) return { f: c[0], r: c[1] };
  return {
    f: c.f ?? c.file ?? c.x,
    r: c.r ?? c.rank ?? c.y,
  };
}

function parseMove(move) {
  if (!move || typeof move !== "object") return null;
  if (move.from != null && move.to != null) {
    const from = cell(move.from);
    const to = cell(move.to);
    if (!from || !to) return null;
    return { fromF: from.f, fromR: from.r, toF: to.f, toR: to.r };
  }
  if (move.fromF != null) {
    return { fromF: move.fromF, fromR: move.fromR, toF: move.toF, toR: move.toR };
  }
  if (move.f0 != null) {
    return { fromF: move.f0, fromR: move.r0, toF: move.f1, toR: move.r1 };
  }
  if (move.tf != null || move.toF != null) {
    return {
      fromF: move.f ?? move.fromF,
      fromR: move.r ?? move.fromR,
      toF: move.tf ?? move.toF,
      toR: move.tr ?? move.toR,
    };
  }
  return null;
}

/** 该方视角：从右到左 1…9。红右即棋盘 file 8。 */
export function fileNumber(f, side) {
  return side === RED ? 9 - f : f + 1;
}

export function fileGlyph(n, side) {
  return side === RED ? CN[n] : String(n);
}

function isForward(fromR, toR, side) {
  return side === RED ? toR > fromR : toR < fromR;
}

function collectSame(board, side, type) {
  const found = [];
  if (!board) return found;
  for (let r = 0; r < board.length; r++) {
    const row = board[r];
    if (!row) continue;
    for (let f = 0; f < row.length; f++) {
      const p = row[f];
      if (p && p.side === side && p.type === type) found.push({ f, r });
    }
  }
  return found;
}

function disambiguate(sameOnFile, fromR, side, name) {
  const sorted = [...sameOnFile].sort((a, b) => (side === RED ? b.r - a.r : a.r - b.r));
  const idx = sorted.findIndex((p) => p.r === fromR);
  if (idx < 0) return { prefix: name, origin: "" };
  const n = sorted.length;
  if (n === 2) return { prefix: `${idx === 0 ? "前" : "后"}${name}`, origin: "" };
  if (n === 3) {
    const tags = ["前", "中", "后"];
    return { prefix: `${tags[idx]}${name}`, origin: "" };
  }
  if (idx === 0) return { prefix: `前${name}`, origin: "" };
  if (idx === n - 1) return { prefix: `后${name}`, origin: "" };
  return { prefix: `${fileGlyph(idx + 1, side)}${name}`, origin: "" };
}

/**
 * 将着法转为中文棋谱。红方中文数字一…九，黑方 1…9，皆从该方右侧起算。
 * @example toNotation(board, { from:{f:7,r:2}, to:{f:4,r:2} }, "red") → "炮二平五"
 * @example toNotation(board, { from:{f:7,r:9}, to:{f:6,r:7} }, "black") → "马8进7"
 */
export function toNotation(boardBefore, move, side) {
  const parsed = parseMove(move);
  if (!parsed) return "";
  const { fromF, fromR, toF, toR } = parsed;
  const piece = boardBefore?.[fromR]?.[fromF];
  const color = side ?? piece?.side;
  if (!piece || !color) return "";

  const name = PIECE_LABEL[color][piece.type];
  const same = collectSame(boardBefore, color, piece.type);
  const onFile = same.filter((p) => p.f === fromF);

  let prefix = name;
  let origin = fileGlyph(fileNumber(fromF, color), color);
  if (onFile.length >= 2) {
    const d = disambiguate(onFile, fromR, color, name);
    prefix = d.prefix;
    origin = d.origin;
  }

  let dir;
  let dest;
  if (fromR === toR) {
    dir = "平";
    dest = fileGlyph(fileNumber(toF, color), color);
  } else {
    dir = isForward(fromR, toR, color) ? "进" : "退";
    if (DEST_FILE_TYPES.has(piece.type)) {
      dest = fileGlyph(fileNumber(toF, color), color);
    } else {
      dest = fileGlyph(Math.abs(toR - fromR), color);
    }
  }

  return origin ? `${prefix}${origin}${dir}${dest}` : `${prefix}${dir}${dest}`;
}
