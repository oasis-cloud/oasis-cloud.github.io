export const INK = "#2b6cb0";
export const INK_DARK = "#1e4a7a";
export const PAPER = "#f4efe2";
export const LINE = "#7aa3d4";
export const ORANGE = "#e07a2f";
export const GREEN = "#3aa56a";
export const GREEN_DARK = "#2a7a4c";

export function wobble(seed, i, amp = 1.4) {
  const n = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return (n - Math.floor(n) - 0.5) * 2 * amp;
}

export function createDoodle(ctx) {
  function strokePath(points, color, width = 2.4) {
    if (points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke();
    ctx.restore();
  }

  function doodleEllipse(cx, cy, rx, ry, color, width, seed, fill) {
    const pts = [];
    const steps = 22;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      pts.push([
        cx + Math.cos(a) * rx + wobble(seed, i, 1.1),
        cy + Math.sin(a) * ry + wobble(seed, i + 9, 1.1),
      ]);
    }
    ctx.save();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    strokePath(pts, color, width);
  }

  function doodleRect(x, y, w, h, color, width, seed, fill) {
    const pts = [
      [x + wobble(seed, 1), y + wobble(seed, 2)],
      [x + w + wobble(seed, 3), y + wobble(seed, 4)],
      [x + w + wobble(seed, 5), y + h + wobble(seed, 6)],
      [x + wobble(seed, 7), y + h + wobble(seed, 8)],
      [x + wobble(seed, 1), y + wobble(seed, 2)],
    ];
    ctx.save();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.fill();
    }
    ctx.restore();
    strokePath(pts, color, width);
  }

  function face(x, cy, seed, hl) {
    doodleEllipse(x, cy, 22, 20, INK, 2.5, seed + 1, hl ? "#e8f2ff" : PAPER);
    ctx.fillStyle = INK_DARK;
    ctx.beginPath();
    ctx.arc(x - 7, cy - 2, 2.4, 0, Math.PI * 2);
    ctx.arc(x + 7, cy - 2, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  return { ctx, strokePath, doodleEllipse, doodleRect, face };
}
