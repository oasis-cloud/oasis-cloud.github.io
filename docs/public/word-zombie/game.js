import {
  createDoodle,
  wobble,
  INK,
  INK_DARK,
  PAPER,
  LINE,
  ORANGE,
  GREEN,
  GREEN_DARK,
} from "./doodle.js";
import { MONSTERS } from "./monsters/index.js";

const STORAGE_KEY = "oasis-word-zombie-words";
const SETTINGS_KEY = "oasis-word-zombie-settings";
const SETTINGS_REV = 2;
const MAX_HP = 120;
const CONTACT_DPS = 18;
const STUN_MS = 1200;
const PEA_SPEED = 620;
const MAX_ALIVE_LANES = 4;

const DEFAULT_WORDS = `apple,苹果
book,书
water,水
friend,朋友
school,学校
family,家庭
happy,高兴
music,音乐
green,绿色的
jump,跳
run,跑
sleep,睡觉
bread,面包
river,河
mountain,山
window,窗户
morning,早晨
night,夜晚
question,问题
answer,答案`;

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const doodle = createDoodle(ctx);
const { strokePath, doodleEllipse, doodleRect } = doodle;
const lobbyEl = document.getElementById("lobby");
const pauseEl = document.getElementById("pause");
const overEl = document.getElementById("gameover");
const dexEl = document.getElementById("dex");
const hudEl = document.getElementById("hud");
const wordInput = document.getElementById("word-input");
const batchInput = document.getElementById("batch-input");
const speedInput = document.getElementById("speed-input");
const speedLabel = document.getElementById("speed-label");
const parseError = document.getElementById("parse-error");
const hpFill = document.getElementById("hp-fill");
const killsEl = document.getElementById("kills");
const spellEl = document.getElementById("spell");
const stunHint = document.getElementById("stun-hint");
const overStats = document.getElementById("over-stats");

function parseWordList(text) {
  const ok = [];
  const errors = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    let en = "";
    let zh = "";
    if (line.includes(",")) {
      const idx = line.indexOf(",");
      en = line.slice(0, idx).trim();
      zh = line.slice(idx + 1).trim();
    } else if (line.includes("\t")) {
      const parts = line.split("\t");
      en = parts[0].trim();
      zh = parts.slice(1).join(" ").trim();
    } else {
      const m = line.match(/^([A-Za-z][A-Za-z0-9\-']*)\s+(.+)$/);
      if (!m) {
        errors.push(i + 1);
        return;
      }
      en = m[1];
      zh = m[2].trim();
    }
    if (!/^[A-Za-z][A-Za-z0-9\-']*$/.test(en) || !zh) {
      errors.push(i + 1);
      return;
    }
    ok.push({ en, zh });
  });
  return { ok, errors };
}

function loadSavedWords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && saved.trim() ? saved : DEFAULT_WORDS;
  } catch {
    return DEFAULT_WORDS;
  }
}

function saveWords(text) {
  try {
    localStorage.setItem(STORAGE_KEY, text);
  } catch {
    /* ignore */
  }
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function readSettingsFromForm() {
  const batch = clamp(Math.round(Number(batchInput.value) || 1), 1, 12);
  const speed = clamp(Number(speedInput.value) || 1, 0.5, 2.5);
  batchInput.value = String(batch);
  speedInput.value = String(speed);
  speedLabel.textContent = `${speed.toFixed(1)}×`;
  state.batchSize = batch;
  state.speedScale = speed;
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ rev: SETTINGS_REV, batch, speed })
    );
  } catch {
    /* ignore */
  }
}

function loadSettings() {
  let batch = Number(batchInput.defaultValue) || 1;
  let speed = Number(speedInput.defaultValue) || 1;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.rev === SETTINGS_REV) {
        if (Number.isFinite(saved.batch)) batch = saved.batch;
        if (Number.isFinite(saved.speed)) speed = saved.speed;
      }
    }
  } catch {
    /* ignore */
  }
  batch = clamp(Math.round(batch), 1, 12);
  speed = clamp(speed, 0.5, 2.5);
  batchInput.value = String(batch);
  speedInput.value = String(speed);
  speedLabel.textContent = `${speed.toFixed(1)}×`;
  state.batchSize = batch;
  state.speedScale = speed;
}

let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, duration, type = "sine", gain = 0.07) {
  const ac = getAudio();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.5), ac.currentTime + duration);
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(g).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration + 0.02);
}

function speakWord(word) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

const state = {
  phase: "lobby",
  words: [],
  monsters: [],
  peas: [],
  hp: MAX_HP,
  kills: 0,
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
  speedScale: 1,
};

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

window.addEventListener("resize", layout);

function show(el, on) {
  el.hidden = !on;
}

function setHud() {
  hpFill.style.width = `${Math.max(0, (state.hp / MAX_HP) * 100)}%`;
  killsEl.textContent = `SCORE ${state.kills}`;
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

function laneY(lane) {
  return state.ground - 6 - lane * 58;
}

function pickWord() {
  const used = new Set(state.monsters.map((z) => z.word.en.toLowerCase()));
  const unused = state.words.filter((w) => !used.has(w.en.toLowerCase()));
  const pool = unused.length ? unused : state.words;
  return pool[Math.floor(Math.random() * pool.length)];
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
  if (!state.words.length) return;
  const word = pickWord();
  const kind = pickKind();
  const species = MONSTERS[kind];
  const alive = state.monsters.length;
  const lane = alive % MAX_ALIVE_LANES;
  const col = Math.floor(alive / MAX_ALIVE_LANES);
  state.monsters.push({
    word,
    kind,
    x: state.w + 8 + lane * 36 + col * 100 + Math.random() * 20,
    lane,
    speed: (species.speed + Math.random() * 8) * state.speedScale,
    seed: Math.random() * 100,
    phase: Math.random() * Math.PI * 2,
    dead: false,
  });
}

function maintainMonsters() {
  if (!state.words.length) return;
  const alive = state.monsters.filter((z) => !z.dead).length;
  for (let i = alive; i < state.batchSize; i++) spawnMonster();
}

function resetRound() {
  state.hp = MAX_HP;
  state.kills = 0;
  state.buffer = "";
  state.monsters = [];
  state.peas = [];
  state.stunUntil = 0;
  state.missUntil = 0;
  setHud();
  updateSpellHud();
  maintainMonsters();
}

function startRound(words) {
  readSettingsFromForm();
  state.words = words;
  state.phase = "playing";
  resetRound();
  show(lobbyEl, false);
  show(pauseEl, false);
  show(overEl, false);
  show(dexEl, false);
  show(hudEl, true);
  getAudio();
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

function gameOver() {
  state.phase = "over";
  state.buffer = "";
  updateSpellHud();
  overStats.textContent = `本局击杀 ${state.kills} 只单词怪兽。汤姆大叔的小木屋需要重修。`;
  show(hudEl, false);
  show(overEl, true);
}

function goLobby() {
  state.phase = "lobby";
  state.buffer = "";
  show(hudEl, false);
  show(pauseEl, false);
  show(overEl, false);
  show(dexEl, false);
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
  saveWords(text);
  return parsed.ok;
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
  playTone(420, 0.09, "sine", 0.08);
  state.peas.push({
    x: state.plantX + 46,
    y: state.plantY - 62,
    target: monster,
    seed: Math.random() * 10,
  });
}

function killMonster(monster) {
  if (monster.dead) return;
  monster.dead = true;
  playTone(240, 0.12, "triangle", 0.09);
  speakWord(monster.word.en);
  state.kills += 1;
  setHud();
  state.monsters = state.monsters.filter((z) => z !== monster);
  maintainMonsters();
}

function onLetter(ch) {
  if (state.phase !== "playing") return;
  if (performance.now() < state.stunUntil) {
    playTone(90, 0.08, "sawtooth", 0.05);
    return;
  }
  if (!visibleMonsters().length) return;
  const next = state.buffer + ch;
  const hits = matchingMonsters(next);
  if (!hits.length) {
    state.buffer = "";
    state.missUntil = performance.now() + 420;
    state.stunUntil = performance.now() + STUN_MS;
    playTone(80, 0.12, "sawtooth", 0.06);
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

function drawPaper() {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, state.w, state.h);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.2;
  for (let y = 28; y < state.h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(state.w, y + 1);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(43,108,176,0.04)";
  for (let i = 0; i < 40; i++) {
    ctx.fillRect((i * 97) % state.w, (i * 53) % state.h, 2, 2);
  }
}

function drawGrass() {
  ctx.save();
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1.6;
  const y = state.ground;
  strokePath(
    [
      [0, y + 4],
      [state.w * 0.3, y + wobble(2, 1, 3)],
      [state.w * 0.7, y + wobble(3, 2, 3)],
      [state.w, y + 6],
    ],
    INK,
    2.2
  );
  for (let x = 16; x < state.w; x += 18) {
    const h = 8 + (x % 7);
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + 2, y - h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCabin() {
  const x = state.cabinX;
  const g = state.ground;
  const w = 118;
  const h = 96;
  doodleRect(x, g - h, w, h, INK, 2.6, 11, "#f3e2c0");
  strokePath(
    [
      [x - 10, g - h + 8],
      [x + w / 2, g - h - 38],
      [x + w + 10, g - h + 8],
    ],
    ORANGE,
    3
  );
  doodleRect(x + 44, g - 42, 28, 40, INK, 2.2, 12, "#d9c39a");
  doodleRect(x + 14, g - h + 22, 26, 22, INK, 2, 13, "#cfe6f4");
  doodleRect(x + 78, g - h + 22, 26, 22, INK, 2, 14, "#cfe6f4");
  ctx.fillStyle = INK_DARK;
  ctx.font = "12px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText("汤姆大叔", x + 18, g - h - 46);
}

function drawPea(stunned) {
  const x = state.plantX;
  const g = state.plantY;
  const shake = stunned ? wobble(performance.now() / 80, 1, 2.5) : 0;
  const px = x + shake;
  strokePath(
    [
      [px, g],
      [px + 2, g - 28],
      [px - 4, g - 48],
    ],
    GREEN_DARK,
    4
  );
  doodleEllipse(px - 10, g - 18, 10, 16, GREEN, 2.2, 21, "#b7e39a");
  doodleEllipse(px + 12, g - 16, 11, 17, GREEN, 2.2, 22, "#b7e39a");
  doodleEllipse(px + 8, g - 72, 28, 26, GREEN_DARK, 2.8, 20, stunned ? "#9ccc88" : "#7ed957");
  doodleEllipse(px + 36, g - 70, 14, 11, GREEN_DARK, 2.2, 23, "#8fe06a");
  ctx.fillStyle = INK_DARK;
  ctx.beginPath();
  ctx.arc(px + 2, g - 76, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px + 16, g - 76, 3.2, 0, Math.PI * 2);
  ctx.fill();
  if (stunned) {
    ctx.fillStyle = "#c45c2a";
    ctx.font = "13px Comic Sans MS, Chalkboard SE, sans-serif";
    ctx.fillText("…", px + 22, g - 104);
  }
}

function drawWordCard(z, highlight, x, y) {
  const en = z.word.en;
  const zh = z.word.zh;
  ctx.font = "bold 16px Comic Sans MS, Chalkboard SE, sans-serif";
  const enW = ctx.measureText(en).width;
  ctx.font = "13px PingFang SC, Microsoft YaHei, sans-serif";
  const zhW = ctx.measureText(zh).width;
  const tw = Math.max(40, enW, zhW) + 16;
  const cardY = y - 156;
  doodleRect(x - tw / 2, cardY, tw, 36, INK, 1.8, z.seed + 4, highlight ? "#e8f2ff" : "#fffcf4");
  ctx.textAlign = "center";
  ctx.fillStyle = highlight ? ORANGE : INK_DARK;
  ctx.font = "bold 16px Comic Sans MS, Chalkboard SE, sans-serif";
  ctx.fillText(en, x, cardY + 15);
  ctx.fillStyle = INK_DARK;
  ctx.font = "13px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText(zh, x, cardY + 30);
}

function drawMonster(z, highlight) {
  const y = laneY(z.lane);
  const walk = Math.sin(z.phase) * 5;
  const x = z.x;
  const species = MONSTERS[z.kind] || MONSTERS[0];
  species.draw(doodle, { x, y, walk, seed: z.seed, hl: highlight });
  drawWordCard(z, highlight, x, y);
}

function drawPeaShot(p) {
  doodleEllipse(p.x, p.y, 9, 8, GREEN_DARK, 2, p.seed, "#7ed957");
}

function tick(now) {
  const dt = Math.min(0.05, (now - state.last) / 1000);
  state.last = now;
  const stunned = now < state.stunUntil;

  if (state.phase === "playing") {
    for (const z of state.monsters) {
      if (z.dead) continue;
      z.phase += dt * 5;
      z.x -= z.speed * dt;
      if (z.x < state.plantX + 18) {
        state.hp -= CONTACT_DPS * dt;
        z.x = Math.max(z.x, state.plantX + 10);
        setHud();
        if (state.hp <= 0) {
          state.hp = 0;
          gameOver();
        }
      }
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

  drawPaper();
  drawGrass();
  drawCabin();
  drawPea(stunned);
  const hl = new Set(matchingMonsters(state.buffer));
  const ordered = [...state.monsters].sort((a, b) => a.lane - b.lane);
  for (const z of ordered) drawMonster(z, hl.has(z));
  for (const p of state.peas) drawPeaShot(p);

  requestAnimationFrame(tick);
}

wordInput.value = loadSavedWords();
loadSettings();
speedInput.addEventListener("input", () => {
  const speed = clamp(Number(speedInput.value) || 1, 0.5, 2.5);
  speedLabel.textContent = `${speed.toFixed(1)}×`;
});
layout();
requestAnimationFrame(tick);

let dexBack = "lobby";

function renderBestiary() {
  const grid = document.getElementById("dex-grid");
  grid.innerHTML = "";
  MONSTERS.forEach((species, i) => {
    const card = document.createElement("article");
    card.className = "dex-card";
    const preview = document.createElement("canvas");
    preview.width = 160;
    preview.height = 180;
    const title = document.createElement("h2");
    title.textContent = species.name;
    const blurb = document.createElement("p");
    blurb.textContent = species.blurb;
    card.append(preview, title, blurb);
    grid.append(card);
    const c = preview.getContext("2d");
    c.fillStyle = PAPER;
    c.fillRect(0, 0, 160, 180);
    c.strokeStyle = LINE;
    for (let y = 20; y < 180; y += 18) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(160, y);
      c.stroke();
    }
    species.draw(createDoodle(c), {
      x: 80,
      y: 155,
      walk: 2,
      seed: i * 13 + 5,
      hl: false,
    });
  });
}

function openDex(back) {
  dexBack = back;
  show(lobbyEl, false);
  show(pauseEl, false);
  show(dexEl, true);
  const grid = document.getElementById("dex-grid");
  if (grid) grid.scrollTop = 0;
}

function closeDex() {
  show(dexEl, false);
  if (dexBack === "pause") show(pauseEl, true);
  else show(lobbyEl, true);
}

renderBestiary();

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
