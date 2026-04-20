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
  colors: string[];                    // dominant colors
  selectedTextColor?: string | null;   // 선택된 아이템 색 (text or shape)
  eyedropperMode?: boolean;
  onColorSelect?: (color: string) => void;
  onEyedropperToggle?: () => void;
}

export default function ColorStrip({
  colors, selectedTextColor, eyedropperMode,
  onColorSelect, onEyedropperToggle,
}: Props) {
  const customRef = useRef<HTMLInputElement>(null);
  const isItemSelected = selectedTextColor != null;

  const dominantColors = colors.length > 0
    ? colors
    : ['#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040'];

  return (
    <div className="border-t border-zinc-200 relative z-50" style={{ backgroundColor: '#FFFFFF' }}>
      {/* 아이템 선택 시 — 헤더 */}
      {isItemSelected && (
        <div className="flex items-center justify-between px-4 pt-2">
          <span className="text-xs text-zinc-400">
            {eyedropperMode ? '사진을 탭해서 색상 추출' : '색상 선택'}
          </span>
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full border-2 border-zinc-300 flex-shrink-0"
              style={{ backgroundColor: selectedTextColor ?? '#000' }}
            />
            <button
              onClick={onEyedropperToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors"
              style={{
                backgroundColor: eyedropperMode ? '#191970' : '#f4f4f5',
                color: eyedropperMode ? '#ffffff' : '#52525b',
              }}
              title="스포이드"
            >✦</button>
          </div>
        </div>
      )}

      {/* 색상 행 */}
      <div className="flex items-center min-h-[52px]">
        {isItemSelected ? (
          /* 선택 상태: 가로 스크롤 전체 팔레트 */
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto w-full"
            style={{ scrollbarWidth: 'none' }}>
            {/* dominant colors */}
            {dominantColors.map((color, i) => (
              <ColorDot key={`d${i}`} color={color} current={selectedTextColor} onClick={() => onColorSelect?.(color)} size={34} />
            ))}
            {/* 구분선 */}
            <div className="w-px h-6 bg-zinc-200 flex-shrink-0" />
            {/* basic palette */}
            {BASIC_PALETTE.map((color) => (
              <ColorDot key={color} color={color} current={selectedTextColor} onClick={() => onColorSelect?.(color)} size={30} />
            ))}
            {/* 구분선 */}
            <div className="w-px h-6 bg-zinc-200 flex-shrink-0" />
            {/* 커스텀 색 */}
            <button
              onClick={() => customRef.current?.click()}
              className="flex-shrink-0 rounded-full border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 text-xs"
              style={{ width: 30, height: 30 }}
              title="커스텀 색상"
            >＋</button>
            <input
              ref={customRef}
              type="color"
              value={selectedTextColor ?? '#000000'}
              className="w-0 h-0 opacity-0 absolute"
              onChange={(e) => onColorSelect?.(e.target.value)}
            />
          </div>
        ) : (
          /* 비선택 상태: dominant 5색만 */
          <div className="flex items-center justify-center gap-3 px-4 py-3 w-full">
            {dominantColors.map((color, i) => (
              <ColorDot key={i} color={color} current={null} onClick={() => onColorSelect?.(color)} size={36} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ColorDot({ color, current, onClick, size }: {
  color: string; current: string | null; onClick: () => void; size: number;
}) {
  const isSelected = color.toLowerCase() === current?.toLowerCase();
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 rounded-full active:scale-90 transition-transform"
      style={{
        width: size, height: size,
        backgroundColor: color,
        border: isSelected ? '3px solid #191970' : '2px solid #e4e4e7',
        outline: isSelected ? '2px solid #191970' : undefined,
        outlineOffset: isSelected ? 1 : undefined,
        boxShadow: color === '#FFFFFF' ? 'inset 0 0 0 1px #e4e4e7' : undefined,
      }}
    />
  );
}
