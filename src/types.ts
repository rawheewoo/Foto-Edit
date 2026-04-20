export type AspectRatio = '4:5' | '9:16' | '16:9' | '3:4' | '4:3';

export const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  '4:5':  4 / 5,
  '9:16': 9 / 16,
  '16:9': 16 / 9,
  '3:4':  3 / 4,
  '4:3':  4 / 3,
};

export type BaseItem = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

export type TextItem = BaseItem & {
  kind: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
};

export type StickerItem = BaseItem & {
  kind: 'sticker';
  src: string; // 크롭된 dataURL
  width: number;
  height: number;
};

export type ShapeItem = BaseItem & {
  kind: 'shape';
  shape: 'circle' | 'rect' | 'triangle' | 'heart';
  fill: string;
  width: number;
  height: number;
};

export type EditorItem = TextItem | StickerItem | ShapeItem;
