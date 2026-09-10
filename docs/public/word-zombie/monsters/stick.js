import { INK, PAPER } from "../doodle.js";

export function drawStick(d, x, y, walk, seed, hl) {
  d.strokePath(
    [
      [x - 8, y],
      [x - 4 + walk, y - 22],
      [x, y - 48],
    ],
    INK,
    2.6
  );
  d.strokePath(
    [
      [x + 8, y],
      [x + 2 - walk, y - 22],
      [x, y - 48],
    ],
    INK,
    2.6
  );
  d.doodleEllipse(x, y - 62, 11, 22, INK, 2.3, seed, PAPER);
  d.strokePath(
    [
      [x - 18, y - 58],
      [x, y - 64],
      [x + 16, y - 52 + walk],
    ],
    INK,
    2.2
  );
  d.face(x, y - 92, seed, hl);
}

export default {
  id: "stick",
  name: "细腿怪",
  blurb: "两条细腿走路，最常见的单词怪兽。",
  speed: 40,
  draw(d, p) {
    drawStick(d, p.x, p.y, p.walk, p.seed, p.hl);
  },
};
