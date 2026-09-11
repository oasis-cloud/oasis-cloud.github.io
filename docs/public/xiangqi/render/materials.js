/**
 * 工笔材质工厂。零 PBR；同 kind+army 共用实例。
 */
import * as THREE from "three";
import { MATERIAL_KIND } from "../core/constants.js";
import { HAN, PIGMENT, RAMP_THRESHOLDS, SCENE_COLOR } from "../core/palette.js";
import {
  gongbiFragment,
  gongbiVertex,
  outlineFragment,
  outlineVertex,
  riverFragment,
  riverVertex,
} from "./shaders.js";
import { makeCunTexture, makeSilkTexture } from "./textures.js";

const tracked = new Set();
const gongbiCache = new Map();
const outlineCache = { ink: null, gold: null };
let riverMat = null;
const resolution = new THREE.Vector2(1, 1);

const SILK_BY_KIND = {
  [MATERIAL_KIND.LACQUER]: 0.08,
  [MATERIAL_KIND.CLOTH]: 0.16,
  [MATERIAL_KIND.LEATHER]: 0.12,
  [MATERIAL_KIND.GOLD]: 0.05,
  [MATERIAL_KIND.IVORY]: 0.07,
  [MATERIAL_KIND.WOOD]: 0.14,
  [MATERIAL_KIND.INK]: 0.1,
  [MATERIAL_KIND.PIGMENT]: 0.12,
  skin: 0.06,
};

function defaultRamp(kind) {
  const fromHan = HAN[kind];
  if (Array.isArray(fromHan) && fromHan.length >= 4) return fromHan;
  if (kind === "skin" && Array.isArray(HAN.skin)) return HAN.skin;
  return HAN.lacquer;
}

function defaultThresholds(kind) {
  const t = RAMP_THRESHOLDS[kind] || RAMP_THRESHOLDS.pigment;
  return t.slice(0, 3);
}

function track(mat) {
  tracked.add(mat);
  if (mat.uniforms?.uResolution) {
    mat.uniforms.uResolution.value.copy(resolution);
  }
  return mat;
}

function hexRamp(arr) {
  const src = arr && arr.length >= 4 ? arr : defaultRamp(MATERIAL_KIND.LACQUER);
  return [
    new THREE.Color(src[0]),
    new THREE.Color(src[1]),
    new THREE.Color(src[2]),
    new THREE.Color(src[3]),
  ];
}

/**
 * @param {{ kind: string, rampHexArray?: number[], thresholds?: number[], silkStrength?: number }} opts
 */
export function createGongbiMaterial({ kind, rampHexArray, thresholds, silkStrength } = {}) {
  const k = kind || MATERIAL_KIND.LACQUER;
  const ramp = rampHexArray && rampHexArray.length >= 4 ? rampHexArray : defaultRamp(k);
  const key = `${k}:${ramp.map((h) => h.toString(16)).join("-")}`;
  const hit = gongbiCache.get(key);
  if (hit) return hit;

  const th = thresholds && thresholds.length >= 3 ? thresholds.slice(0, 3) : defaultThresholds(k);
  const colors = hexRamp(ramp);

  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.lights,
    {
      ramp0: { value: colors[0] },
      ramp1: { value: colors[1] },
      ramp2: { value: colors[2] },
      ramp3: { value: colors[3] },
      thresholds: { value: new THREE.Vector3(th[0], th[1], th[2]) },
      silkMap: { value: makeSilkTexture() },
      cunMap: { value: makeCunTexture() },
      uResolution: { value: resolution.clone() },
      uSilkStrength: { value: silkStrength ?? SILK_BY_KIND[k] ?? 0.12 },
      uInkEdge: { value: 0 },
      uSilhouette: { value: 0 },
    },
  ]);

  const mat = new THREE.ShaderMaterial({
    name: `gongbi-${k}`,
    lights: true,
    uniforms,
    vertexShader: gongbiVertex,
    fragmentShader: gongbiFragment,
    fog: false,
  });
  mat.userData.gongbiKind = k;
  gongbiCache.set(key, mat);
  return track(mat);
}

/**
 * @param {{ gold?: boolean, width?: number }} opts
 */
export function createOutlineMaterial({ gold = false, width = 0.0025 } = {}) {
  const slot = gold ? "gold" : "ink";
  if (outlineCache[slot]) return outlineCache[slot];

  const mat = new THREE.ShaderMaterial({
    name: gold ? "outline-gold" : "outline-ink",
    uniforms: {
      uWidth: { value: width },
      uGold: { value: gold ? 1 : 0 },
      uInkColor: { value: new THREE.Color(SCENE_COLOR.inkLine) },
      uGoldColor: { value: new THREE.Color(SCENE_COLOR.goldLine) },
      uSilhouette: { value: 0 },
    },
    vertexShader: outlineVertex,
    fragmentShader: outlineFragment,
    side: THREE.BackSide,
    fog: false,
    depthWrite: true,
  });
  outlineCache[slot] = mat;
  return track(mat);
}

export function createRiverMaterial() {
  if (riverMat) return riverMat;
  riverMat = new THREE.ShaderMaterial({
    name: "gongbi-river",
    uniforms: {
      river0: { value: new THREE.Color(SCENE_COLOR.riverDeep) },
      river1: { value: new THREE.Color(SCENE_COLOR.riverMid) },
      river2: { value: new THREE.Color(SCENE_COLOR.riverLight) },
      river3: { value: new THREE.Color(PIGMENT.qing.wash) },
      lightDir: { value: new THREE.Vector3(0.25, 0.9, 0.35).normalize() },
      uTime: { value: 0 },
      uSilhouette: { value: 0 },
      uResolution: { value: resolution.clone() },
      silkMap: { value: makeSilkTexture() },
      uSilkStrength: { value: 0.1 },
    },
    vertexShader: riverVertex,
    fragmentShader: riverFragment,
    fog: false,
  });
  riverMat.onBeforeRender = () => {
    riverMat.uniforms.uTime.value = performance.now() * 0.001;
  };
  return track(riverMat);
}

export function setResolution(w, h) {
  resolution.set(Math.max(1, w), Math.max(1, h));
  for (const mat of tracked) {
    if (mat.uniforms?.uResolution) {
      mat.uniforms.uResolution.value.copy(resolution);
    }
  }
}

export function setSilhouetteMode(mat, on) {
  if (mat?.uniforms?.uSilhouette) {
    mat.uniforms.uSilhouette.value = on ? 1 : 0;
  }
}

export function setAllSilhouette(on) {
  for (const mat of tracked) setSilhouetteMode(mat, on);
}

export function getTrackedMaterials() {
  return tracked;
}
