/**
 * 木案、绢面线刻、楚河汉界与格点交互。真实物体，不是贴图平面。
 */
import * as THREE from "three";
import { BOARD_Y, FILES, RANKS, RIVER_GAP, TILE, MATERIAL_KIND } from "../core/constants.js";
import { boardSpan, tileToWorld } from "../core/coords.js";
import { HAN, PIGMENT, RAMP_THRESHOLDS, SCENE_COLOR } from "../core/palette.js";
import { createGongbiMaterial, createRiverMaterial } from "../render/materials.js";
import { addOutline } from "../render/outline.js";
import { makeGoldFoilTexture, makeSealChar, makeSilkTexture, makeWoodTexture } from "../render/textures.js";

const LINE_Y = BOARD_Y + 0.048;
const SILK_TOP = BOARD_Y + 0.034;
const SILK_H = 0.028;
const WATER_Y = BOARD_Y + 0.004;

function attachOutline(parent, mesh, opts) {
  parent.add(mesh);
  const outline = addOutline(mesh, opts);
  parent.add(outline);
  return mesh;
}

function addBar(parent, x1, z1, x2, z2, y, mat, width = 0.028, height = 0.011) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  if (len < 1e-5) return null;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(len, height, width), mat);
  bar.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  bar.rotation.y = Math.atan2(-dz, dx);
  bar.castShadow = false;
  bar.receiveShadow = true;
  parent.add(bar);
  return bar;
}

function addBox(parent, w, h, d, x, y, z, mat, { cast = true, receive = true } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}

/** 炮/兵位传统「┴」角标：只朝有邻线的一侧张开。 */
function cornerMarks(parent, f, r, y, mat) {
  const { x, z } = tileToWorld(f, r);
  const inset = 0.11;
  const arm = 0.15;
  const xs = [];
  if (f > 0) xs.push(-1);
  if (f < FILES - 1) xs.push(1);
  for (const sx of xs) {
    for (const sz of [-1, 1]) {
      addBar(parent, x + sx * inset, z + sz * inset, x + sx * (inset + arm), z + sz * inset, y, mat, 0.022, 0.01);
      addBar(parent, x + sx * inset, z + sz * inset, x + sx * inset, z + sz * (inset + arm), y, mat, 0.022, 0.01);
    }
  }
}

function sealPlane(char, x, y, z) {
  const tex = makeSealChar(char, PIGMENT.nijin.mid);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    color: PIGMENT.nijin.light,
    depthWrite: false,
    transparent: true,
  });
  const mesh = new THREE.Sprite(mat);
  mesh.scale.set(0.72, 0.72, 1);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

export function createBoard(scene) {
  const root = new THREE.Group();
  root.name = "board";
  scene.add(root);

  const span = boardSpan();
  const woodMat = createGongbiMaterial({
    kind: MATERIAL_KIND.WOOD,
    rampHexArray: HAN.wood,
    thresholds: RAMP_THRESHOLDS.wood,
    silkStrength: 0.14,
  });
  const silkMat = createGongbiMaterial({
    kind: MATERIAL_KIND.CLOTH,
    rampHexArray: [PIGMENT.zhe.wash, PIGMENT.ge.deep, PIGMENT.ge.mid, PIGMENT.ge.light],
    thresholds: [0.42, 0.72, 0.97],
    silkStrength: 0.22,
  });
  const stoneMat = createGongbiMaterial({
    kind: MATERIAL_KIND.PIGMENT,
    rampHexArray: [PIGMENT.zhe.deep, PIGMENT.zhe.mid, PIGMENT.qing.mid, PIGMENT.ge.deep],
    thresholds: RAMP_THRESHOLDS.pigment,
    silkStrength: 0.1,
  });
  const goldMat = createGongbiMaterial({
    kind: MATERIAL_KIND.GOLD,
    rampHexArray: HAN.gold,
    thresholds: RAMP_THRESHOLDS.gold,
    silkStrength: 0.05,
  });
  const inkMat = createGongbiMaterial({
    kind: MATERIAL_KIND.INK,
    rampHexArray: HAN.ink,
    thresholds: RAMP_THRESHOLDS.ink,
    silkStrength: 0.08,
  });
  const riverMat = createRiverMaterial();
  const foilMap = makeGoldFoilTexture();
  const foilMat = new THREE.MeshBasicMaterial({
    map: foilMap,
    color: SCENE_COLOR.palaceGold,
  });
  const legalMat = new THREE.MeshBasicMaterial({
    color: SCENE_COLOR.legalMark,
    transparent: true,
    opacity: 0.92,
  });
  const captureMat = new THREE.MeshBasicMaterial({
    color: SCENE_COLOR.captureMark,
    transparent: true,
    opacity: 0.95,
  });
  const selectMat = new THREE.MeshBasicMaterial({
    color: PIGMENT.nijin.wash,
    transparent: true,
    opacity: 0.88,
  });
  const checkMat = new THREE.MeshBasicMaterial({
    color: SCENE_COLOR.checkPulse,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });

  const woodW = span.x + 0.55;
  const woodD = span.z + 0.5;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(woodW, BOARD_Y, woodD), woodMat);
  plate.position.y = BOARD_Y / 2;
  plate.castShadow = true;
  plate.receiveShadow = true;
  attachOutline(root, plate, { gold: false, width: 0.0022 });

  const grainTex = makeWoodTexture().clone();
  grainTex.repeat.set(2.2, 2.6);
  grainTex.needsUpdate = true;
  const grain = new THREE.Mesh(
    new THREE.PlaneGeometry(woodW * 0.995, woodD * 0.995),
    new THREE.MeshBasicMaterial({
      map: grainTex,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  grain.rotation.x = -Math.PI / 2;
  grain.position.y = BOARD_Y + 0.001;
  root.add(grain);

  const edgeY = BOARD_Y + 0.006;
  const goldH = 0.012;
  const goldT = 0.02;
  addBox(root, woodW + 0.02, goldH, goldT, 0, edgeY, woodD / 2, goldMat, { cast: false });
  addBox(root, woodW + 0.02, goldH, goldT, 0, edgeY, -woodD / 2, goldMat, { cast: false });
  addBox(root, goldT, goldH, woodD + 0.02, woodW / 2, edgeY, 0, goldMat, { cast: false });
  addBox(root, goldT, goldH, woodD + 0.02, -woodW / 2, edgeY, 0, goldMat, { cast: false });

  const legInsetX = woodW / 2 - 0.42;
  const legInsetZ = woodD / 2 - 0.42;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * legInsetX;
      const z = sz * legInsetZ;
      const w = 0.22;
      const h = 0.17;
      const d = 0.22;
      addBox(root, w, h, d, x, -h / 2 + 0.012, z, woodMat);
      addBox(root, 0.02, h * 0.9, 0.02, x + sx * (w / 2), -h / 2 + 0.012, z + sz * (d / 2), goldMat, {
        cast: false,
      });
    }
  }

  const p00 = tileToWorld(0, 0);
  const p80 = tileToWorld(FILES - 1, 0);
  const p09 = tileToWorld(0, RANKS - 1);
  const silkW = (FILES - 1) * TILE + 0.42;
  const bankInner = 0.42;
  const redZ0 = p00.z - 0.26;
  const redZ1 = -bankInner;
  const blkZ0 = bankInner;
  const blkZ1 = p09.z + 0.26;
  const silkY = BOARD_Y + SILK_H / 2;

  const redSilk = new THREE.Mesh(new THREE.BoxGeometry(silkW, SILK_H, redZ1 - redZ0), silkMat);
  redSilk.position.set(0, silkY, (redZ0 + redZ1) / 2);
  redSilk.castShadow = true;
  redSilk.receiveShadow = true;
  attachOutline(root, redSilk, { gold: false, width: 0.0018 });

  const blkSilk = new THREE.Mesh(new THREE.BoxGeometry(silkW, SILK_H, blkZ1 - blkZ0), silkMat);
  blkSilk.position.set(0, silkY, (blkZ0 + blkZ1) / 2);
  blkSilk.castShadow = true;
  blkSilk.receiveShadow = true;
  attachOutline(root, blkSilk, { gold: false, width: 0.0018 });

  const silkTex = makeSilkTexture().clone();
  silkTex.repeat.set(6, 7);
  silkTex.needsUpdate = true;
  const silkWash = new THREE.MeshBasicMaterial({
    map: silkTex,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  for (const [z0, z1] of [
    [redZ0, redZ1],
    [blkZ0, blkZ1],
  ]) {
    const wash = new THREE.Mesh(new THREE.PlaneGeometry(silkW * 0.98, z1 - z0 - 0.04), silkWash);
    wash.rotation.x = -Math.PI / 2;
    wash.position.set(0, SILK_TOP + 0.001, (z0 + z1) / 2);
    root.add(wash);
  }

  const trough = addBox(root, silkW * 0.98, 0.07, RIVER_GAP * 1.05, 0, BOARD_Y - 0.06, 0, woodMat);
  trough.receiveShadow = true;

  const water = new THREE.Mesh(new THREE.BoxGeometry(silkW * 0.9, 0.032, RIVER_GAP * 0.62), riverMat);
  water.position.set(0, WATER_Y, 0);
  water.receiveShadow = false;
  water.castShadow = false;
  root.add(water);

  const stoneN = 12;
  const stoneSpan = silkW * 0.92;
  const stoneW = stoneSpan / stoneN;
  for (const side of [-1, 1]) {
    for (let i = 0; i < stoneN; i++) {
      const h = 0.068 + (i % 3) * 0.01;
      const d = 0.12 + (i % 2) * 0.018;
      const x = -stoneSpan / 2 + (i + 0.5) * stoneW;
      const z = side * 0.38;
      addBox(root, stoneW * 0.9, h, d, x, BOARD_Y - 0.018 + h / 2, z, stoneMat);
    }
    addBox(root, stoneSpan * 0.96, 0.01, 0.016, 0, BOARD_Y + 0.028, side * 0.32, goldMat, { cast: false });
  }

  const sealY = WATER_Y + 0.028;
  root.add(sealPlane("楚", 2.55, sealY, 0));
  root.add(sealPlane("河", 2.05, sealY, 0));
  root.add(sealPlane("汉", -2.05, sealY, 0));
  root.add(sealPlane("界", -2.55, sealY, 0));

  addBar(root, p00.x, p00.z, p80.x, p80.z, LINE_Y, inkMat, 0.042, 0.02);
  addBar(root, p09.x, p09.z, tileToWorld(FILES - 1, RANKS - 1).x, p09.z, LINE_Y, inkMat, 0.038, 0.014);
  const p04 = tileToWorld(0, 4);
  const p84 = tileToWorld(FILES - 1, 4);
  const p05 = tileToWorld(0, 5);
  const p85 = tileToWorld(FILES - 1, 5);
  addBar(root, p00.x, p00.z, p04.x, p04.z, LINE_Y, inkMat, 0.038, 0.014);
  addBar(root, p80.x, p80.z, p84.x, p84.z, LINE_Y, inkMat, 0.038, 0.014);
  addBar(root, p05.x, p05.z, p09.x, p09.z, LINE_Y, inkMat, 0.038, 0.014);
  addBar(root, p85.x, p85.z, tileToWorld(FILES - 1, RANKS - 1).x, p09.z, LINE_Y, inkMat, 0.038, 0.014);

  for (let r = 1; r < RANKS - 1; r++) {
    const a = tileToWorld(0, r);
    const b = tileToWorld(FILES - 1, r);
    addBar(root, a.x, a.z, b.x, b.z, LINE_Y, inkMat, 0.028, 0.012);
  }
  for (let f = 0; f < FILES; f++) {
    const redA = tileToWorld(f, 0);
    const redB = tileToWorld(f, 4);
    const blkA = tileToWorld(f, 5);
    const blkB = tileToWorld(f, 9);
    addBar(root, redA.x, redA.z, redB.x, redB.z, LINE_Y, inkMat, 0.028, 0.012);
    addBar(root, blkA.x, blkA.z, blkB.x, blkB.z, LINE_Y, inkMat, 0.028, 0.012);
  }

  const palaces = [
    [
      [3, 0],
      [5, 0],
      [3, 2],
      [5, 2],
    ],
    [
      [3, 7],
      [5, 7],
      [3, 9],
      [5, 9],
    ],
  ];
  for (const p of palaces) {
    const a = tileToWorld(...p[0]);
    const b = tileToWorld(...p[1]);
    const c = tileToWorld(...p[2]);
    const d = tileToWorld(...p[3]);
    addBar(root, a.x, a.z, d.x, d.z, LINE_Y + 0.001, foilMat, 0.032, 0.01);
    addBar(root, b.x, b.z, c.x, c.z, LINE_Y + 0.001, foilMat, 0.032, 0.01);
  }

  for (const [f, r] of [
    [1, 2],
    [7, 2],
    [1, 7],
    [7, 7],
    [0, 3],
    [2, 3],
    [4, 3],
    [6, 3],
    [8, 3],
    [0, 6],
    [2, 6],
    [4, 6],
    [6, 6],
    [8, 6],
  ]) {
    cornerMarks(root, f, r, LINE_Y, inkMat);
  }

  const hitGeo = new THREE.PlaneGeometry(TILE * 0.98, TILE * 0.98);
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const markGeo = new THREE.BoxGeometry(0.46, 0.022, 0.46);
  const points = [];
  const marks = [];
  const hitMeshes = [];

  for (let r = 0; r < RANKS; r++) {
    points[r] = [];
    marks[r] = [];
    for (let f = 0; f < FILES; f++) {
      const { x, z } = tileToWorld(f, r);
      const hit = new THREE.Mesh(hitGeo, hitMat);
      hit.rotation.x = -Math.PI / 2;
      hit.position.set(x, BOARD_Y + 0.06, z);
      hit.userData = { f, r, kind: "point" };
      root.add(hit);
      points[r][f] = hit;
      hitMeshes.push(hit);

      const mark = new THREE.Mesh(markGeo, legalMat);
      mark.rotation.y = Math.PI / 4;
      mark.position.set(x, BOARD_Y + 0.055, z);
      mark.visible = false;
      mark.userData = { f, r, kind: "highlight" };
      root.add(mark);
      marks[r][f] = mark;
    }
  }

  const checkRoot = new THREE.Group();
  checkRoot.visible = false;
  const checkRing = new THREE.Mesh(new THREE.TorusGeometry(TILE * 0.3, 0.016, 6, 24), checkMat);
  checkRing.rotation.x = Math.PI / 2;
  checkRoot.add(checkRing);
  const checkPlate = new THREE.Mesh(new THREE.RingGeometry(TILE * 0.14, TILE * 0.32, 4), checkMat);
  checkPlate.rotation.x = -Math.PI / 2;
  checkPlate.rotation.z = Math.PI / 4;
  checkPlate.position.y = -0.006;
  checkRoot.add(checkPlate);
  root.add(checkRoot);

  function setHighlights(selected, legalMoves) {
    for (let r = 0; r < RANKS; r++) {
      for (let f = 0; f < FILES; f++) {
        marks[r][f].visible = false;
      }
    }
    if (selected && marks[selected.r]?.[selected.f]) {
      const m = marks[selected.r][selected.f];
      m.visible = true;
      m.material = selectMat;
      m.scale.setScalar(1.22);
    }
    for (const move of legalMoves || []) {
      const m = marks[move.r]?.[move.f];
      if (!m) continue;
      m.visible = true;
      m.material = move.capture ? captureMat : legalMat;
      m.scale.setScalar(selected && selected.f === move.f && selected.r === move.r ? 1.22 : 1);
    }
  }

  function setCheckSquare(f, r) {
    if (f == null || r == null) {
      checkRoot.visible = false;
      return;
    }
    const w = tileToWorld(f, r);
    checkRoot.position.set(w.x, BOARD_Y + 0.028, w.z);
    checkRoot.visible = true;
  }

  function setRiverTime(t) {
    if (riverMat.uniforms?.uTime) riverMat.uniforms.uTime.value = t;
    if (checkRoot.visible) {
      const s = 1 + Math.sin(t * 5.6) * 0.09;
      checkRoot.scale.set(s, 1, s);
      checkMat.opacity = 0.52 + Math.sin(t * 5.6) * 0.32;
    }
  }

  return {
    root,
    points,
    setHighlights,
    setCheckSquare,
    setRiverTime,
    hitMeshes,
  };
}
