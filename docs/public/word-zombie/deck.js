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

export function createDeck(words) {
  const queue = shuffle(words.map((word) => ({ word, mode: MODE_RECOGNIZE })));
  let cleared = 0;
  const total = words.length * 2;

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
      queue.push({ word: card.word, mode: card.mode });
    },
    complete(card) {
      cleared += 1;
      if (card.mode === MODE_RECOGNIZE) {
        queue.push({ word: card.word, mode: MODE_DICTATE });
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
