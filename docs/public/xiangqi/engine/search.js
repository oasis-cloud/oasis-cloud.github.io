import { probeBook } from "./book.js";
import { evaluate, PIECE_VALUE } from "./evaluate.js";
import {
  DIFFICULTY,
  cloneBoard,
  getAllLegalMoves,
  getStatus,
  isInCheck,
  opposite,
} from "./rules.js";
import { hashMove, hashPosition } from "./zobrist.js";

const INF = 30000;
const MATE = 20000;
const EXACT = 0;
const LOWER = 1;
const UPPER = 2;
const BLUNDER = 350;

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function toMove(m) {
  return { from: { f: m.from.f, r: m.from.r }, to: { f: m.to.f, r: m.to.r }, capture: !!m.capture };
}

function sameMove(a, b) {
  return a && b && a.from.f === b.from.f && a.from.r === b.from.r && a.to.f === b.to.f && a.to.r === b.to.r;
}

function play(pos, m) {
  const captured = pos[m.to.r][m.to.f];
  pos[m.to.r][m.to.f] = pos[m.from.r][m.from.f];
  pos[m.from.r][m.from.f] = null;
  return captured;
}

function unplay(pos, m, captured) {
  pos[m.from.r][m.from.f] = pos[m.to.r][m.to.f];
  pos[m.to.r][m.to.f] = captured;
}

function resolveOptions(options) {
  const d = options.difficulty ? DIFFICULTY[options.difficulty] : null;
  const difficulty = options.difficulty;
  let maxDepth = options.maxDepth ?? d?.depth ?? 4;
  let timeMs = options.timeMs ?? d?.timeMs ?? 800;
  let noise = options.noise ?? d?.noise ?? 0;
  let pool = options.pool ?? d?.pool ?? 1;
  let secondBest = options.secondBest ?? d?.secondBest ?? 0;
  let useBook = options.useBook;
  if (useBook === undefined) {
    useBook = difficulty ? difficulty !== "easy" : true;
  }
  if (difficulty === "easy") {
    maxDepth = Math.min(3, Math.max(2, maxDepth));
    pool = Math.max(2, pool);
  } else if (difficulty === "medium") {
    maxDepth = Math.min(6, Math.max(4, maxDepth));
  } else if (difficulty === "hard") {
    noise = 0;
    pool = 1;
    secondBest = 0;
    useBook = options.useBook !== false;
  }
  return {
    timeMs,
    maxDepth,
    noise,
    pool,
    secondBest,
    useBook,
    qply: difficulty === "hard" ? 6 : difficulty === "easy" ? 2 : 4,
    shouldStop: options.shouldStop || (() => false),
    onInfo: options.onInfo,
    historyMoves: options.historyMoves || [],
    startHash: options.startHash,
  };
}

function mvvLva(m) {
  const victim = m.capturedType ? PIECE_VALUE[m.capturedType] || 0 : 0;
  const attacker = PIECE_VALUE[m.piece] || 0;
  return victim * 16 - attacker;
}

export function search(board, side, options = {}) {
  const opt = resolveOptions(options);
  const start = nowMs();
  const deadline = start + opt.timeMs;
  const shouldStop = () => opt.shouldStop() || nowMs() >= deadline;

  if (opt.useBook) {
    const bookMove = probeBook(board, side, opt.historyMoves);
    if (bookMove) {
      return { move: bookMove, score: 0, depth: 0, nodes: 0, pv: [bookMove], source: "book" };
    }
  }

  const status = getStatus(board, side);
  if (status === "checkmate" || status === "stalemate") {
    return { move: null, score: -MATE, depth: 0, nodes: 0, pv: [], source: "search" };
  }

  let rootHash = opt.startHash;
  if (rootHash === undefined || rootHash === null) rootHash = hashPosition(board, side);

  const pos = cloneBoard(board);
  const tt = new Map();
  const killers = Array.from({ length: 64 }, () => [null, null]);
  const history = new Map();
  let nodes = 0;
  let stopped = false;

  function histKey(m) {
    return `${m.from.f},${m.from.r}-${m.to.f},${m.to.r}`;
  }

  function orderMoves(moves, ply, ttMove) {
    const scored = moves.map((m, i) => {
      let s = 0;
      if (ttMove && sameMove(toMove(m), ttMove)) s = 1e6;
      else if (m.capture) s = 80000 + mvvLva(m);
      else if (killers[ply] && sameMove(toMove(m), killers[ply][0])) s = 70000;
      else if (killers[ply] && sameMove(toMove(m), killers[ply][1])) s = 60000;
      else s = history.get(histKey(m)) || 0;
      return { m, s, i };
    });
    scored.sort((a, b) => b.s - a.s || a.i - b.i);
    return scored.map((x) => x.m);
  }

  function ttStore(hash, depth, score, flag, move) {
    const prev = tt.get(hash);
    if (prev && prev.depth > depth) return;
    tt.set(hash, { depth, score, flag, move });
  }

  function qsearch(toMoveSide, alpha, beta, ply, qdepth, inCheck, hash) {
    nodes++;
    if ((nodes & 63) === 0 && shouldStop()) {
      stopped = true;
      return evaluate(pos, toMoveSide);
    }
    if (ply > 20) return evaluate(pos, toMoveSide);

    if (!inCheck) {
      const stand = evaluate(pos, toMoveSide);
      if (stand >= beta) return stand;
      if (stand > alpha) alpha = stand;
      if (qdepth <= 0) return stand;
    } else if (qdepth <= 0) {
      return evaluate(pos, toMoveSide);
    }

    let moves = getAllLegalMoves(pos, toMoveSide);
    if (inCheck && !moves.length) return -MATE + ply;
    if (!inCheck) moves = moves.filter((m) => m.capture);
    if (!moves.length) return inCheck ? -MATE + ply : alpha;

    moves = orderMoves(moves, ply, null);
    const foe = opposite(toMoveSide);
    for (const m of moves) {
      const captured = pos[m.to.r][m.to.f];
      const nextHash = hashMove(hash, pos, m.from, m.to, captured);
      play(pos, m);
      const nextCheck = isInCheck(pos, foe);
      const sc = -qsearch(foe, -beta, -alpha, ply + 1, qdepth - 1, nextCheck, nextHash);
      unplay(pos, m, captured);
      if (stopped) return alpha;
      if (sc >= beta) return sc;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }

  function alphabeta(toMoveSide, depth, alpha, beta, hash, ply) {
    nodes++;
    if ((nodes & 63) === 0 && shouldStop()) {
      stopped = true;
      return evaluate(pos, toMoveSide);
    }

    const inCheck = isInCheck(pos, toMoveSide);
    if (depth <= 0) return qsearch(toMoveSide, alpha, beta, ply, opt.qply, inCheck, hash);

    const hit = tt.get(hash);
    if (hit && hit.depth >= depth && ply > 0) {
      if (hit.flag === EXACT) return hit.score;
      if (hit.flag === LOWER && hit.score >= beta) return hit.score;
      if (hit.flag === UPPER && hit.score <= alpha) return hit.score;
    }

    const moves = getAllLegalMoves(pos, toMoveSide);
    if (!moves.length) return -MATE + ply;

    const ordered = orderMoves(moves, ply, hit?.move);
    const foe = opposite(toMoveSide);
    const alpha0 = alpha;
    let best = -INF;
    let bestMove = null;
    for (const m of ordered) {
      const captured = pos[m.to.r][m.to.f];
      const nextHash = hashMove(hash, pos, m.from, m.to, captured);
      play(pos, m);
      const sc = -alphabeta(foe, depth - 1, -beta, -alpha, nextHash, ply + 1);
      unplay(pos, m, captured);
      if (stopped) break;
      if (sc > best) {
        best = sc;
        bestMove = toMove(m);
      }
      if (sc > alpha) alpha = sc;
      if (sc >= beta) {
        if (!m.capture && killers[ply]) {
          if (!sameMove(killers[ply][0], toMove(m))) killers[ply][1] = killers[ply][0];
          killers[ply][0] = toMove(m);
        }
        const hk = histKey(m);
        history.set(hk, (history.get(hk) || 0) + depth * depth);
        break;
      }
    }
    if (bestMove) {
      let flag = EXACT;
      if (best <= alpha0) flag = UPPER;
      else if (best >= beta) flag = LOWER;
      ttStore(hash, depth, best, flag, bestMove);
    }
    return best;
  }

  function scoreRoot(depth) {
    const moves = getAllLegalMoves(pos, side);
    const hit = tt.get(rootHash);
    const ordered = orderMoves(moves, 0, hit?.move);
    const foe = opposite(side);
    const scored = [];
    let alpha = -INF;
    let pv = [];
    for (const m of ordered) {
      if (shouldStop() && scored.length) break;
      const captured = pos[m.to.r][m.to.f];
      const nextHash = hashMove(rootHash, pos, m.from, m.to, captured);
      play(pos, m);
      const sc = -alphabeta(foe, depth - 1, -INF, -alpha, nextHash, 1);
      unplay(pos, m, captured);
      const mv = toMove(m);
      scored.push({ move: mv, score: sc });
      if (sc > alpha) {
        alpha = sc;
        pv = [mv];
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return { scored, pv };
  }

  function pickMove(scored) {
    if (!scored.length) return { move: null, score: -MATE };
    const best = scored[0];
    const safe = scored.filter((x) => best.score - x.score <= BLUNDER);
    const pool = (safe.length ? safe : scored).slice(0, Math.max(1, opt.pool));

    if (opt.secondBest > 0 && scored.length >= 2 && Math.random() < opt.secondBest) {
      return scored[1];
    }
    if (opt.pool <= 1 && opt.noise <= 0) return best;

    const noisy = pool.map((x) => ({
      ...x,
      n: x.score + (opt.noise ? (Math.random() * 2 - 1) * opt.noise : 0),
    }));
    const t = 48;
    const maxN = Math.max(...noisy.map((x) => x.n));
    const weights = noisy.map((x) => Math.exp((x.n - maxN) / t));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < noisy.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[0];
  }

  let last = { scored: [], pv: [] };
  let reached = 0;
  for (let depth = 1; depth <= opt.maxDepth; depth++) {
    if (shouldStop() && last.scored.length) break;
    stopped = false;
    const iter = scoreRoot(depth);
    if (iter.scored.length) {
      last = iter;
      reached = depth;
      opt.onInfo?.({ depth, nodes, score: iter.scored[0].score });
    }
    if (shouldStop()) break;
  }

  const chosen = pickMove(last.scored);
  return {
    move: chosen.move,
    score: chosen.score ?? 0,
    depth: reached,
    nodes,
    pv: last.pv.length ? last.pv : chosen.move ? [chosen.move] : [],
    source: "search",
  };
}

export { INF, MATE };
