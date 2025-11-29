# 图片压缩脚本

## 功能说明

这些脚本用于在构建博客时自动压缩图片，实现无损压缩以减小文件大小。

## 脚本说明

### `compress_images.js`

图片压缩核心脚本（Node.js 版本），使用 Sharp 库，支持以下格式：
- **PNG**: 使用最高压缩级别（compressionLevel: 9）进行无损压缩
- **JPEG**: 使用高质量压缩（quality: 95）和渐进式编码
- **WebP**: 使用高质量压缩（quality: 95）
- **SVG/GIF**: 直接复制（不压缩）

### `post_build.js`

构建后处理脚本，在 Ark 构建完成后自动运行图片压缩。

## 使用方法

### 自动使用（推荐）

图片压缩已集成到构建流程中，运行以下命令时会自动压缩：

```bash
npm run build
```

构建完成后会自动压缩 `out/images` 目录中的图片。

### 手动使用

如果需要单独运行图片压缩：

```bash
# 压缩 res/images 到 out/images
node scripts/compress_images.js res/images out/images

# 原地压缩 out/images（如果图片已经在输出目录）
node scripts/compress_images.js out/images out/images
```

## 依赖安装

确保已安装 Node.js 依赖：

```bash
npm install
```

主要依赖：
- `sharp`: 高性能图片处理库，支持 PNG、JPEG、WebP 等多种格式

## 压缩效果

脚本会显示每个文件的压缩结果：
- `✓` 表示成功压缩并减小了文件大小
- `→` 表示文件无变化或压缩后反而更大（保留原文件）

最后会显示压缩统计信息，包括压缩的文件数量和节省的总空间。

