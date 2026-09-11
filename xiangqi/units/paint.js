/**
 * 汉/楚军队材质入口。单位与载具都走工笔 ramp，禁止各自再 new Toon。
 */
import { MATERIAL_KIND } from "../core/constants.js";
import { armyOf } from "../core/palette.js";
import { createGongbiMaterial, createOutlineMaterial } from "../render/materials.js";

export function armyMaterial(kind, side) {
  const army = armyOf(side);
  let ramp;
  if (kind === "skin") ramp = army.skin;
  else if (kind === MATERIAL_KIND.PIGMENT) {
    const c = army.flag;
    ramp = [army.lacquer[0], c, army.cloth[2] ?? c, army.cloth[3] ?? c];
  } else ramp = army[kind] || army.lacquer;
  const k = kind === "skin" ? "skin" : kind;
  return createGongbiMaterial({ kind: k, rampHexArray: ramp });
}

export { createOutlineMaterial };
