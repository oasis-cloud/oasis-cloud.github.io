export function createAudio() {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  return {
    unlock() {
      getCtx();
    },
    tone(freq, duration, type = "sine", gain = 0.07) {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, freq * 0.5),
        ac.currentTime + duration
      );
      g.gain.setValueAtTime(gain, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.connect(g).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration + 0.02);
    },
  };
}
