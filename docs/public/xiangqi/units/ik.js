/**
 * 运行时 IK：防穿地、骑兵夹腿、战车滚轮、象鼻待机。
 * 迈步由 walk clip + 根位移驱动；不把脚锁在世界 XZ，避免走子后腿被拉长。
 */
import * as THREE from "three";
import { boneOf, getMount, getTrunk } from "./animations.js";

const _world = new THREE.Vector3();
const _target = new THREE.Vector3();
const _delta = new THREE.Vector3();
const _local0 = new THREE.Vector3();
const _local1 = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

function ikState(unit) {
  if (!unit.userData.ikRuntime) {
    unit.userData.ikRuntime = {
      L: null,
      R: null,
      time: 0,
    };
  }
  return unit.userData.ikRuntime;
}

function applyWorldDelta(obj, fromWorld, toWorld) {
  const parent = obj.parent;
  if (!parent) {
    obj.position.add(toWorld.clone().sub(fromWorld));
    return;
  }
  parent.worldToLocal(_local0.copy(fromWorld));
  parent.worldToLocal(_local1.copy(toWorld));
  obj.position.add(_local1.sub(_local0));
}

function footIk(foot, groundedY) {
  if (!foot) return;
  if (!foot.userData.restPosition) foot.userData.restPosition = foot.position.clone();
  foot.position.copy(foot.userData.restPosition);
  foot.updateWorldMatrix(true, false);
  foot.getWorldPosition(_world);
  if (_world.y >= groundedY) return;
  _target.copy(_world);
  _target.y = groundedY;
  applyWorldDelta(foot, _world, _target);
}

function isDescendant(node, ancestor) {
  let p = node;
  while (p) {
    if (p === ancestor) return true;
    p = p.parent;
  }
  return false;
}

function weaponOf(unit) {
  return unit.userData?.weapon || unit.userData?.mounts?.weapon || null;
}

function applyHands(unit) {
  const weapon = weaponOf(unit);
  const handR = boneOf(unit, "handR");
  if (!weapon || !handR) return;
  // 已挂在手上则绝不 reparent；双持时左手看向杆上一点。
  if (!isDescendant(weapon, handR)) return;
  const twoHand = unit.userData.twoHanded || weapon.userData?.twoHanded || weapon.userData?.grip === "two";
  if (!twoHand) return;
  const handL = boneOf(unit, "handL");
  if (!handL) return;
  const shaft = new THREE.Vector3(0, 0.16, 0);
  weapon.localToWorld(shaft);
  handL.lookAt(shaft);
}

function clampThighs(unit) {
  if (unit.userData?.type !== "horse") return;
  const horse = getMount(unit, "horse");
  if (!horse) return;
  const thighL = boneOf(unit, "thighL");
  const thighR = boneOf(unit, "thighR");
  const pull = 0.18;
  if (thighL) {
    _e.set(0, 0, pull);
    _q.setFromEuler(_e);
    thighL.quaternion.multiply(_q);
  }
  if (thighR) {
    _e.set(0, 0, -pull);
    _q.setFromEuler(_e);
    thighR.quaternion.multiply(_q);
  }
}

function wheelRadius(wheel) {
  if (wheel.userData.radius > 0) return wheel.userData.radius;
  const box = new THREE.Box3().setFromObject(wheel);
  const size = box.getSize(_delta);
  const r = Math.max(size.y, size.z, size.x) * 0.5;
  wheel.userData.radius = r > 1e-4 ? r : 0.12;
  return wheel.userData.radius;
}

function getWheels(unit) {
  const m = unit.userData?.mounts || {};
  if (Array.isArray(m.wheels) && m.wheels.length) return m.wheels.filter(Boolean);
  const found = [];
  const roots = [m.chariot, unit].filter(Boolean);
  for (const r of roots) {
    r.traverse((o) => {
      if (o.name === "wheelL" || o.name === "wheelR" || o.userData?.rollAxis) {
        if (!found.includes(o)) found.push(o);
      }
    });
  }
  return found;
}

function rollWheels(unit) {
  if (unit.userData?.type !== "chariot") return;
  const wheels = getWheels(unit);
  if (!wheels.length) return;
  if (!unit.userData.lastPos) unit.userData.lastPos = unit.position.clone();
  const last = unit.userData.lastPos;
  const dx = unit.position.x - last.x;
  const dz = unit.position.z - last.z;
  const dist = Math.hypot(dx, dz);
  last.copy(unit.position);
  if (dist < 1e-8) return;
  _fwd.set(0, 0, 1).applyQuaternion(unit.quaternion);
  const sign = Math.sign(_fwd.x * dx + _fwd.z * dz) || 1;
  for (const wheel of wheels) {
    const radius = wheelRadius(wheel);
    const axis = wheel.userData.rollAxis;
    if (axis) _axis.copy(axis).normalize();
    else _axis.set(1, 0, 0);
    wheel.rotateOnAxis(_axis, (dist / radius) * sign);
  }
}

function idleTrunk(unit, dt, clipName) {
  if (unit.userData?.type !== "elephant") return;
  if (clipName === "attack" || clipName === "walk" || clipName === "death") return;
  const segs = getTrunk(unit);
  if (!segs.length) return;
  const st = ikState(unit);
  st.time += dt;
  segs.forEach((seg, i) => {
    if (!seg.userData.restQuaternion) seg.userData.restQuaternion = seg.quaternion.clone();
    const a = Math.sin(st.time * 1.73 + i * 0.61) * (0.11 + i * 0.045);
    _e.set(a, 0, a * 0.28);
    _q.setFromEuler(_e);
    seg.quaternion.copy(seg.userData.restQuaternion).multiply(_q);
  });
}

export function resetIk(unit) {
  if (unit?.userData) unit.userData.ikRuntime = null;
}

export function applyIk(unit, dt, { groundedY } = {}) {
  if (!unit) return;
  const ground = groundedY ?? unit.position.y;
  const clipName = unit.userData.activeClipName;

  footIk(boneOf(unit, "footL"), ground);
  footIk(boneOf(unit, "footR"), ground);
  applyHands(unit);
  clampThighs(unit);
  rollWheels(unit);
  idleTrunk(unit, dt, clipName);
}
