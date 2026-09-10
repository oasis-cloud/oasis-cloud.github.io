import { INK, PAPER } from "../doodle.js";

export default {
  id: "blob",
  name: "圆滚怪",
  blurb: "身子像一团墨水，挪得慢但很难忽略。",
  speed: 28,
  draw(d, { x, y, walk, seed, hl }) {
    d.strokePath(
      [
        [x - 10, y],
        [x - 6, y - 10],
      ],
      INK,
      2.4
    );
    d.strokePath(
      [
        [x + 10, y],
        [x + 6, y - 10],
      ],
      INK,
      2.4
    );
    d.doodleEllipse(x, y - 42, 28, 32, INK, 2.6, seed, PAPER);
    d.strokePath(
      [
        [x - 22, y - 48],
        [x - 30, y - 36 + walk],
      ],
      INK,
      2.2
    );
    d.strokePath(
      [
        [x + 22, y - 48],
        [x + 30, y - 34 - walk],
      ],
      INK,
      2.2
    );
    d.face(x, y - 88, seed, hl);
  },
};
