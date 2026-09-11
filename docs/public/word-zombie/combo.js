import { COMBO_HEAL, SLOW_MS } from "./config.js";

export function createCombo() {
  let count = 0;
  let slowUntil = 0;

  return {
    get count() {
      return count;
    },
    glowing() {
      return count >= 3;
    },
    slowActive(now) {
      return now < slowUntil;
    },
    reset() {
      count = 0;
    },
    registerHit(now) {
      count += 1;
      const fx = { glow: count >= 3, slow: false, heal: 0, combo5Voice: false };
      if (count >= 5) {
        slowUntil = now + SLOW_MS;
        fx.slow = true;
        if (count === 5) fx.combo5Voice = true;
      }
      if (count >= 8 && count % 8 === 0) fx.heal = COMBO_HEAL;
      return fx;
    },
  };
}
