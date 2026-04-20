import { useRef } from 'react';

interface Props {
  value: number; // -90 ~ 90
  onChange: (v: number) => void;
}

const TICK_PX = 18; // pixels per 5 degrees
const MIN = -90;
const MAX = 90;

export default function DialControl({ value, onChange }: Props) {
  const startX = useRef<number | null>(null);
  const startValue = useRef(0);

  function handlePointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    startValue.current = value;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    const raw = startValue.current + dx * 0.4;
    onChange(Math.round(Math.max(MIN, Math.min(MAX, raw)) * 10) / 10);
  }

  function handlePointerUp() {
    startX.current = null;
  }

  // 눈금: -90 ~ +90, 5도 간격 (총 37개)
  const ticks: number[] = [];
  for (let d = MIN; d <= MAX; d += 5) ticks.push(d);

  // 중앙 마커에 현재 값이 오도록 ruler를 translateX
  // value=0 → ruler 중앙(index 18)이 화면 중앙
  // translateX = 50% - (index * TICK_PX)
  const index = (value - MIN) / 5; // 소수점 가능
  const translateX = `calc(50% - ${index * TICK_PX}px)`;

  return (
    <div
      className="flex flex-col items-center py-2 border-t border-zinc-200 select-none"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* 현재 각도 */}
      <div className="text-xs text-zinc-500 mb-1 font-mono">
        {value > 0 ? '+' : ''}{value.toFixed(1)}°
      </div>

      {/* 눈금자 */}
      <div
        className="relative w-full overflow-hidden cursor-ew-resize"
        style={{ height: 36 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* 중앙 포인터 */}
        <div
          className="absolute top-0 left-1/2 -translate-x-px w-0.5 h-full z-10"
          style={{ backgroundColor: '#191970' }}
        />

        {/* 눈금들 */}
        <div
          className="absolute top-0 flex items-end"
          style={{
            transform: `translateX(${translateX})`,
            height: 36,
            width: ticks.length * TICK_PX,
            left: 0,
          }}
        >
          {ticks.map((deg) => {
            const isMajor = deg % 10 === 0;
            return (
              <div
                key={deg}
                className="flex flex-col items-center justify-end"
                style={{ width: TICK_PX, minWidth: TICK_PX, height: 36 }}
              >
                {isMajor && (
                  <span className="text-zinc-400 leading-none" style={{ fontSize: 8, marginBottom: 2 }}>
                    {deg}
                  </span>
                )}
                <div
                  className="bg-zinc-400"
                  style={{ width: 1, height: isMajor ? 14 : 7 }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
