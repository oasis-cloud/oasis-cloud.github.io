import { ORANGE } from "../doodle.js";
import { drawStick } from "./stick.js";

export default {
  id: "tophat",
  name: "礼帽怪",
  blurb: "戴着歪礼帽，觉得自己很有派头。",
  speed: 38,
  draw(d, { x, y, walk, seed, hl }) {
    drawStick(d, x, y, walk, seed, hl);
    d.doodleRect(x - 18, y - 118, 36, 10, ORANGE, 2.2, seed + 6, "#f3d0a8");
    d.doodleRect(x - 10, y - 138, 20, 20, ORANGE, 2.2, seed + 7, "#f3d0a8");
  },
};
