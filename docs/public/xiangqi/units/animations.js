/**
 * 程序化骨骼 clip。轨道绑在骨头名上，不旋转整组 mesh。
 * 骨头查找走别名表：factory 微调命名时接口仍稳定。
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

const ALIASES = {
  root: ["root", "Root", "hipsRoot"],
  pelvis: ["pelvis", "hips", "Hips", "hip"],
  spine1: ["spine1", "spine", "Spine", "chest"],
  spine2: ["spine2", "spineUpper", "upperSpine", "chest2"],
  neck: ["neck", "Neck"],
  head: ["head", "Head"],
  clavL: ["clavL", "clavicleL", "shoulderL", "lClavicle"],
  uArmL: ["uArmL", "upperArmL", "armL", "lUpperArm"],
  lArmL: ["lArmL", "lowerArmL", "forearmL", "lForearm"],
  handL: ["handL", "HandL", "lHand", "wristL"],
  clavR: ["clavR", "clavicleR", "shoulderR", "rClavicle"],
  uArmR: ["uArmR", "upperArmR", "armR", "rUpperArm"],
  lArmR: ["lArmR", "lowerArmR", "forearmR", "rForearm"],
  handR: ["handR", "HandR", "rHand", "wristR"],
  thighL: ["thighL", "upLegL", "lThigh", "upperLegL"],
  shinL: ["shinL", "legL", "lShin", "lowerLegL", "calfL"],
  footL: ["footL", "FootL", "lFoot", "ankleL"],
  thighR: ["thighR", "upLegR", "rThigh", "upperLegR"],
  shinR: ["shinR", "legR", "rShin", "lowerLegR", "calfR"],
  footR: ["footR", "FootR", "rFoot", "ankleR"],
};

const HORSE_LIMBS = {
  thighFL: ["thighFL", "hThighFL", "foreThighL", "legFL"],
  shinFL: ["shinFL", "hShinFL", "foreShinL"],
  hoofFL: ["hoofFL", "footFL", "foreHoofL"],
  thighFR: ["thighFR", "hThighFR", "foreThighR", "legFR"],
  shinFR: ["shinFR", "hShinFR", "foreShinR"],
  hoofFR: ["hoofFR", "footFR", "foreHoofR"],
  thighBL: ["thighBL", "hThighBL", "hindThighL", "legBL", "thighHL"],
  shinBL: ["shinBL", "hShinBL", "hindShinL"],
  hoofBL: ["hoofBL", "footBL", "hindHoofL", "hoofHL"],
  thighBR: ["thighBR", "hThighBR", "hindThighR", "legBR", "thighHR"],
  shinBR: ["shinBR", "hShinBR", "hindShinR"],
  hoofBR: ["hoofBR", "footBR", "hindHoofR", "hoofHR"],
};

/** 非整数、按兵种区分的走/呼吸时长。 */
export const CLIP_DURATION = {
  hit: 0.21,
  attack: 0.56, // 0.37 蓄力 + 0.19 挥击
  death: 1.17,
  win: 1.31,
  walk: {
    pawn: 0.73,
    advisor: 0.77,
    king: 0.81,
    horse: 0.61,
    elephant: 1.13,
    chariot: 0.87,
    cannon: 0.79,
  },
};

export const animClock = { timeScale: 1 };

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function typeOf(unit) {
  return unit.userData?.type || "pawn";
}

function ensureBonesMap(unit) {
  if (!unit.userData) unit.userData = {};
  if (!unit.userData.bones) unit.userData.bones = {};
  return unit.userData.bones;
}

function searchNamed(root, aliases) {
  if (!root) return null;
  let found = null;
  root.traverse((o) => {
    if (found || !o.name) return;
    if (aliases.includes(o.name)) found = o;
  });
  return found;
}

export function boneOf(unit, name) {
  if (!unit) return null;
  const bones = ensureBonesMap(unit);
  if (bones[name]) return bones[name];
  const aliases = ALIASES[name] || [name];
  for (const a of aliases) {
    if (bones[a]) {
      bones[name] = bones[a];
      return bones[a];
    }
  }
  const ik = unit.userData.ik;
  if (ik?.[name]) {
    bones[name] = ik[name];
    return ik[name];
  }
  const skel = unit.userData.skeleton;
  if (skel?.bones) {
    for (const b of skel.bones) {
      if (aliases.includes(b.name)) {
        bones[name] = b;
        return b;
      }
    }
  }
  const found = searchNamed(unit, aliases);
  if (found) {
    bones[name] = found;
    if (!found.name) found.name = name;
  }
  return found;
}

export function findNode(unit, names) {
  const list = Array.isArray(names) ? names : [names];
  const bones = unit.userData?.bones || {};
  for (const n of list) {
    if (bones[n]) return bones[n];
  }
  const mounts = unit.userData?.mounts || {};
  const roots = [unit, mounts.horse, mounts.elephant, mounts.chariot, mounts.catapult].filter(
    Boolean
  );
  for (const r of roots) {
    const found = searchNamed(r, list);
    if (found) return found;
  }
  return null;
}

export function horseLimb(unit, key) {
  return findNode(unit, HORSE_LIMBS[key] || [key]);
}

export function getTrunk(unit) {
  const segs = unit.userData?.mounts?.trunk;
  if (!Array.isArray(segs)) return [];
  segs.forEach((s, i) => {
    if (s && !s.name) s.name = `trunk${i}`;
  });
  return segs.filter(Boolean);
}

export function getCatapultArm(unit) {
  const m = unit.userData?.mounts || {};
  const arm = m.catapultArm || m.catapult?.userData?.arm || findNode(unit, ["arm", "catapultArm"]);
  if (arm) {
    if (!arm.name) arm.name = "catapultArm";
    m.catapultArm = arm;
  }
  return arm || null;
}

export function getMount(unit, key) {
  const m = unit.userData?.mounts || {};
  const obj = m[key];
  if (obj && !obj.name) obj.name = key === "horse" ? "mountHorse" : key === "elephant" ? "mountElephant" : key;
  return obj || null;
}

export function ensureMixer(unit) {
  if (!unit.userData) unit.userData = {};
  if (!unit.userData.mixer) unit.userData.mixer = new THREE.AnimationMixer(unit);
  return unit.userData.mixer;
}

function captureRest(obj) {
  if (!obj || obj.userData.restCaptured) return;
  obj.userData.restQuaternion = obj.quaternion.clone();
  obj.userData.restPosition = obj.position.clone();
  obj.userData.restRotationX = obj.rotation.x;
  obj.userData.restCaptured = true;
}

function restQ(bone) {
  return (bone.userData.restQuaternion || bone.quaternion).clone();
}

function restY(bone) {
  return (bone.userData.restPosition || bone.position).y;
}

function captureUnitRest(unit) {
  for (const name of BONE_NAMES) {
    const b = boneOf(unit, name);
    if (b) captureRest(b);
  }
  getTrunk(unit).forEach(captureRest);
  const arm = getCatapultArm(unit);
  if (arm) captureRest(arm);
  const horse = getMount(unit, "horse");
  if (horse) captureRest(horse);
  for (const key of Object.keys(HORSE_LIMBS)) {
    const n = horseLimb(unit, key);
    if (n) captureRest(n);
  }
}

function quatValues(bone, eulers) {
  const rest = restQ(bone);
  const out = [];
  let prev = null;
  for (const e of eulers) {
    _e.set(e[0] || 0, e[1] || 0, e[2] || 0, e[3] || "XYZ");
    _q.copy(rest).multiply(new THREE.Quaternion().setFromEuler(_e));
    if (prev && prev.dot(_q) < 0) _q.set(-_q.x, -_q.y, -_q.z, -_q.w);
    out.push(_q.x, _q.y, _q.z, _q.w);
    prev = _q.clone();
  }
  return out;
}

function quatTrack(bone, times, eulers) {
  if (!bone || !bone.name) return null;
  return new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, quatValues(bone, eulers));
}

function yTrack(bone, times, offsets) {
  if (!bone || !bone.name) return null;
  const y0 = restY(bone);
  return new THREE.NumberKeyframeTrack(
    `${bone.name}.position[y]`,
    times,
    offsets.map((d) => y0 + d)
  );
}

function rotXTrack(obj, times, offsets) {
  if (!obj || !obj.name) return null;
  const x0 = obj.userData.restRotationX ?? obj.rotation.x;
  return new THREE.NumberKeyframeTrack(
    `${obj.name}.rotation[x]`,
    times,
    offsets.map((d) => x0 + d)
  );
}

function clipOf(name, duration, tracks) {
  const clip = new THREE.AnimationClip(name, duration, tracks.filter(Boolean));
  clip.duration = duration;
  return clip;
}

/** poses[i] = { bone: [x,y,z] | { e:[x,y,z], y } } */
function tracksFromPoses(unit, times, poses, extraNodes = {}) {
  const names = new Set();
  for (const p of poses) Object.keys(p).forEach((k) => names.add(k));
  const tracks = [];
  for (const name of names) {
    const node = extraNodes[name] || boneOf(unit, name) || findNode(unit, [name]);
    if (!node) continue;
    const eulers = [];
    const ys = [];
    let hasY = false;
    for (const p of poses) {
      const v = p[name];
      if (v == null) {
        eulers.push([0, 0, 0]);
        ys.push(0);
      } else if (Array.isArray(v)) {
        eulers.push(v);
        ys.push(0);
      } else {
        eulers.push(v.e || [0, 0, 0]);
        ys.push(v.y || 0);
        if (v.y != null) hasY = true;
      }
    }
    tracks.push(quatTrack(node, times, eulers));
    if (hasY) tracks.push(yTrack(node, times, ys));
  }
  return tracks;
}

function idlePeriod(type) {
  const h = hash01(type);
  let period = 2.3 + h * 0.6;
  if (Math.abs(period - Math.round(period)) < 0.04) period += 0.073;
  return period;
}

function buildIdle(unit, type) {
  const period = idlePeriod(type);
  const amp = 0.008 + hash01(`${type}-amp`) * 0.012;
  const times = [0, period * 0.37, period * 0.68, period];
  const spine1 = boneOf(unit, "spine1");
  const tracks = [];
  if (spine1) {
    tracks.push(yTrack(spine1, times, [0, amp, amp * 0.35, 0]));
    tracks.push(
      quatTrack(spine1, times, [
        [0, 0, 0],
        [0.018, 0, 0],
        [0.01, 0, 0],
        [0, 0, 0],
      ])
    );
  }
  const chest = boneOf(unit, "spine2");
  if (chest) {
    tracks.push(
      quatTrack(chest, times, [
        [0, 0, 0],
        [0.012, 0, 0],
        [0.006, 0, 0],
        [0, 0, 0],
      ])
    );
  }
  if (type === "horse") {
    tracks.push(
      ...tracksFromPoses(unit, times, [
        { thighL: [0.22, 0, 0.28], thighR: [0.22, 0, -0.28], pelvis: { e: [0.04, 0, 0], y: -0.01 } },
        { thighL: [0.2, 0, 0.32], thighR: [0.24, 0, -0.24], pelvis: { e: [0.03, 0, 0], y: 0.006 } },
        { thighL: [0.24, 0, 0.24], thighR: [0.2, 0, -0.32], pelvis: { e: [0.05, 0, 0], y: -0.004 } },
        { thighL: [0.22, 0, 0.28], thighR: [0.22, 0, -0.28], pelvis: { e: [0.04, 0, 0], y: -0.01 } },
      ])
    );
  }
  if (type === "cannon") {
    const arm = getCatapultArm(unit);
    if (arm) tracks.push(rotXTrack(arm, times, [0, 0.055, -0.03, 0]));
    tracks.push(
      ...tracksFromPoses(unit, times, [
        { uArmR: [0.12, 0, 0.08], lArmR: [0.2, 0, 0] },
        { uArmR: [0.16, 0, 0.1], lArmR: [0.28, 0, 0] },
        { uArmR: [0.1, 0, 0.06], lArmR: [0.18, 0, 0] },
        { uArmR: [0.12, 0, 0.08], lArmR: [0.2, 0, 0] },
      ])
    );
  }
  return clipOf("idle", period, tracks);
}

function infantryWalk(unit, duration, weight = 0.024) {
  const t = [0, duration * 0.25, duration * 0.5, duration * 0.75, duration];
  return tracksFromPoses(unit, t, [
    {
      pelvis: { e: [0.02, 0.04, 0], y: -weight },
      spine1: [0, -0.05, 0],
      thighL: [0.08, 0, 0],
      shinL: [0.12, 0, 0],
      footL: [-0.06, 0, 0],
      thighR: [-0.42, 0, 0],
      shinR: [0.28, 0, 0],
      footR: [0.12, 0, 0],
      uArmL: [-0.35, 0, 0.05],
      lArmL: [0.18, 0, 0],
      uArmR: [0.38, 0, -0.05],
      lArmR: [0.22, 0, 0],
    },
    {
      pelvis: { e: [0, 0, 0.02], y: 0.008 },
      spine1: [0, 0, 0],
      thighL: [0.48, 0, 0],
      shinL: [0.55, 0, 0],
      footL: [-0.18, 0, 0],
      thighR: [-0.18, 0, 0],
      shinR: [0.2, 0, 0],
      footR: [0.04, 0, 0],
      uArmL: [0.12, 0, 0],
      lArmL: [0.1, 0, 0],
      uArmR: [-0.12, 0, 0],
      lArmR: [0.12, 0, 0],
    },
    {
      pelvis: { e: [0.02, -0.04, 0], y: -weight },
      spine1: [0, 0.05, 0],
      thighL: [-0.42, 0, 0],
      shinL: [0.28, 0, 0],
      footL: [0.12, 0, 0],
      thighR: [0.08, 0, 0],
      shinR: [0.12, 0, 0],
      footR: [-0.06, 0, 0],
      uArmL: [0.38, 0, -0.05],
      lArmL: [0.22, 0, 0],
      uArmR: [-0.35, 0, 0.05],
      lArmR: [0.18, 0, 0],
    },
    {
      pelvis: { e: [0, 0, -0.02], y: 0.008 },
      spine1: [0, 0, 0],
      thighL: [-0.18, 0, 0],
      shinL: [0.2, 0, 0],
      footL: [0.04, 0, 0],
      thighR: [0.48, 0, 0],
      shinR: [0.55, 0, 0],
      footR: [-0.18, 0, 0],
      uArmL: [-0.12, 0, 0],
      lArmL: [0.12, 0, 0],
      uArmR: [0.12, 0, 0],
      lArmR: [0.1, 0, 0],
    },
    {
      pelvis: { e: [0.02, 0.04, 0], y: -weight },
      spine1: [0, -0.05, 0],
      thighL: [0.08, 0, 0],
      shinL: [0.12, 0, 0],
      footL: [-0.06, 0, 0],
      thighR: [-0.42, 0, 0],
      shinR: [0.28, 0, 0],
      footR: [0.12, 0, 0],
      uArmL: [-0.35, 0, 0.05],
      lArmL: [0.18, 0, 0],
      uArmR: [0.38, 0, -0.05],
      lArmR: [0.22, 0, 0],
    },
  ]);
}

function horseWalk(unit, duration) {
  const t = [0, duration * 0.25, duration * 0.5, duration * 0.75, duration];
  const extra = {};
  for (const key of Object.keys(HORSE_LIMBS)) extra[key] = horseLimb(unit, key);
  extra.mountHorse = getMount(unit, "horse");
  const bob = [
    { e: [0.05, 0, 0], y: 0.028 },
    { e: [0.02, 0, 0.02], y: -0.012 },
    { e: [0.05, 0, 0], y: 0.028 },
    { e: [0.02, 0, -0.02], y: -0.012 },
    { e: [0.05, 0, 0], y: 0.028 },
  ];
  const poses = [
    {
      pelvis: { e: [0.06, 0, 0], y: 0.02 },
      spine1: [0.04, 0, 0],
      thighL: [0.28, 0.04, 0.36],
      thighR: [0.18, -0.04, -0.22],
      shinL: [0.35, 0, 0],
      shinR: [0.55, 0, 0],
      uArmR: [0.25, 0, -0.1],
      uArmL: [-0.15, 0, 0.1],
      mountHorse: bob[0],
      thighFL: [0.35, 0, 0],
      shinFL: [0.2, 0, 0],
      hoofFL: [-0.1, 0, 0],
      thighBR: [0.32, 0, 0],
      shinBR: [0.18, 0, 0],
      hoofBR: [-0.08, 0, 0],
      thighFR: [-0.28, 0, 0],
      shinFR: [0.45, 0, 0],
      hoofFR: [0.12, 0, 0],
      thighBL: [-0.3, 0, 0],
      shinBL: [0.42, 0, 0],
      hoofBL: [0.1, 0, 0],
    },
    {
      pelvis: { e: [0.02, 0, 0], y: -0.016 },
      spine1: [0.01, 0, 0],
      thighL: [0.2, 0, 0.24],
      thighR: [0.26, 0, -0.34],
      shinL: [0.48, 0, 0],
      shinR: [0.32, 0, 0],
      uArmR: [0.05, 0, 0],
      uArmL: [0.05, 0, 0],
      mountHorse: bob[1],
      thighFL: [-0.1, 0, 0],
      shinFL: [0.3, 0, 0],
      hoofFL: [0.04, 0, 0],
      thighBR: [-0.08, 0, 0],
      shinBR: [0.28, 0, 0],
      hoofBR: [0.04, 0, 0],
      thighFR: [0.12, 0, 0],
      shinFR: [0.22, 0, 0],
      hoofFR: [-0.04, 0, 0],
      thighBL: [0.1, 0, 0],
      shinBL: [0.2, 0, 0],
      hoofBL: [-0.04, 0, 0],
    },
    {
      pelvis: { e: [0.06, 0, 0], y: 0.02 },
      spine1: [0.04, 0, 0],
      thighL: [0.18, -0.04, 0.22],
      thighR: [0.28, 0.04, -0.36],
      shinL: [0.55, 0, 0],
      shinR: [0.35, 0, 0],
      uArmR: [-0.15, 0, 0.1],
      uArmL: [0.25, 0, -0.1],
      mountHorse: bob[2],
      thighFL: [-0.28, 0, 0],
      shinFL: [0.45, 0, 0],
      hoofFL: [0.12, 0, 0],
      thighBR: [-0.3, 0, 0],
      shinBR: [0.42, 0, 0],
      hoofBR: [0.1, 0, 0],
      thighFR: [0.35, 0, 0],
      shinFR: [0.2, 0, 0],
      hoofFR: [-0.1, 0, 0],
      thighBL: [0.32, 0, 0],
      shinBL: [0.18, 0, 0],
      hoofBL: [-0.08, 0, 0],
    },
    {
      pelvis: { e: [0.02, 0, 0], y: -0.016 },
      spine1: [0.01, 0, 0],
      thighL: [0.26, 0, 0.34],
      thighR: [0.2, 0, -0.24],
      shinL: [0.32, 0, 0],
      shinR: [0.48, 0, 0],
      uArmR: [0.05, 0, 0],
      uArmL: [0.05, 0, 0],
      mountHorse: bob[3],
      thighFL: [0.12, 0, 0],
      shinFL: [0.22, 0, 0],
      hoofFL: [-0.04, 0, 0],
      thighBR: [0.1, 0, 0],
      shinBR: [0.2, 0, 0],
      hoofBR: [-0.04, 0, 0],
      thighFR: [-0.1, 0, 0],
      shinFR: [0.3, 0, 0],
      hoofFR: [0.04, 0, 0],
      thighBL: [-0.08, 0, 0],
      shinBL: [0.28, 0, 0],
      hoofBL: [0.04, 0, 0],
    },
    {
      pelvis: { e: [0.06, 0, 0], y: 0.02 },
      spine1: [0.04, 0, 0],
      thighL: [0.28, 0.04, 0.36],
      thighR: [0.18, -0.04, -0.22],
      shinL: [0.35, 0, 0],
      shinR: [0.55, 0, 0],
      uArmR: [0.25, 0, -0.1],
      uArmL: [-0.15, 0, 0.1],
      mountHorse: bob[4],
      thighFL: [0.35, 0, 0],
      shinFL: [0.2, 0, 0],
      hoofFL: [-0.1, 0, 0],
      thighBR: [0.32, 0, 0],
      shinBR: [0.18, 0, 0],
      hoofBR: [-0.08, 0, 0],
      thighFR: [-0.28, 0, 0],
      shinFR: [0.45, 0, 0],
      hoofFR: [0.12, 0, 0],
      thighBL: [-0.3, 0, 0],
      shinBL: [0.42, 0, 0],
      hoofBL: [0.1, 0, 0],
    },
  ];
  return tracksFromPoses(unit, t, poses, extra);
}

function elephantWalk(unit, duration) {
  const t = [0, duration * 0.28, duration * 0.5, duration * 0.78, duration];
  const trunk = getTrunk(unit);
  const extra = {};
  trunk.forEach((s, i) => {
    extra[`trunk${i}`] = s;
  });
  const swing = (a0, a1, a2) => ({ [`trunk0`]: [a0, 0, 0], [`trunk1`]: [a1, 0, 0.04], [`trunk2`]: [a2, 0, 0.06] });
  return tracksFromPoses(
    unit,
    t,
    [
      {
        pelvis: { e: [0.03, 0.03, 0], y: -0.038 },
        spine1: [0.02, -0.04, 0],
        thighL: [0.06, 0, 0],
        shinL: [0.08, 0, 0],
        thighR: [-0.38, 0, 0],
        shinR: [0.22, 0, 0],
        uArmL: [-0.12, 0, 0],
        uArmR: [0.14, 0, 0],
        ...swing(0.18, 0.28, 0.38),
      },
      {
        pelvis: { e: [0.01, 0, 0], y: 0.01 },
        spine1: [0, 0, 0],
        thighL: [0.32, 0, 0],
        shinL: [0.4, 0, 0],
        thighR: [-0.12, 0, 0],
        shinR: [0.14, 0, 0],
        ...swing(0.05, 0.08, 0.1),
      },
      {
        pelvis: { e: [0.03, -0.03, 0], y: -0.038 },
        spine1: [0.02, 0.04, 0],
        thighL: [-0.38, 0, 0],
        shinL: [0.22, 0, 0],
        thighR: [0.06, 0, 0],
        shinR: [0.08, 0, 0],
        uArmL: [0.14, 0, 0],
        uArmR: [-0.12, 0, 0],
        ...swing(-0.18, -0.28, -0.38),
      },
      {
        pelvis: { e: [0.01, 0, 0], y: 0.01 },
        spine1: [0, 0, 0],
        thighL: [-0.12, 0, 0],
        shinL: [0.14, 0, 0],
        thighR: [0.32, 0, 0],
        shinR: [0.4, 0, 0],
        ...swing(-0.05, -0.08, -0.1),
      },
      {
        pelvis: { e: [0.03, 0.03, 0], y: -0.038 },
        spine1: [0.02, -0.04, 0],
        thighL: [0.06, 0, 0],
        shinL: [0.08, 0, 0],
        thighR: [-0.38, 0, 0],
        shinR: [0.22, 0, 0],
        ...swing(0.18, 0.28, 0.38),
      },
    ],
    extra
  );
}

function chariotWalk(unit, duration) {
  const t = [0, duration * 0.5, duration];
  return tracksFromPoses(unit, t, [
    {
      pelvis: { e: [0.015, 0.02, 0], y: -0.006 },
      spine1: [0.02, -0.03, 0],
      uArmR: [0.12, 0, -0.04],
      uArmL: [-0.08, 0, 0.04],
      thighL: [0.04, 0, 0],
      thighR: [-0.05, 0, 0],
    },
    {
      pelvis: { e: [0.015, -0.02, 0], y: -0.006 },
      spine1: [0.02, 0.03, 0],
      uArmR: [-0.08, 0, 0.04],
      uArmL: [0.12, 0, -0.04],
      thighL: [-0.05, 0, 0],
      thighR: [0.04, 0, 0],
    },
    {
      pelvis: { e: [0.015, 0.02, 0], y: -0.006 },
      spine1: [0.02, -0.03, 0],
      uArmR: [0.12, 0, -0.04],
      uArmL: [-0.08, 0, 0.04],
      thighL: [0.04, 0, 0],
      thighR: [-0.05, 0, 0],
    },
  ]);
}

function cannonWalk(unit, duration) {
  return infantryWalk(unit, duration, 0.014);
}

function buildWalk(unit, type) {
  const duration = CLIP_DURATION.walk[type] || 0.73;
  let tracks;
  if (type === "horse") tracks = horseWalk(unit, duration);
  else if (type === "elephant") tracks = elephantWalk(unit, duration);
  else if (type === "chariot") tracks = chariotWalk(unit, duration);
  else if (type === "cannon") tracks = cannonWalk(unit, duration);
  else tracks = infantryWalk(unit, duration, type === "king" ? 0.018 : 0.024);
  return clipOf("walk", duration, tracks);
}

const ATTACK_T = [0, 0.19, 0.37, 0.47, 0.56];

function attackPoses(type) {
  if (type === "pawn") {
    return [
      {},
      { spine1: [0.08, 0.12, 0], uArmR: [-0.55, 0.1, -0.15], lArmR: [0.4, 0, 0], uArmL: [0.2, 0, 0.1], thighR: [0.15, 0, 0] },
      { spine1: [0.12, 0.16, 0], uArmR: [-0.72, 0.12, -0.18], lArmR: [0.55, 0, 0], pelvis: { e: [0.06, 0.08, 0], y: -0.02 } },
      { spine1: [-0.06, -0.04, 0], uArmR: [0.85, 0, -0.05], lArmR: [0.15, 0, 0], thighL: [0.28, 0, 0] },
      { spine1: [-0.1, -0.06, 0], uArmR: [1.05, 0, 0], lArmR: [0.05, 0, 0], handR: [0.1, 0, 0] },
    ];
  }
  if (type === "advisor") {
    return [
      {},
      { spine1: [0, -0.22, 0], uArmL: [-0.9, 0.2, 0.35], lArmL: [0.4, 0, 0], uArmR: [0.15, 0, -0.2], thighL: [-0.1, 0, 0] },
      { spine1: [0.04, -0.28, 0], uArmL: [-1.05, 0.25, 0.4], lArmL: [0.55, 0, 0], uArmR: [-0.2, 0, -0.25] },
      { spine1: [0.08, 0.35, 0], uArmR: [-0.4, -0.3, -0.5], lArmR: [0.6, 0, 0], uArmL: [0.2, 0, 0] },
      { spine1: [-0.04, 0.42, 0], uArmR: [0.55, -0.15, -0.7], lArmR: [0.2, 0, 0], handR: [0.2, 0, 0] },
    ];
  }
  if (type === "king") {
    return [
      {},
      { spine1: [0.06, 0.08, 0], uArmR: [-0.45, 0.15, -0.2], lArmR: [0.35, 0, 0], uArmL: [0.15, 0, 0.12] },
      { spine1: [0.1, 0.1, 0], uArmR: [-0.55, 0.2, -0.25], lArmR: [0.45, 0, 0], pelvis: { e: [0.05, 0, 0], y: -0.012 } },
      { spine1: [-0.08, -0.08, 0], uArmR: [0.35, 0, -0.15], lArmR: [0.55, 0, 0] },
      { spine1: [-0.12, -0.1, 0], uArmR: [0.55, 0, -0.1], lArmR: [0.25, 0, 0] },
    ];
  }
  if (type === "horse") {
    return [
      { thighL: [0.22, 0, 0.28], thighR: [0.22, 0, -0.28] },
      { spine1: [-0.15, 0.1, 0], uArmR: [-1.15, 0.2, -0.25], lArmR: [0.2, 0, 0], pelvis: { e: [-0.08, 0.06, 0], y: 0.02 }, thighL: [0.24, 0, 0.3], thighR: [0.2, 0, -0.26] },
      { spine1: [-0.22, 0.12, 0], uArmR: [-1.35, 0.25, -0.3], lArmR: [0.15, 0, 0], pelvis: { e: [-0.1, 0.08, 0], y: 0.03 }, thighL: [0.26, 0, 0.32], thighR: [0.2, 0, -0.24] },
      { spine1: [0.18, -0.2, 0], uArmR: [0.4, -0.1, -0.45], lArmR: [0.5, 0, 0], pelvis: { e: [0.12, -0.1, 0], y: -0.02 }, thighL: [0.2, 0, 0.3], thighR: [0.24, 0, -0.3] },
      { spine1: [0.28, -0.25, 0], uArmR: [0.85, 0, -0.35], lArmR: [0.15, 0, 0], pelvis: { e: [0.16, -0.12, 0], y: -0.03 }, thighL: [0.22, 0, 0.28], thighR: [0.22, 0, -0.28] },
    ];
  }
  if (type === "elephant") {
    return [
      {},
      { spine1: [0.05, 0.35, 0], pelvis: { e: [0, 0.2, 0], y: -0.02 }, trunk0: [-0.2, 0.4, 0], trunk1: [-0.15, 0.5, 0], trunk2: [-0.1, 0.45, 0] },
      { spine1: [0.08, 0.48, 0], pelvis: { e: [0, 0.28, 0], y: -0.03 }, trunk0: [-0.15, 0.55, 0], trunk1: [-0.1, 0.7, 0], trunk2: [0.1, 0.6, 0] },
      { spine1: [0.06, -0.4, 0], pelvis: { e: [0.04, -0.25, 0], y: -0.02 }, trunk0: [0.25, -0.55, 0], trunk1: [0.35, -0.7, 0], trunk2: [0.45, -0.55, 0] },
      { spine1: [0.04, -0.55, 0], pelvis: { e: [0.06, -0.35, 0], y: -0.015 }, trunk0: [0.35, -0.7, 0], trunk1: [0.45, -0.85, 0], trunk2: [0.55, -0.65, 0] },
    ];
  }
  if (type === "chariot") {
    return [
      {},
      { spine1: [0.18, 0, 0], spine2: [0.1, 0, 0], pelvis: { e: [0.12, 0, 0], y: -0.018 }, uArmR: [0.25, 0, -0.1] },
      { spine1: [0.32, 0, 0], spine2: [0.18, 0, 0], pelvis: { e: [0.2, 0, 0], y: -0.03 }, head: [0.08, 0, 0] },
      { spine1: [0.42, 0, 0], spine2: [0.22, 0, 0], pelvis: { e: [0.28, 0, 0], y: -0.04 }, uArmR: [0.45, 0, 0] },
      { spine1: [0.38, 0, 0], spine2: [0.16, 0, 0], pelvis: { e: [0.24, 0, 0], y: -0.028 } },
    ];
  }
  return [
    {},
    { spine1: [0.1, 0, 0], uArmR: [0.35, 0, -0.2], uArmL: [0.35, 0, 0.2], lArmR: [0.4, 0, 0] },
    { spine1: [0.16, 0, 0], uArmR: [0.5, 0, -0.25], uArmL: [0.5, 0, 0.25] },
    { spine1: [-0.08, 0, 0], uArmR: [-0.15, 0, -0.1], uArmL: [-0.1, 0, 0.1] },
    { spine1: [-0.04, 0, 0], uArmR: [0.1, 0, 0], uArmL: [0.1, 0, 0] },
  ];
}

function buildAttack(unit, type) {
  const extra = {};
  getTrunk(unit).forEach((s, i) => {
    extra[`trunk${i}`] = s;
  });
  const poses = attackPoses(type);
  const tracks = tracksFromPoses(unit, ATTACK_T, poses, extra);
  return clipOf("attack", CLIP_DURATION.attack, tracks);
}

function buildHit(unit, type) {
  const d = CLIP_DURATION.hit;
  const t = [0, 0.07, d];
  const horse = type === "horse";
  const poses = [
    horse ? { thighL: [0.22, 0, 0.28], thighR: [0.22, 0, -0.28] } : {},
    {
      pelvis: { e: [-0.12, 0, 0], y: -0.018 },
      spine1: [-0.22, 0.08, 0],
      spine2: [-0.1, 0, 0],
      head: [-0.12, 0.06, 0],
      uArmL: [0.2, 0, 0.15],
      uArmR: [0.15, 0, -0.12],
      ...(horse ? { thighL: [0.18, 0, 0.3], thighR: [0.18, 0, -0.3] } : {}),
    },
    horse ? { thighL: [0.22, 0, 0.28], thighR: [0.22, 0, -0.28] } : {},
  ];
  return clipOf("hit", d, tracksFromPoses(unit, t, poses));
}

function buildDeath(unit, type) {
  const d = CLIP_DURATION.death;
  const t = [0, 0.31, 0.73, d];
  const extra = {};
  getTrunk(unit).forEach((s, i) => {
    extra[`trunk${i}`] = s;
  });
  let poses;
  if (type === "horse") {
    poses = [
      { thighL: [0.22, 0, 0.28], thighR: [0.22, 0, -0.28] },
      { spine1: [-0.35, 0.1, 0], pelvis: { e: [-0.2, 0.15, 0], y: -0.04 }, head: [-0.3, 0, 0], thighL: [0.3, 0, 0.2], thighR: [0.15, 0, -0.15] },
      { spine1: [-0.7, 0.2, 0.15], pelvis: { e: [-0.55, 0.25, 0.1], y: -0.08 }, head: [-0.55, 0.1, 0], uArmR: [-0.4, 0, 0.3] },
      { spine1: [-0.95, 0.15, 0.2], pelvis: { e: [-0.85, 0.2, 0.12], y: -0.12 }, head: [-0.7, 0, 0], thighL: [0.55, 0, 0.1], thighR: [0.4, 0, -0.08] },
    ];
  } else if (type === "elephant") {
    poses = [
      {},
      { pelvis: { e: [0.15, 0, 0], y: -0.05 }, thighL: [0.45, 0, 0], thighR: [0.35, 0, 0], spine1: [0.2, 0.1, 0], trunk0: [0.3, 0.2, 0] },
      { pelvis: { e: [0.35, 0.1, 0], y: -0.12 }, thighL: [0.95, 0, 0], shinL: [1.1, 0, 0], thighR: [0.7, 0, 0], spine1: [0.45, 0.2, 0], trunk0: [0.6, 0.4, 0] },
      { pelvis: { e: [0.5, 0.12, 0], y: -0.16 }, thighL: [1.15, 0, 0], shinL: [1.25, 0, 0], thighR: [0.95, 0, 0], spine1: [0.55, 0.15, 0], head: [0.35, 0, 0] },
    ];
  } else {
    poses = [
      {},
      { spine1: [-0.28, 0.08, 0], pelvis: { e: [-0.12, 0.06, 0], y: -0.03 }, head: [-0.2, 0, 0], uArmL: [0.25, 0, 0.2] },
      { spine1: [-0.45, 0.12, 0], pelvis: { e: [0.35, 0.1, 0], y: -0.1 }, thighL: [0.85, 0, 0], shinL: [1.15, 0, 0], thighR: [0.55, 0, 0], shinR: [0.7, 0, 0], head: [-0.35, 0.1, 0] },
      { spine1: [-0.55, 0.08, 0], pelvis: { e: [0.55, 0.12, 0], y: -0.14 }, thighL: [1.05, 0, 0], shinL: [1.35, 0, 0], thighR: [0.85, 0, 0], shinR: [1.05, 0, 0], head: [-0.25, 0, 0], uArmR: [-0.4, 0, 0.35] },
    ];
  }
  const tracks = tracksFromPoses(unit, t, poses, extra);
  if (!boneOf(unit, "pelvis")) {
    tracks.push(new THREE.NumberKeyframeTrack(".rotation[x]", [0, 0.41, d], [0, -0.55, -1.05]));
  }
  return clipOf("death", d, tracks);
}

function buildWin(unit, type) {
  const d = CLIP_DURATION.win;
  const t = [0, 0.37, 0.73, d];
  const horse = type === "horse";
  const base = horse ? { thighL: [0.22, 0, 0.28], thighR: [0.22, 0, -0.28] } : {};
  const poses = [
    { ...base },
    {
      ...base,
      uArmR: [-1.15, 0.15, -0.2],
      lArmR: [0.25, 0, 0],
      spine1: [-0.08, 0.06, 0],
      uArmL: type === "king" ? [-0.9, 0, 0.2] : [0.1, 0, 0.12],
    },
    {
      ...base,
      uArmR: [-1.28, 0.1, -0.15],
      lArmR: [0.15, 0, 0],
      spine1: [-0.1, 0.04, 0],
      head: [-0.08, 0, 0],
      uArmL: type === "king" ? [-1.05, 0, 0.18] : [0.08, 0, 0.1],
    },
    {
      ...base,
      uArmR: [-1.2, 0.12, -0.18],
      lArmR: [0.2, 0, 0],
      spine1: [-0.08, 0.05, 0],
    },
  ];
  return clipOf("win", d, tracksFromPoses(unit, t, poses));
}

export function buildClips(unit) {
  ensureMixer(unit);
  captureUnitRest(unit);
  const type = typeOf(unit);
  const clips = {
    idle: buildIdle(unit, type),
    walk: buildWalk(unit, type),
    attack: buildAttack(unit, type),
    hit: buildHit(unit, type),
    death: buildDeath(unit, type),
    win: buildWin(unit, type),
  };
  unit.userData.clips = clips;
  return clips;
}

export function playClip(unit, name, { fade = 0.15, loop = true } = {}) {
  if (!unit?.userData) return null;
  if (!unit.userData.clips?.[name]) buildClips(unit);
  const clip = unit.userData.clips[name];
  if (!clip) return null;
  const mixer = ensureMixer(unit);
  const action = mixer.clipAction(clip);
  action.reset();
  action.enabled = true;
  action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
  action.clampWhenFinished = !loop;
  const prev = unit.userData.activeAction;
  if (prev && prev !== action) {
    prev.fadeOut(fade);
    action.reset().fadeIn(fade).play();
  } else {
    action.reset().fadeIn(fade).play();
  }
  unit.userData.activeAction = action;
  unit.userData.activeClipName = name;
  return action;
}

export function updateMixer(unit, dt) {
  const mixer = unit.userData?.mixer;
  if (!mixer) return;
  mixer.update(dt * animClock.timeScale);
}
