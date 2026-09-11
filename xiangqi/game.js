/**
 * 对局编排：开局布阵、走子、三拍吃子、引擎、复盘、存档。
 * 渲染走 world/scene，规则走 engine，角色走 units。
 */
import {
  BLACK,
  KING,
  PHASE,
  RED,
} from "./core/constants.js";
import { tileToWorld } from "./core/coords.js";
import { evaluate, evaluateRed } from "./engine/evaluate.js";
import { createEngineHost } from "./engine/host.js";
import { isPerpetualCheck, isSixtyMoveDraw } from "./engine/repetition.js";
import {
  applyMove,
  cloneBoard,
  createInitialBoard,
  findKing,
  getLegalMoves,
  getStatus,
  isInCheck,
  opposite,
  positionKey,
} from "./engine/rules.js";
import { classifyDelta, createReviewController } from "./ui/review.js";
import { toNotation } from "./ui/notation.js";
import { applyIk, resetIk } from "./units/ik.js";
import { buildClips, playClip, updateMixer } from "./units/animations.js";
import { playCapture, playWalk } from "./units/combat.js";
import { createUnit } from "./units/factory.js";
import { createScene } from "./world/scene.js";

function pieceCount(board) {
  let n = 0;
  for (const row of board) for (const p of row) if (p) n += 1;
  return n;
}

function sideName(side) {
  return side === RED ? "汉军" : "楚军";
}

export function createGame(canvas, ui) {
  const hud = ui.hud;
  const audio = ui.audio;
  const storage = ui.storage;
  const view = createScene(canvas);
  view.setAdaptivePixelRatio(true);

  const engine = ui.onNeedEngine === false ? null : createEngineHost();

  let board = createInitialBoard();
  let meshes = [];
  let turn = RED;
  let selected = null;
  let legal = [];
  let hover = null;
  let history = [];
  let moveList = [];
  let hashes = [];
  let checkFlags = [];
  let halfmove = 0;
  let captured = { red: [], black: [] };
  let parked = { red: [], black: [] };
  let jobs = [];
  let phase = PHASE.LOBBY;
  let over = false;
  let started = false;
  let vs = "ai";
  let difficulty = "medium";
  let startedAt = Date.now();
  let silOn = false;
  let thinking = false;
  let review = null;
  let reviewBoards = [];
  let last = performance.now();

  function busy() {
    return jobs.length > 0 || thinking || phase === PHASE.PARADE || phase === PHASE.CAPTURE || phase === PHASE.CEREMONY;
  }

  function homeOf(f, r) {
    const w = tileToWorld(f, r);
    return w;
  }

  function facing(unit) {
    unit.rotation.y = unit.userData.side === BLACK ? Math.PI : 0;
  }

  function clearJobs() {
    jobs = [];
  }

  function clearPieces() {
    while (view.pieceRoot.children.length) {
      view.pieceRoot.remove(view.pieceRoot.children[0]);
    }
    meshes = Array.from({ length: 10 }, () => Array(9).fill(null));
    parked = { red: [], black: [] };
  }

  function spawnUnit(type, side, f, r, world) {
    const unit = createUnit(type, side);
    buildClips(unit);
    playClip(unit, "idle", { fade: 0, loop: true });
    const w = world || homeOf(f, r);
    unit.position.set(w.x, w.y, w.z);
    facing(unit);
    unit.userData.f = f;
    unit.userData.r = r;
    unit.userData.homeY = w.y;
    unit.userData.lastPos = unit.position.clone();
    view.pieceRoot.add(unit);
    if (Number.isInteger(f) && Number.isInteger(r) && f >= 0) meshes[r][f] = unit;
    return unit;
  }

  function spawnAll(place = true) {
    clearPieces();
    for (let r = 0; r < 10; r++) {
      for (let f = 0; f < 9; f++) {
        const p = board[r][f];
        if (!p) continue;
        const w = place ? homeOf(f, r) : offBoard(p.side, f, r);
        spawnUnit(p.type, p.side, f, r, w);
      }
    }
  }

  function offBoard(side, f, r) {
    const dest = homeOf(f, r);
    const z = side === RED ? dest.z - 7.4 : dest.z + 7.4;
    return { x: dest.x, y: dest.y, z };
  }

  function clearSelect() {
    selected = null;
    legal = [];
    view.setHighlights(null, []);
  }

  function selectAt(f, r) {
    const p = board[r][f];
    if (!p || p.side !== turn) return false;
    if (vs === "ai" && turn === BLACK) return false;
    selected = { f, r };
    legal = getLegalMoves(board, f, r);
    view.setHighlights(selected, legal);
    audio?.move?.();
    return true;
  }

  function persist() {
    storage?.saveGame?.({
      board,
      turn,
      mode: vs,
      vs,
      difficulty,
      moveList,
      halfmove,
      hashes,
      checkFlags,
      captured,
      startedAt,
    });
  }

  function updateHud() {
    if (!started || over) {
      hud.enableUndo(false);
      hud.enableHint(false);
      return;
    }
    const status = getStatus(board, turn);
    hud.setTurn(turn, status);
    hud.enableUndo(history.length > 0 && !busy());
    hud.enableHint(vs === "ai" && turn === RED && !busy());
    const king = findKing(board, turn);
    if (status === "check" && king) view.setCheckSquare(king.f, king.r);
    else view.setCheckSquare(null, null);
    hud.setEval(evaluateRed(board));
    hud.setCaptured("red", captured.red);
    hud.setCaptured("black", captured.black);
    const n = pieceCount(board);
    audio?.setSparse?.(n < 14 ? 1 - n / 14 : 0);
    if (n <= 12 && phase === PHASE.PLAYING) {
      view.cameraRig.setMode("endgame");
      view.env.setEndgame(true);
    }
  }

  function parkCaptured(unit, ownerSide) {
    if (!unit) return;
    unit.visible = true;
    const list = parked[ownerSide];
    const i = list.length;
    const x = ownerSide === RED ? -6.15 : 6.15;
    const z = -4.2 + i * 0.52;
    unit.position.set(x, homeOf(0, 0).y + 0.04, z);
    unit.rotation.set(0.18, ownerSide === RED ? 0.4 : -0.4, Math.PI / 2.4);
    unit.userData.f = -1;
    unit.userData.r = -1;
    unit.userData.moving = false;
    resetIk(unit);
    playClip(unit, "death", { fade: 0.05, loop: false });
    list.push(unit);
  }

  function endGame(winner, reason) {
    over = true;
    phase = PHASE.CEREMONY;
    clearSelect();
    thinking = false;
    hud.setTurn(winner, "over");
    hud.enableUndo(false);
    hud.enableHint(false);
    view.cameraRig.setMode("ceremony");
    audio?.ceremony?.();
    storage?.clearGame?.();

    for (const row of meshes) {
      for (const u of row) {
        if (!u) continue;
        if (u.userData.side === winner) playClip(u, "win", { fade: 0.12, loop: false });
        else if (u.userData.type === KING) playClip(u, "death", { fade: 0.1, loop: false });
      }
    }

    const title = `${sideName(winner)}胜`;
    setTimeout(() => {
      hud.showOver({ title, reason });
      phase = PHASE.REVIEW;
    }, 2200);
  }

  function afterMove() {
    const key = positionKey(board, turn);
    hashes.push(key);
    const inCheck = isInCheck(board, turn);
    checkFlags.push(inCheck);
    const status = getStatus(board, turn);

    if (isPerpetualCheck(hashes, checkFlags)) {
      endGame(turn, "长将");
      return;
    }
    if (isSixtyMoveDraw(halfmove)) {
      over = true;
      phase = PHASE.REVIEW;
      hud.showOver({ title: "和棋", reason: "六十回合不吃子" });
      storage?.clearGame?.();
      return;
    }
    if (status === "checkmate") {
      endGame(opposite(turn), "将死");
      return;
    }
    if (status === "stalemate") {
      endGame(opposite(turn), "困毙");
      return;
    }
    if (inCheck) {
      const king = findKing(board, turn);
      if (king) {
        const w = homeOf(king.f, king.r);
        const playMode = pieceCount(board) > 12 ? "middle" : "endgame";
        view.cameraRig.setMode("check");
        view.cameraRig.focusWorld(w, {
          dist: 10.4,
          durationHint: 0.45,
          restoreAfter: 0.9,
          restoreMode: playMode,
          restoreYaw: vs === "human" ? (turn === RED ? Math.PI : 0) : undefined,
        });
      }
      audio?.check?.();
      hud.setTurn(turn, "check");
    } else if (vs === "human") {
      view.cameraRig.faceSide(turn);
    }
    persist();
    updateHud();
    if (!over && vs === "ai" && turn === BLACK) requestAi();
  }

  function requestAi() {
    if (!engine || thinking || over) return;
    thinking = true;
    hud.setHint("楚军推敲…");
    hud.enableHint(false);
    const snapshot = cloneBoard(board);
    const side = turn;
    const hist = moveList.map((m) => ({ from: m.from, to: m.to }));
    engine
      .search({ board: snapshot, side, difficulty, historyMoves: hist })
      .then((result) => {
        thinking = false;
        hud.setHint("");
        if (over || turn !== side || !result?.move) {
          updateHud();
          return;
        }
        const { from, to } = result.move;
        const legalNow = getLegalMoves(board, from.f, from.r);
        const ok = legalNow.some((m) => m.f === to.f && m.r === to.r);
        if (!ok) {
          hud.setHint("引擎着法非法，已停手");
          return;
        }
        play(from, to);
      })
      .catch((err) => {
        thinking = false;
        console.warn(err);
        hud.setHint("引擎未应");
        updateHud();
      });
  }

  function play(from, to) {
    const dest = legal.length
      ? legal.find((m) => m.f === to.f && m.r === to.r)
      : getLegalMoves(board, from.f, from.r).find((m) => m.f === to.f && m.r === to.r);
    if (!dest) return false;

    const mover = meshes[from.r][from.f];
    if (!mover) return false;
    const capturedMesh = meshes[to.r][to.f];
    const piece = board[from.r][from.f];
    const capturedType = capturedMesh ? capturedMesh.userData.type : null;
    const before = evaluate(board, turn);
    const notation = toNotation(board, { from, to }, turn);

    history.push({
      board: cloneBoard(board),
      turn,
      halfmove,
      hashes: hashes.slice(),
      checkFlags: checkFlags.slice(),
      captured: { red: captured.red.slice(), black: captured.black.slice() },
      moveList: moveList.slice(),
    });

    if (capturedType) {
      captured[piece.side === RED ? "black" : "red"].push(capturedType);
      halfmove = 0;
    } else {
      halfmove += 1;
    }

    const next = applyMove(board, from, to);
    const after = turn === RED ? evaluateRed(next) : -evaluateRed(next);
    const tag = classifyDelta(after - before);
    moveList.push({ from, to, capture: !!capturedType, notation, tag, capturedType });
    hud.pushMove(notation, tag);

    clearSelect();
    const fromW = homeOf(from.f, from.r);
    const toW = homeOf(to.f, to.r);

    if (piece.type === "horse") audio?.hoof?.();
    else if (piece.type === "chariot") audio?.wheel?.();
    else if (piece.type === "cannon" && capturedType) audio?.catapult?.();

    const n = pieceCount(next);
    if (capturedMesh) {
      phase = PHASE.CAPTURE;
      view.cameraRig.setMode("capture");
      view.cameraRig.focusWorld(toW, { dist: 9.6, pitch: 1.02, durationHint: 0.4 });
      jobs.push(
        playCapture({
          attacker: mover,
          defender: capturedMesh,
          from: fromW,
          to: toW,
          type: piece.type,
          view,
          onHit: () => audio?.capture?.(),
          onDone: () => {
            meshes[from.r][from.f] = null;
            meshes[to.r][to.f] = mover;
            mover.userData.f = to.f;
            mover.userData.r = to.r;
            mover.userData.homeY = toW.y;
            parkCaptured(capturedMesh, capturedMesh.userData.side);
            board = next;
            turn = opposite(turn);
            phase = PHASE.PLAYING;
            if (n > 12) view.cameraRig.setMode("middle");
            else view.cameraRig.setMode("endgame");
            afterMove();
          },
        }),
      );
    } else {
      const dist = Math.hypot(toW.x - fromW.x, toW.z - fromW.z);
      const dur = Math.min(1.15, 0.42 + dist * 0.22);
      audio?.move?.();
      jobs.push(
        playWalk(mover, fromW, toW, dur, () => {
          meshes[from.r][from.f] = null;
          meshes[to.r][to.f] = mover;
          mover.userData.f = to.f;
          mover.userData.r = to.r;
          mover.userData.homeY = toW.y;
          board = next;
          turn = opposite(turn);
          afterMove();
        }),
      );
    }
    return true;
  }

  function handlePick(f, r) {
    if (!started || over || busy()) return;
    if (vs === "ai" && turn === BLACK) return;
    if (selected) {
      if (selected.f === f && selected.r === r) {
        clearSelect();
        return;
      }
      if (play(selected, { f, r })) return;
      const p = board[r][f];
      if (p && p.side === turn) {
        selectAt(f, r);
        return;
      }
      clearSelect();
      return;
    }
    selectAt(f, r);
  }

  function startParade(skip) {
    phase = PHASE.PARADE;
    hud.setSkipParadeVisible(true);
    view.cameraRig.setMode("opening");
    spawnAll(false);
    if (skip) {
      skipParade();
      return;
    }
    const units = [];
    view.pieceRoot.children.forEach((u) => {
      if (u.userData?.type) units.push(u);
    });
    units.sort((a, b) => {
      const ra = a.userData.side === RED ? a.userData.r : 9 - a.userData.r;
      return ra - (b.userData.side === RED ? b.userData.r : 9 - b.userData.r) || a.userData.f - b.userData.f;
    });
    let remaining = units.length;
    units.forEach((u, i) => {
      const dest = homeOf(u.userData.f, u.userData.r);
      const from = { x: u.position.x, y: u.position.y, z: u.position.z };
      const delay = 0.18 + i * 0.22;
      const dur = 1.05 + (u.userData.type === "elephant" ? 0.35 : 0);
      let t = 0;
      let walk = null;
      jobs.push({
        update(dt) {
          t += dt;
          if (!walk) {
            if (t < delay) return false;
            walk = playWalk(u, from, dest, dur, () => {
              u.userData.homeY = dest.y;
              remaining -= 1;
              if (remaining <= 0) finishParade();
            });
          }
          return walk.update(dt);
        },
      });
    });
    if (!units.length) finishParade();
  }

  function finishParade() {
    hud.setSkipParadeVisible(false);
    phase = PHASE.PLAYING;
    view.cameraRig.setMode("middle");
    if (vs === "human") view.cameraRig.faceSide(turn);
    hashes = [positionKey(board, turn)];
    checkFlags = [false];
    persist();
    updateHud();
    if (vs === "ai" && turn === BLACK) requestAi();
  }

  function skipParade() {
    if (phase !== PHASE.PARADE) return;
    clearJobs();
    for (const row of meshes) {
      for (const u of row) {
        if (!u) continue;
        const w = homeOf(u.userData.f, u.userData.r);
        u.position.set(w.x, w.y, w.z);
        u.userData.homeY = w.y;
        u.userData.moving = false;
        resetIk(u);
        facing(u);
        playClip(u, "idle", { fade: 0.1, loop: true });
      }
    }
    finishParade();
  }

  function beginMatch({ vs: nextVs, difficulty: nextDiff, saved } = {}) {
    vs = nextVs || saved?.vs || saved?.mode || "ai";
    difficulty = nextDiff || saved?.difficulty || "medium";
    started = true;
    over = false;
    thinking = false;
    startedAt = saved?.startedAt || Date.now();
    selected = null;
    legal = [];
    hover = null;
    history = [];
    review = null;
    reviewBoards = [];
    clearJobs();
    hud.hideOver();
    hud.hideReview();
    hud.hideLobby();
    hud.setDifficulty(vs === "human" ? "human" : difficulty);
    hud.setHint("");
    view.setSilhouette(silOn);
    view.env.setEndgame(false);
    view.cameraRig.setMode("opening");

    if (saved?.board) {
      board = saved.board;
      turn = saved.turn || RED;
      moveList = saved.moveList || [];
      halfmove = saved.halfmove || 0;
      hashes = saved.hashes || [];
      checkFlags = saved.checkFlags || [];
      captured = saved.captured || { red: [], black: [] };
      spawnAll(true);
      for (const n of saved.moveList || []) hud.pushMove(n.notation || n, n.tag);
      phase = PHASE.PLAYING;
      hud.setSkipParadeVisible(false);
      persist();
      updateHud();
      if (vs === "ai" && turn === BLACK) requestAi();
      return;
    }

    board = createInitialBoard();
    turn = RED;
    moveList = [];
    halfmove = 0;
    hashes = [];
    checkFlags = [];
    captured = { red: [], black: [] };
    startParade(false);
  }

  function start(mode = {}) {
    storage?.clearGame?.();
    beginMatch({
      vs: mode.vs || "ai",
      difficulty: mode.difficulty || "medium",
    });
  }

  function continueSaved() {
    const saved = storage?.loadGame?.();
    if (!saved) {
      hud.showLobby();
      return;
    }
    beginMatch({ saved });
  }

  function restart() {
    start({ vs, difficulty });
  }

  function undo() {
    if (!history.length || busy() || over) return;
    engine?.stop?.();
    thinking = false;
    const prev = history.pop();
    board = prev.board;
    turn = prev.turn;
    halfmove = prev.halfmove;
    hashes = prev.hashes;
    checkFlags = prev.checkFlags;
    captured = prev.captured;
    moveList = prev.moveList;
    spawnAll(true);
    const list = document.getElementById("move-list");
    if (list) list.replaceChildren();
    for (const n of moveList) hud.pushMove(n.notation, n.tag);
    over = false;
    hud.hideOver();
    phase = PHASE.PLAYING;
    persist();
    updateHud();
  }

  function resign() {
    if (!started || over || busy()) return;
    endGame(opposite(turn), `${sideName(turn)}认输`);
  }

  function hint() {
    if (!engine || busy() || over || turn !== RED) return;
    hud.setHint("推敲…");
    const snapshot = cloneBoard(board);
    const hist = moveList.map((m) => ({ from: m.from, to: m.to }));
    engine
      .search({ board: snapshot, side: turn, difficulty: "hard", historyMoves: hist, timeMs: 700 })
      .then((result) => {
        if (!result?.move) {
          hud.setHint("");
          return;
        }
        const { from, to } = result.move;
        const text = toNotation(board, result.move, turn);
        hud.setHint(text ? `可走 ${text}` : "");
        view.setHighlights(from, [{ f: to.f, r: to.r, capture: !!board[to.r][to.f] }]);
      })
      .catch(() => hud.setHint(""));
  }

  function toggleSilhouette() {
    silOn = !silOn;
    view.setSilhouette(silOn);
  }

  function snapshotBoards() {
    const boards = [createInitialBoard()];
    let b = createInitialBoard();
    for (const m of moveList) {
      b = applyMove(b, m.from, m.to);
      boards.push(cloneBoard(b));
    }
    return boards;
  }

  function showPly(ply) {
    const boards = reviewBoards.length ? reviewBoards : snapshotBoards();
    reviewBoards = boards;
    const b = boards[Math.min(ply, boards.length - 1)];
    board = cloneBoard(b);
    spawnAll(true);
    const mv = moveList[ply];
    if (mv) hud.setHint(mv.notation + (mv.tag ? ` · ${mv.tag}` : ""));
    else hud.setHint("开局");
  }

  function reviewNext() {
    if (!review) {
      reviewBoards = snapshotBoards();
      review = createReviewController({
        boardRestorer: showPly,
        engineHint: (ply) => {
          const mv = moveList[ply];
          if (!mv) return "开局";
          const tag = mv.tag === "blunder" ? "漏着" : mv.tag === "inaccurate" ? "不精确" : "好棋";
          return `${mv.notation} · ${tag}`;
        },
      });
      review.bind(moveList.length);
      phase = PHASE.REVIEW;
      view.cameraRig.setMode("endgame");
    }
    const snap = review.next();
    return snap.hint;
  }

  function reviewPrev() {
    if (!review) return reviewNext();
    const snap = review.prev();
    return snap.hint;
  }

  let down = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    down = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener("pointerup", (e) => {
    if (e.button !== 0) return;
    const startPt = down || { x: e.clientX, y: e.clientY };
    down = null;
    const dx = e.clientX - startPt.x;
    const dy = e.clientY - startPt.y;
    if (dx * dx + dy * dy > 784) return;
    const hit = view.pick(e.clientX, e.clientY);
    if (hit) handlePick(hit.f, hit.r);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!started || over || busy() || selected) return;
    const hit = view.pick(e.clientX, e.clientY);
    hover = hit && board[hit.r]?.[hit.f] ? `${hit.f},${hit.r}` : null;
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") clearSelect();
    if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      undo();
    }
  });

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const scale = view.worldTimeScale || 1;
    const step = dt * scale;

    for (let i = jobs.length - 1; i >= 0; i--) {
      if (jobs[i].update(step)) jobs.splice(i, 1);
    }

    view.pieceRoot.children.forEach((unit) => {
      if (!unit.userData?.type) return;
      updateMixer(unit, step);
      applyIk(unit, step, {
        groundedY: unit.userData.homeY ?? unit.position.y,
        moving: !!unit.userData.moving,
      });
      if (!unit.userData.moving && Number.isInteger(unit.userData.f) && unit.userData.f >= 0) {
        const selectedNow = selected && selected.f === unit.userData.f && selected.r === unit.userData.r;
        const hoverNow = hover === `${unit.userData.f},${unit.userData.r}`;
        const lift = selectedNow ? 0.07 : hoverNow ? 0.032 : 0;
        unit.position.y = (unit.userData.homeY ?? unit.position.y) + lift;
      }
    });

    if (started && !over && phase === PHASE.PLAYING) {
      audio?.tickMusic?.(dt, pieceCount(board));
    }

    view.render(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  requestAnimationFrame(() => view.resize());

  if (new URLSearchParams(location.search).has("silhouette")) {
    silOn = true;
    view.setSilhouette(true);
  }

  hud.showLobby();

  return {
    start,
    restart,
    undo,
    resign,
    hint,
    skipParade,
    toggleSilhouette,
    continueSaved,
    reviewNext,
    reviewPrev,
    resize: view.resize,
  };
}
