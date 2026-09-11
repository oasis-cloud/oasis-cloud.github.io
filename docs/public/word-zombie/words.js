export const DEFAULT_WORDS = `apple,苹果
book,书
water,水
friend,朋友
school,学校
family,家庭
happy,高兴
music,音乐
green,绿色的
jump,跳
run,跑
sleep,睡觉
bread,面包
river,河
mountain,山
window,窗户
morning,早晨
night,夜晚
question,问题
answer,答案`;

export function parseWordList(text) {
  const ok = [];
  const errors = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    let en = "";
    let zh = "";
    if (line.includes(",")) {
      const idx = line.indexOf(",");
      en = line.slice(0, idx).trim();
      zh = line.slice(idx + 1).trim();
    } else if (line.includes("\t")) {
      const parts = line.split("\t");
      en = parts[0].trim();
      zh = parts.slice(1).join(" ").trim();
    } else {
      const m = line.match(/^([A-Za-z][A-Za-z0-9\-']*)\s+(.+)$/);
      if (!m) {
        errors.push(i + 1);
        return;
      }
      en = m[1];
      zh = m[2].trim();
    }
    if (!/^[A-Za-z][A-Za-z0-9\-']*$/.test(en) || !zh) {
      errors.push(i + 1);
      return;
    }
    ok.push({ en, zh });
  });
  return { ok, errors };
}
