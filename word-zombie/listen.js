const SpeechApi =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

/** 常见字母读音 → 字母（英文名 + 小孩常说的中文名） */
const LETTER_ALIASES = {
  a: "a",
  ay: "a",
  hey: "a",
  eh: "a",
  ei: "a",
  诶: "a",
  欸: "a",
  b: "b",
  be: "b",
  bee: "b",
  比: "b",
  c: "c",
  see: "c",
  sea: "c",
  si: "c",
  西: "c",
  d: "d",
  dee: "d",
  迪: "d",
  弟: "d",
  e: "e",
  ee: "e",
  衣: "e",
  伊: "e",
  f: "f",
  ef: "f",
  eff: "f",
  爱弗: "f",
  g: "g",
  gee: "g",
  jee: "g",
  吉: "g",
  h: "h",
  aitch: "h",
  age: "h",
  艾尺: "h",
  i: "i",
  eye: "i",
  aye: "i",
  艾: "i",
  j: "j",
  jay: "j",
  杰: "j",
  k: "k",
  kay: "k",
  开: "k",
  l: "l",
  el: "l",
  ell: "l",
  艾勒: "l",
  m: "m",
  em: "m",
  艾姆: "m",
  n: "n",
  en: "n",
  恩: "n",
  o: "o",
  oh: "o",
  owe: "o",
  哦: "o",
  p: "p",
  pee: "p",
  pea: "p",
  皮: "p",
  q: "q",
  queue: "q",
  cue: "q",
  吉吾: "q",
  r: "r",
  are: "r",
  ar: "r",
  儿: "r",
  s: "s",
  es: "s",
  ess: "s",
  艾斯: "s",
  t: "t",
  tea: "t",
  tee: "t",
  提: "t",
  u: "u",
  you: "u",
  yu: "u",
  优: "u",
  v: "v",
  vee: "v",
  维: "v",
  w: "w",
  doubleu: "w",
  doubleyou: "w",
  达不溜: "w",
  大不溜: "w",
  x: "x",
  ex: "x",
  eks: "x",
  埃克斯: "x",
  y: "y",
  why: "y",
  wye: "y",
  歪: "y",
  z: "z",
  zee: "z",
  zed: "z",
  贼德: "z",
};

const UNDO_WORDS = new Set([
  "backspace",
  "delete",
  "undo",
  "clear",
  "擦掉",
  "删掉",
  "删除",
  "退格",
  "重来",
]);

function normalizeToken(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[.。,，!！?？'’"]/g, "")
    .replace(/\s+/g, "");
}

function tokenToLetter(token) {
  const t = normalizeToken(token);
  if (!t) return null;
  if (LETTER_ALIASES[t]) return LETTER_ALIASES[t];
  if (/^[a-z]$/.test(t)) return t;
  return null;
}

function lettersOnly(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/**
 * 只接受逐字母拼读（如 "a" / "ay" / "a p p"），不接受整词 "apple"。
 */
export function parseSpeech(transcript) {
  const raw = String(transcript || "").trim();
  if (!raw) return { letters: [], undo: false, wholeWord: false };

  const lower = raw.toLowerCase().replace(/double\s*u(?:\s*you)?/g, "w");
  if (UNDO_WORDS.has(normalizeToken(raw)) || /^(删|擦|退)/.test(raw)) {
    return { letters: [], undo: true, wholeWord: false };
  }

  const tokens = lower
    .split(/[\s\-_/|，,。.]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (!tokens.length) return { letters: [], undo: false, wholeWord: false };

  if (tokens.length === 1 && UNDO_WORDS.has(normalizeToken(tokens[0]))) {
    return { letters: [], undo: true, wholeWord: false };
  }

  const letters = [];
  for (const tok of tokens) {
    const ch = tokenToLetter(tok);
    if (!ch) {
      const compact = lettersOnly(tok);
      return {
        letters: [],
        undo: false,
        wholeWord: compact.length >= 2,
      };
    }
    letters.push(ch);
  }
  return { letters, undo: false, wholeWord: false };
}

/**
 * 点按切换监听：start 开始听，stop 结束听。
 * 监听期间会在一小段结束后自动续听，直到用户点结束。
 */
export function createListen({ onResult, onStatus } = {}) {
  let recog = null;
  let active = false;
  let held = false;
  let restartTimer = 0;

  function setStatus(status, detail = "") {
    onStatus?.(status, detail);
  }

  function supported() {
    return Boolean(SpeechApi);
  }

  function clearRestart() {
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = 0;
    }
  }

  function killRecog() {
    if (!recog) return;
    const r = recog;
    recog = null;
    try {
      r.onend = null;
      r.onresult = null;
      r.onerror = null;
      r.onstart = null;
      r.abort?.();
    } catch {
      /* ignore */
    }
    try {
      r.stop?.();
    } catch {
      /* ignore */
    }
  }

  function scheduleResume(ms = 180) {
    clearRestart();
    if (!active || held) return;
    restartTimer = setTimeout(() => {
      restartTimer = 0;
      begin();
    }, ms);
  }

  function build() {
    const r = new SpeechApi();
    r.lang = "en-US";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 5;

    r.onstart = () => {
      if (active && !held) setStatus("listening");
    };
    r.onerror = (e) => {
      const err = e?.error || "error";
      if (err === "not-allowed" || err === "service-not-allowed") {
        active = false;
        clearRestart();
        setStatus("denied");
        return;
      }
      if (err === "no-speech" || err === "aborted") return;
      if (active) setStatus("error", err);
    };
    r.onend = () => {
      if (!active) {
        setStatus("idle");
        return;
      }
      if (held) {
        setStatus("held");
        return;
      }
      // 用户仍在监听中：自动续听下一小段
      scheduleResume(160);
    };
    r.onresult = (event) => {
      if (!active || held) return;
      let finalAlts = null;
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res) continue;
        if (res.isFinal) {
          const alts = [];
          for (let j = 0; j < res.length; j++) {
            const t = res[j]?.transcript;
            if (t) alts.push(t);
          }
          if (alts.length) finalAlts = alts;
        } else {
          const t = res[0]?.transcript;
          if (t) interim = t;
        }
      }
      if (interim) onResult?.([interim], { interim: true });
      if (finalAlts) onResult?.(finalAlts, { interim: false });
    };
    return r;
  }

  function begin() {
    if (!SpeechApi || !active || held) return;
    killRecog();
    try {
      recog = build();
      recog.start();
    } catch {
      scheduleResume(400);
    }
  }

  return {
    supported,
    isActive() {
      return active;
    },
    start() {
      if (!SpeechApi) {
        setStatus("unsupported");
        return false;
      }
      if (active) return true;
      active = true;
      held = false;
      setStatus("starting");
      begin();
      return true;
    },
    stop() {
      const was = active;
      active = false;
      held = false;
      clearRestart();
      killRecog();
      setStatus("idle");
      return was;
    },
    toggle() {
      if (active) {
        this.stop();
        return false;
      }
      return this.start();
    },
    /** TTS 播放时暂停；结束后若仍在监听则自动恢复 */
    hold(on) {
      held = Boolean(on);
      if (!active) return;
      if (held) {
        clearRestart();
        killRecog();
        setStatus("held");
      } else {
        setStatus("starting");
        scheduleResume(220);
      }
    },
  };
}
