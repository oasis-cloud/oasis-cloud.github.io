/**
 * 共享人形骨架。比例由 UNIT_SCALE 的 height / shoulder / head 驱动。
 * 蒙皮权重：最近 3 骨逆距离，中轴优先脊柱，四肢走对应链，脚必须绑 foot。
 */
import * as THREE from "three";

export const BONE_NAMES = [
  "root",
  "pelvis",
  "spine1",
  "spine2",
  "neck",
  "head",
  "clavL",
  "uArmL",
  "lArmL",
  "handL",
  "clavR",
  "uArmR",
  "lArmR",
  "handR",
  "thighL",
  "shinL",
  "footL",
  "thighR",
  "shinR",
  "footR",
];

const CHAINS = {
  spine: ["pelvis", "spine1", "spine2", "neck", "head"],
  armL: ["clavL", "uArmL", "lArmL", "handL"],
  armR: ["clavR", "uArmR", "lArmR", "handR"],
  legL: ["thighL", "shinL", "footL"],
  legR: ["thighR", "shinR", "footR"],
  footL: ["footL", "shinL", "thighL"],
  footR: ["footR", "shinR", "thighR"],
};

function mkBone(name) {
  const b = new THREE.Bone();
  b.name = name;
  return b;
}

/**
 * A-pose，臂下垂约 18°。
 * @param {{ height: number, width?: number, head?: number, shoulder?: number }} scale
 */
export function createHumanoidBones(scale) {
  const H = scale.height;
  const headR = scale.head ?? 0.2;
  const width = scale.width ?? H * 0.55;
  const shouldW = width * (scale.shoulder ?? 0.9);
  const A = (18 * Math.PI) / 180;

  const bones = {};
  for (const n of BONE_NAMES) bones[n] = mkBone(n);

  const {
    root,
    pelvis,
    spine1,
    spine2,
    neck,
    head,
    clavL,
    uArmL,
    lArmL,
    handL,
    clavR,
    uArmR,
    lArmR,
    handR,
    thighL,
    shinL,
    footL,
    thighR,
    shinR,
    footR,
  } = bones;

  root.add(pelvis);
  pelvis.add(spine1, thighL, thighR);
  spine1.add(spine2);
  spine2.add(neck, clavL, clavR);
  neck.add(head);
  clavL.add(uArmL);
  uArmL.add(lArmL);
  lArmL.add(handL);
  clavR.add(uArmR);
  uArmR.add(lArmR);
  lArmR.add(handR);
  thighL.add(shinL);
  shinL.add(footL);
  thighR.add(shinR);
  shinR.add(footR);

  const hipY = 0.47 * H;
  const spineLen = 0.135 * H;
  const neckLen = 0.05 * H;
  const headLen = 0.09 * H * (headR / 0.2);
  const clavX = shouldW * 0.38;
  const upperArm = 0.155 * H;
  const lowerArm = 0.135 * H;
  const handLen = 0.05 * H;
  const thighLen = 0.245 * H;
  const shinLen = 0.21 * H;
  const stanceX = width * 0.16;

  pelvis.position.set(0, hipY, 0);
  spine1.position.set(0, spineLen, 0.01 * H);
  spine2.position.set(0, spineLen, 0);
  neck.position.set(0, spineLen * 0.42, 0.008 * H);
  head.position.set(0, neckLen + headLen * 0.15, 0.01 * H);

  clavL.position.set(-clavX, 0.018 * H, 0.012 * H);
  clavR.position.set(clavX, 0.018 * H, 0.012 * H);

  uArmL.position.set(-0.018 * H, -0.02 * H, 0);
  uArmL.rotation.z = -A;
  uArmL.rotation.x = 0.06;
  lArmL.position.set(0, -upperArm, 0);
  handL.position.set(0, -lowerArm, 0);
  handL.userData.reach = handLen;

  uArmR.position.set(0.018 * H, -0.02 * H, 0);
  uArmR.rotation.z = A;
  uArmR.rotation.x = 0.06;
  lArmR.position.set(0, -upperArm, 0);
  handR.position.set(0, -lowerArm, 0);
  handR.userData.reach = handLen;

  thighL.position.set(-stanceX, -0.01 * H, 0);
  thighR.position.set(stanceX, -0.01 * H, 0);
  shinL.position.set(0, -thighLen, 0.008 * H);
  shinR.position.set(0, -thighLen, 0.008 * H);
  footL.position.set(0, -shinLen, 0.02 * H);
  footR.position.set(0, -shinLen, 0.02 * H);
  footL.rotation.x = 0.12;
  footR.rotation.x = 0.12;

  const list = BONE_NAMES.map((n) => bones[n]);
  root.updateWorldMatrix(true, true);
  return { root, bones, list };
}

export function bindSkeleton(rootBone, list) {
  rootBone.updateWorldMatrix(true, true);
  return new THREE.Skeleton(list);
}

function matrixOf(bindMatricesWorld, i, name) {
  if (Array.isArray(bindMatricesWorld)) return bindMatricesWorld[i];
  return bindMatricesWorld[name];
}

function regionOf(v, hipY, clavY, halfW) {
  const ax = Math.abs(v.x);
  if (v.y < hipY * 0.18) return v.x < 0 ? "footL" : "footR";
  if (v.y < hipY * 0.55) {
    if (ax < halfW * 0.12) return "spine";
    return v.x < 0 ? "legL" : "legR";
  }
  if (v.y < hipY + 0.04) {
    if (ax < halfW * 0.18) return "spine";
    return v.x < 0 ? "legL" : "legR";
  }
  if (ax > halfW * 0.52 && v.y < clavY + hipY * 0.35) {
    return v.x < 0 ? "armL" : "armR";
  }
  if (v.y > clavY && ax > halfW * 0.62) return v.x < 0 ? "armL" : "armR";
  return "spine";
}

/**
 * 写入 skinIndex / skinWeight。排除 root。最近 3 根，逆距离归一。
 */
export function skinGeometry(geometry, bones, bindMatricesWorld) {
  const list = Array.isArray(bones) ? bones : BONE_NAMES.map((n) => bones[n]);
  const indexOf = Object.create(null);
  const world = Object.create(null);
  const tmp = new THREE.Vector3();

  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    indexOf[b.name] = i;
    const m = matrixOf(bindMatricesWorld, i, b.name);
    if (m) {
      world[b.name] = tmp.setFromMatrixPosition(m).clone();
    } else {
      world[b.name] = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld);
    }
  }

  const hipY = world.pelvis?.y ?? 0.3;
  const clavY = world.spine2?.y ?? hipY * 1.5;
  const halfW = Math.max(
    Math.abs(world.clavL?.x ?? 0.1),
    Math.abs(world.clavR?.x ?? 0.1)
  );

  const pos = geometry.attributes.position;
  const n = pos.count;
  const skinIndex = new Uint16Array(n * 4);
  const skinWeight = new Float32Array(n * 4);
  const v = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i);
    const region = regionOf(v, hipY, clavY, halfW);
    let names = CHAINS[region] || CHAINS.spine;

    if (region === "footL" || region === "footR") {
      names = CHAINS[region];
    } else if (region === "spine" && Math.abs(v.x) < halfW * 0.2) {
      names = CHAINS.spine;
    }

    const scored = [];
    for (const name of names) {
      const p = world[name];
      if (!p || name === "root") continue;
      const d = v.distanceTo(p) + 1e-4;
      scored.push({ name, d, w: 1 / d });
    }
    if (scored.length === 0) {
      scored.push({ name: "pelvis", d: 1, w: 1 });
    }
    scored.sort((a, b) => a.d - b.d);
    const top = scored.slice(0, 3);

    if (region === "footL" || region === "footR") {
      const footName = region;
      let fi = top.findIndex((s) => s.name === footName);
      if (fi < 0) {
        top[top.length - 1] = {
          name: footName,
          d: 0.01,
          w: 8,
        };
        fi = top.length - 1;
      }
      top[fi].w = Math.max(top[fi].w, 8);
    }

    let sum = 0;
    for (const s of top) sum += s.w;
    for (let k = 0; k < 4; k++) {
      if (k < top.length) {
        skinIndex[i * 4 + k] = indexOf[top[k].name] ?? 1;
        skinWeight[i * 4 + k] = top[k].w / sum;
      } else {
        skinIndex[i * 4 + k] = 0;
        skinWeight[i * 4 + k] = 0;
      }
    }

    if (region === "footL" || region === "footR") {
      const footName = region;
      let footW = 0;
      let footSlot = 0;
      for (let k = 0; k < 3; k++) {
        if (top[k] && top[k].name === footName) {
          footW = skinWeight[i * 4 + k];
          footSlot = k;
        }
      }
      if (footW < 0.6) {
        const boost = 0.6 - footW;
        skinWeight[i * 4 + footSlot] = 0.6;
        let rest = 0.4;
        let other = 0;
        for (let k = 0; k < 3; k++) {
          if (k !== footSlot) other += skinWeight[i * 4 + k];
        }
        for (let k = 0; k < 3; k++) {
          if (k === footSlot) continue;
          skinWeight[i * 4 + k] =
            other > 1e-6 ? (skinWeight[i * 4 + k] / other) * rest : rest / 2;
        }
        void boost;
      }
    }
  }

  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeight, 4));
  return geometry;
}

export function bindMatricesOf(list) {
  return list.map((b) => b.matrixWorld.clone());
}
