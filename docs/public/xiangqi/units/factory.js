/**
 * 程序化棋子工厂。几何按 (type, side) 缓存，实例重建骨架并 bind。
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  BASE_HEIGHT,
  MATERIAL_KIND,
  PIECE_LABEL,
  TILE,
  UNIT_SCALE,
} from "../core/constants.js";
import { armyOf } from "../core/palette.js";
import { addOutline } from "../render/outline.js";
import { specOf } from "./catalog.js";
import { armyMaterial } from "./paint.js";
import {
  compose,
  extrudePlate,
  lathe,
  placed,
  polyShape,
  prismBox,
  prismCyl,
  pyramid,
  rectShape,
  taperedPrism,
} from "./geometry.js";
import {
  createCatapult,
  createChariot,
  createElephant,
  createHorse,
} from "./mounts.js";
import {
  bindMatricesOf,
  bindSkeleton,
  createHumanoidBones,
  skinGeometry,
} from "./skeleton.js";

function createGongbiMaterial(kind, side) {
  return armyMaterial(kind, side);
}

const PICK_MAT = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
  colorWrite: false,
});

function addPickProxy(unit, type) {
  const u = UNIT_SCALE[type];
  const h = u.height + (u.platform || 0) + 0.22;
  const w = Math.min(TILE * 0.9, Math.max(0.34, u.width * 1.12));
  const d = Math.min(TILE * 0.9, Math.max(0.34, u.depth * 1.08));
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), PICK_MAT);
  mesh.name = "pickProxy";
  mesh.position.y = h * 0.48;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.userData.pickProxy = true;
  mesh.userData.pieceRoot = unit;
  unit.add(mesh);
}

function figureScale(type) {
  const u = UNIT_SCALE[type];
  const scale = {
    height: u.height,
    width: u.width,
    depth: u.depth,
    head: u.head,
    shoulder: u.shoulder,
    platform: u.platform || 0,
    fullHeight: u.height,
    fullWidth: u.width,
    fullDepth: u.depth,
    type,
  };
  if (type === "king") {
    scale.height = 0.78;
    scale.width = 0.52;
    scale.depth = 0.4;
  } else if (type === "cannon") {
    scale.height = 0.7;
    scale.width = 0.4;
    scale.depth = 0.32;
  } else if (type === "horse") {
    scale.height = 0.56;
    scale.width = 0.34;
    scale.depth = 0.28;
  } else if (type === "elephant") {
    scale.height = 0.5;
    scale.width = 0.38;
    scale.depth = 0.3;
  } else if (type === "chariot") {
    scale.height = 0.58;
    scale.width = 0.38;
    scale.depth = 0.3;
  }
  return scale;
}

function wp(bone) {
  return new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
}

function part(geo, kind) {
  return { geo, kind };
}

function limbBetween(a, b, r0, r1, kind) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = Math.max(dir.length(), 1e-4);
  const geo = taperedPrism(r0 * 2, r1 * 2, len, Math.max(r0, r1) * 1.85);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.multiplyScalar(1 / len)
  );
  const mid = a.clone().add(b).multiplyScalar(0.5);
  geo.applyMatrix4(new THREE.Matrix4().compose(mid, quat, new THREE.Vector3(1, 1, 1)));
  return part(geo, kind);
}

function prepareGeo(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.attributes.uv) {
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  }
  if (!g.attributes.normal) g.computeVertexNormals();
  for (const name of Object.keys(g.attributes)) {
    if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
  }
  return g;
}

function assemble(parts) {
  const buckets = new Map();
  const order = [];
  for (const p of parts) {
    if (!p || !p.geo || !p.geo.attributes || !p.geo.attributes.position) continue;
    if (!buckets.has(p.kind)) {
      buckets.set(p.kind, []);
      order.push(p.kind);
    }
    buckets.get(p.kind).push(prepareGeo(p.geo));
  }
  const geos = [];
  for (const kind of order) {
    const gs = buckets.get(kind);
    geos.push(gs.length === 1 ? gs[0] : mergeGeometries(gs, false) || gs[0]);
  }
  const geo = geos.length === 1 ? geos[0] : mergeGeometries(geos, true) || geos[0];
  return { geo, kinds: order };
}

function inflateGeometry(geo, amount) {
  const g = geo.clone();
  g.deleteAttribute("skinIndex");
  g.deleteAttribute("skinWeight");
  const flat = g.index ? g.toNonIndexed() : g;
  flat.computeVertexNormals();
  const pos = flat.attributes.position;
  const nrm = flat.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + nrm.getX(i) * amount,
      pos.getY(i) + nrm.getY(i) * amount,
      pos.getZ(i) + nrm.getZ(i) * amount
    );
  }
  pos.needsUpdate = true;
  return flat;
}

function makeSealMap(char, inkHex) {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4a3018";
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = "#352010";
  ctx.fillRect(10, 10, s - 20, s - 20);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, s - 28, s - 28);
  const c = new THREE.Color(inkHex);
  ctx.fillStyle = `rgb(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0})`;
  ctx.font = '800 68px "Songti SC","STSong","SimSun","Noto Serif SC",serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, s / 2, s / 2 + 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createBase(type, side) {
  const army = armyOf(side);
  const group = new THREE.Group();
  group.name = "base";
  const drum = new THREE.Mesh(
    lathe(
      [
        [0.02, 0],
        [0.17, 0],
        [0.185, 0.01],
        [0.16, BASE_HEIGHT],
        [0.02, BASE_HEIGHT],
      ],
      8
    ),
    createGongbiMaterial(MATERIAL_KIND.WOOD, side)
  );
  drum.castShadow = true;
  drum.receiveShadow = true;
  group.add(drum);
  const tex = makeSealMap(PIECE_LABEL[side][type], army.gold[2]);
  const plate = new THREE.Mesh(
    prismBox(0.21, 0.008, 0.21),
    new THREE.MeshBasicMaterial({
      map: tex,
    })
  );
  plate.name = "seal";
  plate.position.y = BASE_HEIGHT + 0.003;
  group.add(plate);
  return group;
}

function helmetParts(spec, scale, headPos) {
  const H = scale.height;
  const hr = Math.max(0.07, scale.head * H * 0.55);
  const y = headPos.y + hr * 0.12;
  const z = headPos.z;
  const parts = [];
  const lac = MATERIAL_KIND.LACQUER;
  const cloth = MATERIAL_KIND.CLOTH;
  const gold = MATERIAL_KIND.GOLD;
  const ink = MATERIAL_KIND.INK;

  switch (spec.helmet) {
    case "doumou":
      parts.push(
        part(
          placed(
            lathe(
              [
                [hr * 0.12, 0],
                [hr * 0.7, 0.008],
                [hr * 0.76, hr * 0.42],
                [hr * 0.38, hr * 0.82],
                [hr * 0.1, hr * 0.92],
              ],
              8
            ),
            0,
            y,
            z
          ),
          lac
        )
      );
      parts.push(part(placed(prismCyl(hr * 0.8, hr * 0.8, 0.016, 8), 0, y + 0.008, z), gold));
      break;
    case "clothHelm":
      parts.push(
        part(
          placed(
            lathe(
              [
                [hr * 0.18, 0],
                [hr * 0.68, 0.012],
                [hr * 0.66, hr * 0.52],
                [hr * 0.48, hr * 0.68],
                [0.04, hr * 0.7],
              ],
              8
            ),
            0,
            y,
            z
          ),
          cloth
        )
      );
      parts.push(part(placed(prismBox(hr * 1.35, hr * 0.2, hr * 0.16), 0, y + hr * 0.12, z + hr * 0.52), gold));
      break;
    case "jinxian":
      parts.push(part(placed(prismBox(hr * 1.05, hr * 0.32, hr * 1.15), 0, y + hr * 0.18, z), cloth));
      parts.push(part(placed(prismBox(hr * 0.55, hr * 0.12, hr * 0.55), 0, y + hr * 0.38, z), gold));
      break;
    case "imperialMian":
      parts.push(part(placed(prismBox(hr * 1.05, hr * 0.38, hr * 1.0), 0, y + hr * 0.18, z), lac));
      parts.push(part(placed(prismBox(hr * 1.65, hr * 0.16, hr * 0.85), 0, y + hr * 0.52, z), gold));
      for (let i = -2; i <= 2; i++) {
        parts.push(
          part(placed(prismBox(0.012, hr * 0.28, 0.012), i * hr * 0.28, y + hr * 0.28, z + hr * 0.42), gold)
        );
      }
      break;
    case "chuHighCrown":
      parts.push(part(placed(taperedPrism(hr * 1.05, hr * 0.85, hr * 0.28, hr * 0.95), 0, y + hr * 0.08, z), ink));
      break;
    case "chuOfficial":
      parts.push(part(placed(taperedPrism(hr * 1.0, hr * 0.62, hr * 0.58, hr * 0.85), 0, y + hr * 0.28, z), cloth));
      break;
    case "chuCrownSmall":
      parts.push(part(placed(taperedPrism(hr * 0.9, hr * 0.5, hr * 0.42, hr * 0.75), 0, y + hr * 0.2, z), ink));
      break;
    default:
      parts.push(part(placed(prismBox(hr * 0.9, hr * 0.3, hr * 0.9), 0, y, z), lac));
  }
  return parts;
}

function paintMesh(geo, kind, side) {
  const m = new THREE.Mesh(geo, createGongbiMaterial(kind, side));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function createCrest(spec, scale, side) {
  const g = new THREE.Group();
  g.name = "crest";
  const H = scale.height;
  const hr = Math.max(0.07, scale.head * H * 0.55);
  const lac = MATERIAL_KIND.LACQUER;
  const cloth = MATERIAL_KIND.CLOTH;
  const gold = MATERIAL_KIND.GOLD;
  const ink = MATERIAL_KIND.INK;

  switch (spec.crest) {
    case "shortPheasant": {
      const m = paintMesh(taperedPrism(0.018, 0.007, hr * 0.75, 0.018), lac, side);
      m.position.set(0, hr * 1.05, 0);
      g.add(m);
      break;
    }
    case "pheasant": {
      const m = paintMesh(taperedPrism(0.02, 0.006, hr * 1.35, 0.02), lac, side);
      m.position.set(0, hr * 1.2, -0.02);
      m.rotation.x = -0.28;
      g.add(m);
      break;
    }
    case "twinPheasant": {
      for (const s of [-1, 1]) {
        const m = paintMesh(taperedPrism(0.028, 0.007, hr * 3.1, 0.022), lac, side);
        m.position.set(s * 0.055, hr * 2.05, -0.06);
        m.rotation.z = s * 0.22;
        m.rotation.x = -0.32;
        g.add(m);
      }
      break;
    }
    case "browOrnament": {
      const m = paintMesh(prismBox(hr * 0.55, hr * 0.26, hr * 0.12), gold, side);
      m.position.set(0, hr * 0.18, hr * 0.72);
      g.add(m);
      break;
    }
    case "wingCap": {
      for (const s of [-1, 1]) {
        const wing = paintMesh(prismBox(hr * 0.12, hr * 0.55, hr * 0.95), cloth, side);
        wing.position.set(s * hr * 0.85, hr * 0.62, 0);
        wing.rotation.z = s * 0.22;
        g.add(wing);
      }
      break;
    }
    case "chuHighBoard": {
      const board = paintMesh(taperedPrism(hr * 1.55, hr * 1.9, hr * 3.2, hr * 0.18), ink, side);
      board.position.set(0, hr * 2.05, 0);
      g.add(board);
      const bar = paintMesh(prismBox(hr * 1.95, hr * 0.1, hr * 0.22), gold, side);
      bar.position.set(0, hr * 0.58, 0);
      g.add(bar);
      break;
    }
    case "chuTassel": {
      const m = paintMesh(prismBox(0.028, hr * 0.55, 0.028), cloth, side);
      m.position.set(0, hr * 0.9, 0);
      g.add(m);
      break;
    }
    case "frontJade": {
      const m = paintMesh(prismBox(hr * 0.32, hr * 0.48, hr * 0.1), gold, side);
      m.position.set(0, hr * 0.4, hr * 0.55);
      g.add(m);
      break;
    }
    default:
      break;
  }
  return g;
}

function createWeapon(kind, H, side) {
  const g = new THREE.Group();
  g.name = "weapon";
  const wood = MATERIAL_KIND.WOOD;
  const gold = MATERIAL_KIND.GOLD;
  const lac = MATERIAL_KIND.LACQUER;

  const add = (geo, k, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const m = paintMesh(placed(geo, x, y, z, rx, ry, rz), k, side);
    g.add(m);
    return m;
  };

  switch (kind) {
    case "shortSpear": {
      const len = H * 0.62;
      add(prismCyl(0.01, 0.012, len, 6), wood, 0, len * 0.32, 0);
      add(pyramid(0.026, H * 0.09, 4), gold, 0, len * 0.32 + len / 2 + H * 0.03, 0);
      break;
    }
    case "spear": {
      const len = H * 0.88;
      add(prismCyl(0.01, 0.012, len, 6), wood, 0, len * 0.35, 0);
      add(pyramid(0.03, H * 0.11, 4), gold, 0, len * 0.35 + len / 2 + H * 0.04, 0);
      break;
    }
    case "ge": {
      const len = H * 0.78;
      add(prismCyl(0.01, 0.012, len, 6), wood, 0, len * 0.3, 0);
      add(taperedPrism(0.018, 0.085, H * 0.24, 0.016), lac, 0.04, len * 0.3 + len * 0.38, 0, 0, 0, Math.PI / 2);
      add(prismBox(0.07, 0.016, 0.016), gold, 0.05, len * 0.3 + len * 0.28, 0);
      break;
    }
    case "ji": {
      const len = H * 0.95;
      add(prismCyl(0.011, 0.013, len, 6), wood, 0, len * 0.32, 0);
      add(pyramid(0.03, H * 0.12, 4), gold, 0, len * 0.32 + len / 2 + H * 0.04, 0);
      add(taperedPrism(0.016, 0.07, H * 0.2, 0.016), lac, 0.04, len * 0.32 + len * 0.28, 0, 0, 0, Math.PI / 2);
      break;
    }
    case "hu":
      add(prismBox(0.045, H * 0.3, 0.012), MATERIAL_KIND.IVORY, 0, H * 0.08, 0);
      break;
    case "fan":
      add(prismCyl(0.008, 0.008, H * 0.22, 6), wood, 0, H * 0.04, 0);
      add(
        extrudePlate(
          polyShape([
            [0, 0],
            [0.12, 0.035],
            [0.04, 0.16],
            [-0.09, 0.09],
          ]),
          0.01,
          0.004
        ),
        MATERIAL_KIND.CLOTH,
        0.02,
        H * 0.14,
        0
      );
      break;
    case "mallet":
      add(prismCyl(0.01, 0.01, H * 0.3, 6), wood, 0, H * 0.08, 0);
      add(prismBox(0.085, 0.065, 0.065), lac, 0, H * 0.24, 0);
      break;
    case "sword":
      add(taperedPrism(0.03, 0.01, H * 0.44, 0.012), gold, 0, H * 0.18, 0);
      add(prismBox(0.065, 0.018, 0.02), lac, 0, H * 0.02, 0);
      add(prismBox(0.018, 0.09, 0.018), wood, 0, -0.04, 0);
      break;
    default:
      add(prismCyl(0.01, 0.01, H * 0.5, 6), wood, 0, H * 0.2, 0);
  }
  return g;
}

function buildBodyParts(scale, spec, bones) {
  const H = scale.height;
  const pelvis = wp(bones.pelvis);
  const spine2 = wp(bones.spine2);
  const neck = wp(bones.neck);
  const head = wp(bones.head);
  const parts = [];
  const cloth = spec.armorLayout.robe ? MATERIAL_KIND.CLOTH : MATERIAL_KIND.LACQUER;
  const armor = spec.armorLayout.plateRows > 0 ? MATERIAL_KIND.LACQUER : MATERIAL_KIND.CLOTH;

  const torsoH = spine2.y - pelvis.y + 0.05 * H;
  const torso = taperedPrism(
    scale.width * 0.62,
    scale.width * (0.78 + (scale.shoulder - 0.82) * 0.25),
    torsoH,
    scale.depth * 0.68,
    2
  );
  torso.applyMatrix4(compose(0, (pelvis.y + spine2.y) * 0.5 + 0.01 * H, 0.012 * H));
  parts.push(part(torso, armor));

  if (spec.armorLayout.plateRows > 0) {
    const rows = spec.armorLayout.plateRows;
    const startY = pelvis.y + 0.02 * H;
    for (let r = 0; r < rows; r++) {
      const y = startY + (r + 0.5) * (torsoH / rows);
      const w = scale.width * (0.68 + (r / Math.max(rows - 1, 1)) * 0.2);
      const rowH = (torsoH / rows) * 0.78;
      const plate = extrudePlate(rectShape(w * 0.58, rowH), 0.014, 0.005);
      plate.applyMatrix4(compose(0, y, scale.depth * 0.3));
      parts.push(part(plate, MATERIAL_KIND.LACQUER));
      const sidePlate = extrudePlate(rectShape(scale.depth * 0.42, rowH * 0.85), 0.011, 0.004);
      parts.push(part(placed(sidePlate, -w * 0.46, y, 0.01, 0, Math.PI / 2, 0), MATERIAL_KIND.LACQUER));
      parts.push(part(placed(sidePlate, w * 0.46, y, 0.01, 0, -Math.PI / 2, 0), MATERIAL_KIND.LACQUER));
    }
  }

  if (spec.armorLayout.skirt) {
    const skirt = taperedPrism(scale.width * 0.95, scale.width * 0.7, H * 0.16, scale.depth * 0.55);
    skirt.applyMatrix4(compose(0, pelvis.y - H * 0.02, 0));
    parts.push(part(skirt, cloth));
  }

  if (spec.armorLayout.robe) {
    const robe = taperedPrism(scale.width * 0.55, scale.width * 1.08, H * 0.58, scale.depth * 0.62, 2);
    robe.applyMatrix4(compose(0, pelvis.y + H * 0.02, 0));
    parts.push(part(robe, MATERIAL_KIND.CLOTH));
  }

  if (spec.armorLayout.cape) {
    const cape = extrudePlate(
      polyShape([
        [-scale.width * 0.5, 0.08 * H],
        [scale.width * 0.5, 0.08 * H],
        [scale.width * 0.72, -0.42 * H],
        [-scale.width * 0.72, -0.42 * H],
      ]),
      0.02,
      0.01
    );
    cape.applyMatrix4(compose(0, spine2.y - 0.02 * H, -scale.depth * 0.38));
    parts.push(part(cape, MATERIAL_KIND.CLOTH));
  }

  const neckGeo = taperedPrism(scale.width * 0.22, scale.width * 0.26, 0.07 * H, scale.depth * 0.22);
  neckGeo.applyMatrix4(compose(neck.x, neck.y, neck.z));
  parts.push(part(neckGeo, "skin"));

  const hr = scale.head * H;
  const headGeo = lathe(
    [
      [0.002, -hr * 0.42],
      [hr * 0.28, -hr * 0.38],
      [hr * 0.38, -hr * 0.08],
      [hr * 0.34, hr * 0.22],
      [hr * 0.16, hr * 0.38],
      [0.002, hr * 0.4],
    ],
    8
  );
  headGeo.applyMatrix4(compose(head.x, head.y, head.z + hr * 0.04));
  parts.push(part(headGeo, "skin"));

  const eyeR = 0.011 * (scale.head / 0.2);
  for (const sx of [-1, 1]) {
    const eye = new THREE.SphereGeometry(eyeR, 6, 5);
    eye.toNonIndexed();
    eye.computeVertexNormals();
    if (!eye.attributes.uv) {
      eye.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(eye.attributes.position.count * 2), 2));
    }
    eye.applyMatrix4(compose(head.x + sx * hr * 0.16, head.y + hr * 0.04, head.z + hr * 0.32));
    parts.push(part(eye, MATERIAL_KIND.INK));
  }

  parts.push(...helmetParts(spec, scale, head));

  const armR0 = scale.width * 0.09;
  parts.push(limbBetween(wp(bones.uArmL), wp(bones.lArmL), armR0, armR0 * 0.85, cloth));
  parts.push(limbBetween(wp(bones.lArmL), wp(bones.handL), armR0 * 0.8, armR0 * 0.7, "skin"));
  parts.push(limbBetween(wp(bones.uArmR), wp(bones.lArmR), armR0, armR0 * 0.85, cloth));
  parts.push(limbBetween(wp(bones.lArmR), wp(bones.handR), armR0 * 0.8, armR0 * 0.7, "skin"));

  const handL = wp(bones.handL);
  const handR = wp(bones.handR);
  parts.push(part(placed(prismBox(armR0 * 1.1, armR0 * 0.7, armR0 * 1.3), handL.x, handL.y - 0.01, handL.z), "skin"));
  parts.push(part(placed(prismBox(armR0 * 1.1, armR0 * 0.7, armR0 * 1.3), handR.x, handR.y - 0.01, handR.z), "skin"));

  const thighR = scale.width * 0.12;
  parts.push(limbBetween(wp(bones.thighL), wp(bones.shinL), thighR, thighR * 0.85, cloth));
  parts.push(limbBetween(wp(bones.shinL), wp(bones.footL), thighR * 0.72, thighR * 0.6, cloth));
  parts.push(limbBetween(wp(bones.thighR), wp(bones.shinR), thighR, thighR * 0.85, cloth));
  parts.push(limbBetween(wp(bones.shinR), wp(bones.footR), thighR * 0.72, thighR * 0.6, cloth));

  const footL = wp(bones.footL);
  const footR = wp(bones.footR);
  const fw = scale.width * 0.13;
  parts.push(part(placed(prismBox(fw, fw * 0.42, fw * 1.55), footL.x, Math.max(0.015, footL.y * 0.35), footL.z + fw * 0.25), MATERIAL_KIND.LEATHER));
  parts.push(part(placed(prismBox(fw, fw * 0.42, fw * 1.55), footR.x, Math.max(0.015, footR.y * 0.35), footR.z + fw * 0.25), MATERIAL_KIND.LEATHER));

  return parts;
}

function alignToWorldUp(obj, parentBone) {
  parentBone.updateWorldMatrix(true, false);
  const inv = new THREE.Matrix4().copy(parentBone.matrixWorld).invert();
  const localUp = new THREE.Vector3(0, 1, 0).transformDirection(inv).normalize();
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), localUp);
}

function makeMount(kind, side, scale) {
  if (kind === "horse") return createHorse(side, scale);
  if (kind === "elephant") return createElephant(side, scale);
  if (kind === "chariot") return createChariot(side, scale);
  if (kind === "catapult") return createCatapult(side, scale);
  return null;
}

const templateCache = new Map();

function getTemplate(type, side) {
  const key = `${type}:${side}`;
  if (templateCache.has(key)) return templateCache.get(key);

  const scale = figureScale(type);
  const spec = specOf(type, side);
  const { bones, list } = createHumanoidBones(scale);
  const bindMats = bindMatricesOf(list);
  const parts = buildBodyParts(scale, spec, bones);
  const { geo, kinds } = assemble(parts);
  skinGeometry(geo, list, bindMats);
  const outlineGeo = inflateGeometry(geo, 0.011);
  skinGeometry(outlineGeo, list, bindMats);

  const tmpl = { scale, spec, bodyGeo: geo, outlineGeo, kinds };
  templateCache.set(key, tmpl);
  return tmpl;
}

export function createUnit(type, side) {
  const tmpl = getTemplate(type, side);
  const { root, bones, list } = createHumanoidBones(tmpl.scale);
  const skeleton = bindSkeleton(root, list);

  const unit = new THREE.Group();
  unit.name = `unit-${side}-${type}`;

  const base = createBase(type, side);
  unit.add(base);

  const platform = new THREE.Object3D();
  platform.name = "platform";
  unit.add(platform);

  const mounts = { wheels: [], trunk: [] };
  let saddleY = 0;
  const mountKind = tmpl.spec.mount?.kind;
  if (mountKind) {
    const mount = makeMount(mountKind, side, UNIT_SCALE[type]);
    mount.position.y = BASE_HEIGHT;
    unit.add(mount);
    saddleY = mount.userData.saddleY || 0;
    if (mountKind === "horse") mounts.horse = mount;
    if (mountKind === "elephant") mounts.elephant = mount;
    if (mountKind === "chariot") mounts.chariot = mount;
    if (mountKind === "catapult") mounts.catapult = mount;
    if (mount.userData.wheels) mounts.wheels = mount.userData.wheels;
    if (mount.userData.trunk) mounts.trunk = mount.userData.trunk;
    if (mount.userData.arm) mounts.catapultArm = mount.userData.arm;
    mount.traverse((o) => {
      if (o.name === "wheelL" || o.name === "wheelR") {
        if (!mounts.wheels.includes(o)) mounts.wheels.push(o);
      }
      if (o.name === "arm" && mountKind === "catapult") mounts.catapult = mount;
    });
    const mountMeshes = [];
    mount.traverse((o) => {
      if (o.isMesh) mountMeshes.push(o);
    });
    for (const m of mountMeshes) {
      m.parent.add(addOutline(m, { gold: false, width: 0.002 }));
    }
  }

  const platH = tmpl.scale.platform || 0;
  if (mountKind === "catapult") {
    platform.position.set(-UNIT_SCALE.cannon.width * 0.28, BASE_HEIGHT + platH, 0.04);
  } else if (mountKind) {
    platform.position.y = BASE_HEIGHT + saddleY;
  } else {
    platform.position.y = BASE_HEIGHT + platH;
  }

  if (platH > 0 && !mountKind) {
    const deck = paintMesh(
      prismBox(tmpl.scale.fullWidth * 0.7, platH, tmpl.scale.fullDepth * 0.62),
      MATERIAL_KIND.WOOD,
      side
    );
    deck.position.set(0, -platH / 2, 0);
    platform.add(deck);
    const rim = paintMesh(
      prismBox(tmpl.scale.fullWidth * 0.76, 0.018, tmpl.scale.fullDepth * 0.68),
      MATERIAL_KIND.GOLD,
      side
    );
    rim.position.set(0, 0.002, 0);
    platform.add(rim);
  }

  const body = new THREE.SkinnedMesh(
    tmpl.bodyGeo,
    tmpl.kinds.map((k) => createGongbiMaterial(k, side))
  );
  body.name = "body";
  body.castShadow = true;
  body.receiveShadow = true;
  body.frustumCulled = false;
  body.add(root);
  body.bind(skeleton);
  platform.add(body);

  const outline = addOutline(body, { gold: false, width: 0.0024 });
  outline.name = "outline";
  outline.frustumCulled = false;
  platform.add(outline);

  const weapon = createWeapon(tmpl.spec.weapon, tmpl.scale.height, side);
  alignToWorldUp(weapon, bones.handR);
  weapon.position.set(0.012, -0.018, 0.016);
  bones.handR.add(weapon);

  const crest = createCrest(tmpl.spec, tmpl.scale, side);
  bones.head.add(crest);

  const army = armyOf(side);
  unit.userData = {
    type,
    side,
    skeleton,
    mixer: new THREE.AnimationMixer(unit),
    bones,
    clips: {},
    weapon,
    mounts,
    ik: {
      handR: bones.handR,
      handL: bones.handL,
      footL: bones.footL,
      footR: bones.footR,
    },
    height: BASE_HEIGHT + UNIT_SCALE[type].height,
    pigmentColor: army.lacquer[1],
  };

  unit.traverse((obj) => {
    if (obj.isMesh) obj.userData.pieceRoot = unit;
  });
  addPickProxy(unit, type);

  return unit;
}

/*
剪影识别清单（默认镜头、纯黑剪影也应可辨）：

兵 pawn
  最矮最瘦。汉：兜鍪短缨 + 短矛。楚：布胄额饰 + 戈横刃。

仕/士 advisor
  中等身高，袍服下摆宽。汉：进贤冠双翼。楚：中高冠 + 额玉，持扇。

相/象 elephant
  体量最高大之一，柱腿 + 大耳 + 向前象牙。楚象牙上翘更明显。鼻分三节。

马 horse
  侧面最深（长躯干）。汉披鬃，楚剪鬃。骑士盔缨。

车 chariot
  最宽。双轮 + 旗杆。汉：伞盖 + 方旗。楚：燕尾旗、辐条少。

炮 cannon
  投石机木架 + 斜臂 + 弹巢，不是管炮。士兵偏立一侧。

帅/将 king
  站指挥台，明显高过士。汉：冕板 + 双雉尾。楚：极高扁冠。
*/
