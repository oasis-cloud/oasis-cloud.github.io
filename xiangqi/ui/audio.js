/** 宫商角徵羽，C4 起。 */
const PENTATONIC = [261.6, 293.7, 329.6, 392, 440];
const MUSIC_STEPS = [0, 2, 4, 1, 3, 0, 2, 3];

function AudioCtx() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

function envelope(gain, t, peak, attack, decay) {
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
}

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let sparse = 0;
  let acc = 0;
  let step = 0;
  let noise = null;

  function ensure() {
    if (!ctx) {
      ctx = AudioCtx();
      if (!ctx) return null;
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.85;
      master.connect(ctx.destination);
      const n = Math.floor(ctx.sampleRate);
      noise = ctx.createBuffer(1, n, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    }
    return ctx;
  }

  function out() {
    return master;
  }

  function tone(freq, duration, type, peak, at = 0) {
    const ac = ensure();
    if (!ac || muted) return;
    const t = ac.currentTime + at;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    envelope(g, t, peak, Math.min(0.012, duration * 0.15), duration);
    osc.connect(g).connect(out());
    osc.start(t);
    osc.stop(t + duration + 0.04);
  }

  function noiseBurst({ duration, freq, q, peak, type = "bandpass", at = 0, attack = 0.004 }) {
    const ac = ensure();
    if (!ac || muted || !noise) return;
    const t = ac.currentTime + at;
    const src = ac.createBufferSource();
    src.buffer = noise;
    const filter = ac.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.setValueAtTime(q, t);
    const g = ac.createGain();
    envelope(g, t, peak, attack, duration);
    src.connect(filter).connect(g).connect(out());
    src.start(t);
    src.stop(t + duration + 0.05);
  }

  return {
    resume() {
      const ac = ensure();
      if (!ac) return;
      if (ac.state === "suspended") ac.resume();
    },

    move() {
      noiseBurst({ duration: 0.07, freq: 420, q: 1.1, peak: 0.16, type: "lowpass" });
      tone(190, 0.055, "sine", 0.07);
      tone(92, 0.08, "sine", 0.05);
    },

    capture() {
      noiseBurst({ duration: 0.09, freq: 1400, q: 2.4, peak: 0.2 });
      noiseBurst({ duration: 0.07, freq: 2800, q: 3.2, peak: 0.1, at: 0.02 });
      noiseBurst({ duration: 0.12, freq: 700, q: 1.4, peak: 0.12, at: 0.018 });
      tone(620, 0.05, "square", 0.03);
      tone(1480, 0.04, "triangle", 0.025, 0.03);
      tone(2100, 0.03, "sine", 0.02, 0.05);
    },

    check() {
      noiseBurst({
        duration: 0.28,
        freq: 90,
        q: 0.7,
        peak: 0.28,
        type: "lowpass",
        attack: 0.008,
      });
      noiseBurst({ duration: 0.18, freq: 180, q: 1.2, peak: 0.14, type: "bandpass", at: 0.04 });
      tone(70, 0.22, "sine", 0.12);
      tone(105, 0.16, "triangle", 0.04, 0.05);
    },

    hoof() {
      noiseBurst({ duration: 0.06, freq: 220, q: 1.6, peak: 0.14, type: "lowpass" });
      tone(118, 0.06, "sine", 0.08);
      noiseBurst({ duration: 0.055, freq: 200, q: 1.4, peak: 0.12, type: "lowpass", at: 0.08 });
      tone(96, 0.055, "sine", 0.07, 0.08);
    },

    wheel() {
      const ac = ensure();
      if (!ac || muted || !noise) return;
      const t = ac.currentTime;
      const src = ac.createBufferSource();
      src.buffer = noise;
      const filter = ac.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(280, t);
      filter.frequency.exponentialRampToValueAtTime(520, t + 0.18);
      filter.frequency.exponentialRampToValueAtTime(240, t + 0.42);
      filter.Q.setValueAtTime(1.8, t);
      const g = ac.createGain();
      envelope(g, t, 0.09, 0.02, 0.44);
      src.connect(filter).connect(g).connect(out());
      src.start(t);
      src.stop(t + 0.48);
    },

    catapult() {
      const ac = ensure();
      if (!ac || muted) return;
      const t = ac.currentTime;
      noiseBurst({ duration: 0.16, freq: 900, q: 0.8, peak: 0.1, type: "highpass", attack: 0.02 });
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.22);
      envelope(g, t, 0.14, 0.01, 0.28);
      osc.connect(g).connect(out());
      osc.start(t);
      osc.stop(t + 0.32);
      noiseBurst({ duration: 0.1, freq: 160, q: 1.1, peak: 0.18, type: "lowpass", at: 0.18 });
    },

    ceremony() {
      const phrase = [0, 3, 4, 3, 0];
      phrase.forEach((idx, i) => {
        tone(PENTATONIC[idx], 0.42, "triangle", 0.045, i * 0.28);
        tone(PENTATONIC[idx] * 0.5, 0.5, "sine", 0.02, i * 0.28);
      });
    },

    setSparse(t01) {
      const n = Number(t01);
      sparse = Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
    },

    tickMusic(dt, pieceCount) {
      const ac = ensure();
      if (!ac || muted || ac.state !== "running") return;
      const sec = dt > 2 ? dt / 1000 : dt;
      if (!Number.isFinite(sec) || sec <= 0) return;
      const count = Number.isFinite(pieceCount) ? pieceCount : 32;
      const density = Math.max(0.06, Math.min(1, (count / 32) * (1 - sparse * 0.78)));
      const interval = 2.15 + (1 - density) * 7.2;
      acc += sec;
      if (acc < interval) return;
      acc = 0;
      if (Math.random() > density * 0.82 + 0.12) {
        step += 1;
        return;
      }
      const freq = PENTATONIC[MUSIC_STEPS[step % MUSIC_STEPS.length]];
      const peak = 0.028 * (0.35 + density * 0.65);
      tone(freq, 0.55 + density * 0.25, "sine", peak);
      tone(freq * 0.5, 0.7, "triangle", peak * 0.35);
      step += 1;
    },

    mute(on) {
      muted = !!on;
      if (master && ctx) {
        master.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.03);
      }
    },
  };
}
