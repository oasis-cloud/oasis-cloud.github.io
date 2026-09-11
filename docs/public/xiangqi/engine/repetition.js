/** 将局面哈希追加到列表，供重复局面 / 长将判定。 */
export function recordHash(hashes, hash) {
  hashes.push(hash);
  return hashes;
}

/**
 * 同一方连续用将军造成三次重复局面 → 长将。
 * `checkFlags[i]` 表示走到 `hashes[i]` 的那一步是否将军。
 */
export function isPerpetualCheck(hashes, checkFlags) {
  if (!hashes.length) return false;
  const last = hashes.length - 1;
  const key = hashes[last];
  const occ = [];
  for (let i = 0; i <= last; i++) {
    if (hashes[i] === key) occ.push(i);
  }
  if (occ.length < 3) return false;
  const from = occ[occ.length - 3];
  for (let i = from; i <= last; i++) {
    if (((last - i) & 1) === 0 && !checkFlags[i]) return false;
  }
  return true;
}

/** 六十回合不吃子和：双方各 60 步 = 120 ply。 */
export function isSixtyMoveDraw(halfmovePlies) {
  return halfmovePlies >= 120;
}
