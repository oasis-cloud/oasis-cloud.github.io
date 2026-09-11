/**
 * 工笔重彩程序纹理。全部 Canvas 2D 生成，不下载图。
 * 色板只取自矿物颜料，缓存后复用。
 */
import * as THREE from "three";
import { PIGMENT, SCENE_COLOR } from "../core/palette.js";

const cache = new Map();

function rgb(hex) {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function css(hex) {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function canvasTexture(canvas, { wrap = true, nearest = false, colorSpace = THREE.NoColorSpace } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (wrap) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  }
  if (nearest) {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
  }
  tex.colorSpace = colorSpace;
  tex.needsUpdate = true;
  return tex;
}

function getCached(key, factory) {
  const hit = cache.get(key);
  if (hit) return hit;
  const tex = factory();
  cache.set(key, tex);
  return tex;
}

/** 绢织经纬 + 轻微不规则。罩染用，RepeatWrapping。 */
export function makeSilkTexture(size = 256) {
  return getCached(`silk:${size}`, () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(size, size);
    const base = rgb(SCENE_COLOR.silk);
    const period = 4;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const warp = x % period;
        const weft = y % period;
        const yarn = warp === 0 || weft === 0 ? 0.82 : warp === 2 || weft === 2 ? 0.96 : 1;
        const slub = 0.94 + hash2(x * 0.37, y * 0.41) * 0.12;
        const v = yarn * slub;
        const i = (y * size + x) * 4;
        img.data[i] = Math.min(255, base[0] * v);
        img.data[i + 1] = Math.min(255, base[1] * v);
        img.data[i + 2] = Math.min(255, base[2] * v);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvasTexture(canvas);
  });
}

/** 皴法笔触：侧锋短线，不是 Perlin 雾。 */
export function makeCunTexture(size = 256) {
  return getCached(`cun:${size}`, () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const paper = rgb(PIGMENT.ge.light);
    ctx.fillStyle = `rgb(${paper[0]},${paper[1]},${paper[2]})`;
    ctx.fillRect(0, 0, size, size);
    ctx.lineCap = "butt";
    ctx.lineJoin = "bevel";
    const ink = rgb(PIGMENT.mo.mid);
    const inkWash = rgb(PIGMENT.mo.wash);
    const strokes = size * 1.7;
    for (let i = 0; i < strokes; i++) {
      const x = hash2(i, 1.7) * size;
      const y = hash2(i, 8.3) * size;
      const len = 7 + hash2(i, 3.1) * 20;
      const ang = -0.72 + (hash2(i, 5.9) - 0.5) * 0.38;
      const w = 0.55 + hash2(i, 2.2) * 1.7;
      const a = 0.07 + hash2(i, 9.4) * 0.16;
      const c = hash2(i, 4.4) > 0.55 ? ink : inkWash;
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
    const second = size * 0.55;
    for (let i = 0; i < second; i++) {
      const x = hash2(i + 40, 2.1) * size;
      const y = hash2(i + 40, 6.6) * size;
      const len = 5 + hash2(i, 1.4) * 12;
      const ang = -0.42 + (hash2(i, 7.2) - 0.5) * 0.28;
      ctx.strokeStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${0.05 + hash2(i, 0.8) * 0.1})`;
      ctx.lineWidth = 0.45 + hash2(i, 3.3) * 1.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
    return canvasTexture(canvas);
  });
}

/** 赭石木纹。 */
export function makeWoodTexture(size = 256) {
  return getCached(`wood:${size}`, () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(size, size);
    const deep = rgb(PIGMENT.zhe.deep);
    const mid = rgb(PIGMENT.zhe.mid);
    const light = rgb(PIGMENT.zhe.light);
    const wash = rgb(PIGMENT.teng.wash);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gy = y / size;
        const wave = Math.sin(gy * 18 + Math.sin(gy * 7.4) * 1.3 + hash2(x * 0.08, y) * 0.4);
        const ring = (wave * 0.5 + 0.5 + hash2(x, y * 0.2) * 0.12) % 1;
        const t = ring * ring;
        let c;
        if (t < 0.22) c = deep;
        else if (t < 0.48) c = mid;
        else if (t < 0.78) c = light;
        else c = wash;
        const pore = 0.92 + hash2(x * 1.7, y * 3.1) * 0.16;
        const i = (y * size + x) * 4;
        img.data[i] = Math.min(255, c[0] * pore);
        img.data[i + 1] = Math.min(255, c[1] * pore);
        img.data[i + 2] = Math.min(255, c[2] * pore);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvasTexture(canvas, { colorSpace: THREE.SRGBColorSpace });
  });
}

/** 金箔压印颗粒。 */
export function makeGoldFoilTexture(size = 256) {
  return getCached(`gold:${size}`, () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = ctx.createImageData(size, size);
    const deep = rgb(PIGMENT.nijin.deep);
    const mid = rgb(PIGMENT.nijin.mid);
    const light = rgb(PIGMENT.nijin.light);
    const wash = rgb(PIGMENT.nijin.wash);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const flake = hash2(Math.floor(x / 5), Math.floor(y / 4));
        const grain = hash2(x * 1.3, y * 1.7);
        const crease = Math.abs(Math.sin(x * 0.21 + y * 0.07) * Math.cos(y * 0.18));
        let c;
        if (flake < 0.18) c = deep;
        else if (flake < 0.55) c = mid;
        else if (flake < 0.82) c = light;
        else c = wash;
        const press = 0.78 + grain * 0.28 - crease * 0.12;
        const i = (y * size + x) * 4;
        img.data[i] = Math.min(255, c[0] * press);
        img.data[i + 1] = Math.min(255, c[1] * press);
        img.data[i + 2] = Math.min(255, c[2] * press);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvasTexture(canvas, { colorSpace: THREE.SRGBColorSpace });
  });
}

/** 1×4 量化色带。NearestFilter，禁止插值。 */
export function makeRampTexture(hexColors) {
  const cols = hexColors && hexColors.length ? hexColors.slice(0, 4) : SCENE_COLOR.inkLine;
  const key = `ramp:${[].concat(cols).join(",")}`;
  return getCached(key, () => {
    const n = 4;
    const data = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
      const hex = Array.isArray(hexColors) ? hexColors[Math.min(i, hexColors.length - 1)] : hexColors;
      data[i * 4] = (hex >> 16) & 255;
      data[i * 4 + 1] = (hex >> 8) & 255;
      data[i * 4 + 2] = hex & 255;
      data[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  });
}

/** 篆意汉字：系统宋体上屏后高对比二值化，当作刻印。 */
export function makeSealChar(char, color) {
  const ink = color ?? PIGMENT.zhu.mid;
  const key = `seal:${char}:${ink}`;
  return getCached(key, () => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    ctx.font = '900 176px "Songti SC","STSong","Noto Serif SC","SimSun","serif"';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(char), size * 0.5, size * 0.56);
    const img = ctx.getImageData(0, 0, size, size);
    const [r, g, b] = rgb(ink);
    for (let i = 0; i < img.data.length; i += 4) {
      const lum = img.data[i] * 0.3 + img.data[i + 1] * 0.59 + img.data[i + 2] * 0.11;
      const on = lum < 148;
      img.data[i] = on ? r : 255;
      img.data[i + 1] = on ? g : 255;
      img.data[i + 2] = on ? b : 255;
      img.data[i + 3] = on ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0);
    const tex = canvasTexture(canvas, { wrap: false, nearest: false, colorSpace: THREE.SRGBColorSpace });
    return tex;
  });
}

/** 千里江山平涂蓝绿，老化饱和度。 */
export function makeSkyGradient() {
  return getCached("sky", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, css(SCENE_COLOR.skyTop));
    g.addColorStop(0.42, css(SCENE_COLOR.skyMid));
    g.addColorStop(0.74, css(SCENE_COLOR.skyHorizon));
    g.addColorStop(1, css(PIGMENT.ge.deep));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 256);
    const tex = canvasTexture(canvas, { wrap: false, colorSpace: THREE.SRGBColorSpace });
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  });
}
