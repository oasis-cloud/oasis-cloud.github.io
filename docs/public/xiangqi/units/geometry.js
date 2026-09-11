/**
 * 硬边积木：汉画像石体量。禁止把锐角焊成光滑曲面。
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function harden(geo) {
  const out = geo.index ? geo.toNonIndexed() : geo;
  if (!out.attributes.uv) {
    out.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(out.attributes.position.count * 2), 2)
    );
  }
  out.computeVertexNormals();
  return out;
}

/** 棱柱盒，原点在几何中心。 */
export function prismBox(w, h, d) {
  return harden(new THREE.BoxGeometry(w, h, d));
}

/**
 * 竖向楔/台体。w0 底宽、w1 顶宽，h 高，d 厚。
 * seg 为高度分段，便于之后蒙皮。
 */
export function taperedPrism(w0, w1, h, d, seg = 1) {
  const geo = new THREE.BoxGeometry(1, h, 1, 1, Math.max(1, seg), 1);
  const pos = geo.attributes.position;
  const y0 = -h / 2;
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - y0) / Math.max(h, 1e-6);
    const wt = w0 * (1 - t) + w1 * t;
    pos.setX(i, pos.getX(i) * wt);
    pos.setZ(i, pos.getZ(i) * d);
  }
  pos.needsUpdate = true;
  return harden(geo);
}

/** 车床体。points 为 Vector2 或 [radius, y]。默认 8 段八角。 */
export function lathe(points, segments = 8) {
  const pts = points.map((p) =>
    p.isVector2 ? p : new THREE.Vector2(p.x ?? p[0], p.y ?? p[1])
  );
  return harden(new THREE.LatheGeometry(pts, segments));
}

/** 倒角薄板。shape 在 XY，沿 Z 挤出。 */
export function extrudePlate(shape, depth, bevel = 0.01) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.85,
    bevelOffset: 0,
    bevelSegments: 1,
    curveSegments: 1,
  });
  return harden(geo);
}

/**
 * 合并几何。transforms[i] 为可选 Matrix4，在合并前应用到对应网格。
 * 不 weld：输入应已是非索引硬边。
 */
export function merge(geos, transforms) {
  const prepared = [];
  for (let i = 0; i < geos.length; i++) {
    const src = geos[i];
    if (!src) continue;
    const g = src.clone();
    if (transforms && transforms[i]) g.applyMatrix4(transforms[i]);
    prepared.push(harden(g));
  }
  if (prepared.length === 0) return harden(new THREE.BoxGeometry(0.01, 0.01, 0.01));
  if (prepared.length === 1) return prepared[0];
  const merged = mergeGeometries(prepared, false);
  return harden(merged || prepared[0]);
}

export function rectShape(w, h) {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  s.moveTo(-hw, -hh);
  s.lineTo(hw, -hh);
  s.lineTo(hw, hh);
  s.lineTo(-hw, hh);
  s.closePath();
  return s;
}

export function polyShape(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

export function compose(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
  return m;
}

export function placed(geo, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = geo.clone();
  g.applyMatrix4(compose(x, y, z, rx, ry, rz));
  return g;
}

/** 沿 Y 轴的四棱锥 / 矛尖。 */
export function pyramid(radius, h, sides = 4) {
  return harden(new THREE.CylinderGeometry(0.001, radius, h, sides));
}

/** 少段圆柱，当作棱柱。 */
export function prismCyl(rTop, rBot, h, sides = 6) {
  return harden(new THREE.CylinderGeometry(rTop, rBot, h, sides));
}
