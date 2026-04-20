import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Text, Ellipse, Path } from 'react-konva';
import type { AspectRatio, TextItem, StickerItem, ShapeItem, EditorItem } from '../types';
import { ASPECT_RATIO_VALUES } from '../types';

const HEART_PATH = 'M55 20 C55 10,40 5,28 12 C14 20,14 38,55 70 C96 38,96 20,82 12 C70 5,55 10,55 20 Z';
const HEART_W = 110;
const HEART_H = 70;
const HEART_OX = 55;
const HEART_OY = 40;
// 정삼각형 기준 Path (100×86.6)
const TRI_PATH = 'M50 0 L100 86.6 L0 86.6 Z';
const TRI_W = 100;
const TRI_H = 86.6;
const TRI_OX = 50;
const TRI_OY = 43.3;


interface Props {
  photoSrc: string | null;
  aspectRatio: AspectRatio;
  flipX: boolean;
  snapRotation: number;
  dialAngle: number;
  items: EditorItem[];
  selectedItemId: string | null;
  eyedropperMode: boolean;
  onItemSelect: (id: string | null) => void;
  onItemChange: (id: string, attrs: Partial<EditorItem>) => void;
  onItemDelete: (id: string) => void;
  onTextDblClick: (id: string) => void;
  onEyedropperSample: (color: string) => void;
}

export interface CanvasHandle {
  toDataURL: () => string | null;
}

const Canvas = forwardRef<CanvasHandle, Props>(function Canvas({
  photoSrc, aspectRatio, flipX, snapRotation, dialAngle,
  items, selectedItemId, eyedropperMode,
  onItemSelect, onItemChange, onItemDelete, onTextDblClick, onEyedropperSample,
}: Props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [photoSelected, setPhotoSelected] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [overTrash, setOverTrash] = useState(false);
  const [snapLabel, setSnapLabel] = useState<string | null>(null);
  const [photoNaturalSize, setPhotoNaturalSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => { setPhotoNaturalSize(null); }, [photoSrc]);

  useImperativeHandle(ref, () => ({
    toDataURL: () => {
      if (!stageRef.current) return null;
      // Transformer 핸들 숨기고 내보내기
      trRef.current?.nodes([]);
      trRef.current?.getLayer()?.batchDraw();
      // 원본 사진 해상도 기준 pixelRatio 계산 (최대 4096px 캡)
      let pixelRatio = 3;
      if (photoNaturalSize && stageW > 0 && stageH > 0) {
        const prByW = Math.ceil(photoNaturalSize.w / stageW);
        const prByH = Math.ceil(photoNaturalSize.h / stageH);
        const target = Math.max(prByW, prByH);
        const capW = Math.floor(4096 / stageW);
        const capH = Math.floor(4096 / stageH);
        pixelRatio = Math.min(target, capW, capH);
      }
      return stageRef.current.toDataURL({ pixelRatio, mimeType: 'image/png' });
    },
  }));
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showSnap(label: string) {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    setSnapLabel(label);
    snapTimerRef.current = setTimeout(() => setSnapLabel(null), 1400);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      setStageSize({ width: container.clientWidth, height: container.clientHeight });
    });
    observer.observe(container);
    setStageSize({ width: container.clientWidth, height: container.clientHeight });
    return () => observer.disconnect();
  }, []);

  useEffect(() => { setPhotoSelected(false); }, [photoSrc]);

  // ── 단일 Transformer — 선택된 노드에만 연결 ──────────────────────────────
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    const nodeId = photoSelected ? 'photo' : selectedItemId;
    if (!nodeId) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
      return;
    }
    const node = stageRef.current.findOne('#' + nodeId);
    trRef.current.nodes(node ? [node] : []);
    trRef.current.getLayer()?.batchDraw();
  }, [photoSelected, selectedItemId, items]);

  const ratio = ASPECT_RATIO_VALUES[aspectRatio];
  let stageW = stageSize.width;
  let stageH = stageSize.height;
  if (stageW / stageH > ratio) { stageW = stageH * ratio; } else { stageH = stageW / ratio; }
  stageW = Math.floor(stageW);
  stageH = Math.floor(stageH);

  const keepRatio = photoSelected;

  // Trash zone: bottom-center of stage, 80×80px
  const TRASH_W = 80;
  const TRASH_H = 80;
  const trashX = stageW / 2 - TRASH_W / 2;
  const trashY = stageH - TRASH_H - 8;

  function checkOverTrash(x: number, y: number) {
    return x > trashX && x < trashX + TRASH_W && y > trashY;
  }

  function handleDragStart(id: string) {
    setDraggingItemId(id);
    setOverTrash(false);
  }

  function handleDragMove(e: any) {
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) setOverTrash(checkOverTrash(pos.x, pos.y));
  }

  function handleDragEnd(id: string, x: number, y: number, onChange: (attrs: any) => void) {
    // overTrash는 마지막 dragMove 기준 — 재계산하지 않고 현재 상태 사용
    const shouldDelete = overTrash;
    setDraggingItemId(null);
    setOverTrash(false);
    if (shouldDelete) {
      onItemDelete(id);
    } else {
      onChange({ x, y });
    }
  }

  function handleStageClick(e: any) {
    if (eyedropperMode) {
      const pos = stageRef.current?.getPointerPosition();
      if (!pos) return;
      const canvas = stageRef.current.toCanvas({ pixelRatio: 1 });
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      const pixel = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
      const hex = '#' + [pixel[0], pixel[1], pixel[2]]
        .map((v) => v.toString(16).padStart(2, '0')).join('');
      onEyedropperSample(hex);
      return;
    }
    if (e.target === e.target.getStage() || e.target.name() === 'bg') {
      setPhotoSelected(false);
      onItemSelect(null);
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center touch-none overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', cursor: eyedropperMode ? 'crosshair' : 'default' }}
    >
      {stageW > 0 && stageH > 0 && (
        <div className="shadow-lg relative">
          <Stage
            ref={stageRef}
            width={stageW}
            height={stageH}
            style={{ background: '#f4f4f4', display: 'block' }}
            onClick={handleStageClick}
            onTap={handleStageClick}
          >
            <Layer>
              <Rect name="bg" x={0} y={0} width={stageW} height={stageH} fill="#ffffff" />

              {photoSrc && (
                <PhotoImage
                  src={photoSrc}
                  stageW={stageW}
                  stageH={stageH}
                  flipX={flipX}
                  snapRotation={snapRotation}
                  dialAngle={dialAngle}
                  onSelect={() => { setPhotoSelected(true); onItemSelect(null); }}
                  onLoad={(w, h) => setPhotoNaturalSize({ w, h })}
                />
              )}

              {items.map((item) => {
                const centered = item.x === 0 && item.y === 0
                  ? { ...item, x: stageW / 2, y: stageH / 2 }
                  : item;
                const onSelect = () => { setPhotoSelected(false); onItemSelect(item.id); };
                const onChange = (attrs: Partial<EditorItem>) => onItemChange(item.id, attrs);

                if (centered.kind === 'text') return (
                  <TextNode key={item.id} item={centered as TextItem}
                    onSelect={onSelect} onDblClick={() => onTextDblClick(item.id)} onChange={onChange}
                    onDragStart={() => handleDragStart(item.id)}
                    onDragMove={handleDragMove}
                    onDragEnd={(x, y) => handleDragEnd(item.id, x, y, onChange)} />
                );
                if (centered.kind === 'sticker') return (
                  <StickerNode key={item.id} item={centered as StickerItem}
                    onSelect={onSelect} onChange={onChange}
                    onDragStart={() => handleDragStart(item.id)}
                    onDragMove={handleDragMove}
                    onDragEnd={(x, y) => handleDragEnd(item.id, x, y, onChange)}
                    onSnap={showSnap} />
                );
                if (centered.kind === 'shape') return (
                  <ShapeNode key={item.id} item={centered as ShapeItem}
                    onSelect={onSelect} onChange={onChange}
                    onDragStart={() => handleDragStart(item.id)}
                    onDragMove={handleDragMove}
                    onDragEnd={(x, y) => handleDragEnd(item.id, x, y, onChange)}
                    onSnap={showSnap} />
                );
                return null;
              })}

              {/* 전체 공유 Transformer — 항상 하나만 존재 */}
              <Transformer
                ref={trRef}
                rotateEnabled
                keepRatio={keepRatio}
                boundBoxFunc={(o, n) => (n.width < 10 || n.height < 10 ? o : n)}
              />
            </Layer>
          </Stage>

          {!photoSrc && items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm pointer-events-none">
              사진을 불러오세요
            </div>
          )}

          {/* 정형 스냅 배지 */}
          {snapLabel && (
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: 'rgba(25,25,112,0.75)', whiteSpace: 'nowrap' }}
            >
              {snapLabel}
            </div>
          )}

          {/* 휴지통 — 드래그 중에만 표시 */}
          {draggingItemId && (
            <div
              className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full pointer-events-none transition-all duration-150"
              style={{
                bottom: 8,
                width: 64,
                height: 64,
                backgroundColor: overTrash ? '#ef4444' : 'rgba(30,30,30,0.45)',
                transform: `translateX(-50%) scale(${overTrash ? 1.2 : 1})`,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default Canvas;

// ─── PhotoImage ────────────────────────────────────────────────────────────────

function PhotoImage({ src, stageW, stageH, flipX, snapRotation, dialAngle, onSelect, onLoad }: {
  src: string; stageW: number; stageH: number;
  flipX: boolean; snapRotation: number; dialAngle: number;
  onSelect: () => void;
  onLoad?: (w: number, h: number) => void;
}) {
  const imageRef = useRef<any>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const prevFlipX = useRef(false);
  const prevSnapRotation = useRef(0);
  const prevDialAngle = useRef(0);

  useEffect(() => {
    const image = new window.Image();
    image.src = src;
    image.onload = () => { setImg(image); onLoad?.(image.naturalWidth, image.naturalHeight); };
  }, [src]);

  useEffect(() => {
    if (!img || !imageRef.current) return;
    const node = imageRef.current;
    const scale = Math.max(stageW / img.width, stageH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    node.setAttrs({ x: stageW / 2, y: stageH / 2, width: w, height: h, offsetX: w / 2, offsetY: h / 2, scaleX: 1, scaleY: 1, rotation: 0 });
    prevFlipX.current = false;
    prevSnapRotation.current = 0;
    prevDialAngle.current = 0;
    node.getLayer()?.batchDraw();
  }, [img]);

  useEffect(() => {
    if (!imageRef.current || !img || prevFlipX.current === flipX) return;
    prevFlipX.current = flipX;
    imageRef.current.scaleX(imageRef.current.scaleX() * -1);
    imageRef.current.getLayer()?.batchDraw();
  }, [flipX, img]);

  useEffect(() => {
    if (!imageRef.current || !img || prevSnapRotation.current === snapRotation) return;
    const diff = snapRotation - prevSnapRotation.current;
    const delta = ((diff + 540) % 360) - 180;
    prevSnapRotation.current = snapRotation;
    imageRef.current.rotation(imageRef.current.rotation() + delta);
    imageRef.current.getLayer()?.batchDraw();
  }, [snapRotation, img]);

  useEffect(() => {
    if (!imageRef.current || !img) return;
    const delta = dialAngle - prevDialAngle.current;
    if (delta === 0) return;
    prevDialAngle.current = dialAngle;
    imageRef.current.rotation(imageRef.current.rotation() + delta);
    imageRef.current.getLayer()?.batchDraw();
  }, [dialAngle, img]);

  if (!img) return null;
  return <KonvaImage id="photo" ref={imageRef} image={img} draggable onClick={onSelect} onTap={onSelect} />;
}

// ─── TextNode ─────────────────────────────────────────────────────────────────

function TextNode({ item, onSelect, onDblClick, onChange, onDragStart, onDragMove, onDragEnd }: {
  item: TextItem;
  onSelect: () => void; onDblClick: () => void;
  onChange: (attrs: Partial<TextItem>) => void;
  onDragStart?: () => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (x: number, y: number) => void;
}) {
  const textRef = useRef<any>(null);

  useEffect(() => {
    document.fonts.ready.then(() => textRef.current?.getLayer()?.batchDraw());
  }, [item.fontFamily]);

  return (
    <Text
      ref={textRef}
      id={item.id}
      text={item.text}
      x={item.x} y={item.y}
      rotation={item.rotation}
      scaleX={item.scaleX} scaleY={item.scaleY}
      fontSize={item.fontSize}
      fontFamily={item.fontFamily}
      fill={item.fill}
      draggable
      onClick={onSelect} onTap={onSelect}
      onDblClick={onDblClick} onDblTap={onDblClick}
      onDragStart={() => onDragStart?.()}
      onDragMove={(e) => onDragMove?.(e)}
      onDragEnd={(e) => onDragEnd?.(e.target.x(), e.target.y())}
      onTransformEnd={() => {
        const n = textRef.current;
        if (!n) return;
        onChange({ x: n.x(), y: n.y(), rotation: n.rotation(), scaleX: n.scaleX(), scaleY: n.scaleY() });
      }}
    />
  );
}

// ─── StickerNode ──────────────────────────────────────────────────────────────

function StickerNode({ item, onSelect, onChange, onDragStart, onDragMove, onDragEnd, onSnap }: {
  item: StickerItem;
  onSelect: () => void;
  onChange: (attrs: Partial<StickerItem>) => void;
  onDragStart?: () => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (x: number, y: number) => void;
  onSnap?: (label: string) => void;
}) {
  const ref = useRef<any>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new window.Image();
    image.src = item.src;
    image.onload = () => setImg(image);
  }, [item.src]);

  if (!img) return null;
  return (
    <KonvaImage
      ref={ref}
      id={item.id}
      image={img}
      x={item.x} y={item.y}
      width={item.width} height={item.height}
      offsetX={item.width / 2} offsetY={item.height / 2}
      rotation={item.rotation}
      scaleX={item.scaleX} scaleY={item.scaleY}
      draggable
      onClick={onSelect} onTap={onSelect}
      onDragStart={() => onDragStart?.()}
      onDragMove={(e) => onDragMove?.(e)}
      onDragEnd={(e) => onDragEnd?.(e.target.x(), e.target.y())}
      onTransformEnd={() => {
        const n = ref.current;
        if (!n) return;
        let newW = item.width * Math.abs(n.scaleX());
        let newH = item.height * Math.abs(n.scaleY());
        if (Math.abs(newW - newH) / Math.max(newW, newH) < 0.05) {
          const s = (newW + newH) / 2; newW = s; newH = s;
          n.scaleX(1); n.scaleY(1);
          onChange({ x: n.x(), y: n.y(), rotation: n.rotation(), scaleX: 1, scaleY: 1, width: newW, height: newH });
          onSnap?.('정사각형 ■');
        } else {
          onChange({ x: n.x(), y: n.y(), rotation: n.rotation(), scaleX: n.scaleX(), scaleY: n.scaleY() });
        }
      }}
    />
  );
}

// ─── ShapeNode ────────────────────────────────────────────────────────────────

function ShapeNode({ item, onSelect, onChange, onDragStart, onDragMove, onDragEnd, onSnap }: {
  item: ShapeItem;
  onSelect: () => void;
  onChange: (attrs: Partial<ShapeItem>) => void;
  onDragStart?: () => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (x: number, y: number) => void;
  onSnap?: (label: string) => void;
}) {
  const shapeRef = useRef<any>(null);

  function handleTransformEnd() {
    const node = shapeRef.current;
    if (!node) return;
    const sx = Math.abs(node.scaleX());
    const sy = Math.abs(node.scaleY());
    node.scaleX(1);
    node.scaleY(1);
    let newW = item.width * sx;
    let newH = item.height * sy;
    const SNAP = 0.05;
    if (item.shape === 'circle' || item.shape === 'rect') {
      if (Math.abs(newW - newH) / Math.max(newW, newH) < SNAP) {
        const s = (newW + newH) / 2; newW = s; newH = s;
        onSnap?.(item.shape === 'circle' ? '정원 ●' : '정사각형 ■');
      }
    } else if (item.shape === 'triangle') {
      const equilH = newW * (TRI_H / TRI_W);
      if (Math.abs(newH - equilH) / Math.max(newW, newH) < SNAP) {
        newH = equilH;
        onSnap?.('정삼각형 ▲');
      }
    }
    onChange({ x: node.x(), y: node.y(), rotation: node.rotation(), scaleX: 1, scaleY: 1, width: newW, height: newH });
    node.getLayer()?.batchDraw();
  }

  const common = {
    id: item.id, x: item.x, y: item.y,
    rotation: item.rotation, scaleX: item.scaleX, scaleY: item.scaleY,
    fill: item.fill, draggable: true,
    onClick: onSelect, onTap: onSelect,
    onDragStart: () => onDragStart?.(),
    onDragMove: (e: any) => onDragMove?.(e),
    onDragEnd: (e: any) => onDragEnd?.(e.target.x(), e.target.y()),
    onTransformEnd: handleTransformEnd,
  };

  if (item.shape === 'circle')
    return <Ellipse ref={shapeRef} {...common}
      radiusX={item.width / 2} radiusY={item.height / 2} />;

  if (item.shape === 'rect')
    return <Rect ref={shapeRef} {...common} width={item.width} height={item.height}
      offsetX={item.width / 2} offsetY={item.height / 2} />;

  if (item.shape === 'triangle')
    return <Path ref={shapeRef} {...common}
      data={TRI_PATH}
      scaleX={(item.width / TRI_W) * item.scaleX}
      scaleY={(item.height / TRI_H) * item.scaleY}
      offsetX={TRI_OX} offsetY={TRI_OY} />;

  if (item.shape === 'heart')
    return <Path ref={shapeRef} {...common}
      data={HEART_PATH}
      scaleX={(item.width / HEART_W) * item.scaleX}
      scaleY={(item.height / HEART_H) * item.scaleY}
      offsetX={HEART_OX} offsetY={HEART_OY} />;

  return null;
}
