import { INK } from "../doodle.js";

export default {
  id: "crate",
  name: "纸箱怪",
  blurb: "套着涂鸦纸箱，走起来一顿一顿的。",
  speed: 30,
  draw(d, { x, y, walk, seed, hl }) {
    d.strokePath(
      [
        [x - 8, y],
        [x - 8, y - 8],
      ],
      INK,
      2.2
    );
    d.strokePath(
      [
        [x + 8, y],
        [x + 8, y - 8],
      ],
      INK,
      2.2
    );
    d.doodleRect(x - 22, y - 70, 44, 62, INK, 2.5, seed, "#efe2c4");
    d.strokePath(
      [
        [x - 22, y - 40],
        [x + 22, y - 40],
      ],
      INK,
      1.8
    );
    d.face(x, y - 92, seed, hl);
  },
};
