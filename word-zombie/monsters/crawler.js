import { INK, PAPER } from "../doodle.js";

export default {
  id: "crawler",
  name: "爬行怪",
  blurb: "好几条细腿轮流迈步，贴着纸面爬过来。",
  speed: 32,
  draw(d, { x, y, walk, seed, hl }) {
    const legs = [-18, -8, 8, 18];
    for (const ox of legs) {
      d.strokePath(
        [
          [x, y - 40],
          [x + ox + walk * 0.4, y - 18],
          [x + ox * 1.15 - walk * 0.3, y + 2],
        ],
        INK,
        2.2
      );
    }
    d.doodleEllipse(x, y - 48, 20, 14, INK, 2.4, seed, PAPER);
    d.face(x, y - 78, seed, hl);
  },
};
