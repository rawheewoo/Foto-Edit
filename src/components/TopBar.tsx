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
      <label className="px-3 py-2 text-white text-sm rounded-lg min-h-[44px] min-w-[44px] flex items-center cursor-pointer" style={{ backgroundColor: '#FF6347' }}>
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
            className={`px-2 py-2 text-xs rounded min-h-[44px] min-w-[44px] ${
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
        className="px-2 py-2 bg-zinc-100 text-zinc-700 text-lg rounded min-h-[44px] min-w-[44px]"
        title="좌우 뒤집기"
      >
        ↔
      </button>
      <button
        onClick={onRotate}
        className="px-2 py-2 bg-zinc-100 text-zinc-700 text-lg rounded min-h-[44px] min-w-[44px]"
        title="180도 회전"
      >
        ↻
      </button>
    </div>
  );
}
