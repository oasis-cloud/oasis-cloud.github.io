import { STORAGE_KEY } from "../core/constants.js";

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || typeof state !== "object") return null;
    if (!state.board || !state.turn) return null;
    return {
      board: state.board,
      turn: state.turn,
      mode: state.mode ?? null,
      vs: state.vs ?? null,
      difficulty: state.difficulty ?? null,
      moveList: Array.isArray(state.moveList) ? state.moveList : [],
      halfmove: Number.isFinite(state.halfmove) ? state.halfmove : 0,
      hashes: Array.isArray(state.hashes) ? state.hashes : [],
      checkFlags: Array.isArray(state.checkFlags) ? state.checkFlags : [],
      captured: state.captured ?? { red: [], black: [] },
      evals: Array.isArray(state.evals) ? state.evals : [],
      startedAt: state.startedAt ?? null,
    };
  } catch {
    return null;
  }
}

export function saveGame(state) {
  if (!state || typeof state !== "object") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        board: state.board,
        turn: state.turn,
        mode: state.mode ?? null,
        vs: state.vs ?? null,
        difficulty: state.difficulty ?? null,
        moveList: state.moveList ?? [],
        halfmove: state.halfmove ?? 0,
        hashes: state.hashes ?? [],
        checkFlags: state.checkFlags ?? [],
        captured: state.captured ?? { red: [], black: [] },
        evals: state.evals ?? [],
        startedAt: state.startedAt ?? Date.now(),
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function loadGame() {
  return readState();
}

export function clearGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
