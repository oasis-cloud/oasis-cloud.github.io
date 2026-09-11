/**
 * 载具：马、象、战车、投石机。硬边画像石体量，汉楚形制不同。
 */
import * as THREE from "three";
import { MATERIAL_KIND } from "../core/constants.js";
import {
  prismBox,
  taperedPrism,
  lathe,
  extrudePlate,
  prismCyl,
  polyShape,
  placed,
} from "./geometry.js";
import { armyMaterial } from "./paint.js";

function paint(kind, side) {
  return armyMaterial(kind, side);
}

function mesh(geo, kind, side, name) {
  const m = new THREE.Mesh(geo, paint(kind, side));
  m.castShadow = true;
  m.receiveShadow = true;
  if (name) m.name = name;
  return m;
}

function add(parent, geo, kind, side, x, y, z, rx = 0, ry = 0, rz = 0, name) {
  const g = placed(geo, x, y, z, rx, ry, rz);
  const m = mesh(g, kind, side, name);
  parent.add(m);
  return m;
}

export function createHorse(side, scale) {
  const isHan = side === "red";
  const g = new THREE.Group();
  g.name = "horse";

  const L = scale.depth * 0.88;
  const W = scale.width * 0.92;
  const withers = scale.height * 0.4;
  const bodyH = withers * 0.5;
  const bodyY = withers * 0.78;
  const legH = Math.max(0.16, bodyY - bodyH * 0.48);

  add(g, prismBox(W, bodyH, L * 0.55), MATERIAL_KIND.LEATHER, side, 0, bodyY, -0.02);

  add(g, taperedPrism(W * 0.95, W * 0.72, bodyH * 0.9, L * 0.22), MATERIAL_KIND.LEATHER, side, 0, bodyY - 0.01, -L * 0.32);
  add(g, taperedPrism(W * 0.75, W * 1.12, bodyH * 0.95, L * 0.22), MATERIAL_KIND.LEATHER, side, 0, bodyY, L * 0.28);

  add(
    g,
    taperedPrism(W * 0.32, W * 0.5, withers * 0.72, W * 0.36),
    MATERIAL_KIND.LEATHER,
    side,
    0,
    bodyY + withers * 0.38,
    L * 0.36,
    0.72,
    0,
    0
  );

  const headY = bodyY + withers * 0.62;
  const headZ = L * 0.52;
  add(g, taperedPrism(W * 0.28, W * 0.16, withers * 0.42, W * 0.72), MATERIAL_KIND.LEATHER, side, 0, headY, headZ, 1.05, 0, 0);
  add(g, prismBox(W * 0.2, W * 0.12, W * 0.32), MATERIAL_KIND.LEATHER, side, 0, headY - withers * 0.12, headZ + W * 0.18);

  const earH = withers * 0.22;
  add(g, prismBox(W * 0.08, earH, W * 0.1), MATERIAL_KIND.LEATHER, side, -W * 0.16, headY + withers * 0.22, headZ - 0.04, 0, 0, 0.25);
  add(g, prismBox(W * 0.08, earH, W * 0.1), MATERIAL_KIND.LEATHER, side, W * 0.16, headY + withers * 0.22, headZ - 0.04, 0, 0, -0.25);

  if (isHan) {
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      add(
        g,
        prismBox(W * 0.1, withers * (0.22 - t * 0.06), W * 0.12),
        MATERIAL_KIND.INK,
        side,
        0,
        bodyY + withers * (0.42 - t * 0.18),
        L * (0.42 - t * 0.5),
        0.25,
        0,
        0.12 * (i % 2 ? 1 : -1)
      );
    }
  } else {
    for (let i = 0; i < 5; i++) {
      add(
        g,
        prismBox(W * 0.14, withers * 0.08, W * 0.08),
        MATERIAL_KIND.INK,
        side,
        0,
        bodyY + withers * 0.4,
        L * (0.4 - i * 0.09)
      );
    }
  }

  add(g, prismBox(W * 1.05, bodyH * 0.2, L * 0.28), MATERIAL_KIND.LACQUER, side, 0, bodyY + bodyH * 0.52, -0.04);
  add(g, prismBox(W * 1.12, bodyH * 0.1, L * 0.08), MATERIAL_KIND.GOLD, side, 0, bodyY + bodyH * 0.58, L * 0.08);

  const hoofH = Math.max(0.03, legH * 0.12);
  const legR = W * 0.16;
  const feet = [
    [-W * 0.32, L * 0.2],
    [W * 0.32, L * 0.2],
    [-W * 0.34, -L * 0.26],
    [W * 0.34, -L * 0.26],
  ];
  for (const [x, z] of feet) {
    add(g, prismBox(legR, legH, legR), MATERIAL_KIND.LEATHER, side, x, legH / 2, z);
    add(g, prismBox(legR * 1.15, hoofH, legR * 1.4), MATERIAL_KIND.INK, side, x, hoofH * 0.5, z + 0.012);
  }

  add(g, taperedPrism(W * 0.1, W * 0.04, withers * 0.32, W * 0.1), MATERIAL_KIND.INK, side, 0, bodyY, -L * 0.42, 0.65);

  g.userData.saddleY = bodyY + bodyH * 0.55;
  return g;
}

export function createElephant(side, scale) {
  const isHan = side === "red";
  const g = new THREE.Group();
  g.name = "elephant";

  const L = scale.depth * 0.72;
  const W = scale.width * 0.72;
  const bodyH = scale.height * 0.38;
  const backY = scale.height * 0.55;
  const legH = backY - bodyH * 0.42;
  const tuskCurve = isHan ? 0.16 : 0.48;

  add(g, prismBox(W, bodyH, L * 0.7), MATERIAL_KIND.LEATHER, side, 0, backY - bodyH * 0.15, 0);

  const head = taperedPrism(W * 0.55, W * 0.42, bodyH * 0.7, W * 0.5);
  add(g, head, MATERIAL_KIND.LEATHER, side, 0, backY - bodyH * 0.05, L * 0.42, 0.25);

  const earShape = polyShape([
    [0, -0.08],
    [W * 0.42, -0.02],
    [W * 0.48, 0.18],
    [W * 0.1, 0.22],
    [0, 0.12],
  ]);
  const earGeo = extrudePlate(earShape, 0.03, 0.008);
  const earSpread = isHan ? 1 : 1.18;
  const earL = mesh(placed(earGeo, 0, 0, 0, 0, Math.PI / 2, 0.15), MATERIAL_KIND.LEATHER, side, "earL");
  earL.position.set(-W * 0.42 * earSpread, backY + 0.02, L * 0.32);
  earL.scale.set(earSpread, 1, 1);
  g.add(earL);
  const earR = mesh(placed(earGeo, 0, 0, 0, 0, -Math.PI / 2, -0.15), MATERIAL_KIND.LEATHER, side, "earR");
  earR.position.set(W * 0.42 * earSpread, backY + 0.02, L * 0.32);
  earR.scale.set(earSpread, 1, 1);
  g.add(earR);

  const tuskLen = W * 0.85;
  for (const sx of [-1, 1]) {
    const tusk = new THREE.Group();
    tusk.position.set(sx * W * 0.22, backY - bodyH * 0.22, L * 0.48);
    const s0 = mesh(taperedPrism(W * 0.09, W * 0.06, tuskLen * 0.42, W * 0.09), MATERIAL_KIND.IVORY, side);
    s0.rotation.x = 1.05 + tuskCurve * 0.25;
    s0.rotation.z = sx * -0.15;
    tusk.add(s0);
    const s1 = mesh(taperedPrism(W * 0.06, W * 0.02, tuskLen * 0.55, W * 0.06), MATERIAL_KIND.IVORY, side);
    s1.position.set(sx * 0.02, -tuskLen * 0.08, tuskLen * 0.36);
    s1.rotation.x = 0.75 + tuskCurve * 1.25;
    s1.rotation.z = sx * -0.12;
    tusk.add(s1);
    g.add(tusk);
  }

  const trunkRoot = new THREE.Group();
  trunkRoot.name = "trunk0";
  trunkRoot.position.set(0, backY - bodyH * 0.22, L * 0.55);
  const t0 = mesh(taperedPrism(W * 0.16, W * 0.13, bodyH * 0.28, W * 0.16), MATERIAL_KIND.LEATHER, side);
  t0.rotation.x = 0.9;
  trunkRoot.add(t0);

  const trunk1 = new THREE.Group();
  trunk1.name = "trunk1";
  trunk1.position.set(0, -bodyH * 0.12, bodyH * 0.18);
  const t1 = mesh(taperedPrism(W * 0.13, W * 0.1, bodyH * 0.24, W * 0.13), MATERIAL_KIND.LEATHER, side);
  t1.rotation.x = 0.4;
  trunk1.add(t1);
  trunkRoot.add(trunk1);

  const trunk2 = new THREE.Group();
  trunk2.name = "trunk2";
  trunk2.position.set(0, -bodyH * 0.14, bodyH * 0.12);
  const t2 = mesh(taperedPrism(W * 0.1, W * 0.07, bodyH * 0.2, W * 0.1), MATERIAL_KIND.LEATHER, side);
  t2.rotation.x = 0.25;
  trunk2.add(t2);
  trunk1.add(trunk2);
  g.add(trunkRoot);

  const howdah = prismBox(W * 0.7, bodyH * 0.18, L * 0.32);
  add(g, howdah, MATERIAL_KIND.WOOD, side, 0, backY + bodyH * 0.28, -L * 0.04);
  add(
    g,
    prismBox(W * 0.74, bodyH * 0.06, L * 0.36),
    MATERIAL_KIND.LACQUER,
    side,
    0,
    backY + bodyH * 0.38,
    -L * 0.04
  );
  if (isHan) {
    add(g, prismBox(W * 0.08, bodyH * 0.22, W * 0.08), MATERIAL_KIND.GOLD, side, 0, backY + bodyH * 0.55, -L * 0.18);
  } else {
    add(g, prismBox(W * 0.12, bodyH * 0.16, W * 0.04), MATERIAL_KIND.GOLD, side, 0, backY + bodyH * 0.5, -L * 0.2);
  }

  const col = W * 0.2;
  const feet = [
    [-W * 0.32, L * 0.22],
    [W * 0.32, L * 0.22],
    [-W * 0.34, -L * 0.22],
    [W * 0.34, -L * 0.22],
  ];
  for (const [x, z] of feet) {
    add(g, prismBox(col, legH, col), MATERIAL_KIND.LEATHER, side, x, legH / 2, z);
    add(g, prismBox(col * 1.12, legH * 0.1, col * 1.2), MATERIAL_KIND.INK, side, x, legH * 0.06, z);
  }

  const tail = taperedPrism(W * 0.06, W * 0.03, bodyH * 0.28, W * 0.06);
  add(g, tail, MATERIAL_KIND.LEATHER, side, 0, backY - bodyH * 0.2, -L * 0.38, 0.5);

  g.userData.saddleY = backY + bodyH * 0.42;
  g.userData.trunk = [trunkRoot, trunk1, trunk2];
  return g;
}

function makeWheel(side, radius, width, spokes, hubGold) {
  const g = new THREE.Group();
  const segs = spokes <= 4 ? 6 : 10;
  const rim = mesh(
    placed(prismCyl(radius, radius, width, segs), 0, 0, 0, 0, 0, Math.PI / 2),
    MATERIAL_KIND.WOOD,
    side,
    "rim"
  );
  g.add(rim);
  const inner = mesh(
    placed(prismCyl(radius * 0.78, radius * 0.78, width * 0.5, segs), 0, 0, 0, 0, 0, Math.PI / 2),
    MATERIAL_KIND.INK,
    side
  );
  g.add(inner);
  const hub = mesh(
    placed(prismCyl(radius * 0.18, radius * 0.18, width * 1.35, 6), 0, 0, 0, 0, 0, Math.PI / 2),
    hubGold ? MATERIAL_KIND.GOLD : MATERIAL_KIND.WOOD,
    side,
    "hub"
  );
  g.add(hub);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI;
    const spoke = mesh(
      prismBox(radius * 1.7, width * 0.35, radius * 0.07),
      MATERIAL_KIND.WOOD,
      side
    );
    spoke.rotation.x = a;
    g.add(spoke);
  }
  g.userData.rollAxis = new THREE.Vector3(1, 0, 0);
  return g;
}

export function createChariot(side, scale) {
  const isHan = side === "red";
  const g = new THREE.Group();
  g.name = "chariot";

  const W = scale.width * 0.78;
  const D = scale.depth * 0.55;
  const boxH = scale.height * 0.18;
  const wheelR = scale.height * 0.16;
  const spokes = isHan ? 8 : 4;

  const box = add(g, prismBox(W * 0.72, boxH, D * 0.7), MATERIAL_KIND.WOOD, side, 0, wheelR + boxH * 0.45, -D * 0.05);
  void box;
  add(
    g,
    prismBox(W * 0.76, boxH * 0.12, D * 0.74),
    MATERIAL_KIND.LACQUER,
    side,
    0,
    wheelR + boxH * 0.95,
    -D * 0.05
  );
  add(g, prismBox(W * 0.08, boxH * 0.7, D * 0.08), MATERIAL_KIND.WOOD, side, -W * 0.3, wheelR + boxH * 0.7, D * 0.18);
  add(g, prismBox(W * 0.08, boxH * 0.7, D * 0.08), MATERIAL_KIND.WOOD, side, W * 0.3, wheelR + boxH * 0.7, D * 0.18);

  const shaft = prismBox(W * 0.06, W * 0.06, D * 1.15);
  add(g, shaft, MATERIAL_KIND.WOOD, side, 0, wheelR * 0.85, D * 0.55);

  const wheelL = makeWheel(side, wheelR, W * 0.08, spokes, isHan);
  wheelL.name = "wheelL";
  wheelL.position.set(-W * 0.42, wheelR, 0);
  g.add(wheelL);
  const wheelRgt = makeWheel(side, wheelR, W * 0.08, spokes, isHan);
  wheelRgt.name = "wheelR";
  wheelRgt.position.set(W * 0.42, wheelR, 0);
  g.add(wheelRgt);

  const poleH = scale.height * 0.72;
  const pole = mesh(prismCyl(0.018, 0.022, poleH, 6), MATERIAL_KIND.WOOD, side, "flagPole");
  pole.position.set(isHan ? -W * 0.12 : W * 0.1, wheelR + boxH + poleH * 0.42, -D * 0.18);
  g.add(pole);

  if (isHan) {
    const canopy = mesh(
      lathe(
        [
          [0.02, 0],
          [W * 0.28, 0.02],
          [W * 0.32, 0.05],
          [W * 0.08, 0.08],
          [0.01, 0.1],
        ],
        8
      ),
      MATERIAL_KIND.LACQUER,
      side,
      "canopy"
    );
    canopy.position.set(0, wheelR + boxH + scale.height * 0.42, -D * 0.08);
    g.add(canopy);
    const flag = mesh(prismBox(W * 0.32, scale.height * 0.16, 0.02), MATERIAL_KIND.PIGMENT, side, "flag");
    flag.material = paint(MATERIAL_KIND.LACQUER, side);
    flag.position.set(-W * 0.12, wheelR + boxH + poleH * 0.78, -D * 0.28);
    g.add(flag);
  } else {
    const swallow = extrudePlate(
      polyShape([
        [0, 0],
        [W * 0.38, 0],
        [W * 0.28, scale.height * 0.08],
        [W * 0.38, scale.height * 0.16],
        [0, scale.height * 0.14],
      ]),
      0.018,
      0.004
    );
    const flag = mesh(swallow, MATERIAL_KIND.CLOTH, side, "flag");
    flag.position.set(W * 0.1, wheelR + boxH + poleH * 0.62, -D * 0.22);
    flag.rotation.y = -0.4;
    g.add(flag);
  }

  g.userData.saddleY = wheelR + boxH * 0.55;
  g.userData.wheels = [wheelL, wheelRgt];
  return g;
}

export function createCatapult(side, scale) {
  const isHan = side === "red";
  const g = new THREE.Group();
  g.name = "catapult";

  const W = scale.width * 0.7;
  const D = scale.depth * 0.7;
  const H = scale.height * 0.55;
  const beam = MATERIAL_KIND.WOOD;

  add(g, prismBox(W * 0.12, H * 0.55, W * 0.12), beam, side, -W * 0.32, H * 0.28, -D * 0.22);
  add(g, prismBox(W * 0.12, H * 0.55, W * 0.12), beam, side, W * 0.32, H * 0.28, -D * 0.22);
  add(g, prismBox(W * 0.12, H * 0.35, W * 0.12), beam, side, -W * 0.28, H * 0.18, D * 0.28);
  add(g, prismBox(W * 0.12, H * 0.35, W * 0.12), beam, side, W * 0.28, H * 0.18, D * 0.28);

  add(g, prismBox(W * 0.85, W * 0.08, W * 0.1), beam, side, 0, H * 0.52, -D * 0.22);
  add(g, prismBox(W * 0.1, W * 0.08, D * 0.7), beam, side, -W * 0.3, H * 0.22, 0.02);
  add(g, prismBox(W * 0.1, W * 0.08, D * 0.7), beam, side, W * 0.3, H * 0.22, 0.02);
  add(g, prismBox(W * 0.7, W * 0.08, W * 0.1), beam, side, 0, H * 0.08, D * 0.22);

  const brace = taperedPrism(W * 0.08, W * 0.08, H * 0.5, W * 0.08);
  add(g, brace, beam, side, -W * 0.3, H * 0.32, 0, 0.7);
  add(g, brace, beam, side, W * 0.3, H * 0.32, 0, 0.7);

  const arm = new THREE.Group();
  arm.name = "arm";
  arm.position.set(0, H * 0.52, -D * 0.18);
  arm.rotation.x = -0.55;
  const armBeam = mesh(prismBox(W * 0.08, W * 0.08, D * 0.95), beam, side, "armBeam");
  armBeam.position.z = D * 0.35;
  arm.add(armBeam);

  const bowl = mesh(
    lathe(
      [
        [0.01, 0],
        [W * 0.12, 0.01],
        [W * 0.14, 0.05],
        [W * 0.08, 0.07],
        [0.02, 0.08],
      ],
      8
    ),
    MATERIAL_KIND.LEATHER,
    side,
    "bowl"
  );
  bowl.position.set(0, 0.02, D * 0.78);
  arm.add(bowl);
  const stone = mesh(prismBox(W * 0.1, W * 0.08, W * 0.1), MATERIAL_KIND.INK, side, "shot");
  stone.position.set(0, 0.06, D * 0.78);
  arm.add(stone);

  const strap = mesh(prismBox(0.012, 0.012, D * 0.4), MATERIAL_KIND.LEATHER, side, "strap");
  strap.position.set(W * 0.06, -0.04, D * 0.4);
  arm.add(strap);
  const strap2 = strap.clone();
  strap2.position.x = -W * 0.06;
  arm.add(strap2);

  if (isHan) {
    add(g, prismBox(W * 0.2, W * 0.06, W * 0.06), MATERIAL_KIND.GOLD, side, 0, H * 0.58, -D * 0.22);
  } else {
    add(g, prismBox(W * 0.16, W * 0.1, W * 0.05), MATERIAL_KIND.LACQUER, side, 0, H * 0.58, -D * 0.22);
  }

  g.add(arm);
  g.userData.saddleY = 0.12;
  g.userData.arm = arm;
  return g;
}

export { paint };
