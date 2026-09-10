import { INK } from "../doodle.js";

export default {
  id: "cone",
  name: "斗篷怪",
  blurb: "套着三角斗篷，只露出一张圆脸。",
  speed: 34,
  draw(d, { x, y, walk, seed, hl }) {
    d.ctx.save();
    d.ctx.fillStyle = "#efe6d2";
    d.ctx.beginPath();
    d.ctx.moveTo(x, y - 78);
    d.ctx.lineTo(x - 24 + walk, y);
    d.ctx.lineTo(x + 24 - walk, y);
    d.ctx.closePath();
    d.ctx.fill();
    d.ctx.restore();
    d.strokePath(
      [
        [x, y - 78],
        [x - 24 + walk, y],
        [x + 24 - walk, y],
        [x, y - 78],
      ],
      INK,
      2.4
    );
    d.face(x, y - 96, seed, hl);
  },
};
