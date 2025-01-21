// 获取 DOM 元素
const uploadInput = document.getElementById('upload');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('quality-value');
const compressBtn = document.getElementById('compress-btn');
const downloadBtn = document.getElementById('download-btn');
const originalPreview = document.getElementById('original-preview');
const compressedPreview = document.getElementById('compressed-preview');
const originalSize = document.getElementById('original-size');
const compressedSize = document.getElementById('compressed-size');
const compressionControls = document.querySelector('.compression-controls');

let originalFile = null;
let compressedFile = null;

// 更新质量显示
qualityInput.addEventListener('input', function() {
    qualityValue.textContent = this.value + '%';
});

// 处理文件上传
uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        originalFile = file;
        displayImage(file, originalPreview);
        updateFileSize(file, originalSize);
        compressionControls.style.display = 'block';
        downloadBtn.style.display = 'none';
        compressedPreview.src = '';
        compressedSize.textContent = '大小: -- MB';
    }
});

// 显示图片预览
function displayImage(file, imgElement) {
    const reader = new FileReader();
    reader.onload = function(e) {
        imgElement.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 更新文件大小显示
function updateFileSize(file, element) {
    const size = (file.size / (1024 * 1024)).toFixed(2);
    element.textContent = `大小: ${size} MB`;
}

// 压缩图片
compressBtn.addEventListener('click', async function() {
    if (!originalFile) return;

    const quality = parseInt(qualityInput.value) / 100;
    const options = {
        maxSizeMB: 10,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: quality
    };

    try {
        compressedFile = await imageCompression(originalFile, options);
        displayImage(compressedFile, compressedPreview);
        updateFileSize(compressedFile, compressedSize);
        downloadBtn.style.display = 'block';
    } catch (error) {
        console.error('压缩失败:', error);
        alert('图片压缩失败，请重试');
    }
});

// 下载压缩后的图片
downloadBtn.addEventListener('click', function() {
    if (!compressedFile) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedFile);
    link.download = 'compressed_' + originalFile.name;
    link.click();
    URL.revokeObjectURL(link.href);
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
            // 添加加载提示
            pdfInfo.textContent = '正在读取文件...';
            splitButton.disabled = true;

            // 增加超时时间和错误处理
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, {
                ignoreEncryption: true,
                updateMetadata: false
            });
            
            const pageCount = pdfDoc.getPageCount();
            pdfInfo.textContent = `文件名: ${file.name}\n页数: ${pageCount}页`;
            splitButton.disabled = false;
        } catch (error) {
            console.error('PDF 加载错误:', error);
            pdfInfo.textContent = '无法读取PDF文件。请确保：\n1. 文件是有效的PDF格式\n2. 文件未加密\n3. 尝试用其他PDF阅读器重新保存';
            splitButton.disabled = true;
        }
    }
});

// PDF 拆分功能
async function splitPDF(file) {
    try {
        splitProgress.textContent = '正在读取PDF文件...';
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
            updateMetadata: false
        });
        
        const pageCount = pdfDoc.getPageCount();
        
        for (let i = 0; i < pageCount; i++) {
            splitProgress.textContent = `正在处理第 ${i + 1}/${pageCount} 页...`;
            
            try {
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
            } catch (pageError) {
                console.error(`处理第 ${i + 1} 页时出错:`, pageError);
                splitProgress.textContent = `第 ${i + 1} 页处理失败，继续处理下一页...`;
                continue;
            }
        }
        
        splitProgress.textContent = '拆分完成！';
    } catch (error) {
        console.error('PDF 处理错误:', error);
        splitProgress.textContent = '处理PDF时出错。请尝试用其他PDF阅读器重新保存文件后再试。';
    }
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