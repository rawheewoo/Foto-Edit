interface Props {
  onTextClick: () => void;
  onStickerClick: () => void;
  onShapeClick: () => void;
  onPasteClick: () => void;
  onSaveClick: () => void;
}

export default function BottomBar({ onTextClick, onStickerClick, onShapeClick, onPasteClick, onSaveClick }: Props) {
  return (
    <div
      className="flex items-center justify-around px-2 py-3 border-t border-zinc-200 min-h-[64px]"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <button
        onClick={onShapeClick}
        className="flex flex-col items-center gap-1 text-zinc-400 text-xs min-w-[44px] min-h-[44px] justify-center"
      >
        <span className="text-xl">◻</span>
        도형
      </button>
      <button
        onClick={onTextClick}
        className="flex flex-col items-center gap-1 text-xs min-w-[44px] min-h-[44px] justify-center"
        style={{ color: '#191970' }}
      >
        <span className="text-xl font-bold">T</span>
        텍스트
      </button>
      <button
        onClick={onStickerClick}
        className="flex flex-col items-center gap-1 text-zinc-400 text-xs min-w-[44px] min-h-[44px] justify-center"
      >
        <span className="text-xl">☺</span>
        스티커
      </button>
      <button
        onClick={onPasteClick}
        className="flex flex-col items-center gap-1 text-zinc-400 text-xs min-w-[44px] min-h-[44px] justify-center"
      >
        {/* Clipboard icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        </svg>
        붙여넣기
      </button>
      <button
        onClick={onSaveClick}
        className="flex flex-col items-center gap-1 text-zinc-400 text-xs min-w-[44px] min-h-[44px] justify-center"
      >
        <span className="text-xl">↓</span>
        저장
      </button>
    </div>
  );
}
