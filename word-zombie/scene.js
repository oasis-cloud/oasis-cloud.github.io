import {
  GREEN,
  GREEN_DARK,
  INK,
  INK_DARK,
  LINE,
  ORANGE,
  PAPER,
  wobble,
} from "./doodle.js";
import { MODE_DICTATE } from "./deck.js";
import { MONSTERS } from "./monsters/index.js";

export function createScene(ctx, doodle) {
  const { strokePath, doodleEllipse, doodleRect } = doodle;

  function drawPaper(w, h) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.2;
    for (let y = 28; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + 1);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(43,108,176,0.04)";
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 97) % w, (i * 53) % h, 2, 2);
    }
  }

  function drawGrass(w, ground) {
    ctx.save();
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 1.6;
    strokePath(
      [
        [0, ground + 4],
        [w * 0.3, ground + wobble(2, 1, 3)],
        [w * 0.7, ground + wobble(3, 2, 3)],
        [w, ground + 6],
      ],
      INK,
      2.2
    );
    for (let x = 16; x < w; x += 18) {
      const gh = 8 + (x % 7);
      ctx.beginPath();
      ctx.moveTo(x, ground + 2);
      ctx.lineTo(x + 2, ground - gh);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCabin(x, ground) {
    const w = 118;
    const h = 96;
    doodleRect(x, ground - h, w, h, INK, 2.6, 11, "#f3e2c0");
    strokePath(
      [
        [x - 10, ground - h + 8],
        [x + w / 2, ground - h - 38],
        [x + w + 10, ground - h + 8],
      ],
      ORANGE,
      3
    );
    doodleRect(x + 44, ground - 42, 28, 40, INK, 2.2, 12, "#d9c39a");
    doodleRect(x + 14, ground - h + 22, 26, 22, INK, 2, 13, "#cfe6f4");
    doodleRect(x + 78, ground - h + 22, 26, 22, INK, 2, 14, "#cfe6f4");
    ctx.fillStyle = INK_DARK;
    ctx.font = "12px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("汤姆大叔", x + 18, ground - h - 46);
  }

  function drawPea(x, ground, { stunned, glowing }) {
    const shake = stunned ? wobble(performance.now() / 80, 1, 2.5) : 0;
    const px = x + shake;
    if (glowing && !stunned) {
      doodleEllipse(px + 10, ground - 70, 42, 36, "#e8c36a", 1.4, 19, "rgba(255, 230, 120, 0.35)");
    }
    strokePath(
      [
        [px, ground],
        [px + 2, ground - 28],
        [px - 4, ground - 48],
      ],
      GREEN_DARK,
      4
    );
    doodleEllipse(px - 10, ground - 18, 10, 16, GREEN, 2.2, 21, "#b7e39a");
    doodleEllipse(px + 12, ground - 16, 11, 17, GREEN, 2.2, 22, "#b7e39a");
    doodleEllipse(px + 8, ground - 72, 28, 26, GREEN_DARK, 2.8, 20, stunned ? "#9ccc88" : "#7ed957");
    doodleEllipse(px + 36, ground - 70, 14, 11, GREEN_DARK, 2.2, 23, "#8fe06a");
    ctx.fillStyle = INK_DARK;
    ctx.beginPath();
    ctx.arc(px + 2, ground - 76, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 16, ground - 76, 3.2, 0, Math.PI * 2);
    ctx.fill();
    if (stunned) {
      ctx.fillStyle = "#c45c2a";
      ctx.font = "13px Comic Sans MS, Chalkboard SE, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("…", px + 22, ground - 104);
    }
  }

  function drawInkPuddle(x, y) {
    doodleEllipse(x, y + 4, 18, 6, INK, 1.6, 8, "rgba(43, 108, 176, 0.22)");
  }

  function drawWordCard(z, highlight, x, y) {
    const dictate = z.mode === MODE_DICTATE;
    const zh = z.word.zh;
    ctx.font = "13px PingFang SC, Microsoft YaHei, sans-serif";
    const zhW = ctx.measureText(zh).width;
    let enW = 0;
    if (!dictate) {
      ctx.font = "bold 16px Comic Sans MS, Chalkboard SE, sans-serif";
      enW = ctx.measureText(z.word.en).width;
    }
    const tw = Math.max(48, enW, zhW) + 20;
    const th = dictate ? 28 : 36;
    const cardY = y - 156;
    doodleRect(x - tw / 2, cardY, tw, th, INK, 1.8, z.seed + 4, highlight ? "#e8f2ff" : "#fffcf4");
    ctx.textAlign = "center";
    if (dictate) {
      ctx.fillStyle = ORANGE;
      ctx.font = "11px PingFang SC, Microsoft YaHei, sans-serif";
      ctx.fillText("默", x, cardY - 2);
      ctx.fillStyle = highlight ? ORANGE : INK_DARK;
      ctx.font = "13px PingFang SC, Microsoft YaHei, sans-serif";
      ctx.fillText(zh, x, cardY + 18);
    } else {
      ctx.fillStyle = highlight ? ORANGE : INK_DARK;
      ctx.font = "bold 16px Comic Sans MS, Chalkboard SE, sans-serif";
      ctx.fillText(z.word.en, x, cardY + 15);
      ctx.fillStyle = INK_DARK;
      ctx.font = "13px PingFang SC, Microsoft YaHei, sans-serif";
      ctx.fillText(zh, x, cardY + 30);
    }
  }

  function drawMonster(z, y, highlight, inked) {
    const walk = Math.sin(z.phase) * 5;
    if (inked) drawInkPuddle(z.x, y);
    const species = MONSTERS[z.kind] || MONSTERS[0];
    species.draw(doodle, { x: z.x, y, walk, seed: z.seed, hl: highlight });
    drawWordCard(z, highlight, z.x, y);
  }

  function drawPeaShot(p) {
    doodleEllipse(p.x, p.y, 9, 8, GREEN_DARK, 2, p.seed, "#7ed957");
  }

  return { drawPaper, drawGrass, drawCabin, drawPea, drawMonster, drawPeaShot };
}
