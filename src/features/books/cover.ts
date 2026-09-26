import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { processCover } from '@/lib/images';
import { currentUserId, supabase } from '@/lib/supabase';

export class CameraDenied extends Error {}

/**
 * A replacement cover gets a new file name: covers are cached by storage path, so reusing
 * `front.jpg` would keep showing the old photo.
 */
export const replacementPath = (uid: string, itemId: string, at: number) => `${uid}/${itemId}/front-${at}.jpg`;

/** Camera or gallery, cropped to the cover shape by the system picker, then resized like a capture. */
export async function pickCover(source: 'camera' | 'gallery'): Promise<string | null> {
  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [2, 3],
    quality: 0.9,
  };
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new CameraDenied();
  }
  const res =
    source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  const a = res.assets?.[0];
  if (res.canceled || !a) return null;
  const out = await processCover(a.uri, 0, { x: 0, y: 0, width: a.width, height: a.height });
  return out.uri;
}

/** Upload the new photo; the old one (if it was a photo of ours) is removed afterwards. */
export async function uploadReplacementCover(itemId: string, uri: string): Promise<string> {
  const uid = await currentUserId();
  const path = replacementPath(uid, itemId, Date.now());
  const bytes = await new File(uri).bytes();
  const { error } = await supabase.storage.from('covers').upload(path, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

export async function removeOldCover(path: string | null) {
  if (!path) return;
  const uid = await currentUserId();
  if (!path.startsWith(`${uid}/`)) return;
  await supabase.storage.from('covers').remove([path]);
}
