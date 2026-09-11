/**
 * 弹簧阻尼环绕镜头。OrbitControls 只驱动目标球面，不每帧覆盖相机。
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CAM, PHASE } from "../core/constants.js";

const MODE_PRESET = {
  opening: { pitch: CAM.openingPolar, dist: 19.2, lookY: 0.32 },
  middle: { pitch: CAM.defaultPolar, dist: CAM.defaultDist, lookY: 0.45 },
  endgame: { pitch: CAM.endgamePolar, dist: CAM.endgameDist, lookY: 0.3 },
  capture: { pitch: 1.02, dist: 9.8, lookY: 0.52 },
  check: { pitch: 0.98, dist: 10.3, lookY: 0.48 },
  ceremony: { pitch: 0.82, dist: 15.4, lookY: 0.5 },
};

const PHASE_MODE = {
  [PHASE.BOOT]: "opening",
  [PHASE.LOBBY]: "opening",
  [PHASE.PARADE]: "opening",
  [PHASE.PLAYING]: "middle",
  [PHASE.CAPTURE]: "capture",
  [PHASE.CEREMONY]: "ceremony",
  [PHASE.REVIEW]: "endgame",
};

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function dampAngle(current, target, lambda, dt) {
  let d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return current + d * (1 - Math.exp(-lambda * dt));
}

export function createCameraRig(camera, canvas) {
  const spherical = { yaw: Math.PI, pitch: CAM.defaultPolar, dist: CAM.defaultDist };
  const targetSph = { yaw: Math.PI, pitch: CAM.defaultPolar, dist: CAM.defaultDist };
  const targetLook = new THREE.Vector3(0, 0.4, 0);
  const look = new THREE.Vector3(0, 0.4, 0);

  const dummy = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
  dummy.position.setFromSphericalCoords(spherical.dist, spherical.pitch, spherical.yaw);
  dummy.position.add(look);
  dummy.lookAt(look);

  const controls = new OrbitControls(dummy, canvas);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.enableRotate = true;
  controls.enableZoom = true;
  controls.minPolarAngle = CAM.minPolar;
  controls.maxPolarAngle = CAM.maxPolar;
  controls.minDistance = CAM.minUserDist;
  controls.maxDistance = CAM.maxDist;
  controls.rotateSpeed = 0.68;
  controls.zoomSpeed = 0.85;
  controls.target.copy(targetLook);
  controls.update();

  const offset = new THREE.Vector3();
  const tmpSph = new THREE.Spherical();
  let follow = 6.4;
  const followHome = 6.4;
  let punchAmt = 0;
  let pullUntil = 0;
  let dragging = false;
  let restoreAt = 0;
  let restoreMode = "middle";
  let restoreYaw = null;

  function markPull(ms = 90) {
    pullUntil = performance.now() + ms;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 0) dragging = true;
    markPull();
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!e.buttons) return;
    markPull();
    restoreAt = 0;
  });
  canvas.addEventListener(
    "wheel",
    () => {
      markPull(140);
      restoreAt = 0;
    },
    { passive: true },
  );

  function writeDummy() {
    dummy.position.copy(camera.position);
    dummy.lookAt(look);
    controls.target.copy(look);
  }

  function readDummyToTarget() {
    offset.copy(dummy.position).sub(controls.target);
    tmpSph.setFromVector3(offset);
    targetSph.yaw = tmpSph.theta;
    targetSph.pitch = clamp(tmpSph.phi, CAM.minPolar, CAM.maxPolar);
    targetSph.dist = clamp(tmpSph.radius, CAM.minUserDist, CAM.maxDist);
    targetLook.copy(controls.target);
  }

  function applyCamera() {
    const dist = Math.max(CAM.minDist * 0.55, spherical.dist - punchAmt);
    camera.position.setFromSphericalCoords(dist, spherical.pitch, spherical.yaw);
    camera.position.add(look);
    camera.lookAt(look);
  }

  function setMode(mode) {
    const key = PHASE_MODE[mode] || mode;
    const preset = MODE_PRESET[key] || MODE_PRESET.middle;
    targetSph.pitch = clamp(preset.pitch, CAM.minPolar, CAM.maxPolar);
    const floor = key === "capture" || key === "check" ? CAM.minDist : CAM.minUserDist;
    targetSph.dist = clamp(preset.dist, floor, CAM.maxDist);
    targetLook.y = preset.lookY;
    if (key === "middle" || key === "endgame" || key === "opening" || key === "ceremony") {
      targetLook.x = 0;
      targetLook.z = 0;
      restoreAt = 0;
    }
    follow = key === "opening" || key === "ceremony" ? 3.6 : followHome;
    writeDummy();
  }

  function faceSide(side) {
    targetSph.yaw = side === "black" ? 0 : Math.PI;
    writeDummy();
  }

  function focusWorld(pos, opts = {}) {
    if (!pos) return;
    targetLook.set(pos.x, pos.y ?? targetLook.y, pos.z);
    if (opts.dist != null) targetSph.dist = clamp(opts.dist, CAM.minDist, CAM.maxDist);
    if (opts.pitch != null) targetSph.pitch = clamp(opts.pitch, CAM.minPolar, CAM.maxPolar);
    if (opts.durationHint != null) {
      follow = 2.4 / Math.max(0.18, opts.durationHint);
    }
    if (opts.restoreAfter != null) {
      restoreAt = performance.now() + Math.max(0.2, opts.restoreAfter) * 1000;
      restoreMode = opts.restoreMode || "middle";
      restoreYaw = opts.restoreYaw != null ? opts.restoreYaw : null;
    }
    writeDummy();
  }

  function punch(amount = 0.42) {
    punchAmt += Math.max(0, amount);
  }

  function skipToTarget() {
    spherical.yaw = targetSph.yaw;
    spherical.pitch = targetSph.pitch;
    spherical.dist = targetSph.dist;
    look.copy(targetLook);
    punchAmt = 0;
    follow = followHome;
    writeDummy();
    applyCamera();
  }

  function update(dt) {
    const t = Math.min(0.05, Math.max(0, dt || 0.016));
    const interacting = dragging || performance.now() < pullUntil;
    if (interacting) readDummyToTarget();
    else if (restoreAt && performance.now() >= restoreAt) {
      restoreAt = 0;
      setMode(restoreMode);
      if (restoreYaw != null) targetSph.yaw = restoreYaw;
      restoreYaw = null;
    }

    const k = interacting ? Math.max(follow, 10) : follow;
    spherical.yaw = dampAngle(spherical.yaw, targetSph.yaw, k, t);
    spherical.pitch = damp(spherical.pitch, targetSph.pitch, k, t);
    spherical.dist = damp(spherical.dist, targetSph.dist, k, t);
    look.x = damp(look.x, targetLook.x, k * 0.9, t);
    look.y = damp(look.y, targetLook.y, k * 0.9, t);
    look.z = damp(look.z, targetLook.z, k * 0.9, t);
    punchAmt = damp(punchAmt, 0, 14, t);
    follow = damp(follow, followHome, 1.6, t);

    if (!interacting) writeDummy();
    applyCamera();
  }

  applyCamera();

  return {
    spherical,
    targetLook,
    setMode,
    faceSide,
    focusWorld,
    punch,
    update,
    skipToTarget,
  };
}
