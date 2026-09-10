import { INK } from "../doodle.js";

export default {
  id: "balloon",
  name: "气球怪",
  blurb: "身子像气球，用一根线拴着往前飘。",
  speed: 44,
  draw(d, { x, y, walk, seed, hl }) {
    d.strokePath(
      [
        [x, y],
        [x + walk * 0.4, y - 48],
      ],
      INK,
      2
    );
    d.doodleEllipse(x + walk * 0.3, y - 78, 20, 26, INK, 2.4, seed, "#f7f0dc");
    d.face(x + walk * 0.3, y - 100, seed, hl);
  },
};
