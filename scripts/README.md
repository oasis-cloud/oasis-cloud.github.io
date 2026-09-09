# 图片压缩脚本

## 功能说明

这些脚本用于在构建博客时自动压缩图片，减小文件大小。

## 脚本说明

### `compress_images.cjs`

图片压缩核心脚本（Node.js），使用 Sharp：
- **PNG**: compressionLevel 9
- **JPEG**: quality 95、渐进式
- **WebP**: quality 95
- **SVG/GIF**: 直接复制

### `post_build.cjs`

VitePress 构建完成后自动压缩 `dist/images`。

## 使用方法

```bash
npm run build
```

手动压缩：

```bash
node scripts/compress_images.cjs docs/public/images dist/images
```
