export const MODE_RECOGNIZE = "recognize";
export const MODE_DICTATE = "dictate";

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 随机插入；队列非空时尽量不插到最前，避免同一词立刻再刷 */
function insertRandom(queue, card, { avoidFront = true } = {}) {
  if (!queue.length) {
    queue.push(card);
    return;
  }
  const min = avoidFront ? 1 : 0;
  const idx = min + Math.floor(Math.random() * (queue.length - min + 1));
  queue.splice(idx, 0, card);
}

/**
 * 本关牌堆：词表每个词必须先认词、后默写，共 total = words.length * 2 次。
 * 认词牌开局洗乱；默写牌在认词打对后随机插入剩余队列；漏怪也随机插回。
 */
export function createDeck(words) {
  const list = Array.isArray(words) ? words.filter(Boolean) : [];
  const queue = shuffle(list.map((word) => ({ word, mode: MODE_RECOGNIZE })));
  let cleared = 0;
  const total = list.length * 2;

  return {
    get cleared() {
      return cleared;
    },
    get total() {
      return total;
    },
    remaining() {
      return queue.length;
    },
    draw() {
      return queue.shift() || null;
    },
    returnCard(card) {
      insertRandom(queue, { word: card.word, mode: card.mode }, { avoidFront: true });
    },
    complete(card) {
      cleared += 1;
      if (card.mode === MODE_RECOGNIZE) {
        insertRandom(
          queue,
          { word: card.word, mode: MODE_DICTATE },
          { avoidFront: true },
        );
      }
    },
    isClear(fieldCount) {
      return cleared >= total && fieldCount === 0;
    },
  };
}

export function streakSpeed(parentSpeed, streak, step, cap) {
  return parentSpeed * Math.min(cap, step ** Math.max(0, streak));
}
