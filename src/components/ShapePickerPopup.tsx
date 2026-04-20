import type { ShapeItem } from '../types';

type ShapeKind = ShapeItem['shape'];

interface Props {
  onSelect: (shape: ShapeKind) => void;
  onClose: () => void;
}

const SHAPES: { kind: ShapeKind; label: string; preview: React.ReactNode }[] = [
  {
    kind: 'circle',
    label: '원',
    preview: (
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#191970" />
      </svg>
    ),
  },
  {
    kind: 'rect',
    label: '직사각형',
    preview: (
      <svg width="40" height="40" viewBox="0 0 40 40">
        <rect x="3" y="10" width="34" height="20" rx="2" fill="#191970" />
      </svg>
    ),
  },
  {
    kind: 'triangle',
    label: '정삼각형',
    preview: (
      <svg width="40" height="40" viewBox="0 0 40 40">
        <polygon points="20,4 38,36 2,36" fill="#191970" />
      </svg>
    ),
  },
  {
    kind: 'heart',
    label: '하트',
    preview: (
      <svg width="40" height="40" viewBox="0 0 40 40">
        <path
          d="M20 34 C8 26, 4 18, 4 13 C4 7, 9 4, 14 6 C17 7, 19 10, 20 12 C21 10, 23 7, 26 6 C31 4, 36 7, 36 13 C36 18, 32 26, 20 34 Z"
          fill="#191970"
        />
      </svg>
    ),
  },
];

export default function ShapePickerPopup({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-lg rounded-t-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-800">도형 선택</span>
          <button onClick={onClose} className="text-zinc-400 text-2xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {SHAPES.map(({ kind, label, preview }) => (
            <button
              key={kind}
              onClick={() => { onSelect(kind); onClose(); }}
              className="flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-zinc-100 active:bg-zinc-50"
            >
              {preview}
              <span className="text-xs text-zinc-600">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
