import { useEffect, useState } from 'react';
import { getPaletteSync } from 'colorthief';

export function useDominantColors(photoSrc: string | null): string[] {
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    if (!photoSrc) {
      setColors([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photoSrc;

    img.onload = () => {
      try {
        const palette = getPaletteSync(img, { colorCount: 5 });
        if (palette) {
          setColors(palette.map((c) => c.hex()));
        }
      } catch {
        setColors([]);
      }
    };
  }, [photoSrc]);

  return colors;
}
