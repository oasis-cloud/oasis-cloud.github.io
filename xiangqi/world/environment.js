/**
 * 千里江山环境：硬边远山、蛤白半球光、克制藤黄主光。
 * 自定义工笔 shader 只用 NUM_DIR_LIGHTS=1，故不用多级 CSM（会叠光洗色）。
 */
import * as THREE from "three";
import { MATERIAL_KIND } from "../core/constants.js";
import { boardSpan } from "../core/coords.js";
import { PIGMENT, RAMP_THRESHOLDS, SCENE_COLOR } from "../core/palette.js";
import { createGongbiMaterial } from "../render/materials.js";
import { makeSkyGradient } from "../render/textures.js";

const KEY_HOME = new THREE.Vector3(5.4, 15.2, -8.2);
const KEY_END = new THREE.Vector3(11.2, 7.2, -3.6);

function mixHex(a, b, t) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t).getHex();
}

function mountainMat(ramp) {
  return createGongbiMaterial({
    kind: MATERIAL_KIND.PIGMENT,
    rampHexArray: ramp,
    thresholds: RAMP_THRESHOLDS.pigment,
    silkStrength: 0.08,
  });
}

function ridgeShape(peaks, halfW) {
  const shape = new THREE.Shape();
  shape.moveTo(-halfW, 0);
  for (const [x, y] of peaks) shape.lineTo(x, y);
  shape.lineTo(halfW, 0);
  shape.closePath();
  return shape;
}

function addRange(parent, { x = 0, z = 0, y = 0, rotY = 0, scaleX = 1, depth, peaks, halfW, ramp }) {
  const geo = new THREE.ExtrudeGeometry(ridgeShape(peaks, halfW), {
    depth,
    bevelEnabled: false,
    steps: 1,
  });
  const mesh = new THREE.Mesh(geo, mountainMat(ramp));
  mesh.rotation.y = rotY;
  mesh.scale.x = scaleX;
  if (rotY) mesh.position.set(x, y, z);
  else mesh.position.set(x, y, z - depth / 2);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = true;
  parent.add(mesh);
  return mesh;
}

export function createEnvironment(scene, renderer) {
  if (renderer.toneMapping === THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
  }
  scene.background = new THREE.Color(SCENE_COLOR.skyHorizon);
  scene.fog = new THREE.Fog(SCENE_COLOR.fog, 26, 70);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(62, 24, 16),
    new THREE.MeshBasicMaterial({
      map: makeSkyGradient(),
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  );
  sky.userData.isSky = true;
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(PIGMENT.ge.light, PIGMENT.lv.mid, 0.78);
  scene.add(hemi);

  const keyColorHome = new THREE.Color(PIGMENT.teng.wash).lerp(new THREE.Color(PIGMENT.ge.mid), 0.58);
  const keyColorEnd = new THREE.Color(PIGMENT.qing.wash).lerp(new THREE.Color(PIGMENT.ge.deep), 0.4);
  const key = new THREE.DirectionalLight(keyColorHome, 0.98);
  key.position.copy(KEY_HOME);
  key.target.position.set(0, 0.2, 0);
  scene.add(key);
  scene.add(key.target);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.00032;
  key.shadow.normalBias = 0.032;
  key.shadow.radius = 1.6;
  const span = boardSpan();
  const ext = Math.max(span.x, span.z) * 0.62;
  const cam = key.shadow.camera;
  cam.near = 2;
  cam.far = 42;
  cam.left = -ext;
  cam.right = ext;
  cam.top = ext;
  cam.bottom = -ext;
  cam.updateProjectionMatrix();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(56, 56),
    createGongbiMaterial({
      kind: MATERIAL_KIND.PIGMENT,
      rampHexArray: [PIGMENT.lv.deep, PIGMENT.lv.mid, PIGMENT.lv.light, PIGMENT.ge.deep],
      thresholds: RAMP_THRESHOLDS.pigment,
      silkStrength: 0.18,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.receiveShadow = true;
  scene.add(ground);

  const farRamp = [
    PIGMENT.qing.deep,
    PIGMENT.qing.mid,
    mixHex(PIGMENT.qing.light, SCENE_COLOR.fog, 0.45),
    mixHex(PIGMENT.qing.wash, SCENE_COLOR.fog, 0.55),
  ];
  const midRamp = [PIGMENT.qing.mid, PIGMENT.lv.mid, PIGMENT.lv.light, PIGMENT.qing.wash];
  const nearRamp = [PIGMENT.lv.deep, PIGMENT.lv.mid, PIGMENT.lv.light, PIGMENT.lv.wash];

  const peaksFar = [
    [-34, 1.1],
    [-26, 4.2],
    [-18, 1.6],
    [-10, 6.8],
    [-2, 2.4],
    [6, 7.4],
    [14, 2.0],
    [22, 5.1],
    [30, 1.3],
  ];
  const peaksMid = [
    [-30, 0.8],
    [-22, 3.4],
    [-14, 1.2],
    [-6, 5.2],
    [2, 1.8],
    [10, 4.6],
    [18, 1.0],
    [26, 3.1],
  ];
  const peaksNear = [
    [-22, 0.6],
    [-14, 2.6],
    [-6, 0.9],
    [2, 3.4],
    [10, 1.1],
    [16, 2.4],
  ];

  addRange(scene, { z: 36, y: -0.1, depth: 2.8, halfW: 42, peaks: peaksFar, ramp: farRamp, scaleX: 1.05 });
  addRange(scene, { z: 26, y: -0.08, depth: 2.2, halfW: 34, peaks: peaksMid, ramp: midRamp });
  addRange(scene, { z: 17.5, y: -0.06, depth: 1.6, halfW: 24, peaks: peaksNear, ramp: nearRamp, scaleX: 0.92 });
  addRange(scene, { z: -36, y: -0.1, rotY: Math.PI, depth: 2.8, halfW: 42, peaks: peaksFar, ramp: farRamp, scaleX: 1.05 });
  addRange(scene, { z: -26, y: -0.08, rotY: Math.PI, depth: 2.2, halfW: 34, peaks: peaksMid, ramp: midRamp });
  addRange(scene, {
    x: -32,
    y: -0.1,
    rotY: Math.PI / 2,
    depth: 2.4,
    halfW: 38,
    peaks: peaksFar,
    ramp: farRamp,
    scaleX: 0.9,
  });
  addRange(scene, {
    x: 32,
    y: -0.1,
    rotY: -Math.PI / 2,
    depth: 2.4,
    halfW: 38,
    peaks: peaksMid,
    ramp: midRamp,
    scaleX: 0.9,
  });

  let endgame = false;
  let endMix = 0;
  const fogHomeNear = 26;
  const fogHomeFar = 70;

  function setEndgame(on) {
    endgame = !!on;
  }

  function update(dt) {
    const t = Math.min(0.05, Math.max(0, dt || 0.016));
    const goal = endgame ? 1 : 0;
    endMix += (goal - endMix) * (1 - Math.exp(-1.7 * t));
    key.position.lerpVectors(KEY_HOME, KEY_END, endMix);
    key.color.copy(keyColorHome).lerp(keyColorEnd, endMix);
    key.intensity = 0.98 - endMix * 0.18;
    hemi.intensity = 0.78 - endMix * 0.22;
    if (scene.fog) {
      scene.fog.near = fogHomeNear - endMix * 4;
      scene.fog.far = fogHomeFar - endMix * 14;
      scene.fog.color.set(SCENE_COLOR.fog).lerp(new THREE.Color(PIGMENT.qing.wash), endMix * 0.25);
    }
  }

  return {
    lights: { hemi, key },
    csm: null,
    setEndgame,
    update,
  };
}
