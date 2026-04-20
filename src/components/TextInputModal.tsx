import { useState } from 'react';
import { FONTS } from '../fonts';

interface Props {
  initialText?: string;
  initialFont?: string;
  onConfirm: (text: string, fontFamily: string) => void;
  onCancel: () => void;
}

export default function TextInputModal({ initialText = '', initialFont = 'Inter', onConfirm, onCancel }: Props) {
  const [text, setText] = useState(initialText);
  const [selectedFont, setSelectedFont] = useState(initialFont);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-t-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-800">텍스트 추가</span>
          <button onClick={onCancel} className="text-zinc-400 text-2xl leading-none">×</button>
        </div>

        {/* 텍스트 입력 */}
        <textarea
          className="w-full border border-zinc-200 rounded-xl p-3 text-zinc-800 resize-none focus:outline-none focus:border-zinc-400"
          rows={3}
          placeholder="텍스트를 입력하세요"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ fontFamily: selectedFont }}
          autoFocus
        />

        {/* 글꼴 선택 */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FONTS.map((f) => (
            <button
              key={f.family}
              onClick={() => setSelectedFont(f.family)}
              className="flex-shrink-0 px-3 py-2 rounded-xl border-2 text-sm transition-colors"
              style={{
                fontFamily: f.family,
                borderColor: selectedFont === f.family ? '#191970' : '#e4e4e7',
                color: selectedFont === f.family ? '#191970' : '#52525b',
                backgroundColor: selectedFont === f.family ? '#eef0ff' : '#ffffff',
              }}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* 미리보기 */}
        {text && (
          <div
            className="text-center py-2 text-zinc-700 text-xl truncate"
            style={{ fontFamily: selectedFont }}
          >
            {text}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-zinc-100 text-zinc-600 font-medium"
          >
            취소
          </button>
          <button
            onClick={() => text.trim() && onConfirm(text.trim(), selectedFont)}
            className="flex-1 py-3 rounded-xl text-white font-medium"
            style={{ backgroundColor: text.trim() ? '#191970' : '#a3a3a3' }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
