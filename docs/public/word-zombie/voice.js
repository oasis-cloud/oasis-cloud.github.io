function speakUtterance(text, lang, rate) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    try {
      window.speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}

export function createVoice() {
  const queue = [];
  let busy = false;

  async function pump() {
    if (busy || !queue.length) return;
    busy = true;
    const next = queue.shift();
    await speakUtterance(next.text, next.lang, next.rate);
    busy = false;
    pump();
  }

  function enqueue(text, lang, rate) {
    if (!text) return;
    queue.push({ text, lang, rate });
    pump();
  }

  return {
    speakEn(word) {
      enqueue(word, "en-US", 0.92);
    },
    speakZh(line) {
      enqueue(line, "zh-CN", 1);
    },
    clear() {
      queue.length = 0;
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
      busy = false;
    },
  };
}
