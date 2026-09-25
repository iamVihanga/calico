import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { Rect } from '@/features/capture/logic';

export const COVER_WIDTH = 1024;
export const COVER_QUALITY = 0.7;

/** Plan §9.6 step 3: rotate → crop → resize to width 1024 → JPEG 0.7. Returns the new local uri. */
export async function processCover(uri: string, rotation: number, crop: Rect): Promise<{ uri: string; width: number; height: number }> {
  const ctx = ImageManipulator.manipulate(uri);
  if (rotation % 360 !== 0) ctx.rotate(rotation);
  ctx.crop({ originX: crop.x, originY: crop.y, width: crop.width, height: crop.height });
  if (crop.width > COVER_WIDTH) ctx.resize({ width: COVER_WIDTH });
  const image = await ctx.renderAsync();
  const out = await image.saveAsync({ format: SaveFormat.JPEG, compress: COVER_QUALITY });
  return { uri: out.uri, width: out.width, height: out.height };
}

/** Size of an image after rotation (for mapping the crop box). */
export const rotatedSize = (w: number, h: number, rotation: number) =>
  rotation % 180 === 0 ? { width: w, height: h } : { width: h, height: w };
