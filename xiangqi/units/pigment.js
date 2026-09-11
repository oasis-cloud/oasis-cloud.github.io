/**
 * 被击败单位碎成硬边扁平矿物碎片（薄 Box），不是圆粒子雾。
 */
import * as THREE from "three";
import { PIGMENT } from "../core/palette.js";

const GRAVITY = 5.6;

function shardColor(base, jitter) {
  const c = new THREE.Color(base ?? PIGMENT.zhu.mid);
  c.offsetHSL((jitter - 0.5) * 0.04, (jitter - 0.5) * 0.08, (jitter - 0.5) * 0.14);
  return c;
}

export function spawnShatter(parent, worldPos, color, count = 28) {
  const group = new THREE.Group();
  group.position.copy(worldPos);
  parent.add(group);

  const shards = [];
  const n = Math.max(8, count | 0);
  for (let i = 0; i < n; i++) {
    const w = 0.035 + Math.random() * 0.09;
    const h = 0.007 + Math.random() * 0.016;
    const d = 0.028 + Math.random() * 0.07;
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshBasicMaterial({
      color: shardColor(color, Math.random()),
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const dir = new THREE.Vector3(Math.random() - 0.5, 0.25 + Math.random() * 0.7, Math.random() - 0.5).normalize();
    mesh.position.copy(dir).multiplyScalar(0.03 + Math.random() * 0.09);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(mesh);
    shards.push({
      mesh,
      vel: dir.clone().multiplyScalar(0.9 + Math.random() * 1.7).setY(1.15 + Math.random() * 1.7),
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 11,
        (Math.random() - 0.5) * 9
      ),
      age: 0,
      life: 0.8 + Math.random() * 0.6,
    });
  }

  let finished = false;
  return {
    group,
    update(dt) {
      if (finished) return true;
      let alive = 0;
      for (const s of shards) {
        s.age += dt;
        if (s.age >= s.life) {
          s.mesh.visible = false;
          continue;
        }
        alive += 1;
        s.vel.y -= GRAVITY * dt;
        s.vel.x *= 1 - Math.min(1, 1.6 * dt);
        s.vel.z *= 1 - Math.min(1, 1.6 * dt);
        s.mesh.position.addScaledVector(s.vel, dt);
        s.mesh.rotation.x += s.spin.x * dt;
        s.mesh.rotation.y += s.spin.y * dt;
        s.mesh.rotation.z += s.spin.z * dt;
        if (s.mesh.position.y < 0) {
          s.mesh.position.y = 0;
          s.vel.y *= -0.14;
          s.vel.x *= 0.45;
          s.vel.z *= 0.45;
          s.spin.multiplyScalar(0.6);
        }
      }
      if (alive === 0) {
        finished = true;
        parent.remove(group);
        group.traverse((o) => {
          o.geometry?.dispose?.();
          o.material?.dispose?.();
        });
        return true;
      }
      return false;
    },
  };
}
