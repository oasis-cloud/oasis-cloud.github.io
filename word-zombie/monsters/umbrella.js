import { INK, GREEN } from "../doodle.js";
import { drawStick } from "./stick.js";

export default {
  id: "umbrella",
  name: "雨伞怪",
  blurb: "举着一把绿伞，好像天随时会下雨。",
  speed: 33,
  draw(d, { x, y, walk, seed, hl }) {
    drawStick(d, x, y, walk, seed, hl);
    d.strokePath(
      [
        [x + 16, y - 70],
        [x + 18 + walk, y - 118],
      ],
      INK,
      2.2
    );
    d.doodleEllipse(x + 18 + walk, y - 128, 22, 10, GREEN, 2.3, seed + 8, "#d4edd4");
  },
};
