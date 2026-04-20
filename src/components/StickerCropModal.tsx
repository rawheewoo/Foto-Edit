import { useState, useRef, useEffect } from 'react';

type Shape = 'rect' | 'square' | 'circle';

const CROP_SIZE = 300;

interface Props {
  previewSrc: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

type View = { ox: number; oy: number; us: number };
type LastTouch =
  | { type: 'single'; x: number; y: number }
  | { type: 'pinch'; t0x: number; t0y: number; t1x: number; t1y: number; dist: number };

export default function StickerCropModal({ previewSrc, onConfirm, onCancel }: Props) {
  const [shape, setShape] = useState<Shape>('square');
  const [view, setView] = useState<View>({ ox: 0, oy: 0, us: 1 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const lastTouchRef = useRef<LastTouch | null>(null);
  const mouseDragRef = useRef<{ x: number; y: number } | null>(null);
  const cropBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = previewSrc;
    img.onload = () => { imgRef.current = img; setNaturalSize({ w: img.width, h: img.height }); };
  }, [previewSrc]);

  useEffect(() => { setView({ ox: 0, oy: 0, us: 1 }); }, [shape]);

  // Prevent browser scroll/zoom inside crop box
  useEffect(() => {
    const el = cropBoxRef.current;
    if (!el) return;
    const prevent = (e: Event) => e.preventDefault();
    el.addEventListener('touchmove', prevent, { passive: false });
    el.addEventListener('wheel', prevent, { passive: false });
    return () => { el.removeEventListener('touchmove', prevent); el.removeEventListener('wheel', prevent); };
  }, []);

  if (!naturalSize) return null;

  // Base size: fit image into CROP_SIZE box (fixed, only changes on shape/naturalSize change)
  const fitScale = shape === 'rect'
    ? Math.min(CROP_SIZE / naturalSize.w, CROP_SIZE / naturalSize.h)
    : Math.max(CROP_SIZE / naturalSize.w, CROP_SIZE / naturalSize.h);

  const baseW = naturalSize.w * fitScale;
  const baseH = naturalSize.h * fitScale;

  // For canvas export: compute rendered bounds
  const drawW = baseW * view.us;
  const drawH = baseH * view.us;
  const imgLeft = CROP_SIZE / 2 + view.ox - drawW / 2;
  const imgTop  = CROP_SIZE / 2 + view.oy - drawH / 2;

  // Zoom around box-coordinate point (mx, my), with optional pan.
  // Uses view.ox/oy as offset from center, so zoom formula is simply:
  //   newOx = (mx - CROP_SIZE/2)*(1 - r) + ox*r + panDx
  function applyZoom(mx: number, my: number, r: number, panDx = 0, panDy = 0) {
    setView(prev => {
      const clampedUs = Math.max(0.2, Math.min(12, prev.us * r));
      const actualR = clampedUs / prev.us;
      return {
        ox: (mx - CROP_SIZE / 2) * (1 - actualR) + prev.ox * actualR + panDx,
        oy: (my - CROP_SIZE / 2) * (1 - actualR) + prev.oy * actualR + panDy,
        us: clampedUs,
      };
    });
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      lastTouchRef.current = { type: 'single', x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      lastTouchRef.current = {
        type: 'pinch',
        t0x: e.touches[0].clientX, t0y: e.touches[0].clientY,
        t1x: e.touches[1].clientX, t1y: e.touches[1].clientY,
        dist: Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY,
        ),
      };
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    const last = lastTouchRef.current;
    if (!last) return;

    if (e.touches.length === 1 && last.type === 'single') {
      const dx = e.touches[0].clientX - last.x;
      const dy = e.touches[0].clientY - last.y;
      setView(prev => ({ ...prev, ox: prev.ox + dx, oy: prev.oy + dy }));
      lastTouchRef.current = { type: 'single', x: e.touches[0].clientX, y: e.touches[0].clientY };

    } else if (e.touches.length === 2 && last.type === 'pinch') {
      const newDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
      const r = newDist / last.dist;

      // Midpoint in page coords
      const prevMidX = (last.t0x + last.t1x) / 2;
      const prevMidY = (last.t0y + last.t1y) / 2;
      const newMidX  = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const newMidY  = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      // Midpoint in box coords (zoom origin)
      const rect = cropBoxRef.current!.getBoundingClientRect();
      const mx = newMidX - rect.left;
      const my = newMidY - rect.top;

      applyZoom(mx, my, r, newMidX - prevMidX, newMidY - prevMidY);

      lastTouchRef.current = {
        type: 'pinch',
        t0x: e.touches[0].clientX, t0y: e.touches[0].clientY,
        t1x: e.touches[1].clientX, t1y: e.touches[1].clientY,
        dist: newDist,
      };
    }
  }

  function onWheel(e: React.WheelEvent) {
    const rect = cropBoxRef.current!.getBoundingClientRect();
    applyZoom(e.clientX - rect.left, e.clientY - rect.top, e.deltaY > 0 ? 0.9 : 1.1);
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || !naturalSize) return;

    // 화면상 totalScale: 원본 1px = 화면 totalScale px
    const totalScale = fitScale * view.us;

    // 뷰포트(0,0)~(CROP_SIZE,CROP_SIZE)에 대응하는 원본 이미지 좌표 역산
    const rawSrcX = -imgLeft / totalScale;
    const rawSrcY = -imgTop / totalScale;
    const rawSrcW = CROP_SIZE / totalScale;
    const rawSrcH = CROP_SIZE / totalScale;

    // 원본 이미지 경계로 clamp
    const srcX = Math.max(0, rawSrcX);
    const srcY = Math.max(0, rawSrcY);
    const srcW = Math.min(naturalSize.w, rawSrcX + rawSrcW) - srcX;
    const srcH = Math.min(naturalSize.h, rawSrcY + rawSrcH) - srcY;

    if (srcW <= 0 || srcH <= 0) return;

    // 원본 해상도 유지 (메모리 보호용 최대 4096px 제한)
    const MAX_SIZE = 4096;
    const outputScale = Math.min(1, MAX_SIZE / Math.max(srcW, srcH));
    const canvasW = Math.round(srcW * outputScale);
    const canvasH = Math.round(srcH * outputScale);

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;

    if (shape === 'circle') {
      const r = Math.min(canvasW, canvasH) / 2;
      ctx.beginPath();
      ctx.arc(canvasW / 2, canvasH / 2, r, 0, Math.PI * 2);
      ctx.clip();
    }

    // 원본 픽셀 좌표에서 직접 그림 → 해상도 손실 없음
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH);
    onConfirm(canvas.toDataURL('image/png'));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.78)' }}
    >
      {/* Shape selector */}
      <div className="flex gap-2">
        {([['rect', '원본'], ['square', '정사각형'], ['circle', '원형']] as [Shape, string][]).map(([s, label]) => (
          <button
            key={s}
            onClick={() => setShape(s as Shape)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: shape === s ? '#191970' : 'rgba(255,255,255,0.18)',
              color: '#fff',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Crop viewport */}
      <div
        ref={cropBoxRef}
        style={{
          width: CROP_SIZE,
          height: CROP_SIZE,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'grab',
          touchAction: 'none',
          backgroundColor: '#222',
          borderRadius: shape === 'circle' ? '50%' : 0,
        }}
        onMouseDown={(e) => { mouseDragRef.current = { x: e.clientX, y: e.clientY }; }}
        onMouseMove={(e) => {
          if (!mouseDragRef.current) return;
          setView(prev => ({
            ...prev,
            ox: prev.ox + e.clientX - mouseDragRef.current!.x,
            oy: prev.oy + e.clientY - mouseDragRef.current!.y,
          }));
          mouseDragRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseUp={() => { mouseDragRef.current = null; }}
        onMouseLeave={() => { mouseDragRef.current = null; }}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { lastTouchRef.current = null; }}
      >
        <img
          src={previewSrc}
          draggable={false}
          alt=""
          style={{
            position: 'absolute',
            width: baseW,
            height: baseH,
            left: CROP_SIZE / 2 - baseW / 2,
            top: CROP_SIZE / 2 - baseH / 2,
            transform: `translate(${view.ox}px, ${view.oy}px) scale(${view.us})`,
            transformOrigin: 'center',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>

      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
        드래그: 이동 &nbsp;·&nbsp; 핀치 / 휠: 확대축소
      </p>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="px-8 py-2.5 rounded-full text-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
        >
          취소
        </button>
        <button
          onClick={handleConfirm}
          className="px-8 py-2.5 rounded-full text-sm font-semibold"
          style={{ backgroundColor: '#191970', color: '#fff' }}
        >
          적용
        </button>
      </div>
    </div>
  );
}
