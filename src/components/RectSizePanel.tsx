interface Props {
  width: number;
  height: number;
  onChange: (w: number, h: number) => void;
}

export default function RectSizePanel({ width, height, onChange }: Props) {
  return (
    <div
      className="flex items-center justify-center gap-4 px-4 py-2 border-t border-zinc-100"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      <span className="text-xs text-zinc-400">직사각형 크기</span>
      <label className="flex items-center gap-1">
        <span className="text-xs text-zinc-500">W</span>
        <input
          type="number"
          min={10}
          max={2000}
          value={Math.round(width)}
          onChange={(e) => onChange(Number(e.target.value), height)}
          className="w-16 text-center text-sm border border-zinc-200 rounded-lg py-1 focus:outline-none focus:border-zinc-400"
        />
      </label>
      <label className="flex items-center gap-1">
        <span className="text-xs text-zinc-500">H</span>
        <input
          type="number"
          min={10}
          max={2000}
          value={Math.round(height)}
          onChange={(e) => onChange(width, Number(e.target.value))}
          className="w-16 text-center text-sm border border-zinc-200 rounded-lg py-1 focus:outline-none focus:border-zinc-400"
        />
      </label>
    </div>
  );
}
