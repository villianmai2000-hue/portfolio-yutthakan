/**
 * บีบอัดรูปภาพด้วย HTML5 Canvas และแปลงเป็น WebP
 * ช่วยลดขนาดไฟล์จาก 5-10MB เหลือเพียง 100-300KB (-85% ถึง -95%)
 * ทำให้เก็บลง MongoDB Atlas ได้นับหมื่นรูปโดยไม่เปลืองพื้นที่
 */
export async function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพ'));
    }

    const originalSize = file.size;
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // คำนวณรักษาสัดส่วนภาพ (Aspect Ratio)
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // วาดลง Canvas เพื่อบีบอัด
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // แปลงเป็น WebP คุณภาพสูง (หากเบราว์เซอร์ไม่รองรับจะ fallback เป็น JPEG)
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // สร้าง Thumbnail ขนาดเล็ก (กว้าง 400px) สำหรับโหลดเร็วในหน้าแคตตาล็อก
        const thumbCanvas = document.createElement('canvas');
        const thumbWidth = 400;
        const thumbHeight = Math.round((height * thumbWidth) / width);
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;
        const thumbCtx = thumbCanvas.getContext('2d');
        thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        const thumbDataUrl = thumbCanvas.toDataURL('image/webp', 0.7);

        // คำนวณขนาดที่ลดลงได้
        const compressedSizeApprox = Math.round((dataUrl.length * 3) / 4);
        const reductionPercent = Math.max(0, Math.round((1 - compressedSizeApprox / originalSize) * 100));

        resolve({
          dataUrl,
          thumbnailDataUrl: thumbDataUrl,
          width,
          height,
          originalSizeBytes: originalSize,
          compressedSizeBytes: compressedSizeApprox,
          originalSizeText: formatBytes(originalSize),
          compressedSizeText: formatBytes(compressedSizeApprox),
          reductionPercent
        });
      };
      img.onerror = () => reject(new Error('ไม่สามารถอ่านข้อมูลภาพได้'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
