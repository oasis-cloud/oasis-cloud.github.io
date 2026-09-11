/**
 * 矿物颜料色板。每一个材质、UI、粒子都必须从这里取色。
 * 石青、石绿、朱砂、赭石、藤黄、蛤白、墨、泥金。
 * 老化后沉下去的饱和度，不是塑料高光。
 */

function hex(n) {
  return n;
}

export const PIGMENT = {
  qing: {
    // 石青
    deep: hex(0x1a4a62),
    mid: hex(0x2a6b8a),
    light: hex(0x4a93ae),
    wash: hex(0x7eb3c4),
  },
  lv: {
    // 石绿
    deep: hex(0x1e4630),
    mid: hex(0x3d7a4a),
    light: hex(0x6a9a5c),
    wash: hex(0x9bb887),
  },
  zhu: {
    // 朱砂
    deep: hex(0x6e1c16),
    mid: hex(0xa32a1e),
    light: hex(0xc23a2b),
    wash: hex(0xd4785a),
  },
  zhe: {
    // 赭石
    deep: hex(0x4a2410),
    mid: hex(0x8b4518),
    light: hex(0xa05a2d),
    wash: hex(0xc48a58),
  },
  teng: {
    // 藤黄
    deep: hex(0x7a5a08),
    mid: hex(0xc4920a),
    light: hex(0xd4a017),
    wash: hex(0xe8c547),
  },
  ge: {
    // 蛤白
    deep: hex(0xc9c0ae),
    mid: hex(0xe8e0d0),
    light: hex(0xf3efe4),
    wash: hex(0xfaf6ee),
  },
  mo: {
    // 墨
    deep: hex(0x0d0d0c),
    mid: hex(0x1a1a18),
    light: hex(0x2c2c28),
    wash: hex(0x4a4a44),
  },
  nijin: {
    // 泥金
    deep: hex(0x5a4810),
    mid: hex(0x8a7018),
    light: hex(0xb8952c),
    wash: hex(0xd4b85a),
  },
};

export const HAN = {
  lacquer: [PIGMENT.zhu.deep, PIGMENT.zhu.mid, PIGMENT.zhu.light, PIGMENT.zhu.wash],
  cloth: [PIGMENT.qing.deep, PIGMENT.qing.mid, PIGMENT.qing.light, PIGMENT.ge.mid],
  leather: [PIGMENT.zhe.deep, PIGMENT.zhe.mid, PIGMENT.zhe.light, PIGMENT.zhe.wash],
  gold: [PIGMENT.nijin.deep, PIGMENT.nijin.mid, PIGMENT.nijin.light, PIGMENT.nijin.wash],
  ivory: [PIGMENT.zhe.wash, PIGMENT.ge.deep, PIGMENT.ge.mid, PIGMENT.ge.light],
  wood: [PIGMENT.zhe.deep, PIGMENT.zhe.mid, PIGMENT.zhe.light, PIGMENT.teng.wash],
  ink: [PIGMENT.mo.deep, PIGMENT.mo.mid, PIGMENT.mo.light, PIGMENT.mo.wash],
  plume: PIGMENT.zhu.light,
  flag: PIGMENT.zhu.mid,
  skin: [0x6e3a28, 0xa86a48, 0xc48862, 0xe0b090],
  silhouetteCrest: "pheasant", // 盔缨
};

/** 楚军：墨黑漆甲、石绿里衬、暗金勾边。形制不同，不是换色。 */
export const CHU = {
  lacquer: [PIGMENT.mo.deep, PIGMENT.mo.mid, PIGMENT.mo.light, 0x3a4038],
  cloth: [PIGMENT.lv.deep, PIGMENT.lv.mid, PIGMENT.lv.light, PIGMENT.lv.wash],
  leather: [PIGMENT.zhe.deep, 0x5a3820, PIGMENT.zhe.mid, PIGMENT.zhe.light],
  gold: [0x3a3010, PIGMENT.nijin.deep, PIGMENT.nijin.mid, PIGMENT.nijin.light],
  ivory: [PIGMENT.zhe.wash, PIGMENT.ge.deep, PIGMENT.ge.mid, PIGMENT.ge.light],
  wood: [0x2a1a10, PIGMENT.zhe.deep, PIGMENT.zhe.mid, PIGMENT.zhe.light],
  ink: [PIGMENT.mo.deep, PIGMENT.mo.mid, PIGMENT.mo.light, PIGMENT.mo.wash],
  plume: PIGMENT.lv.light,
  flag: PIGMENT.lv.mid,
  skin: [0x5a3224, 0x966048, 0xb88062, 0xd4a888],
  silhouetteCrest: "chu-crown",
};

export function armyOf(side) {
  return side === "red" ? HAN : CHU;
}

export const SCENE_COLOR = {
  silk: PIGMENT.ge.mid,
  wood: PIGMENT.zhe.mid,
  riverDeep: PIGMENT.qing.deep,
  riverMid: PIGMENT.qing.mid,
  riverLight: PIGMENT.qing.light,
  mountainFar: PIGMENT.qing.mid,
  mountainNear: PIGMENT.lv.mid,
  skyTop: 0x6a9aaa,
  skyMid: 0xb5c9b0,
  skyHorizon: 0xd4c49a,
  fog: 0xc4c8b8,
  inkLine: PIGMENT.mo.mid,
  goldLine: PIGMENT.nijin.deep,
  palaceGold: PIGMENT.nijin.light,
  checkPulse: PIGMENT.zhu.light,
  legalMark: PIGMENT.nijin.light,
  captureMark: PIGMENT.zhu.mid,
};

/** 3–4 档 ramp 阈值。不做 Lambert 平滑。各材质不同。 */
export const RAMP_THRESHOLDS = {
  lacquer: [0.28, 0.52, 0.78],
  cloth: [0.32, 0.55, 0.8],
  leather: [0.3, 0.5, 0.74],
  gold: [0.22, 0.48, 0.72],
  ivory: [0.35, 0.58, 0.82],
  wood: [0.3, 0.54, 0.76],
  ink: [0.25, 0.48, 0.7],
  pigment: [0.3, 0.55, 0.8],
  skin: [0.34, 0.56, 0.8],
};
