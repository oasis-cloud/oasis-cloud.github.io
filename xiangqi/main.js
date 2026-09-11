import { bindHud } from "./ui/hud.js";
import { createAudio } from "./ui/audio.js";
import * as storage from "./ui/storage.js";

const canvas = document.getElementById("c");
const hud = bindHud({
  hud: document.getElementById("hud"),
  lobby: document.getElementById("lobby"),
  over: document.getElementById("over"),
  review: document.getElementById("review"),
  moveList: document.getElementById("move-list"),
});
const audio = createAudio();

hud.showLobby();

let game = null;

function applyReview(result) {
  const hint = document.getElementById("review-hint");
  if (!hint || result == null) return;
  if (typeof result === "string") hint.textContent = result;
  else if (result.hint != null) hint.textContent = result.hint;
}

function gesture(fn) {
  return () => {
    audio.resume();
    fn();
  };
}

document.getElementById("btn-start-easy").addEventListener(
  "click",
  gesture(() => {
    hud.setDifficulty("easy");
    hud.hideLobby();
    game?.start?.({ vs: "ai", difficulty: "easy" });
  }),
);

document.getElementById("btn-start-medium").addEventListener(
  "click",
  gesture(() => {
    hud.setDifficulty("medium");
    hud.hideLobby();
    game?.start?.({ vs: "ai", difficulty: "medium" });
  }),
);

document.getElementById("btn-start-hard").addEventListener(
  "click",
  gesture(() => {
    hud.setDifficulty("hard");
    hud.hideLobby();
    game?.start?.({ vs: "ai", difficulty: "hard" });
  }),
);

document.getElementById("btn-start-human").addEventListener(
  "click",
  gesture(() => {
    hud.setDifficulty("human");
    hud.hideLobby();
    game?.start?.({ vs: "human", difficulty: "medium" });
  }),
);

document.getElementById("btn-continue").addEventListener(
  "click",
  gesture(() => {
    hud.hideLobby();
    game?.continueSaved?.();
  }),
);

document.getElementById("btn-undo").addEventListener("click", () => game?.undo?.());
document.getElementById("btn-hint").addEventListener("click", () => game?.hint?.());
document.getElementById("btn-resign").addEventListener("click", () => game?.resign?.());
document.getElementById("btn-restart").addEventListener("click", () => game?.restart?.());
document.getElementById("btn-skip").addEventListener("click", () => game?.skipParade?.());
document.getElementById("btn-silhouette").addEventListener("click", () => game?.toggleSilhouette?.());

document.getElementById("btn-again").addEventListener(
  "click",
  gesture(() => {
    hud.hideOver();
    hud.hideReview();
    game?.restart?.();
  }),
);

document.getElementById("btn-review").addEventListener("click", () => {
  hud.showReview();
});

document.getElementById("btn-review-prev").addEventListener("click", () => {
  applyReview(game?.reviewPrev?.());
});

document.getElementById("btn-review-next").addEventListener("click", () => {
  applyReview(game?.reviewNext?.());
});

window.addEventListener("resize", () => game?.resize?.());

try {
  const mod = await import("./game.js");
  game = mod.createGame(canvas, {
    hud,
    audio,
    storage,
    onNeedEngine: true,
  });
} catch (err) {
  console.warn("createGame 尚未就绪", err);
}
