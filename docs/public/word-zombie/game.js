import { createAudio } from "./audio.js";
import { createBestiary } from "./bestiary.js";
import { createCombo } from "./combo.js";
import {
  BERSERK_CHANCE,
  BERSERK_HEAL,
  BERSERK_SPEED,
  DANGER_BEEP_MS,
  DICTATE_SPEED,
  LEAK_DAMAGE,
  LOW_HP_RATIO,
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
import { createListen, parseSpeech } from "./listen.js";
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
import {
  approachProgress,
  isInDanger,
  levelProgress,
  proximitySpeedMul,
  waveBatchSize,
  waveName,
  waveSpeedMul,
} from "./tension.js";
import { createVoice } from "./voice.js";
import { DEFAULT_WORDS, parseWordList } from "./words.js";

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const doodle = createDoodle(ctx);
const scene = createScene(ctx, doodle);
const audio = createAudio();
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
const hpWrap = document.querySelector(".hp-wrap");
const progressEl = document.getElementById("progress");
const waveEl = document.getElementById("wave");
const comboEl = document.getElementById("combo");
const spellEl = document.getElementById("spell");
const spellHintEl = document.getElementById("spell-hint");
const spellPanelEl = document.getElementById("spell-panel");
const spellDelBtn = document.getElementById("btn-spell-del");
const micBtn = document.getElementById("btn-mic");
const stunHint = document.getElementById("stun-hint");
const overStats = document.getElementById("over-stats");
const winStars = document.getElementById("win-stars");
const winStats = document.getElementById("win-stats");

const listen = createListen({
  onResult: (alts, meta) => onSpeechAlts(alts, meta),
  onStatus: (status) => setMicStatus(status),
});

const voice = createVoice({
  onBusyChange(busy) {
    listen.hold(busy);
  },
});

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
  announcedDanger: false,
  announcedLowHp: false,
  announcedRush: false,
  comboShieldHint: false,
  buffer: "",
  spellHint: "",
  spellHintKind: "",
  lastHeard: "",
  letterFlashUntil: 0,
  dangerBeepAt: 0,
  shakeUntil: 0,
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
  if (hpWrap) hpWrap.classList.toggle("low", state.hp / MAX_HP <= LOW_HP_RATIO);
  const total = state.deck ? state.deck.total : 0;
  progressEl.textContent = total ? `${state.kills} / ${total}` : "0 / 0";
  const progress = levelProgress(state.kills, total);
  const wave = waveName(progress);
  if (waveEl) {
    const labels = { early: "热身", mid: "进攻", rush: "冲刺！" };
    waveEl.hidden = state.phase !== "playing" && state.phase !== "paused";
    waveEl.textContent = labels[wave] || "";
    waveEl.classList.toggle("rush", wave === "rush");
  }
  const shield = combo.shield > 0 ? ` · 护盾${combo.shield}` : "";
  if (combo.count > 1) {
    comboEl.textContent = `连击 ${combo.count}${shield}`;
  } else if (combo.shield > 0) {
    comboEl.textContent = `连击护盾 ${combo.shield}`;
  } else {
    comboEl.textContent = "";
  }
  comboEl.hidden = !comboEl.textContent;
}

function renderSpellLetters() {
  if (!spellEl) return;
  spellEl.classList.remove("miss");
  spellEl.replaceChildren();

  const now = performance.now();
  const playing = state.phase === "playing";
  const missing = playing && now < state.missUntil;

  if (missing) {
    spellEl.classList.add("miss");
    const msg = document.createElement("span");
    msg.className = "spell-empty";
    msg.textContent = "拼写不对";
    spellEl.appendChild(msg);
    return;
  }

  if (!state.buffer) {
    const msg = document.createElement("span");
    msg.className = "spell-empty";
    msg.textContent = playing ? "一个一个说出字母" : "";
    spellEl.appendChild(msg);
    return;
  }

  for (const ch of state.buffer) {
    const tile = document.createElement("span");
    tile.className = "spell-tile";
    tile.textContent = ch.toUpperCase();
    spellEl.appendChild(tile);
  }
  if (playing && performance.now() < state.letterFlashUntil) {
    const last = spellEl.querySelector(".spell-tile:last-of-type");
    if (last && !last.classList.contains("caret")) last.classList.add("flash");
  }
  if (playing) {
    const caret = document.createElement("span");
    caret.className = "spell-tile caret";
    caret.textContent = "·";
    spellEl.appendChild(caret);
  }
}

function updateSpellHud() {
  const now = performance.now();
  const playing = state.phase === "playing";
  stunHint.hidden = !(playing && now < state.stunUntil);
  if (spellPanelEl) spellPanelEl.hidden = !playing && state.phase !== "paused";
  if (spellDelBtn) {
    spellDelBtn.hidden = !playing;
    spellDelBtn.disabled = !playing || !state.buffer || now < state.stunUntil;
  }
  if (micBtn) {
    micBtn.hidden = !playing;
    micBtn.disabled = !playing || !listen.supported() || now < state.stunUntil;
  }

  renderSpellLetters();

  if (!spellHintEl) return;
  spellHintEl.classList.remove("miss", "heard");
  if (playing && now < state.missUntil) {
    spellHintEl.classList.add("miss");
    spellHintEl.textContent = "说错了，再试下一个字母";
    return;
  }
  if (state.spellHint) {
    if (state.spellHintKind) spellHintEl.classList.add(state.spellHintKind);
    spellHintEl.textContent = state.spellHint;
    return;
  }
  spellHintEl.textContent = playing
    ? listen.isActive()
      ? "说完字母后，再点一次按钮结束"
      : "点「开始说字母」，说完再点一次结束"
    : "";
}

function undoLetter() {
  if (state.phase !== "playing") return;
  if (performance.now() < state.stunUntil) return;
  if (!state.buffer) return;
  state.buffer = state.buffer.slice(0, -1);
  state.missUntil = 0;
  state.spellHint = state.buffer
    ? `当前：${state.buffer.toUpperCase().split("").join(" ")}`
    : "";
  state.spellHintKind = state.buffer ? "heard" : "";
  updateSpellHud();
}

function setSpellHint(text, kind = "") {
  state.spellHint = text;
  state.spellHintKind = kind;
}

function setMicStatus(status) {
  if (!micBtn) return;
  micBtn.classList.remove("listening", "warn");
  const map = {
    unsupported: ["不支持语音，请用键盘", "warn", true],
    denied: ["麦克风被拒绝，点此重试", "warn", false],
    error: ["出了点问题，点此重试", "warn", false],
    idle: ["开始说字母", "", false],
    off: ["开始说字母", "", false],
    held: ["汤姆大叔说话中…", "warn", true],
    starting: ["正在听… 再点结束", "listening", false],
    listening: ["正在听… 再点结束", "listening", false],
  };
  const [text, cls, forceDisabled] = map[status] || ["开始说字母", "", false];
  micBtn.textContent = text;
  if (cls) micBtn.classList.add(cls);
  const playing = state.phase === "playing";
  micBtn.disabled =
    !playing ||
    status === "unsupported" ||
    Boolean(forceDisabled) ||
    (playing && performance.now() < state.stunUntil);
}

function syncMicForPhase() {
  if (state.phase === "playing") {
    if (spellPanelEl) spellPanelEl.hidden = false;
    listen.stop();
    setMicStatus(listen.supported() ? "idle" : "unsupported");
    updateSpellHud();
  } else {
    listen.stop();
    if (spellPanelEl) spellPanelEl.hidden = state.phase !== "paused";
    if (micBtn && state.phase === "paused") {
      micBtn.classList.remove("listening");
      micBtn.classList.add("warn");
      micBtn.textContent = "已暂停";
      micBtn.disabled = true;
    }
  }
}

function toggleMicListen() {
  if (state.phase !== "playing") return;
  if (!listen.supported()) {
    setMicStatus("unsupported");
    return;
  }
  if (performance.now() < state.stunUntil) return;
  if (listen.isActive()) {
    listen.stop();
    setSpellHint(state.buffer ? `当前：${state.buffer.toUpperCase().split("").join(" ")}` : "已结束本次说话", "heard");
    updateSpellHud();
  } else {
    setSpellHint("请说出字母，说完再点结束", "heard");
    listen.start();
    updateSpellHud();
  }
}

function onSpeechAlts(alts, meta = {}) {
  if (state.phase !== "playing") return;
  if (!alts?.length) return;

  const heard = String(alts[0] || "").trim();
  if (heard) state.lastHeard = heard;

  if (meta.interim) {
    setSpellHint(`听到：${heard}`, "heard");
    updateSpellHud();
    return;
  }

  if (!visibleMonsters().length) {
    setSpellHint("等怪兽靠近一点再拼", "");
    updateSpellHud();
    return;
  }

  for (const alt of alts) {
    const parsed = parseSpeech(alt);
    if (parsed.undo) {
      undoLetter();
      return;
    }
    if (parsed.letters.length) {
      setSpellHint(`听到：${alt.trim()}`, "heard");
      for (const ch of parsed.letters) onLetter(ch);
      if (state.buffer) {
        setSpellHint(`当前：${state.buffer.toUpperCase().split("").join(" ")}`, "heard");
        updateSpellHud();
      }
      return;
    }
    if (parsed.wholeWord) {
      setSpellHint("请一个字母一个字母说，不要说整词", "miss");
      updateSpellHud();
      return;
    }
  }

  setSpellHint(`没听清字母（${heard}），再说一次`, "miss");
  updateSpellHud();
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
  const progress = levelProgress(state.kills, state.deck?.total || 1);
  const modeMul = card.mode === MODE_DICTATE ? DICTATE_SPEED : 1;
  const waveMul = waveSpeedMul(progress);
  const berserk = Math.random() < BERSERK_CHANCE;
  const berserkMul = berserk ? BERSERK_SPEED : 1;
  if (card.mode === MODE_DICTATE && !state.announcedDictate) {
    state.announcedDictate = true;
    voice.speakZh(VOICE.firstDictate);
  }
  if (waveName(progress) === "rush" && !state.announcedRush) {
    state.announcedRush = true;
    voice.speakZh(VOICE.rush);
  }
  bestiary.markSeen(species.id);
  const baseSpeed =
    (species.speed + Math.random() * 8) * state.speedScale * modeMul * waveMul * berserkMul;
  state.monsters.push({
    word: card.word,
    mode: card.mode,
    kind,
    x: state.w + 8 + lane * 36 + col * 100 + Math.random() * 20,
    lane,
    speed: baseSpeed,
    baseSpeed,
    berserk,
    seed: Math.random() * 100,
    phase: Math.random() * Math.PI * 2,
    dead: false,
  });
}

function maintainMonsters() {
  if (!state.deck) return;
  const progress = levelProgress(state.kills, state.deck.total);
  const batch = waveBatchSize(state.batchSize, progress);
  const alive = state.monsters.filter((z) => !z.dead).length;
  for (let i = alive; i < batch; i++) spawnMonster();
}

function nearestThreat() {
  const list = visibleMonsters();
  if (!list.length) return null;
  list.sort((a, b) => a.x - b.x);
  return list[0];
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
  syncMicForPhase();
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
  syncMicForPhase();
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
  state.shakeUntil = performance.now() + 220;
  audio.tone(100, 0.14, "sawtooth", 0.07);
  maybeAnnounceLowHp();
  setHud();
  maintainMonsters();
  if (state.hp <= 0) loseGame();
}

function maybeAnnounceLowHp() {
  if (state.announcedLowHp) return;
  if (state.hp / MAX_HP > LOW_HP_RATIO) return;
  state.announcedLowHp = true;
  audio.lowHpWarn();
  voice.speakZh(VOICE.lowHp);
}

function killMonster(monster) {
  if (monster.dead) return;
  monster.dead = true;
  if (monster.berserk) {
    audio.berserkHit();
    state.hp = Math.min(MAX_HP, state.hp + BERSERK_HEAL);
    combo.addShield(1);
  } else {
    audio.tone(240, 0.12, "triangle", 0.09);
  }
  voice.speakEn(monster.word.en);
  const species = MONSTERS[monster.kind];
  bestiary.markDefeated(species?.id);
  state.deck.complete(monster);
  state.kills += 1;
  const fx = combo.registerHit(performance.now());
  if (fx.heal) state.hp = Math.min(MAX_HP, state.hp + fx.heal);
  if (fx.combo5Voice) voice.speakZh(VOICE.combo5);
  state.monsters = state.monsters.filter((z) => z !== monster);
  state.shakeUntil = performance.now() + 120;
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
    setSpellHint("", "");
    audio.tone(80, 0.12, "sawtooth", 0.06);
    updateSpellHud();
    return;
  }
  state.buffer = next;
  audio.letterOk();
  state.letterFlashUntil = performance.now() + 180;
  const exact = hits.filter((z) => z.word.en.toLowerCase() === next);
  if (exact.length) {
    exact.sort((a, b) => a.x - b.x);
    fireAt(exact[0]);
    state.buffer = "";
    setSpellHint("打中了！继续拼下一个", "heard");
  } else {
    setSpellHint(`当前：${next.toUpperCase().split("").join(" ")}`, "heard");
  }
  updateSpellHud();
}

function resetRound() {
  state.hp = MAX_HP;
  state.kills = 0;
  state.leaked = false;
  state.announcedDictate = false;
  state.announcedDanger = false;
  state.announcedLowHp = false;
  state.announcedRush = false;
  state.buffer = "";
  state.spellHint = "";
  state.spellHintKind = "";
  state.lastHeard = "";
  state.letterFlashUntil = 0;
  state.dangerBeepAt = 0;
  state.shakeUntil = 0;
  state.monsters = [];
  state.peas = [];
  state.stunUntil = 0;
  state.missUntil = 0;
  combo.hardReset();
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
  syncMicForPhase();
  voice.speakZh(VOICE.start);
}

function pauseGame() {
  if (state.phase !== "playing") return;
  state.phase = "paused";
  show(pauseEl, true);
  syncMicForPhase();
}

function resumeGame() {
  if (state.phase !== "paused") return;
  state.phase = "playing";
  state.last = performance.now();
  show(pauseEl, false);
  syncMicForPhase();
}

function goLobby() {
  state.phase = "lobby";
  state.buffer = "";
  show(hudEl, false);
  hideOverlays();
  show(lobbyEl, true);
  syncMicForPhase();
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
  const lowHp = state.hp / MAX_HP <= LOW_HP_RATIO;
  let dangerActive = false;
  const shake = now < state.shakeUntil ? 5 : 0;

  if (state.phase === "playing") {
    if (state._hudStunned && !stunned) updateSpellHud();
    state._hudStunned = stunned;
    const move = inked ? SLOW_FACTOR : 1;
    for (const z of state.monsters) {
      if (z.dead) continue;
      z.phase += dt * 5;
      const approach = approachProgress(z.x, state.plantX, state.w);
      const prox = proximitySpeedMul(approach);
      z.x -= z.speed * move * prox * dt;
      if (z.x < state.plantX + 18) leakMonster(z);
      if (state.phase !== "playing") break;
    }

    const threat = nearestThreat();
    if (threat && isInDanger(threat.x, state.plantX, state.w)) {
      dangerActive = true;
      if (!state.announcedDanger) {
        state.announcedDanger = true;
        voice.speakZh(VOICE.danger);
      }
      if (now >= state.dangerBeepAt) {
        audio.dangerBeep();
        state.dangerBeepAt = now + DANGER_BEEP_MS;
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
      const stepLen = PEA_SPEED * dt;
      if (dist <= stepLen + 12) {
        killMonster(t);
        p.spent = true;
      } else {
        p.x += (dx / dist) * stepLen;
        p.y += (dy / dist) * stepLen;
      }
    }
    state.peas = state.peas.filter((p) => !p.spent);
    if (now > state.missUntil && spellEl?.classList.contains("miss") && !state.buffer) {
      updateSpellHud();
    }
    if (state.letterFlashUntil && now > state.letterFlashUntil) {
      state.letterFlashUntil = 0;
      updateSpellHud();
    }
  }

  scene.drawPaper(state.w, state.h, {
    lowHp: state.phase === "playing" && lowHp,
    danger: state.phase === "playing" && dangerActive,
    shake: state.phase === "playing" ? shake : 0,
  });
  scene.drawGrass(state.w, state.ground);
  scene.drawCabin(state.cabinX, state.ground, {
    lowHp: state.phase === "playing" && lowHp,
  });
  scene.drawPea(state.plantX, state.plantY, { stunned, glowing: combo.glowing() });
  const hl = new Set(matchingMonsters(state.buffer));
  const ordered = [...state.monsters].sort((a, b) => a.lane - b.lane);
  for (const z of ordered) {
    const approach = approachProgress(z.x, state.plantX, state.w);
    const danger = isInDanger(z.x, state.plantX, state.w);
    scene.drawMonster(z, laneY(z.lane), hl.has(z), inked, { approach, danger });
  }
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

micBtn?.addEventListener("click", () => {
  toggleMicListen();
});

spellDelBtn?.addEventListener("click", () => {
  undoLetter();
});

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
  if (e.code === "Backspace" || e.code === "Delete") {
    e.preventDefault();
    undoLetter();
    return;
  }
  if (e.key.length === 1 && /[A-Za-z]/.test(e.key)) {
    e.preventDefault();
    onLetter(e.key.toLowerCase());
  }
});

if (!listen.supported()) setMicStatus("unsupported");
else setMicStatus("idle");
