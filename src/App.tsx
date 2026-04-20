import { useRef, useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Canvas, { type CanvasHandle } from './components/Canvas';
import ColorStrip from './components/ColorStrip';
import BottomBar from './components/BottomBar';
import DialControl from './components/DialControl';
import TextInputModal from './components/TextInputModal';
import StickerCropModal from './components/StickerCropModal';
import ShapePickerPopup from './components/ShapePickerPopup';
import RectSizePanel from './components/RectSizePanel';
import { useDominantColors } from './hooks/useDominantColors';
import type { AspectRatio, TextItem, StickerItem, ShapeItem, EditorItem } from './types';

let nextId = 1;

function App() {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');
  const [flipX, setFlipX] = useState(false);
  const [snapRotation, setSnapRotation] = useState(0);
  const [dialAngle, setDialAngle] = useState(0);

  const [items, setItems] = useState<EditorItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [textModalOpen, setTextModalOpen] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [eyedropperMode, setEyedropperMode] = useState(false);

  const [stickerPreviewSrc, setStickerPreviewSrc] = useState<string | null>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const [shapePopupOpen, setShapePopupOpen] = useState(false);
  const [pasteMsg, setPasteMsg] = useState<string | null>(null);
  const pasteMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dominantColors = useDominantColors(photoSrc);

  // ── 사진 ──────────────────────────────────────────
  function handleFileChange(file: File) {
    setPhotoSrc(URL.createObjectURL(file));
    setFlipX(false);
    setSnapRotation(0);
    setDialAngle(0);
  }

  // ── 텍스트 ────────────────────────────────────────
  function openNewTextModal() { setEditingTextId(null); setTextModalOpen(true); }
  function openEditTextModal(id: string) { setEditingTextId(id); setTextModalOpen(true); }

  function handleTextConfirm(text: string, fontFamily: string) {
    setTextModalOpen(false);
    if (editingTextId) {
      setItems((prev) => prev.map((item) =>
        item.id === editingTextId ? { ...item, text, fontFamily } : item
      ));
    } else {
      const id = String(nextId++);
      const newItem: TextItem = {
        id, kind: 'text',
        x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1,
        text, fontFamily, fontSize: 36, fill: '#000000',
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(id);
    }
  }

  // ── 도형 ──────────────────────────────────────────
  function handleShapeSelect(shape: ShapeItem['shape']) {
    const id = String(nextId++);
    const defaults: Record<ShapeItem['shape'], { w: number; h: number }> = {
      circle:   { w: 100, h: 100 },
      rect:     { w: 140, h: 90 },
      triangle: { w: 100, h: 87 },
      heart:    { w: 110, h: 70 },
    };
    const { w, h } = defaults[shape];
    const newItem: ShapeItem = {
      id, kind: 'shape', shape,
      x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1,
      fill: '#191970', width: w, height: h,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedItemId(id);
  }

  // ── 스티커 ────────────────────────────────────────
  function handleStickerFileSelect(file: File) {
    setStickerPreviewSrc(URL.createObjectURL(file));
  }

  function handleStickerCropConfirm(dataUrl: string) {
    setStickerPreviewSrc(null);
    addStickerFromSrc(dataUrl);
  }

  // ── 스티커 공통 추가 ──────────────────────────────
  function addStickerFromSrc(src: string) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const maxSize = 160;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const id = String(nextId++);
      const newItem: StickerItem = {
        id, kind: 'sticker',
        x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1,
        src,
        width: img.width * scale,
        height: img.height * scale,
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedItemId(id);
    };
  }

  // ── 클립보드 붙여넣기 ─────────────────────────────
  function showPasteMsg(msg: string) {
    if (pasteMsgTimerRef.current) clearTimeout(pasteMsgTimerRef.current);
    setPasteMsg(msg);
    pasteMsgTimerRef.current = setTimeout(() => setPasteMsg(null), 3000);
  }

  async function handlePaste() {
    if (!navigator.clipboard?.read) {
      showPasteMsg('이 브라우저는 클립보드 붙여넣기를 지원하지 않습니다');
      return;
    }
    try {
      const clipItems = await navigator.clipboard.read();
      let found = false;
      for (const clipItem of clipItems) {
        const imageType = clipItem.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await clipItem.getType(imageType);
          const url = URL.createObjectURL(blob);
          addStickerFromSrc(url);
          found = true;
          break;
        }
      }
      if (!found) showPasteMsg('클립보드에 이미지가 없습니다');
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        showPasteMsg('클립보드 접근 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.');
      } else {
        showPasteMsg('붙여넣기에 실패했습니다');
      }
    }
  }

  // Cmd+V / Ctrl+V 단축키
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        handlePaste();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── 아이템 변경 / 삭제 ────────────────────────────
  function handleItemChange(id: string, attrs: Partial<EditorItem>) {
    setItems((prev) => prev.map((item) => item.id === id ? ({ ...item, ...attrs } as EditorItem) : item));
  }

  function handleItemDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  }

  // ── 저장 ──────────────────────────────────────────
  async function handleSave() {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) return;
    const filename = `foto-edit-${Date.now()}.png`;

    // 모바일: Web Share API (이미지 파일 공유)
    if (typeof navigator.share === 'function') {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'foto edit' });
          return;
        }
      } catch {
        // fall through
      }
    }

    // 데스크톱: 파일 다운로드
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  function handleColorChange(id: string, color: string) {
    setItems((prev) => prev.map((item) =>
      item.id === id && (item.kind === 'text' || item.kind === 'shape')
        ? { ...item, fill: color } : item
    ));
  }

  function handleColorStripSelect(color: string) {
    if (selectedItemId) handleColorChange(selectedItemId, color);
  }

  function handleEyedropperSample(color: string) {
    if (selectedItemId) handleColorChange(selectedItemId, color);
    setEyedropperMode(false);
  }

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const selectedTextColor =
    selectedItem?.kind === 'text' || selectedItem?.kind === 'shape'
      ? (selectedItem as TextItem | ShapeItem).fill
      : null;
  const selectedRect =
    selectedItem?.kind === 'shape' && selectedItem.shape === 'rect'
      ? selectedItem : null;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      <TopBar
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        onFileChange={handleFileChange}
        onFlip={() => setFlipX((v) => !v)}
        onRotate={() => setSnapRotation((v) => (v + 90) % 360)}
      />
      <Canvas
        ref={canvasRef}
        photoSrc={photoSrc}
        aspectRatio={aspectRatio}
        flipX={flipX}
        snapRotation={snapRotation}
        dialAngle={dialAngle}
        items={items}
        selectedItemId={selectedItemId}
        eyedropperMode={eyedropperMode}
        onItemSelect={setSelectedItemId}
        onItemChange={handleItemChange}
        onItemDelete={handleItemDelete}
        onTextDblClick={openEditTextModal}
        onEyedropperSample={handleEyedropperSample}
      />
      <DialControl value={dialAngle} onChange={setDialAngle} />
      <ColorStrip
        colors={dominantColors}
        selectedTextColor={selectedTextColor}
        eyedropperMode={eyedropperMode}
        onColorSelect={handleColorStripSelect}
        onEyedropperToggle={() => setEyedropperMode((v) => !v)}
      />
      {selectedRect && (
        <RectSizePanel
          width={selectedRect.width}
          height={selectedRect.height}
          onChange={(w, h) => handleItemChange(selectedRect.id, { width: w, height: h } as Partial<ShapeItem>)}
        />
      )}
      <BottomBar
        onTextClick={openNewTextModal}
        onStickerClick={() => stickerInputRef.current?.click()}
        onShapeClick={() => setShapePopupOpen(true)}
        onPasteClick={handlePaste}
        onSaveClick={handleSave}
      />

      {/* 붙여넣기 안내 토스트 */}
      {pasteMsg && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm text-white text-center pointer-events-none z-50"
          style={{ backgroundColor: 'rgba(25,25,112,0.88)', maxWidth: '80vw' }}
        >
          {pasteMsg}
        </div>
      )}

      {/* 숨긴 스티커 파일 입력 */}
      <input
        ref={stickerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleStickerFileSelect(file);
          e.target.value = '';
        }}
      />

      {textModalOpen && (
        <TextInputModal
          initialText={editingTextId ? (items.find((i) => i.id === editingTextId) as TextItem)?.text : ''}
          initialFont={editingTextId ? (items.find((i) => i.id === editingTextId) as TextItem)?.fontFamily : 'Inter'}
          onConfirm={handleTextConfirm}
          onCancel={() => setTextModalOpen(false)}
        />
      )}

      {shapePopupOpen && (
        <ShapePickerPopup
          onSelect={handleShapeSelect}
          onClose={() => setShapePopupOpen(false)}
        />
      )}

      {stickerPreviewSrc && (
        <StickerCropModal
          previewSrc={stickerPreviewSrc}
          onConfirm={handleStickerCropConfirm}
          onCancel={() => setStickerPreviewSrc(null)}
        />
      )}
    </div>
  );
}

export default App;
