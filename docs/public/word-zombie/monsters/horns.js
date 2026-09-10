import { INK } from "../doodle.js";
import { drawStick } from "./stick.js";

export default {
  id: "horns",
  name: "犄角怪",
  blurb: "头上两只小角，脾气比看起来大。",
  speed: 42,
  draw(d, { x, y, walk, seed, hl }) {
    drawStick(d, x, y, walk, seed, hl);
    d.strokePath(
      [
        [x - 12, y - 108],
        [x - 22, y - 128],
        [x - 6, y - 112],
      ],
      INK,
      2.4
    );
    d.strokePath(
      [
        [x + 12, y - 108],
        [x + 22, y - 128],
        [x + 6, y - 112],
      ],
      INK,
      2.4
    );
  },
};
