import { INK, PAPER, GREEN } from "../doodle.js";

export default {
  id: "beak",
  name: "鸟喙怪",
  blurb: "尖嘴加小翅膀，偶尔会跳着走。",
  speed: 46,
  draw(d, { x, y, walk, seed, hl }) {
    d.strokePath(
      [
        [x - 6, y],
        [x, y - 36],
      ],
      INK,
      2.3
    );
    d.strokePath(
      [
        [x + 6, y],
        [x, y - 36],
      ],
      INK,
      2.3
    );
    d.doodleEllipse(x, y - 52, 12, 16, INK, 2.2, seed, PAPER);
    d.strokePath(
      [
        [x - 4, y - 58],
        [x - 28, y - 70 + walk],
        [x - 8, y - 48],
      ],
      GREEN,
      2.3
    );
    d.face(x, y - 86, seed, hl);
    d.strokePath(
      [
        [x + 18, y - 86],
        [x + 32, y - 82],
        [x + 18, y - 78],
      ],
      INK,
      2.2
    );
  },
};
