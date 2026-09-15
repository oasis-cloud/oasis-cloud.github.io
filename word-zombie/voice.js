function getVoicesSafe() {
  try {
    return window.speechSynthesis?.getVoices?.() || [];
  } catch {
    return [];
  }
}

/** 与单词朗读同一把系统英文音色 */
function pickWordVoice() {
  const voices = getVoicesSafe();
  if (!voices.length) return null;
  const en = voices.filter((v) => /^en([-_]|$)/i.test(v.lang || ""));
  const pool = en.length ? en : voices;
  const prefer = (re) => pool.find((v) => re.test(v.name || ""));
  return (
    prefer(/samantha|karen|moira|daniel|alex|fred|victoria/i) ||
    prefer(/google\s*us\s*english|microsoft\s*(aria|guy|jenny|zira)/i) ||
    prefer(/enhanced|premium|neural|natural/i) ||
    pool.find((v) => /^en-US/i.test(v.lang || "")) ||
    pool[0] ||
    null
  );
}

function speakUtterance(text, lang, rate, voice) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    try {
      window.speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}

export function createVoice({ onBusyChange } = {}) {
  const queue = [];
  let busy = false;
  let wordVoice = pickWordVoice();

  function refreshVoice() {
    wordVoice = pickWordVoice() || wordVoice;
  }

  if (typeof window !== "undefined" && window.speechSynthesis) {
    refreshVoice();
    window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoice);
    // 部分浏览器首次 getVoices 为空，稍后再取一次
    setTimeout(refreshVoice, 0);
    setTimeout(refreshVoice, 250);
  }

  function setBusy(next) {
    if (busy === next) return;
    busy = next;
    onBusyChange?.(busy);
  }

  async function pump() {
    if (busy || !queue.length) return;
    setBusy(true);
    const next = queue.shift();
    refreshVoice();
    await speakUtterance(next.text, next.lang, next.rate, wordVoice);
    setBusy(false);
    pump();
  }

  function enqueue(text, lang, rate) {
    if (!text) return;
    queue.push({ text, lang, rate });
    pump();
  }

  return {
    speakEn(word) {
      // 单词朗读：系统英文音色
      enqueue(word, "en-US", 0.92);
    },
    speakZh(line) {
      // 旁白与单词共用同一把系统英文音色
      enqueue(line, "zh-CN", 1);
    },
    clear() {
      queue.length = 0;
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
      setBusy(false);
    },
  };
}
