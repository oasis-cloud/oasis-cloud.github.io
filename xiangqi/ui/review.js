function asDelta(item) {
  if (typeof item === "number") return item;
  if (item == null || typeof item !== "object") return 0;
  if (Number.isFinite(item.delta)) return item.delta;
  if (Number.isFinite(item.d)) return item.d;
  if (Number.isFinite(item.before) && Number.isFinite(item.after)) {
    return item.after - item.before;
  }
  if (item.before === -Infinity || item.after === -Infinity) return -Infinity;
  if (item.before === Infinity || item.after === Infinity) {
    if (Number.isFinite(item.after) && Number.isFinite(item.before)) {
      return item.after - item.before;
    }
  }
  if (Number.isFinite(item.cp)) return item.cp;
  if (Number.isFinite(item.eval)) return item.eval;
  return 0;
}

export function classifyDelta(delta) {
  if (delta === Infinity) return "good";
  if (delta === -Infinity) return "blunder";
  if (!Number.isFinite(delta)) return "good";
  if (delta > -30) return "good";
  if (delta >= -120) return "inaccurate";
  return "blunder";
}

/**
 * 根据评估变化给每步打标。
 * Δ > -30 good；Δ -30…-120 inaccurate；Δ < -120 blunder。
 * 元素可为数字 Δ，或 { delta } / { before, after }（着方视角）。
 */
export function classifyMoves(moveEvals) {
  if (!Array.isArray(moveEvals)) return [];
  return moveEvals.map((item) => classifyDelta(asDelta(item)));
}

/**
 * 复盘控制器：ply=0 为开局，ply=n 为第 n 手之后。
 * boardRestorer(ply) 还原棋盘；engineHint(ply) 返回该局面引擎首选着法说明。
 */
export function createReviewController({ boardRestorer, engineHint } = {}) {
  let ply = 0;
  let total = 0;

  function snapshot() {
    if (typeof boardRestorer === "function") boardRestorer(ply);
    const hint = typeof engineHint === "function" ? String(engineHint(ply) ?? "") : "";
    return {
      ply,
      total,
      hint,
      atStart: ply <= 0,
      atEnd: ply >= total,
    };
  }

  return {
    bind(moveCount) {
      total = Math.max(0, Number(moveCount) || 0);
      ply = 0;
      return snapshot();
    },
    prev() {
      if (ply > 0) ply -= 1;
      return snapshot();
    },
    next() {
      if (ply < total) ply += 1;
      return snapshot();
    },
    current() {
      return snapshot();
    },
  };
}
