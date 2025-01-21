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

// 添加 PDF.js 库
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
document.head.appendChild(script);

// PDF 拆分相关的 DOM 元素
const pdfInput = document.getElementById('pdfSplitInput');
const splitButton = document.getElementById('splitPdfBtn');
const pdfInfo = document.getElementById('pdfInfo');
const splitProgress = document.getElementById('splitProgress');

// 监听文件选择
pdfInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();
            
            pdfInfo.textContent = `文件名: ${file.name}\n页数: ${pageCount}页`;
            splitButton.disabled = false;
        } catch (error) {
            pdfInfo.textContent = '无法读取PDF文件，请确保文件格式正确。';
            splitButton.disabled = true;
        }
    }
});

// PDF 拆分功能
async function splitPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();

    splitProgress.textContent = '开始拆分...';

    for (let i = 0; i < pageCount; i++) {
        splitProgress.textContent = `正在处理第 ${i + 1}/${pageCount} 页...`;
        
        const newPdf = await PDFLib.PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);
        
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `第${i + 1}页.pdf`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    splitProgress.textContent = '拆分完成！';
}

// 拆分按钮点击事件
splitButton.addEventListener('click', async () => {
    const file = pdfInput.files[0];
    if (file) {
        splitButton.disabled = true;
        try {
            await splitPDF(file);
        } catch (error) {
            splitProgress.textContent = '拆分过程中出现错误，请重试。';
        }
        splitButton.disabled = false;
    }
}); 