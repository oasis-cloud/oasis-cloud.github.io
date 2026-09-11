/**
 * 倒壳描边：共享 geometry / skeleton，BackSide 浓墨或暗金。
 */
import * as THREE from "three";
import { createOutlineMaterial } from "./materials.js";

/**
 * @param {THREE.Mesh | THREE.SkinnedMesh} mesh
 * @param {{ gold?: boolean, width?: number }} [opts]
 * @returns {THREE.Mesh | THREE.SkinnedMesh}
 */
export function addOutline(mesh, { gold = false, width = 0.0025 } = {}) {
  const mat = createOutlineMaterial({ gold, width });
  let outline;
  if (mesh.isSkinnedMesh) {
    outline = new THREE.SkinnedMesh(mesh.geometry, mat);
    outline.bind(mesh.skeleton, mesh.bindMatrix);
    outline.bindMode = mesh.bindMode;
  } else {
    outline = new THREE.Mesh(mesh.geometry, mat);
  }

  outline.position.copy(mesh.position);
  outline.quaternion.copy(mesh.quaternion);
  outline.scale.copy(mesh.scale);
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.frustumCulled = mesh.frustumCulled;
  outline.renderOrder = (mesh.renderOrder || 0) - 1;
  outline.userData.isOutline = true;
  outline.userData.goldOutline = !!gold;
  return outline;
}
