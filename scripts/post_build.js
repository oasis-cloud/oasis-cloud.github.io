#!/usr/bin/env node
/**
 * 构建后处理脚本
 * 在 Ark 构建完成后压缩图片
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COMPRESS_SCRIPT = path.join(__dirname, 'compress_images.js');
const RES_IMAGES = path.join(PROJECT_ROOT, 'res', 'images');
const OUT_IMAGES = path.join(PROJECT_ROOT, 'out', 'images');

function main() {
  let sourceDir;
  let targetDir;
  
  // 优先使用输出目录（如果 Ark 已经复制了图片）
  // 否则从源目录压缩到输出目录
  if (fs.existsSync(OUT_IMAGES) && fs.readdirSync(OUT_IMAGES).length > 0) {
    console.log(`检测到输出目录已有图片，直接压缩: ${OUT_IMAGES}`);
    sourceDir = OUT_IMAGES;
    targetDir = OUT_IMAGES;
  } else if (fs.existsSync(RES_IMAGES)) {
    console.log(`从源目录压缩图片: ${RES_IMAGES} -> ${OUT_IMAGES}`);
    sourceDir = RES_IMAGES;
    targetDir = OUT_IMAGES;
    // 确保输出目录存在
    if (!fs.existsSync(OUT_IMAGES)) {
      fs.mkdirSync(OUT_IMAGES, { recursive: true });
    }
  } else {
    console.log('警告: 未找到图片目录');
    return 0;
  }
  
  // 运行图片压缩脚本
  console.log('开始压缩图片...');
  try {
    execSync(`node "${COMPRESS_SCRIPT}" "${sourceDir}" "${targetDir}"`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    return 0;
  } catch (error) {
    console.error('压缩失败:', error.message);
    return 1;
  }
}

process.exit(main());

