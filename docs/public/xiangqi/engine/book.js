import { getAllLegalMoves } from "./rules.js";

function keyOf(from, to) {
  return `${from.f},${from.r}-${to.f},${to.r}`;
}

function parseKey(s) {
  const [a, b] = s.split("-");
  const [ff, fr] = a.split(",").map(Number);
  const [tf, tr] = b.split(",").map(Number);
  return { from: { f: ff, r: fr }, to: { f: tf, r: tr } };
}

function histKey(move) {
  const from = move.from || move;
  const to = move.to;
  return keyOf(from, to);
}

/**
 * 常见开局序列（我方坐标 f,r）。
 * 红右炮为 (7,2)，炮二平五 = 7,2-4,2。
 */
const LINES = [
  // 中炮对屏风马
  [
    "7,2-4,2", // 炮二平五
    "7,9-6,7", // 马8进7
    "7,0-6,2", // 马二进三
    "1,9-2,7", // 马2进3
    "8,0-7,0", // 车一平二
    "0,9-1,9", // 车9平8
    "2,3-2,4", // 兵七进一
    "7,7-8,7", // 炮8平9
    "1,0-2,2", // 马八进七
    "6,6-6,5", // 卒7进1
  ],
  // 顺炮
  [
    "7,2-4,2", // 炮二平五
    "7,7-4,7", // 炮8平5
    "7,0-6,2", // 马二进三
    "7,9-6,7", // 马8进7
    "8,0-7,0", // 车一平二
    "0,9-0,8", // 车9进1
    "1,0-2,2", // 马八进七
    "0,8-4,8", // 车9平5
  ],
  // 飞相局
  [
    "2,0-4,2", // 相三进五
    "7,9-6,7", // 马8进7
    "1,0-2,2", // 马八进七
    "1,9-2,7", // 马2进3
    "7,0-6,2", // 马二进三
    "7,7-7,5", // 炮8进2
    "2,3-2,4", // 兵七进一
    "2,6-2,5", // 卒3进1
  ],
  // 仙人指路
  [
    "2,3-2,4", // 兵七进一
    "2,6-2,5", // 卒3进1
    "1,0-2,2", // 马八进七
    "1,9-2,7", // 马2进3
    "2,0-4,2", // 相三进五
    "7,9-6,7", // 马8进7
    "7,0-6,2", // 马二进三
    "7,7-4,7", // 炮8平5
  ],
];

/**
 * 仅当已走序列与某条开局库完全匹配时返回下一着；并校验当前局面合法。
 */
export function probeBook(board, side, historyMoves) {
  const hist = historyMoves || [];
  const histKeys = hist.map(histKey);
  const candidates = [];
  const seen = new Set();
  for (const line of LINES) {
    if (line.length <= hist.length) continue;
    let match = true;
    for (let i = 0; i < hist.length; i++) {
      if (line[i] !== histKeys[i]) {
        match = false;
        break;
      }
    }
    if (!match) continue;
    const next = line[hist.length];
    if (seen.has(next)) continue;
    seen.add(next);
    candidates.push(parseKey(next));
  }
  if (!candidates.length) return null;
  const legal = getAllLegalMoves(board, side);
  const playable = [];
  for (const c of candidates) {
    const hit = legal.find((m) => m.from.f === c.from.f && m.from.r === c.from.r && m.to.f === c.to.f && m.to.r === c.to.r);
    if (hit) {
      playable.push({
        from: { f: hit.from.f, r: hit.from.r },
        to: { f: hit.to.f, r: hit.to.r },
        capture: hit.capture,
      });
    }
  }
  if (!playable.length) return null;
  return playable[Math.floor(Math.random() * playable.length)];
}
