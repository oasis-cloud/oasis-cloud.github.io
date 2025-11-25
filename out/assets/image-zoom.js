(function() {
    'use strict';

    // 图片放大功能
    function initImageZoom() {
        const images = document.querySelectorAll('article.main img');
        if (images.length === 0) return;

        // 创建放大容器
        const overlay = document.createElement('div');
        overlay.className = 'image-zoom-overlay';
        overlay.innerHTML = `
            <div class="image-zoom-container">
                <button class="image-zoom-close" aria-label="关闭">&times;</button>
                <img class="image-zoom-img" src="" alt="">
            </div>
        `;
        document.body.appendChild(overlay);

        const overlayEl = overlay;
        const containerEl = overlay.querySelector('.image-zoom-container');
        const imgEl = overlay.querySelector('.image-zoom-img');
        const closeBtn = overlay.querySelector('.image-zoom-close');

        // 显示图片
        function showImage(img) {
            imgEl.src = img.src;
            imgEl.alt = img.alt || '';
            overlayEl.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // 隐藏图片
        function hideImage() {
            overlayEl.classList.remove('active');
            document.body.style.overflow = '';
        }

        // 为每张图片添加点击事件
        images.forEach((img) => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', function(e) {
                e.preventDefault();
                showImage(img);
            });
        });

        // 关闭按钮
        closeBtn.addEventListener('click', hideImage);

        // 点击背景关闭
        overlayEl.addEventListener('click', function(e) {
            if (e.target === overlayEl) {
                hideImage();
            }
        });

        // 点击容器内的图片不关闭
        containerEl.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // ESC键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlayEl.classList.contains('active')) {
                hideImage();
            }
        });
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageZoom);
    } else {
        initImageZoom();
    }
})();

