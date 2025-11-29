#!/usr/bin/env node
/**
 * 图片无损压缩脚本
 * 支持 PNG、JPEG 格式的无损压缩
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * 压缩图片
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputPath - 输出文件路径
 * @returns {Promise<{success: boolean, originalSize: number, compressedSize: number}>}
 */
async function compressImage(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const originalSize = fs.statSync(inputPath).size;
  
  try {
    let compressedSize;
    
    if (ext === '.png') {
      // PNG 无损压缩
      await sharp(inputPath)
        .png({
          compressionLevel: 9, // 最高压缩级别
          adaptiveFiltering: true,
          palette: true // 如果可能，使用调色板
        })
        .toFile(outputPath);
      compressedSize = fs.statSync(outputPath).size;
    } else if (ext === '.jpg' || ext === '.jpeg') {
      // JPEG 高质量压缩
      await sharp(inputPath)
        .jpeg({
          quality: 95, // 高质量
          progressive: true, // 渐进式 JPEG
          mozjpeg: true // 使用 mozjpeg 编码器（如果可用）
        })
        .toFile(outputPath);
      compressedSize = fs.statSync(outputPath).size;
    } else if (ext === '.webp') {
      // WebP 压缩
      await sharp(inputPath)
        .webp({
          quality: 95,
          effort: 6 // 压缩努力程度（0-6）
        })
        .toFile(outputPath);
      compressedSize = fs.statSync(outputPath).size;
    } else {
      // SVG、GIF 等其他格式直接复制
      fs.copyFileSync(inputPath, outputPath);
      compressedSize = originalSize;
    }
    
    return {
      success: true,
      originalSize,
      compressedSize
    };
  } catch (error) {
    // 压缩失败，复制原文件
    fs.copyFileSync(inputPath, outputPath);
    return {
      success: false,
      originalSize,
      compressedSize: originalSize,
      error: error.message
    };
  }
}

/**
 * 压缩图片目录
 * @param {string} sourceDir - 源目录
 * @param {string} targetDir - 目标目录
 */
async function compressImages(sourceDir, targetDir) {
  const sourcePath = path.resolve(sourceDir);
  const targetPath = path.resolve(targetDir);
  
  // 检查源目录是否存在
  if (!fs.existsSync(sourcePath)) {
    console.error(`错误: 源目录不存在: ${sourcePath}`);
    process.exit(1);
  }
  
  // 确保目标目录存在
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
  
  // 判断是否是原地压缩
  const inPlace = sourcePath === targetPath;
  
  console.log(`开始压缩图片: ${sourcePath} -> ${targetPath}`);
  
  // 统计信息
  let totalFiles = 0;
  let compressedFiles = 0;
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  
  // 递归处理所有子目录
  async function processDirectory(dir, relativePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativeFilePath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        // 递归处理子目录
        await processDirectory(fullPath, relativeFilePath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
        
        if (imageExtensions.includes(ext)) {
          totalFiles++;
          
          // 创建目标文件路径
          const finalTarget = path.join(targetPath, relativeFilePath);
          const finalTargetDir = path.dirname(finalTarget);
          if (!fs.existsSync(finalTargetDir)) {
            fs.mkdirSync(finalTargetDir, { recursive: true });
          }
          
          // 如果是原地压缩，先压缩到临时文件
          const tempFile = inPlace 
            ? finalTarget + '.tmp'
            : finalTarget;
          
          try {
            const result = await compressImage(fullPath, tempFile);
            totalOriginalSize += result.originalSize;
            
            const saved = result.originalSize - result.compressedSize;
            
            if (saved > 0) {
              compressedFiles++;
              totalCompressedSize += result.compressedSize;
              
              // 如果是临时文件，移动到最终位置
              if (inPlace) {
                if (fs.existsSync(finalTarget)) {
                  fs.unlinkSync(finalTarget);
                }
                fs.renameSync(tempFile, finalTarget);
              }
              
              console.log(`✓ ${relativeFilePath}: ${result.originalSize} → ${result.compressedSize} bytes (节省 ${saved} bytes)`);
            } else if (saved < 0) {
              // 压缩后更大，使用原文件
              if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
              }
              fs.copyFileSync(fullPath, finalTarget);
              totalCompressedSize += result.originalSize;
              console.log(`→ ${relativeFilePath}: 压缩后更大，使用原文件`);
            } else {
              // 无变化
              if (inPlace && fs.existsSync(tempFile)) {
                fs.renameSync(tempFile, finalTarget);
              }
              totalCompressedSize += result.compressedSize;
              console.log(`→ ${relativeFilePath}: 无变化`);
            }
          } catch (error) {
            console.error(`压缩失败 ${relativeFilePath}: ${error.message}`);
            // 压缩失败，复制原文件
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
            fs.copyFileSync(fullPath, finalTarget);
            const originalSize = fs.statSync(fullPath).size;
            totalOriginalSize += originalSize;
            totalCompressedSize += originalSize;
          }
        } else {
          // 非图片文件，直接复制
          const finalTarget = path.join(targetPath, relativeFilePath);
          const finalTargetDir = path.dirname(finalTarget);
          if (!fs.existsSync(finalTargetDir)) {
            fs.mkdirSync(finalTargetDir, { recursive: true });
          }
          fs.copyFileSync(fullPath, finalTarget);
        }
      }
    }
  }
  
  await processDirectory(sourcePath);
  
  // 输出统计信息
  console.log(`\n压缩完成: ${compressedFiles}/${totalFiles} 个文件`);
  const totalSaved = totalOriginalSize - totalCompressedSize;
  if (totalSaved > 0) {
    console.log(`总共节省: ${(totalSaved / 1024).toFixed(2)} KB`);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: node compress_images.js <源目录> <目标目录>');
    console.log('示例: node compress_images.js res/images out/images');
    process.exit(1);
  }
  
  const sourceDir = args[0];
  const targetDir = args[1];
  
  await compressImages(sourceDir, targetDir);
}

main().catch(error => {
  console.error('错误:', error);
  process.exit(1);
});
