#!/usr/bin/env node
/**
 * 构建后处理：压缩 dist/images 中的图片
 */

const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const COMPRESS_SCRIPT = path.join(__dirname, 'compress_images.cjs')
const DIST_IMAGES = path.join(PROJECT_ROOT, 'dist', 'images')
const PUBLIC_IMAGES = path.join(PROJECT_ROOT, 'docs', 'public', 'images')

function main() {
  let sourceDir
  let targetDir

  if (fs.existsSync(DIST_IMAGES) && fs.readdirSync(DIST_IMAGES).length > 0) {
    console.log(`检测到输出目录已有图片，直接压缩: ${DIST_IMAGES}`)
    sourceDir = DIST_IMAGES
    targetDir = DIST_IMAGES
  } else if (fs.existsSync(PUBLIC_IMAGES)) {
    console.log(`从源目录压缩图片: ${PUBLIC_IMAGES} -> ${DIST_IMAGES}`)
    sourceDir = PUBLIC_IMAGES
    targetDir = DIST_IMAGES
    if (!fs.existsSync(DIST_IMAGES)) {
      fs.mkdirSync(DIST_IMAGES, { recursive: true })
    }
  } else {
    console.log('警告: 未找到图片目录')
    return 0
  }

  console.log('开始压缩图片...')
  try {
    execSync(`node "${COMPRESS_SCRIPT}" "${sourceDir}" "${targetDir}"`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    })
    return 0
  } catch (error) {
    console.error('压缩失败:', error.message)
    return 1
  }
}

process.exit(main())
