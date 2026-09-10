import { INK, PAPER } from "../doodle.js";

export default {
  id: "tall",
  name: "高挑怪",
  blurb: "腿特别长，走得比别的怪兽快一截。",
  speed: 48,
  draw(d, { x, y, walk, seed, hl }) {
    d.strokePath(
      [
        [x - 6, y],
        [x - 3 + walk, y - 40],
        [x, y - 72],
      ],
      INK,
      2.4
    );
    d.strokePath(
      [
        [x + 6, y],
        [x + 2 - walk, y - 40],
        [x, y - 72],
      ],
      INK,
      2.4
    );
    d.doodleEllipse(x, y - 82, 8, 18, INK, 2.2, seed, PAPER);
    d.strokePath(
      [
        [x - 14, y - 78],
        [x, y - 84],
        [x + 12, y - 76 + walk],
      ],
      INK,
      2
    );
    d.face(x, y - 108, seed, hl);
  },
};
