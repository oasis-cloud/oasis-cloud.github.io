/**
 * 工笔合成：主画面 + 法线深度 Sobel 内轮廓。
 * 不做 ACES 电影调色，保住矿物色。
 */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { PIGMENT } from "../core/palette.js";
import { setAllSilhouette, setResolution } from "./materials.js";
import {
  normalDepthFragment,
  normalDepthVertex,
  sobelFragment,
  sobelVertex,
} from "./shaders.js";

function collectHidden(scene, predicate) {
  const hidden = [];
  scene.traverse((obj) => {
    if (predicate(obj)) hidden.push(obj);
  });
  return hidden;
}

function isSkyMesh(obj) {
  if (!obj.isMesh) return false;
  if (obj.userData.isSky) return true;
  const mats = [].concat(obj.material || []);
  return mats.some((m) => m && m.side === THREE.BackSide && m.fog === false && !obj.userData.isOutline);
}

function isOutlineMesh(obj) {
  return !!(obj && obj.userData && obj.userData.isOutline);
}

export function createComposer(renderer, scene, camera) {
  const prevTone = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const normalRT = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    depthBuffer: true,
  });
  normalRT.texture.generateMipmaps = false;

  const normalDepthMaterial = new THREE.ShaderMaterial({
    name: "gongbi-normal-depth",
    uniforms: {
      cameraNear: { value: camera.near },
      cameraFar: { value: camera.far },
    },
    vertexShader: normalDepthVertex,
    fragmentShader: normalDepthFragment,
    fog: false,
  });

  const silhouetteMaterial = new THREE.ShaderMaterial({
    name: "gongbi-silhouette",
    vertexShader: normalDepthVertex,
    fragmentShader: /* glsl */ `
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    `,
    fog: false,
  });

  const innerInk = new THREE.Color(PIGMENT.mo.light);
  const sobelPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      tNormalDepth: { value: normalRT.texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uInkColor: { value: innerInk },
      uEnabled: { value: 1 },
    },
    vertexShader: sobelVertex,
    fragmentShader: sobelFragment,
  });
  composer.addPass(sobelPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  const clamWhite = new THREE.Color(PIGMENT.ge.light);
  const blackBg = new THREE.Color(0, 0, 0);
  let silhouette = false;
  let storedBackground = scene.background;
  let pixelRatio = renderer.getPixelRatio();

  function applySize(w, h, pr) {
    const width = Math.max(1, w);
    const height = Math.max(1, h);
    pixelRatio = pr ?? renderer.getPixelRatio();
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    const dw = Math.max(1, Math.floor(width * pixelRatio));
    const dh = Math.max(1, Math.floor(height * pixelRatio));
    normalRT.setSize(dw, dh);
    sobelPass.uniforms.uResolution.value.set(dw, dh);
    setResolution(dw, dh);
  }

  function renderNormalDepth() {
    normalDepthMaterial.uniforms.cameraNear.value = camera.near;
    normalDepthMaterial.uniforms.cameraFar.value = camera.far;
    const outlines = collectHidden(scene, isOutlineMesh);
    for (const obj of outlines) obj.visible = false;
    const prevBg = scene.background;
    const prevFog = scene.fog;
    const prevOverride = scene.overrideMaterial;
    scene.background = blackBg;
    scene.fog = null;
    scene.overrideMaterial = normalDepthMaterial;
    renderer.setRenderTarget(normalRT);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    scene.overrideMaterial = prevOverride;
    scene.background = prevBg;
    scene.fog = prevFog;
    for (const obj of outlines) obj.visible = true;
  }

  function render() {
    if (silhouette) {
      const hidden = collectHidden(scene, isSkyMesh);
      for (const obj of hidden) obj.visible = false;
      const prevBg = scene.background;
      const prevOverride = scene.overrideMaterial;
      scene.background = clamWhite;
      scene.overrideMaterial = silhouetteMaterial;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      scene.overrideMaterial = prevOverride;
      scene.background = prevBg;
      for (const obj of hidden) obj.visible = true;
      return;
    }

    renderNormalDepth();
    composer.render();
  }

  function setSilhouette(on) {
    const next = !!on;
    if (next && !silhouette) {
      storedBackground = scene.background;
      scene.background = clamWhite;
    } else if (!next && silhouette) {
      scene.background = storedBackground;
    }
    silhouette = next;
    sobelPass.enabled = !silhouette;
    sobelPass.uniforms.uEnabled.value = silhouette ? 0 : 1;
    setAllSilhouette(silhouette);
  }

  function setPixelRatio(pr) {
    const canvas = renderer.domElement;
    applySize(canvas.clientWidth || 1, canvas.clientHeight || 1, pr);
  }

  function resize(w, h, pr) {
    applySize(w, h, pr);
  }

  function setSize(w, h, pr) {
    applySize(w, h, pr);
  }

  const canvas = renderer.domElement;
  applySize(canvas.clientWidth || 1, canvas.clientHeight || 1, pixelRatio);

  return {
    composer,
    render,
    resize,
    setSize,
    setPixelRatio,
    setSilhouette,
    dispose() {
      renderer.toneMapping = prevTone;
      normalRT.dispose();
      normalDepthMaterial.dispose();
      silhouetteMaterial.dispose();
      composer.dispose();
    },
  };
}
