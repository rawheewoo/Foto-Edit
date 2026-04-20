import { useRef } from 'react';

const BASIC_PALETTE = [
  '#B22222', '#800000', '#8B0000', '#CD5C5C', '#F08080',
  '#FFA500', '#FF8C00', '#FFDAB9', '#FFE4C4',
  '#6B8E23', '#006400', '#228B22', '#2E8B57', '#3CB371', '#90EE90',
  '#008080', '#008B8B', '#20B2AA', '#66CDAA',
  '#4682B4', '#87CEFA', '#00CED1', '#1E90FF', '#6495ED', '#0000CD', '#000080',
  '#7B68EE', '#9400D3', '#4B0082', '#DB7093',
  '#DCDCDC', '#C0C0C0', '#778899', '#696969', '#000000', '#FFFFFF',
];

interface Props {
  dominantColors: string[];
  currentColor: string;
  position: { x: number; y: number } | null;
  onChange: (color: string) => void;
}

export default function ColorPicker({ dominantColors, currentColor, position, onChange }: Props) {
  const customInputRef = useRef<HTMLInputElement>(null);

  if (!position) return null;

  // 화면 밖으로 나가지 않게 clamp
  const pickerW = 220;
  const pickerH = 160;
  const margin = 8;
  const left = Math.min(Math.max(position.x - pickerW / 2, margin), window.innerWidth - pickerW - margin);
  const top = position.y - pickerH - 8 < margin
    ? position.y + 8   // 아래
    : position.y - pickerH - 8; // 위

  return (
    <>
      <div
        className="fixed z-50 rounded-2xl shadow-xl p-3 flex flex-col gap-2"
        style={{ left, top, width: pickerW, backgroundColor: '#FFFFFF', border: '1px solid #e4e4e7' }}
      >
        {/* 추출된 5색 */}
        {dominantColors.length > 0 && (
          <div className="flex gap-1.5 justify-center">
            {dominantColors.map((c, i) => (
              <ColorDot key={i} color={c} selected={c === currentColor} onClick={() => onChange(c)} />
            ))}
          </div>
        )}

        {/* 기본 팔레트 */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {BASIC_PALETTE.map((c) => (
            <ColorDot key={c} color={c} selected={c === currentColor} onClick={() => onChange(c)} />
          ))}
        </div>

        {/* 커스텀 색 */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
          <span className="text-xs text-zinc-400">커스텀</span>
          <div
            className="w-8 h-8 rounded-full border-2 border-zinc-200 cursor-pointer flex-shrink-0"
            style={{ backgroundColor: currentColor }}
            onClick={() => customInputRef.current?.click()}
          />
          <input
            ref={customInputRef}
            type="color"
            value={currentColor}
            className="opacity-0 w-0 h-0 absolute"
            onChange={(e) => onChange(e.target.value)}
          />
          <span className="text-xs text-zinc-400 font-mono">{currentColor}</span>
        </div>
      </div>
    </>
  );

}

function ColorDot({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full flex-shrink-0"
      style={{
        width: 28, height: 28,
        backgroundColor: color,
        border: selected ? '2px solid #191970' : '2px solid #e4e4e7',
        boxShadow: color === '#FFFFFF' ? 'inset 0 0 0 1px #e4e4e7' : undefined,
        outline: selected ? '2px solid #191970' : undefined,
        outlineOffset: selected ? 1 : undefined,
      }}
    />
  );
}
