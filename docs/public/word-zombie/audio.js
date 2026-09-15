export function createAudio() {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, duration, type = "sine", gain = 0.07) {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, freq * 0.5),
      ac.currentTime + duration,
    );
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(g).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration + 0.02);
  }

  return {
    unlock() {
      getCtx();
    },
    tone,
    letterOk() {
      tone(660, 0.05, "sine", 0.05);
      tone(880, 0.06, "triangle", 0.035);
    },
    dangerBeep() {
      tone(520, 0.07, "square", 0.04);
      tone(360, 0.09, "square", 0.03);
    },
    lowHpWarn() {
      tone(180, 0.18, "sawtooth", 0.05);
    },
    berserkHit() {
      tone(300, 0.08, "triangle", 0.07);
      tone(520, 0.1, "sine", 0.05);
    },
  };
}
