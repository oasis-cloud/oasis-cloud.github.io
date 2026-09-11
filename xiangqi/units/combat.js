/**
 * 三拍吃子 + 走子位移。game.js 只应调用本文件与 animations/ik/pigment 的导出。
 */
import * as THREE from "three";
import { TILE } from "../core/constants.js";
import { tileToWorld } from "../core/coords.js";
import { PIGMENT, armyOf } from "../core/palette.js";
import { animClock, CLIP_DURATION, getCatapultArm, playClip } from "./animations.js";
import { restoreBindPose } from "./ik.js";
import { spawnShatter } from "./pigment.js";

const APPROACH = 0.73;
const HIT = 0.17;
const AFTERMATH = 0.91;
const WINDUP = 0.37;
const FREEZE_FRAMES = 3;
const FREEZE_SCALE = 0.08;

function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function isWorld(p) {
  return p && typeof p.x === "number" && typeof p.z === "number" && p.f == null;
}

function toWorld(p) {
  if (!p) return { x: 0, y: 0, z: 0 };
  if (isWorld(p)) return { x: p.x, y: p.y ?? 0, z: p.z };
  return tileToWorld(p.f, p.r);
}

function faceXZ(unit, dx, dz) {
  if (dx * dx + dz * dz < 1e-8) return;
  unit.rotation.y = Math.atan2(dx, dz);
}

function restoreFacing(unit) {
  if (unit.userData?.side === "black") unit.rotation.y = Math.PI;
  else if (unit.userData?.side === "red") unit.rotation.y = 0;
}

function fxParent(attacker, view) {
  return view?.fxRoot || attacker?.parent || view?.scene || null;
}

function pigmentOf(unit) {
  if (unit?.userData?.pigmentColor != null) return unit.userData.pigmentColor;
  const army = armyOf(unit?.userData?.side);
  return army?.lacquer?.[1] ?? PIGMENT.zhu.mid;
}

function setTimeScale(view, scale) {
  animClock.timeScale = scale;
  if (view) view.worldTimeScale = scale;
}

function punchCamera(view, amount) {
  if (view?.cameraRig?.punch) {
    view.cameraRig.punch(amount);
    return;
  }
  const cam = view?.camera;
  if (cam) cam.position.y += amount * 0.12;
}

function playFlash(view, pos) {
  if (view?.playFlash) {
    view.playFlash(pos);
    return null;
  }
  const parent = view?.fxRoot || view?.scene;
  if (!parent) return null;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 1.35),
    new THREE.MeshBasicMaterial({
      color: PIGMENT.ge.light,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(pos.x, pos.y + 0.05, pos.z);
  parent.add(mesh);
  const ink = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.58, 8),
    new THREE.MeshBasicMaterial({
      color: PIGMENT.mo.deep,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    })
  );
  ink.rotation.x = -Math.PI / 2;
  ink.position.copy(mesh.position);
  ink.position.y += 0.002;
  parent.add(ink);
  return {
    update(dt) {
      mesh.material.opacity -= dt * 4.6;
      ink.material.opacity -= dt * 4.2;
      mesh.scale.addScalar(dt * 3.1);
      ink.scale.addScalar(dt * 2.4);
      if (mesh.material.opacity <= 0) {
        parent.remove(mesh);
        parent.remove(ink);
        mesh.geometry.dispose();
        ink.geometry.dispose();
        mesh.material.dispose();
        ink.material.dispose();
        return true;
      }
      return false;
    },
  };
}

function catapultArm(unit) {
  return getCatapultArm(unit);
}

function driveArm(unit, angle) {
  const arm = catapultArm(unit);
  if (!arm) return;
  if (!arm.userData.restQuaternion) arm.userData.restQuaternion = arm.quaternion.clone();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(angle, 0, 0));
  arm.quaternion.copy(arm.userData.restQuaternion).multiply(q);
}

function spawnBolt(attacker, target, view) {
  const parent = fxParent(attacker, view);
  if (!parent) return null;
  const stone = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.074, 0.088),
    new THREE.MeshBasicMaterial({ color: PIGMENT.zhe.mid, toneMapped: false })
  );
  parent.add(stone);
  const start = new THREE.Vector3();
  const origin = () => {
    const arm = catapultArm(attacker);
    if (arm) arm.getWorldPosition(start);
    else attacker.getWorldPosition(start).add(new THREE.Vector3(0, 0.52, 0));
    return start;
  };
  let dead = false;
  return {
    update(u) {
      if (dead) return;
      const s = origin();
      const peak = 1.18 * 4 * u * (1 - u);
      stone.position.set(
        s.x + (target.x - s.x) * u,
        s.y + (target.y - s.y) * u + peak,
        s.z + (target.z - s.z) * u
      );
      stone.rotation.x += 0.21;
      stone.rotation.z += 0.17;
    },
    impact() {
      if (dead) return;
      dead = true;
      parent.remove(stone);
      stone.geometry.dispose();
      stone.material.dispose();
    },
  };
}

function approachPoint(from, to, type) {
  if (type === "cannon") return { x: from.x, y: from.y, z: from.z };
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  const gap = Math.min(TILE * 0.36, Math.max(0.28, len * 0.22));
  const u = Math.max(0, 1 - gap / len);
  return { x: from.x + dx * u, y: to.y, z: from.z + dz * u };
}

/**
 * 位移用 smoothstep，mixer 播 walk；战车轮子交给 applyIk。
 * 结束贴齐 toWorld。
 */
export function playWalk(unit, fromWorld, toWorld, duration, onDone) {
  const type = unit.userData?.type || "pawn";
  const dur = duration || CLIP_DURATION.walk[type] || 0.73;
  let t = 0;
  let done = false;
  const from = { x: fromWorld.x, y: fromWorld.y, z: fromWorld.z };
  const dest = { x: toWorld.x, y: toWorld.y, z: toWorld.z };
  unit.userData.moving = true;
  if (!unit.userData.lastPos) unit.userData.lastPos = new THREE.Vector3();
  unit.userData.lastPos.set(from.x, from.y, from.z);
  playClip(unit, "walk", { fade: 0.12, loop: true });
  faceXZ(unit, dest.x - from.x, dest.z - from.z);

  return {
    update(dt) {
      if (done) return true;
      t += dt;
      const u = Math.min(1, t / Math.max(dur, 1e-4));
      const e = smoothstep(u);
      unit.position.set(
        from.x + (dest.x - from.x) * e,
        from.y + (dest.y - from.y) * e,
        from.z + (dest.z - from.z) * e
      );
      if (u < 1) return false;
      unit.position.set(dest.x, dest.y, dest.z);
      unit.userData.moving = false;
      restoreBindPose(unit);
      restoreFacing(unit);
      playClip(unit, "idle", { fade: 0.18, loop: true });
      done = true;
      onDone?.();
      return true;
    },
  };
}

/**
 * 三拍：approach 0.73 → hit 0.17（含 3 帧 0.08 时标）→ aftermath 0.91。
 */
export function playCapture({ attacker, defender, from, to, type, view, onHit, onDone }) {
  const pieceType = type || attacker.userData?.type || "pawn";
  const aFrom = toWorld(from);
  const aTo = toWorld(to);
  const near = approachPoint(aFrom, aTo, pieceType);
  const defPos = defender
    ? defender.getWorldPosition(new THREE.Vector3())
    : new THREE.Vector3(aTo.x, aTo.y + 0.2, aTo.z);

  let elapsed = 0;
  let phase = "approach";
  let freezeLeft = 0;
  let attackStarted = false;
  let hitCalled = false;
  let finished = false;
  let onDoneFired = false;
  let shatter = null;
  let flash = null;
  let projectile = pieceType === "cannon" ? spawnBolt(attacker, defPos, view) : null;
  const attackAt = APPROACH - WINDUP;

  attacker.userData.moving = pieceType !== "cannon";
  if (!attacker.userData.lastPos) attacker.userData.lastPos = new THREE.Vector3();
  attacker.userData.lastPos.copy(attacker.position);
  if (pieceType === "cannon") playClip(attacker, "idle", { fade: 0.08, loop: true });
  else playClip(attacker, "walk", { fade: 0.1, loop: true });
  faceXZ(attacker, aTo.x - aFrom.x, aTo.z - aFrom.z);

  function finishBoard() {
    if (onDoneFired) return;
    onDoneFired = true;
    attacker.position.set(aTo.x, aTo.y, aTo.z);
    attacker.userData.moving = false;
    restoreBindPose(attacker);
    restoreFacing(attacker);
    playClip(attacker, "idle", { fade: 0.16, loop: true });
    setTimeScale(view, 1);
    onDone?.();
  }

  return {
    update(dt) {
      if (finished) return true;

      if (freezeLeft > 0) {
        setTimeScale(view, FREEZE_SCALE);
        freezeLeft -= 1;
      } else {
        setTimeScale(view, 1);
      }

      elapsed += dt;
      if (flash) {
        const gone = flash.update(dt);
        if (gone) flash = null;
      }

      if (phase === "approach") {
        const u = Math.min(1, elapsed / APPROACH);
        const e = smoothstep(u);
        attacker.position.set(
          aFrom.x + (near.x - aFrom.x) * e,
          aFrom.y + (near.y - aFrom.y) * e,
          aFrom.z + (near.z - aFrom.z) * e
        );
        if (pieceType === "cannon") driveArm(attacker, -0.82 * e);
        if (!attackStarted && elapsed >= attackAt) {
          attackStarted = true;
          playClip(attacker, "attack", { fade: 0.07, loop: false });
        }
        projectile?.update(u);
        if (u < 1) return false;

        phase = "hit";
        elapsed = 0;
        freezeLeft = FREEZE_FRAMES - 1;
        setTimeScale(view, FREEZE_SCALE);
        punchCamera(view, 0.18);
        flash = playFlash(view, defPos);
        projectile?.impact();
        projectile = null;
        if (pieceType === "cannon") driveArm(attacker, 1.25);
        if (defender) playClip(defender, "hit", { fade: 0.04, loop: false });
        if (!hitCalled) {
          hitCalled = true;
          onHit?.();
        }
        return false;
      }

      if (phase === "hit") {
        if (pieceType === "cannon") {
          const k = smoothstep(Math.min(1, elapsed / HIT));
          driveArm(attacker, THREE.MathUtils.lerp(-0.82, 1.35, k));
        }
        if (elapsed < HIT) return false;
        phase = "aftermath";
        elapsed = 0;
        setTimeScale(view, 1);
        if (defender) playClip(defender, "death", { fade: 0.07, loop: false });
        const parent = fxParent(attacker, view);
        if (parent) shatter = spawnShatter(parent, defPos, pigmentOf(defender), 28);
        return false;
      }

      const u = Math.min(1, elapsed / AFTERMATH);
      const e = smoothstep(u);
      attacker.position.set(
        near.x + (aTo.x - near.x) * e,
        near.y + (aTo.y - near.y) * e,
        near.z + (aTo.z - near.z) * e
      );
      if (pieceType === "cannon" && u < 0.4) {
        driveArm(attacker, THREE.MathUtils.lerp(1.35, 0.05, u / 0.4));
      }
      if (defender && u > 0.16) defender.visible = false;
      const shatterDone = shatter ? shatter.update(dt) : true;
      if (shatterDone) shatter = null;

      if (u >= 1 && !onDoneFired) finishBoard();
      if (u >= 1 && !shatter) {
        finished = true;
        return true;
      }
      return false;
    },
  };
}
