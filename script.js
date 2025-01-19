document.addEventListener('DOMContentLoaded', function() {
    const upload = document.getElementById('upload');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');
    const originalPreview = document.getElementById('original-preview');
    const compressedPreview = document.getElementById('compressed-preview');
    const originalSize = document.getElementById('original-size');
    const compressedSize = document.getElementById('compressed-size');
    const downloadBtn = document.getElementById('download-btn');
    const compressionControls = document.querySelector('.compression-controls');
    const compressBtn = document.getElementById('compress-btn');

    let originalFile = null;
    let compressedFile = null;

    // 处理文件上传
    upload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        originalFile = file;
        
        // 显示原始图片预览
        originalPreview.src = URL.createObjectURL(file);
        originalSize.textContent = `大小: ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
        
        // 显示控制器
        compressionControls.style.display = 'block';
        
        // 重置压缩预览
        compressedPreview.src = '';
        compressedSize.textContent = '大小: -- MB';
        downloadBtn.style.display = 'none';
    });

    // 处理压缩按钮点击
    compressBtn.addEventListener('click', async function() {
        if (!originalFile) return;
        await compressImage(originalFile, qualitySlider.value / 100);
        downloadBtn.style.display = 'block';
    });

    // 处理质量滑块变化
    qualitySlider.addEventListener('input', function(e) {
        qualityValue.textContent = `${e.target.value}%`;
    });

    // 图片压缩函数
    async function compressImage(file, quality) {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            quality: quality
        };

        try {
            compressedFile = await imageCompression(file, options);
            compressedPreview.src = URL.createObjectURL(compressedFile);
            compressedSize.textContent = `大小: ${(compressedFile.size / (1024 * 1024)).toFixed(2)} MB`;
        } catch (error) {
            console.error('压缩失败:', error);
        }
    }

    // 处理下载
    downloadBtn.addEventListener('click', function() {
        if (!compressedFile) return;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(compressedFile);
        link.download = `compressed_${originalFile.name}`;
        link.click();
    });
}); 