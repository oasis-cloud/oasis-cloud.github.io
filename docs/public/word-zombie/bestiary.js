import { createDoodle, LINE, PAPER } from "./doodle.js";
import { loadDex, saveDex } from "./storage.js";
import { MONSTERS } from "./monsters/index.js";

export function createBestiary() {
  const dex = loadDex();

  function persist() {
    saveDex(dex);
  }

  function markSeen(id) {
    if (!id || dex.seen.has(id)) return;
    dex.seen.add(id);
    persist();
  }

  function markDefeated(id) {
    if (!id) return;
    dex.seen.add(id);
    dex.defeated.add(id);
    persist();
  }

  function statusOf(id) {
    if (dex.defeated.has(id)) return "击败过";
    if (dex.seen.has(id)) return "见过";
    return "未遇见";
  }

  function render(grid) {
    grid.innerHTML = "";
    MONSTERS.forEach((species, i) => {
      const card = document.createElement("article");
      card.className = "dex-card";
      const preview = document.createElement("canvas");
      preview.width = 160;
      preview.height = 180;
      const title = document.createElement("h2");
      title.textContent = species.name;
      const tag = document.createElement("span");
      tag.className = "dex-tag";
      tag.textContent = statusOf(species.id);
      const blurb = document.createElement("p");
      blurb.textContent = species.blurb;
      card.append(preview, title, tag, blurb);
      grid.append(card);
      const c = preview.getContext("2d");
      c.fillStyle = PAPER;
      c.fillRect(0, 0, 160, 180);
      c.strokeStyle = LINE;
      for (let y = 20; y < 180; y += 18) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(160, y);
        c.stroke();
      }
      species.draw(createDoodle(c), {
        x: 80,
        y: 155,
        walk: 2,
        seed: i * 13 + 5,
        hl: false,
      });
    });
  }

  return { markSeen, markDefeated, render };
}
