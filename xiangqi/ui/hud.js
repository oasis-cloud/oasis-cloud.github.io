import { DIFFICULTY, PIECE_LABEL, RED } from "../core/constants.js";
import { loadGame } from "./storage.js";

function el(dom, key, id) {
  if (dom && dom[key]) return dom[key];
  return document.getElementById(id);
}

function setHidden(node, hidden) {
  if (!node) return;
  node.hidden = !!hidden;
}

function setEnabled(btn, on) {
  if (!btn) return;
  btn.disabled = !on;
}

export function bindHud(dom = {}) {
  const root = el(dom, "hud", "hud");
  const lobby = el(dom, "lobby", "lobby");
  const over = el(dom, "over", "over");
  const review = el(dom, "review", "review");
  const moveList = el(dom, "moveList", "move-list");
  const turnEl = el(dom, "turn", "turn");
  const hintEl = el(dom, "hint", "hint-text");
  const modeEl = el(dom, "modeLabel", "mode-label");
  const evalRoot = el(dom, "evalBar", "eval-ink");
  const evalHan = el(dom, "evalHan", "eval-han");
  const evalChu = el(dom, "evalChu", "eval-chu");
  const capturedRed = el(dom, "capturedRed", "captured-red");
  const capturedBlack = el(dom, "capturedBlack", "captured-black");
  const overTitle = el(dom, "overTitle", "over-title");
  const overReason = el(dom, "overReason", "over-reason");
  const reviewHint = el(dom, "reviewHint", "review-hint");
  const btnContinue = el(dom, "btnContinue", "btn-continue");
  const btnUndo = el(dom, "btnUndo", "btn-undo");
  const btnHint = el(dom, "btnHint", "btn-hint");
  const btnSkip = el(dom, "btnSkip", "btn-skip");
  const btnEasy = el(dom, "btnEasy", "btn-start-easy");
  const btnMedium = el(dom, "btnMedium", "btn-start-medium");
  const btnHard = el(dom, "btnHard", "btn-start-hard");
  const btnHuman = el(dom, "btnHuman", "btn-start-human");

  function paintCaptured(node, side, typeList) {
    if (!node) return;
    node.replaceChildren();
    const labels = PIECE_LABEL[side] || PIECE_LABEL.red;
    for (const type of typeList || []) {
      const span = document.createElement("span");
      span.className = "fallen";
      span.textContent = labels[type] || type;
      node.appendChild(span);
    }
  }

  function markDifficulty(id) {
    const map = { easy: btnEasy, medium: btnMedium, hard: btnHard, human: btnHuman };
    for (const [key, btn] of Object.entries(map)) {
      if (!btn) continue;
      const on = key === id;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  const api = {
    showLobby() {
      setHidden(lobby, false);
      setHidden(over, true);
      setHidden(review, true);
      setHidden(root, true);
      if (moveList) moveList.replaceChildren();
      if (hintEl) hintEl.textContent = "";
      if (reviewHint) reviewHint.textContent = "";
      paintCaptured(capturedRed, "red", []);
      paintCaptured(capturedBlack, "black", []);
      api.setEval(0);
      if (btnContinue) {
        const saved = loadGame();
        setHidden(btnContinue, !saved);
      }
    },

    hideLobby() {
      setHidden(lobby, true);
      setHidden(root, false);
    },

    setTurn(side, status) {
      if (!turnEl) return;
      const army = side === RED || side === "red" ? "汉军走" : "楚军走";
      if (status === "check" || status === "将军") {
        turnEl.textContent = "将军";
        turnEl.dataset.kind = "check";
      } else if (status === "checkmate" || status === "over") {
        turnEl.textContent = status === "checkmate" ? "将死" : army;
        turnEl.dataset.kind = "over";
      } else {
        turnEl.textContent = army;
        turnEl.dataset.kind = side === RED || side === "red" ? "han" : "chu";
      }
    },

    setDifficulty(id) {
      markDifficulty(id);
      const diff = DIFFICULTY[id];
      if (id === "human") api.setModeLabel("人对人");
      else if (diff) api.setModeLabel(diff.label);
    },

    pushMove(notation, evalTag) {
      if (!moveList || !notation) return;
      const li = document.createElement("li");
      li.className = "move-item";
      li.textContent = notation;
      if (evalTag) {
        li.dataset.eval = evalTag;
        li.classList.add(`eval-${evalTag}`);
      }
      moveList.appendChild(li);
      moveList.scrollTop = moveList.scrollHeight;
    },

    setEval(cp) {
      const n = cp === Infinity ? 8000 : cp === -Infinity ? -8000 : Number(cp);
      const v = Number.isFinite(n) ? Math.tanh(n / 380) : 0;
      const mag = Math.abs(v);
      if (evalRoot) evalRoot.style.setProperty("--eval", String(v));
      if (evalHan) {
        evalHan.style.opacity = v > 0 ? String(0.25 + mag * 0.7) : "0";
        evalHan.style.height = v > 0 ? `${50 + mag * 50}%` : "0%";
      }
      if (evalChu) {
        evalChu.style.opacity = v < 0 ? String(0.25 + mag * 0.7) : "0";
        evalChu.style.height = v < 0 ? `${50 + mag * 50}%` : "0%";
      }
    },

    setCaptured(side, typeList) {
      if (side === RED || side === "red") paintCaptured(capturedRed, "red", typeList);
      else paintCaptured(capturedBlack, "black", typeList);
    },

    setModeLabel(text) {
      if (modeEl) modeEl.textContent = text || "";
    },

    showOver({ title, reason } = {}) {
      if (overTitle) overTitle.textContent = title || "";
      if (overReason) overReason.textContent = reason || "";
      setHidden(over, false);
    },

    hideOver() {
      setHidden(over, true);
    },

    showReview() {
      setHidden(review, false);
      setHidden(over, true);
    },

    hideReview() {
      setHidden(review, true);
    },

    enableUndo(on) {
      setEnabled(btnUndo, !!on);
    },

    enableHint(on) {
      setEnabled(btnHint, !!on);
    },

    setHint(text) {
      if (hintEl) hintEl.textContent = text || "";
      if (review && !review.hidden && reviewHint && text) {
        reviewHint.textContent = text;
      }
    },

    setSkipParadeVisible(on) {
      setHidden(btnSkip, !on);
    },
  };

  api.setSkipParadeVisible(false);
  api.enableUndo(false);
  api.enableHint(false);
  api.setEval(0);
  return api;
}
