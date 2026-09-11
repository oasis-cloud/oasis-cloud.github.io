import { DIFFICULTY } from "../core/constants.js";

export function createEngineHost() {
  const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  let seq = 0;
  const pending = new Map();

  worker.onmessage = (e) => {
    const msg = e.data;
    if (!msg) return;
    const wait = pending.get(msg.id);
    if (!wait) return;
    if (msg.type === "info") {
      wait.onInfo?.(msg);
      return;
    }
    if (msg.type === "result") {
      pending.delete(msg.id);
      const { id, type, ...result } = msg;
      wait.resolve(result);
    }
  };

  worker.onerror = (err) => {
    for (const p of pending.values()) p.reject(err);
    pending.clear();
  };

  function search({ board, side, difficulty, historyMoves, timeMs, onInfo }) {
    const id = ++seq;
    const d = DIFFICULTY[difficulty] || DIFFICULTY.medium;
    const options = {
      difficulty,
      timeMs: timeMs ?? d.timeMs,
      maxDepth: d.depth,
      noise: d.noise,
      pool: d.pool,
      secondBest: d.secondBest,
      useBook: difficulty !== "easy",
    };
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject, onInfo });
      worker.postMessage({ id, type: "search", board, side, options, historyMoves: historyMoves || [] });
    });
  }

  function stop() {
    worker.postMessage({ type: "stop" });
  }

  function terminate() {
    worker.terminate();
    for (const p of pending.values()) {
      p.reject(new Error("engine terminated"));
    }
    pending.clear();
  }

  return { search, stop, terminate };
}
