import { FILES, RANKS, TILE, BOARD_Y, RIVER_GAP, BASE_HEIGHT } from "./constants.js";

export function tileToWorld(f, r) {
  const x = (f - (FILES - 1) / 2) * TILE;
  let z = (r - (RANKS - 1) / 2) * TILE;
  z += r >= 5 ? RIVER_GAP / 2 : -RIVER_GAP / 2;
  return { x, y: BOARD_Y + BASE_HEIGHT, z };
}

export function worldToTile(x, z) {
  const river = z >= 0 ? RIVER_GAP / 2 : -RIVER_GAP / 2;
  const f = Math.round(x / TILE + (FILES - 1) / 2);
  const r = Math.round((z - river) / TILE + (RANKS - 1) / 2);
  return { f, r };
}

export function boardSpan() {
  const pad = 1.05;
  return {
    x: (FILES - 1) * TILE + pad * 2,
    z: (RANKS - 1) * TILE + RIVER_GAP + pad * 2,
    pad,
  };
}
