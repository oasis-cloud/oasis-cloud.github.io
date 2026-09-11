/**
 * 主场景装配：渲染器、合成器、棋盘、环境、弹簧镜头、拾取与剪影。
 */
import * as THREE from "three";
import { BOARD_Y } from "../core/constants.js";
import { PIGMENT } from "../core/palette.js";
import { createComposer } from "../render/composer.js";
import { setResolution } from "../render/materials.js";
import { createBoard } from "./board.js";
import { createCameraRig } from "./camera.js";
import { createEnvironment } from "./environment.js";

export function createScene(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.15, 90);
  camera.position.set(0, 9.2, -11.2);
  camera.lookAt(0, 0.35, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  const maxPR = Math.min(window.devicePixelRatio || 1, 2);
  let currentPR = maxPR;
  renderer.setPixelRatio(currentPR);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;

  const env = createEnvironment(scene, renderer);
  const board = createBoard(scene);
  const cameraRig = createCameraRig(camera, canvas);
  const composer = createComposer(renderer, scene, camera);

  const pieceRoot = new THREE.Group();
  pieceRoot.name = "pieceRoot";
  scene.add(pieceRoot);
  const fxRoot = new THREE.Group();
  fxRoot.name = "fxRoot";
  scene.add(fxRoot);

  const flash = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 4),
    new THREE.MeshBasicMaterial({
      color: PIGMENT.ge.wash,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    }),
  );
  flash.rotation.x = -Math.PI / 2;
  flash.visible = false;
  fxRoot.add(flash);
  let flashFrames = 0;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let lastNow = performance.now();
  let accum = 0;
  let adaptive = false;
  let slowFrames = 0;
  let silOn = false;

  function resize() {
    const w = Math.max(1, canvas.clientWidth || 1);
    const h = Math.max(1, canvas.clientHeight || 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(currentPR);
    renderer.setSize(w, h, false);
    composer.resize(w, h, currentPR);
    setResolution(Math.floor(w * currentPR), Math.floor(h * currentPR));
  }

  function findPieceRoot(obj) {
    let node = obj;
    while (node) {
      if (node.userData?.isOutline) {
        node = node.parent;
        continue;
      }
      const root = node.userData?.pieceRoot;
      if (root?.userData && Number.isInteger(root.userData.f)) return root;
      if (node.parent === pieceRoot && Number.isInteger(node.userData?.f)) return node;
      node = node.parent;
    }
    return null;
  }

  function collectPickProxies() {
    const list = [];
    pieceRoot.traverse((obj) => {
      if (obj.userData?.pickProxy) list.push(obj);
    });
    return list;
  }

  function firstPieceHit(hits) {
    for (const hit of hits) {
      if (!hit.object.userData?.pickProxy) continue;
      const root = findPieceRoot(hit.object);
      if (root && Number.isInteger(root.userData.f) && root.userData.f >= 0) {
        return { root, distance: hit.distance };
      }
    }
    return null;
  }

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;
    pointer.x = ((clientX - rect.left) / w) * 2 - 1;
    pointer.y = -((clientY - rect.top) / h) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const pieceHit = firstPieceHit(raycaster.intersectObjects(collectPickProxies(), false));
    const pointHits = raycaster.intersectObjects(board.hitMeshes, false);
    const square = pointHits[0]?.object?.userData;
    const squareDist = pointHits[0]?.distance ?? Infinity;

    // 近景时蒙皮绑定姿势会挡住整条射线，只认各子上的拾取盒。
    if (pieceHit && pieceHit.distance <= squareDist + 0.08) {
      return { f: pieceHit.root.userData.f, r: pieceHit.root.userData.r, piece: pieceHit.root };
    }
    if (square && Number.isInteger(square.f) && Number.isInteger(square.r)) {
      return { f: square.f, r: square.r };
    }
    if (pieceHit) {
      return { f: pieceHit.root.userData.f, r: pieceHit.root.userData.r, piece: pieceHit.root };
    }
    return null;
  }

  function setHighlights(selected, legalMoves) {
    board.setHighlights(selected, legalMoves);
  }

  function setCheckSquare(f, r) {
    board.setCheckSquare(f, r);
  }

  function setSilhouette(on) {
    silOn = !!on;
    composer.setSilhouette(silOn);
    renderer.shadowMap.enabled = !silOn;
    if (env.lights?.key) env.lights.key.castShadow = !silOn;
  }

  function setAdaptivePixelRatio(enabled) {
    adaptive = !!enabled;
    if (!adaptive && currentPR !== maxPR) {
      currentPR = maxPR;
      slowFrames = 0;
      resize();
    }
  }

  function playFlash(worldPos) {
    if (!worldPos) return;
    flash.position.set(worldPos.x, (worldPos.y ?? BOARD_Y) + 0.36, worldPos.z);
    flash.visible = true;
    flash.material.opacity = 1;
    flashFrames = 3;
  }

  function render(dt) {
    const now = performance.now();
    let delta = dt;
    if (delta == null) delta = (now - lastNow) * 0.001;
    else if (delta > 1) delta *= 0.001;
    delta = Math.min(0.05, Math.max(0, delta));
    lastNow = now;
    accum += delta;

    cameraRig.update(delta);
    env.update(delta);
    board.setRiverTime(accum);

    if (flashFrames > 0) {
      flash.material.opacity = flashFrames / 3;
      flashFrames -= 1;
      if (flashFrames <= 0) flash.visible = false;
    }

    composer.render();

    if (adaptive) {
      const ms = performance.now() - now;
      if (ms > 20 && currentPR > 1.01) {
        slowFrames += 1;
        if (slowFrames >= 8) {
          currentPR = 1;
          slowFrames = 0;
          resize();
        }
      } else {
        slowFrames = 0;
      }
    }
  }

  resize();

  return {
    scene,
    camera,
    renderer,
    composer,
    board,
    env,
    cameraRig,
    pieceRoot,
    fxRoot,
    resize,
    render,
    pick,
    setHighlights,
    setCheckSquare,
    setSilhouette,
    setAdaptivePixelRatio,
    playFlash,
  };
}
