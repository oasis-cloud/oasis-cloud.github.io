import { ORANGE } from "../doodle.js";
import { drawStick } from "./stick.js";

export default {
  id: "cape",
  name: "披风怪",
  blurb: "身后拖着橙墨披风，跑起来呼呼响。",
  speed: 36,
  draw(d, { x, y, walk, seed, hl }) {
    d.strokePath(
      [
        [x + 4, y - 88],
        [x + 28 + walk, y - 70],
        [x + 22, y - 20],
        [x + 8, y - 48],
      ],
      ORANGE,
      2.6
    );
    drawStick(d, x, y, walk, seed, hl);
  },
};
