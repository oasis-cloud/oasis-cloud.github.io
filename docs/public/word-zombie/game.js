import { createAudio } from "./audio.js";
import { createBestiary } from "./bestiary.js";
import { createCombo } from "./combo.js";
import {
  DICTATE_SPEED,
  LEAK_DAMAGE,
  MAX_ALIVE_LANES,
  MAX_HP,
  PEA_SPEED,
  SLOW_FACTOR,
  STREAK_CAP,
  STREAK_STEP,
  STUN_MS,
  VOICE,
} from "./config.js";
import { createDeck, MODE_DICTATE, streakSpeed } from "./deck.js";
import { createDoodle } from "./doodle.js";
import { MONSTERS } from "./monsters/index.js";
import { createScene } from "./scene.js";
import {
  loadSettings,
  loadStreak,
  loadWordsText,
  saveSettings,
  saveStreak,
  saveWordsText,
} from "./storage.js";
import { createVoice } from "./voice.js";
import { DEFAULT_WORDS, parseWordList } from "./words.js";

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const doodle = createDoodle(ctx);
const scene = createScene(ctx, doodle);
const audio = createAudio();
const voice = createVoice();
const combo = createCombo();
const bestiary = createBestiary();

const lobbyEl = document.getElementById("lobby");
const pauseEl = document.getElementById("pause");
const overEl = document.getElementById("gameover");
const winEl = document.getElementById("victory");
const dexEl = document.getElementById("dex");
const hudEl = document.getElementById("hud");
const wordInput = document.getElementById("word-input");
const batchInput = document.getElementById("batch-input");
const speedInput = document.getElementById("speed-input");
const speedLabel = document.getElementById("speed-label");
const parseError = document.getElementById("parse-error");
const hpFill = document.getElementById("hp-fill");
const progressEl = document.getElementById("progress");
const comboEl = document.getElementById("combo");
const spellEl = document.getElementById("spell");
const stunHint = document.getElementById("stun-hint");
const overStats = document.getElementById("over-stats");
const winStars = document.getElementById("win-stars");
const winStats = document.getElementById("win-stats");

const state = {
  phase: "lobby",
  words: [],
  deck: null,
  monsters: [],
  peas: [],
  hp: MAX_HP,
  kills: 0,
  leaked: false,
  announcedDictate: false,
  buffer: "",
  stunUntil: 0,
  missUntil: 0,
  last: performance.now(),
  w: 960,
  h: 540,
  ground: 400,
  plantX: 210,
  plantY: 0,
  cabinX: 48,
  batchSize: 1,
  parentSpeed: 1,
  speedScale: 1,
  streak: loadStreak(),
};

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function show(el, on) {
  el.hidden = !on;
}

function hideOverlays() {
  show(lobbyEl, false);
  show(pauseEl, false);
  show(overEl, false);
  show(winEl, false);
  show(dexEl, false);
}

function layout() {
  const frame = document.getElementById("frame");
  const rect = frame.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(640, Math.floor(rect.width * dpr));
  canvas.height = Math.max(360, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.w = rect.width;
  state.h = rect.height;
  state.ground = state.h * 0.78;
  state.plantY = state.ground - 8;
  state.plantX = Math.max(188, state.w * 0.2);
  state.cabinX = 36;
}

function laneY(lane) {
  return state.ground - 6 - lane * 58;
}

function setHud() {
  hpFill.style.width = `${Math.max(0, (state.hp / MAX_HP) * 100)}%`;
  const total = state.deck ? state.deck.total : 0;
  progressEl.textContent = total ? `${state.kills} / ${total}` : "0 / 0";
  comboEl.textContent = combo.count > 1 ? `连击 ${combo.count}` : "";
  comboEl.hidden = combo.count <= 1;
}

function updateSpellHud() {
  spellEl.classList.remove("active", "miss");
  const now = performance.now();
  stunHint.hidden = !(state.phase === "playing" && now < state.stunUntil);
  if (state.phase === "playing" && now < state.missUntil) {
    spellEl.classList.add("miss");
    spellEl.textContent = "拼写不对";
    return;
  }
  if (!state.buffer) {
    spellEl.textContent = "";
    return;
  }
  spellEl.classList.add("active");
  spellEl.textContent = state.buffer;
}

function readSettingsFromForm() {
  const batch = clamp(Math.round(Number(batchInput.value) || 1), 1, 12);
  const speed = clamp(Number(speedInput.value) || 1, 0.5, 2.5);
  batchInput.value = String(batch);
  speedInput.value = String(speed);
  speedLabel.textContent = `${speed.toFixed(1)}×`;
  state.batchSize = batch;
  state.parentSpeed = speed;
  state.speedScale = streakSpeed(speed, state.streak, STREAK_STEP, STREAK_CAP);
  saveSettings({ batch, speed });
}

function applyLoadedSettings() {
  const loaded = loadSettings({
    batch: Number(batchInput.defaultValue) || 1,
    speed: Number(speedInput.defaultValue) || 1,
  });
  const batch = clamp(Math.round(loaded.batch), 1, 12);
  const speed = clamp(loaded.speed, 0.5, 2.5);
  batchInput.value = String(batch);
  speedInput.value = String(speed);
  speedLabel.textContent = `${speed.toFixed(1)}×`;
  state.batchSize = batch;
  state.parentSpeed = speed;
  state.speedScale = streakSpeed(speed, state.streak, STREAK_STEP, STREAK_CAP);
}

function pickKind() {
  const used = new Set(state.monsters.map((z) => z.kind));
  const unused = [];
  for (let i = 0; i < MONSTERS.length; i++) {
    if (!used.has(i)) unused.push(i);
  }
  const pool = unused.length ? unused : [...Array(MONSTERS.length).keys()];
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnMonster() {
  const card = state.deck?.draw();
  if (!card) return;
  const kind = pickKind();
  const species = MONSTERS[kind];
  const alive = state.monsters.length;
  const lane = alive % MAX_ALIVE_LANES;
  const col = Math.floor(alive / MAX_ALIVE_LANES);
  const modeMul = card.mode === MODE_DICTATE ? DICTATE_SPEED : 1;
  if (card.mode === MODE_DICTATE && !state.announcedDictate) {
    state.announcedDictate = true;
    voice.speakZh(VOICE.firstDictate);
  }
  bestiary.markSeen(species.id);
  state.monsters.push({
    word: card.word,
    mode: card.mode,
    kind,
    x: state.w + 8 + lane * 36 + col * 100 + Math.random() * 20,
    lane,
    speed: (species.speed + Math.random() * 8) * state.speedScale * modeMul,
    seed: Math.random() * 100,
    phase: Math.random() * Math.PI * 2,
    dead: false,
  });
}

function maintainMonsters() {
  if (!state.deck) return;
  const alive = state.monsters.filter((z) => !z.dead).length;
  for (let i = alive; i < state.batchSize; i++) spawnMonster();
}

function visibleMonsters() {
  return state.monsters.filter((z) => !z.dead && z.x < state.w + 70 && z.x > -30);
}

function matchingMonsters(buf) {
  if (!buf) return [];
  const b = buf.toLowerCase();
  return visibleMonsters().filter((z) => z.word.en.toLowerCase().startsWith(b));
}

function fireAt(monster) {
  if (performance.now() < state.stunUntil) return;
  audio.tone(420, 0.09, "sine", 0.08);
  state.peas.push({
    x: state.plantX + 46,
    y: state.plantY - 62,
    target: monster,
    seed: Math.random() * 10,
  });
}

function leftover() {
  return Math.max(0, (state.deck?.total || 0) - state.kills);
}

function winGame() {
  if (state.phase !== "playing") return;
  state.phase = "win";
  state.buffer = "";
  updateSpellHud();
  state.streak += 1;
  saveStreak(state.streak);
  const stars = 1 + (state.hp > MAX_HP * 0.5 ? 1 : 0) + (state.leaked ? 0 : 1);
  winStars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
  winStats.textContent = `打对 ${state.kills} 次。连胜 ${state.streak}。汤姆大叔说木屋保住了。`;
  show(hudEl, false);
  show(winEl, true);
  voice.speakZh(VOICE.win);
}

function loseGame() {
  if (state.phase !== "playing") return;
  state.phase = "over";
  state.buffer = "";
  updateSpellHud();
  state.streak = 0;
  saveStreak(0);
  overStats.textContent = `还剩 ${leftover()} 次没打对。本局击杀 ${state.kills} 只单词怪兽。汤姆大叔的小木屋需要重修。`;
  show(hudEl, false);
  show(overEl, true);
  voice.speakZh(VOICE.lose);
}

function tryWin() {
  if (state.hp > 0 && state.deck?.isClear(state.monsters.length)) winGame();
}

function leakMonster(monster) {
  if (monster.dead) return;
  monster.dead = true;
  combo.reset();
  state.leaked = true;
  state.hp = Math.max(0, state.hp - LEAK_DAMAGE);
  state.deck.returnCard(monster);
  state.monsters = state.monsters.filter((z) => z !== monster);
  state.peas = state.peas.filter((p) => p.target !== monster);
  setHud();
  maintainMonsters();
  if (state.hp <= 0) loseGame();
}

function killMonster(monster) {
  if (monster.dead) return;
  monster.dead = true;
  audio.tone(240, 0.12, "triangle", 0.09);
  voice.speakEn(monster.word.en);
  const species = MONSTERS[monster.kind];
  bestiary.markDefeated(species?.id);
  state.deck.complete(monster);
  state.kills += 1;
  const fx = combo.registerHit(performance.now());
  if (fx.heal) state.hp = Math.min(MAX_HP, state.hp + fx.heal);
  if (fx.combo5Voice) voice.speakZh(VOICE.combo5);
  state.monsters = state.monsters.filter((z) => z !== monster);
  setHud();
  maintainMonsters();
  tryWin();
}

function onLetter(ch) {
  if (state.phase !== "playing") return;
  if (performance.now() < state.stunUntil) {
    audio.tone(90, 0.08, "sawtooth", 0.05);
    return;
  }
  if (!visibleMonsters().length) return;
  const next = state.buffer + ch;
  const hits = matchingMonsters(next);
  if (!hits.length) {
    state.buffer = "";
    combo.reset();
    setHud();
    state.missUntil = performance.now() + 420;
    state.stunUntil = performance.now() + STUN_MS;
    audio.tone(80, 0.12, "sawtooth", 0.06);
    updateSpellHud();
    return;
  }
  state.buffer = next;
  const exact = hits.filter((z) => z.word.en.toLowerCase() === next);
  if (exact.length) {
    exact.sort((a, b) => a.x - b.x);
    fireAt(exact[0]);
    state.buffer = "";
  }
  updateSpellHud();
}

function resetRound() {
  state.hp = MAX_HP;
  state.kills = 0;
  state.leaked = false;
  state.announcedDictate = false;
  state.buffer = "";
  state.monsters = [];
  state.peas = [];
  state.stunUntil = 0;
  state.missUntil = 0;
  combo.reset();
  state.deck = createDeck(state.words);
  setHud();
  updateSpellHud();
  maintainMonsters();
}

function startRound(words) {
  readSettingsFromForm();
  state.words = words;
  state.phase = "playing";
  resetRound();
  hideOverlays();
  show(hudEl, true);
  audio.unlock();
  voice.speakZh(VOICE.start);
}

function pauseGame() {
  if (state.phase !== "playing") return;
  state.phase = "paused";
  show(pauseEl, true);
}

function resumeGame() {
  if (state.phase !== "paused") return;
  state.phase = "playing";
  state.last = performance.now();
  show(pauseEl, false);
}

function goLobby() {
  state.phase = "lobby";
  state.buffer = "";
  show(hudEl, false);
  hideOverlays();
  show(lobbyEl, true);
}

function currentWordsFromInput() {
  const text = wordInput.value;
  const parsed = parseWordList(text);
  if (!parsed.ok.length) {
    parseError.textContent = parsed.errors.length
      ? `第 ${parsed.errors.join("、")} 行无法解析，且没有有效词条`
      : "至少需要一条「英文,中文」";
    return null;
  }
  parseError.textContent = parsed.errors.length
    ? `第 ${parsed.errors.join("、")} 行已跳过；其余 ${parsed.ok.length} 条可用`
    : "";
  saveWordsText(text);
  return parsed.ok;
}

function tick(now) {
  try {
    step(now);
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(tick);
}

function step(now) {
  const dt = Math.min(0.12, (now - state.last) / 1000);
  state.last = now;
  const stunned = now < state.stunUntil;
  const inked = combo.slowActive(now);

  if (state.phase === "playing") {
    const move = inked ? SLOW_FACTOR : 1;
    for (const z of state.monsters) {
      if (z.dead) continue;
      z.phase += dt * 5;
      z.x -= z.speed * move * dt;
      if (z.x < state.plantX + 18) leakMonster(z);
      if (state.phase !== "playing") break;
    }

    for (const p of state.peas) {
      const t = p.target;
      if (!t || t.dead) {
        p.spent = true;
        continue;
      }
      const ty = laneY(t.lane) - 70;
      const dx = t.x - p.x;
      const dy = ty - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = PEA_SPEED * dt;
      if (dist <= step + 12) {
        killMonster(t);
        p.spent = true;
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    }
    state.peas = state.peas.filter((p) => !p.spent);
    if (now > state.missUntil && spellEl.classList.contains("miss") && !state.buffer) {
      updateSpellHud();
    }
  }

  scene.drawPaper(state.w, state.h);
  scene.drawGrass(state.w, state.ground);
  scene.drawCabin(state.cabinX, state.ground);
  scene.drawPea(state.plantX, state.plantY, { stunned, glowing: combo.glowing() });
  const hl = new Set(matchingMonsters(state.buffer));
  const ordered = [...state.monsters].sort((a, b) => a.lane - b.lane);
  for (const z of ordered) scene.drawMonster(z, laneY(z.lane), hl.has(z), inked);
  for (const p of state.peas) scene.drawPeaShot(p);
}

let dexBack = "lobby";

function openDex(back) {
  dexBack = back;
  show(lobbyEl, false);
  show(pauseEl, false);
  bestiary.render(document.getElementById("dex-grid"));
  show(dexEl, true);
  const grid = document.getElementById("dex-grid");
  if (grid) grid.scrollTop = 0;
}

function closeDex() {
  show(dexEl, false);
  if (dexBack === "pause") show(pauseEl, true);
  else show(lobbyEl, true);
}

wordInput.value = loadWordsText(DEFAULT_WORDS);
applyLoadedSettings();
speedInput.addEventListener("input", () => {
  const speed = clamp(Number(speedInput.value) || 1, 0.5, 2.5);
  speedLabel.textContent = `${speed.toFixed(1)}×`;
});
layout();
window.addEventListener("resize", layout);
requestAnimationFrame(tick);
bestiary.render(document.getElementById("dex-grid"));

document.getElementById("btn-default").addEventListener("click", () => {
  wordInput.value = DEFAULT_WORDS;
  parseError.textContent = "";
});
document.getElementById("btn-start").addEventListener("click", () => {
  const words = currentWordsFromInput();
  if (words) startRound(words);
});
document.getElementById("btn-dex").addEventListener("click", () => openDex("lobby"));
document.getElementById("btn-dex-pause").addEventListener("click", () => openDex("pause"));
document.getElementById("btn-dex-close").addEventListener("click", closeDex);
document.getElementById("btn-resume").addEventListener("click", resumeGame);
document.getElementById("btn-edit").addEventListener("click", goLobby);
document.getElementById("btn-restart").addEventListener("click", () => {
  const words = currentWordsFromInput() || state.words;
  if (words?.length) startRound(words);
});
document.getElementById("btn-again").addEventListener("click", () => {
  if (state.words.length) startRound(state.words);
});
document.getElementById("btn-again-edit").addEventListener("click", goLobby);
document.getElementById("btn-win-again").addEventListener("click", () => {
  if (state.words.length) startRound(state.words);
});
document.getElementById("btn-win-edit").addEventListener("click", goLobby);

document.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    if (!dexEl.hidden) {
      closeDex();
      return;
    }
    if (state.phase === "playing") pauseGame();
    else if (state.phase === "paused") resumeGame();
    return;
  }
  if (state.phase !== "playing") return;
  if (e.code === "Backspace") {
    e.preventDefault();
    state.buffer = state.buffer.slice(0, -1);
    updateSpellHud();
    return;
  }
  if (e.key.length === 1 && /[A-Za-z]/.test(e.key)) {
    e.preventDefault();
    onLetter(e.key.toLowerCase());
  }
});
