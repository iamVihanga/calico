import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';

import { type Quad, quadOutputSize, rectOf, toBmp, warpPerspective } from '@/features/capture/logic';

import { COVER_QUALITY, processCover } from './images';

/** Source pixels decoded in JS (long side) and the straightened cover's long side. */
const SRC_LONG = 1280;
const OUT_LONG = 1200;

type Out = { uri: string; width: number; height: number };

/**
 * Four-corner crop: `quad` is in pixels of the image after `rotation` (`size`). A quad that is still an
 * upright rectangle is a plain native crop. Otherwise: rotate + shrink natively → decode in JS → warp
 * the quad flat → hand the pixels back as a BMP for the native JPEG encode.
 */
export async function straightenCover(
  uri: string,
  rotation: number,
  quad: Quad,
  size: { width: number; height: number },
): Promise<Out> {
  const rect = rectOf(quad, Math.max(size.width, size.height) * 0.01);
  if (rect) return processCover(uri, rotation, rect);

  const k = Math.min(1, SRC_LONG / Math.max(size.width, size.height));
  const ctx = ImageManipulator.manipulate(uri);
  if (rotation % 360 !== 0) ctx.rotate(rotation);
  if (k < 1) ctx.resize({ width: Math.round(size.width * k) });
  const mid = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.92 });

  const src = jpeg.decode(await new File(mid.uri).bytes(), { useTArray: true, formatAsRGBA: true });
  const sx = src.width / size.width;
  const sy = src.height / size.height;
  const q = quad.map((p) => ({ x: p.x * sx, y: p.y * sy })) as Quad;
  const out = quadOutputSize(q, OUT_LONG);
  const rgba = warpPerspective(src.data, src.width, src.height, q, out.width, out.height);
  remove(mid.uri);
  return encode(rgba, out.width, out.height);
}

async function encode(rgba: Uint8Array, width: number, height: number): Promise<Out> {
  const bmp = new File(Paths.cache, `straight-${Date.now()}.bmp`);
  try {
    bmp.create({ overwrite: true });
    bmp.write(toBmp(rgba, width, height));
    const img = await ImageManipulator.manipulate(bmp.uri).renderAsync();
    const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: COVER_QUALITY });
    return { uri: out.uri, width: out.width, height: out.height };
  } catch {
    // If BMP can't be loaded natively, encode in JS (slower).
    const file = new File(Paths.cache, `straight-${Date.now()}.jpg`);
    file.create({ overwrite: true });
    file.write(jpegEncode(rgba, width, height));
    return { uri: file.uri, width, height };
  } finally {
    remove(bmp.uri);
  }
}

/** jpeg-js returns `Buffer.from(bytes)` when bundled; Hermes has no Buffer, so lend it one briefly. */
function jpegEncode(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const g = globalThis as { Buffer?: unknown };
  const had = 'Buffer' in g;
  if (!had) g.Buffer = { from: (a: ArrayLike<number>) => Uint8Array.from(a) };
  try {
    return new Uint8Array(jpeg.encode({ data: rgba, width, height }, Math.round(COVER_QUALITY * 100)).data);
  } finally {
    if (!had) delete g.Buffer;
  }
}

function remove(uri: string) {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // a leftover temp file in the cache is harmless
  }
}
