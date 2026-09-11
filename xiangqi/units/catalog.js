/**
 * 七兵种 × 汉 / 楚 形制差异。纯数据，不含几何。
 * 汉：朱砂漆甲、雉尾盔缨、戟/矛/弩。
 * 楚：墨黑漆甲、高冠、戈、燕尾旗。
 */

export const UNIT_CATALOG = {
  pawn: {
    han: {
      helmet: "doumou",
      crest: "shortPheasant",
      weapon: "shortSpear",
      armorLayout: { plateRows: 4, cape: false, skirt: true, robe: false },
      mount: null,
    },
    chu: {
      helmet: "clothHelm",
      crest: "browOrnament",
      weapon: "ge",
      armorLayout: { plateRows: 3, cape: false, skirt: true, robe: false },
      mount: null,
    },
  },
  advisor: {
    han: {
      helmet: "jinxian",
      crest: "wingCap",
      weapon: "hu",
      armorLayout: { plateRows: 0, cape: true, skirt: true, robe: true },
      mount: null,
    },
    chu: {
      helmet: "chuOfficial",
      crest: "frontJade",
      weapon: "fan",
      armorLayout: { plateRows: 0, cape: true, skirt: true, robe: true },
      mount: null,
    },
  },
  elephant: {
    han: {
      helmet: "doumou",
      crest: "shortPheasant",
      weapon: "spear",
      armorLayout: { plateRows: 3, cape: false, skirt: true, robe: false },
      mount: {
        kind: "elephant",
        tuskCurve: 0.16,
        earSpread: 1,
      },
    },
    chu: {
      helmet: "clothHelm",
      crest: "browOrnament",
      weapon: "ge",
      armorLayout: { plateRows: 3, cape: false, skirt: true, robe: false },
      mount: {
        kind: "elephant",
        tuskCurve: 0.48,
        earSpread: 1.18,
      },
    },
  },
  horse: {
    han: {
      helmet: "doumou",
      crest: "pheasant",
      weapon: "spear",
      armorLayout: { plateRows: 3, cape: false, skirt: true, robe: false },
      mount: { kind: "horse", mane: "flowing" },
    },
    chu: {
      helmet: "chuCrownSmall",
      crest: "chuTassel",
      weapon: "ge",
      armorLayout: { plateRows: 3, cape: false, skirt: true, robe: false },
      mount: { kind: "horse", mane: "cropped" },
    },
  },
  chariot: {
    han: {
      helmet: "doumou",
      crest: "pheasant",
      weapon: "ji",
      armorLayout: { plateRows: 3, cape: false, skirt: true, robe: false },
      mount: {
        kind: "chariot",
        flag: "square",
        spokes: 8,
        hubGold: true,
        canopy: "umbrella",
      },
    },
    chu: {
      helmet: "chuCrownSmall",
      crest: "chuTassel",
      weapon: "ge",
      armorLayout: { plateRows: 3, cape: false, skirt: true, robe: false },
      mount: {
        kind: "chariot",
        flag: "swallowtail",
        spokes: 4,
        hubGold: false,
        canopy: "pole",
      },
    },
  },
  cannon: {
    han: {
      helmet: "doumou",
      crest: "shortPheasant",
      weapon: "mallet",
      armorLayout: { plateRows: 2, cape: false, skirt: true, robe: false },
      mount: { kind: "catapult", frame: "cinnabar" },
    },
    chu: {
      helmet: "clothHelm",
      crest: "browOrnament",
      weapon: "mallet",
      armorLayout: { plateRows: 2, cape: false, skirt: true, robe: false },
      mount: { kind: "catapult", frame: "ink" },
    },
  },
  king: {
    han: {
      helmet: "imperialMian",
      crest: "twinPheasant",
      weapon: "ji",
      armorLayout: { plateRows: 5, cape: true, skirt: true, robe: false },
      mount: null,
    },
    chu: {
      helmet: "chuHighCrown",
      crest: "chuHighBoard",
      weapon: "sword",
      armorLayout: { plateRows: 4, cape: true, skirt: true, robe: false },
      mount: null,
    },
  },
};

export function specOf(type, side) {
  const army = side === "red" ? "han" : "chu";
  return UNIT_CATALOG[type][army];
}
