export type CropShape = 'circle' | 'square' | 'original';

/**
 * 이미지를 지정된 모양으로 크롭하여 dataURL 반환
 */
export async function cropImage(file: File, shape: CropShape): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth: w, naturalHeight: h } = img;
      const size = Math.min(w, h); // 짧은 변 기준

      let canvasW = w;
      let canvasH = h;
      let sx = 0, sy = 0, sw = w, sh = h;

      if (shape === 'square' || shape === 'circle') {
        sx = (w - size) / 2;
        sy = (h - size) / 2;
        sw = size;
        sh = size;
        canvasW = size;
        canvasH = size;
      }

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d')!;

      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}
