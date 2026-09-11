/** 中国象棋规则：着法生成、将军/将死/困毙、perft。禁止依赖 Three。 */

export {
  FILES,
  RANKS,
  RED,
  BLACK,
  KING,
  ADVISOR,
  ELEPHANT,
  HORSE,
  CHARIOT,
  CANNON,
  PAWN,
  PIECE_TYPES,
  PIECE_LABEL,
  DIFFICULTY,
} from "../core/constants.js";

import {
  FILES,
  RANKS,
  RED,
  BLACK,
  KING,
  ADVISOR,
  ELEPHANT,
  HORSE,
  CHARIOT,
  CANNON,
  PAWN,
} from "../core/constants.js";

export function opposite(side) {
  return side === RED ? BLACK : RED;
}

export function inBounds(f, r) {
  return f >= 0 && f < FILES && r >= 0 && r < RANKS;
}

/** 将/帅与士/仕只能在己方九宫：列 3–5，红行 0–2，黑行 7–9。 */
export function inPalace(f, r, side) {
  if (f < 3 || f > 5) return false;
  return side === RED ? r >= 0 && r <= 2 : r >= 7 && r <= 9;
}

/** 河界在 r=4 与 r=5 之间；红未过河 r<=4，黑未过河 r>=5。 */
export function onOwnSide(r, side) {
  return side === RED ? r <= 4 : r >= 5;
}

export function crossedRiver(r, side) {
  return !onOwnSide(r, side);
}

export function cloneBoard(board) {
  return board.map((row) => row.map((p) => (p ? { side: p.side, type: p.type } : null)));
}

export function createInitialBoard() {
  const board = Array.from({ length: RANKS }, () => Array(FILES).fill(null));
  const back = [CHARIOT, HORSE, ELEPHANT, ADVISOR, KING, ADVISOR, ELEPHANT, HORSE, CHARIOT];
  for (let f = 0; f < FILES; f++) {
    board[0][f] = { side: RED, type: back[f] };
    board[9][f] = { side: BLACK, type: back[f] };
  }
  board[2][1] = { side: RED, type: CANNON };
  board[2][7] = { side: RED, type: CANNON };
  board[7][1] = { side: BLACK, type: CANNON };
  board[7][7] = { side: BLACK, type: CANNON };
  for (const f of [0, 2, 4, 6, 8]) {
    board[3][f] = { side: RED, type: PAWN };
    board[6][f] = { side: BLACK, type: PAWN };
  }
  return board;
}

export function findKing(board, side) {
  for (let r = 0; r < RANKS; r++) {
    for (let f = 0; f < FILES; f++) {
      const p = board[r][f];
      if (p && p.type === KING && p.side === side) return { f, r };
    }
  }
  return null;
}

export function applyMove(board, from, to) {
  const next = cloneBoard(board);
  next[to.r][to.f] = next[from.r][from.f];
  next[from.r][from.f] = null;
  return next;
}

function land(board, f, r, side) {
  if (!inBounds(f, r)) return "oob";
  const p = board[r][f];
  if (!p) return "empty";
  return p.side === side ? "ally" : "enemy";
}

function pushLand(board, moves, f, r, side) {
  const kind = land(board, f, r, side);
  if (kind === "empty") {
    moves.push({ f, r, capture: false });
  } else if (kind === "enemy" && board[r][f].type !== KING) {
    moves.push({ f, r, capture: true });
  }
  return kind;
}

function clearBetween(board, f0, r0, f1, r1) {
  const df = Math.sign(f1 - f0);
  const dr = Math.sign(r1 - r0);
  let f = f0 + df;
  let r = r0 + dr;
  while (f !== f1 || r !== r1) {
    if (board[r][f]) return false;
    f += df;
    r += dr;
  }
  return true;
}

function countBetween(board, f0, r0, f1, r1) {
  const df = Math.sign(f1 - f0);
  const dr = Math.sign(r1 - r0);
  let n = 0;
  let f = f0 + df;
  let r = r0 + dr;
  while (f !== f1 || r !== r1) {
    if (board[r][f]) n++;
    f += df;
    r += dr;
  }
  return n;
}

/** 将帅同列且中间无子：飞将，局面非法。 */
export function kingsFace(board) {
  const red = findKing(board, RED);
  const black = findKing(board, BLACK);
  if (!red || !black || red.f !== black.f) return false;
  return clearBetween(board, red.f, red.r, black.f, black.r);
}

/** 伪合法着法（尚未过滤自将/飞将）。 */
export function getRawMoves(board, f, r) {
  const piece = board[r]?.[f];
  if (!piece) return [];
  const { side, type } = piece;
  const moves = [];

  if (type === KING) {
    for (const [df, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nf = f + df;
      const nr = r + dr;
      if (!inPalace(nf, nr, side)) continue;
      pushLand(board, moves, nf, nr, side);
    }
    return moves;
  }

  if (type === ADVISOR) {
    for (const [df, dr] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const nf = f + df;
      const nr = r + dr;
      if (!inPalace(nf, nr, side)) continue;
      pushLand(board, moves, nf, nr, side);
    }
    return moves;
  }

  if (type === ELEPHANT) {
    for (const [df, dr] of [
      [2, 2],
      [2, -2],
      [-2, 2],
      [-2, -2],
    ]) {
      const eyeF = f + df / 2;
      const eyeR = r + dr / 2;
      if (!inBounds(eyeF, eyeR) || board[eyeR][eyeF]) continue;
      const nf = f + df;
      const nr = r + dr;
      if (!inBounds(nf, nr) || !onOwnSide(nr, side)) continue;
      pushLand(board, moves, nf, nr, side);
    }
    return moves;
  }

  if (type === HORSE) {
    const hops = [
      { df: 2, dr: 1, bf: 1, br: 0 },
      { df: 2, dr: -1, bf: 1, br: 0 },
      { df: -2, dr: 1, bf: -1, br: 0 },
      { df: -2, dr: -1, bf: -1, br: 0 },
      { df: 1, dr: 2, bf: 0, br: 1 },
      { df: 1, dr: -2, bf: 0, br: -1 },
      { df: -1, dr: 2, bf: 0, br: 1 },
      { df: -1, dr: -2, bf: 0, br: -1 },
    ];
    for (const h of hops) {
      if (land(board, f + h.bf, r + h.br, side) !== "empty") continue;
      pushLand(board, moves, f + h.df, r + h.dr, side);
    }
    return moves;
  }

  if (type === CHARIOT) {
    for (const [df, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      let nf = f + df;
      let nr = r + dr;
      while (inBounds(nf, nr)) {
        const kind = pushLand(board, moves, nf, nr, side);
        if (kind !== "empty") break;
        nf += df;
        nr += dr;
      }
    }
    return moves;
  }

  if (type === CANNON) {
    for (const [df, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      let nf = f + df;
      let nr = r + dr;
      let platform = false;
      while (inBounds(nf, nr)) {
        const occ = board[nr][nf];
        if (!platform) {
          if (!occ) moves.push({ f: nf, r: nr, capture: false });
          else platform = true;
        } else if (occ) {
          if (occ.side !== side && occ.type !== KING) moves.push({ f: nf, r: nr, capture: true });
          break;
        }
        nf += df;
        nr += dr;
      }
    }
    return moves;
  }

  if (type === PAWN) {
    const fwd = side === RED ? 1 : -1;
    pushLand(board, moves, f, r + fwd, side);
    if (crossedRiver(r, side)) {
      pushLand(board, moves, f - 1, r, side);
      pushLand(board, moves, f + 1, r, side);
    }
  }

  return moves;
}

function pieceAttacks(board, piece, f, r, tf, tr) {
  if (f === tf && r === tr) return false;
  const df = tf - f;
  const dr = tr - r;
  const { side, type } = piece;

  if (type === KING) {
    return Math.abs(df) + Math.abs(dr) === 1 && inPalace(tf, tr, side);
  }
  if (type === ADVISOR) {
    return Math.abs(df) === 1 && Math.abs(dr) === 1 && inPalace(tf, tr, side);
  }
  if (type === ELEPHANT) {
    if (Math.abs(df) !== 2 || Math.abs(dr) !== 2) return false;
    if (!onOwnSide(tr, side)) return false;
    const eyeF = f + df / 2;
    const eyeR = r + dr / 2;
    return inBounds(eyeF, eyeR) && !board[eyeR][eyeF];
  }
  if (type === HORSE) {
    const adf = Math.abs(df);
    const adr = Math.abs(dr);
    if (!((adf === 2 && adr === 1) || (adf === 1 && adr === 2))) return false;
    const bf = f + (adf === 2 ? Math.sign(df) : 0);
    const br = r + (adr === 2 ? Math.sign(dr) : 0);
    return !board[br][bf];
  }
  if (type === CHARIOT) {
    if (df !== 0 && dr !== 0) return false;
    return clearBetween(board, f, r, tf, tr);
  }
  if (type === CANNON) {
    if (df !== 0 && dr !== 0) return false;
    return countBetween(board, f, r, tf, tr) === 1;
  }
  if (type === PAWN) {
    const fwd = side === RED ? 1 : -1;
    if (df === 0 && dr === fwd) return true;
    return crossedRiver(r, side) && dr === 0 && Math.abs(df) === 1;
  }
  return false;
}

/** `side` 能否吃到 (tf,tr) 上的棋子（炮需恰好隔一炮架；将不包含飞将）。 */
export function attacksSquare(board, side, tf, tr) {
  for (let r = 0; r < RANKS; r++) {
    for (let f = 0; f < FILES; f++) {
      const p = board[r][f];
      if (!p || p.side !== side) continue;
      if (pieceAttacks(board, p, f, r, tf, tr)) return true;
    }
  }
  return false;
}

export function isInCheck(board, side) {
  const king = findKing(board, side);
  if (!king) return true;
  if (attacksSquare(board, opposite(side), king.f, king.r)) return true;
  return kingsFace(board);
}

export function getLegalMoves(board, f, r) {
  const piece = board[r]?.[f];
  if (!piece) return [];
  const legal = [];
  for (const dest of getRawMoves(board, f, r)) {
    const captured = board[dest.r][dest.f];
    board[dest.r][dest.f] = piece;
    board[r][f] = null;
    const ok = !isInCheck(board, piece.side) && !kingsFace(board);
    board[r][f] = piece;
    board[dest.r][dest.f] = captured;
    if (ok) legal.push(dest);
  }
  return legal;
}

export function getAllLegalMoves(board, side) {
  const all = [];
  for (let r = 0; r < RANKS; r++) {
    for (let f = 0; f < FILES; f++) {
      const p = board[r][f];
      if (!p || p.side !== side) continue;
      for (const dest of getLegalMoves(board, f, r)) {
        const cap = board[dest.r][dest.f];
        all.push({
          from: { f, r },
          to: { f: dest.f, r: dest.r },
          capture: dest.capture,
          piece: p.type,
          capturedType: cap ? cap.type : null,
        });
      }
    }
  }
  return all;
}

export function hasAnyLegalMove(board, side) {
  for (let r = 0; r < RANKS; r++) {
    for (let f = 0; f < FILES; f++) {
      const p = board[r][f];
      if (!p || p.side !== side) continue;
      if (getLegalMoves(board, f, r).length) return true;
    }
  }
  return false;
}

export function getStatus(board, side) {
  const inCheck = isInCheck(board, side);
  const canMove = hasAnyLegalMove(board, side);
  if (!canMove) return inCheck ? "checkmate" : "stalemate";
  if (inCheck) return "check";
  return "playing";
}

/** 只计合法着法叶子节点。 */
export function perft(board, side, depth) {
  if (depth <= 0) return 1;
  const moves = getAllLegalMoves(board, side);
  if (depth === 1) return moves.length;
  let n = 0;
  const foe = opposite(side);
  for (const m of moves) {
    n += perft(applyMove(board, m.from, m.to), foe, depth - 1);
  }
  return n;
}

/** 重复局面用的字符串键（无碰撞设计，另有 zobrist）。 */
export function positionKey(board, side) {
  const parts = [side === RED ? "r" : "b"];
  for (let r = 0; r < RANKS; r++) {
    for (let f = 0; f < FILES; f++) {
      const p = board[r][f];
      if (!p) continue;
      parts.push(`${f}${r}${p.side[0]}${p.type}`);
    }
  }
  return parts.join("/");
}
