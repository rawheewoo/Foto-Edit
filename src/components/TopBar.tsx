import type { AspectRatio } from '../types';

interface Props {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (r: AspectRatio) => void;
  onFileChange: (file: File) => void;
  onFlip: () => void;
  onRotate: () => void;
}

const RATIOS: AspectRatio[] = ['4:5', '9:16', '16:9', '3:4', '4:3'];

export default function TopBar({ aspectRatio, onAspectRatioChange, onFileChange, onFlip, onRotate }: Props) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 min-h-[52px]"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* 사진 불러오기 */}
      <label className="w-10 h-10 rounded-full text-white text-xs font-medium flex items-center justify-center cursor-pointer shrink-0" style={{ backgroundColor: '#FF6347' }}>
        사진
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileChange(file);
          }}
        />
      </label>

      <div className="w-px h-6 bg-zinc-300" />

      {/* 비율 선택 */}
      <div className="flex gap-1">
        {RATIOS.map((ratio) => (
          <button
            key={ratio}
            onClick={() => onAspectRatioChange(ratio)}
            className={`w-10 h-10 rounded-full text-[11px] shrink-0 ${
              aspectRatio === ratio
                ? 'text-white'
                : 'bg-zinc-100 text-zinc-700'
            }`}
            style={aspectRatio === ratio ? { backgroundColor: '#191970' } : {}}
          >
            {ratio}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-zinc-300" />

      {/* 뒤집기 / 회전 */}
      <button
        onClick={onFlip}
        className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 text-base shrink-0"
        title="좌우 뒤집기"
      >
        ↔
      </button>
      <button
        onClick={onRotate}
        className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 text-base shrink-0"
        title="180도 회전"
      >
        ↻
      </button>
    </div>
  );
}
