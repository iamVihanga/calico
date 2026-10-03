import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { type CropResult, QuadCropView } from '@/features/capture/QuadCropView';
import { capture, useCaptureStore } from '@/features/capture/store';
import { copy } from '@/i18n/en';
import { toast } from '@/lib/stores/toast';
import { straightenCover } from '@/lib/straighten';

/** Crop the cover photo: four free corners, straightened (brief §7.5.2). */
export default function Crop() {
  const pending = useCaptureStore((s) => s.pending);
  const [busy, setBusy] = useState(false);
  // Set once "Use photo" hands the photo on: clearing `pending` then is expected, not "nothing to crop".
  const leaving = useRef(false);

  // Nothing to crop (e.g. restored after the app was killed): go back to the camera.
  useEffect(() => {
    if (!pending && !leaving.current) router.back();
  }, [pending]);
  if (!pending) return null;

  const use = async ({ quad, rotation, size }: CropResult) => {
    setBusy(true);
    try {
      const out = await straightenCover(pending.uri, rotation, quad, size);
      const side = pending.side;
      leaving.current = true;
      capture().patch({ [side]: out.uri, pending: null, extraction: side === 'front' ? null : capture().extraction });
      // Front → read the cover. Back (from Review) → read both again.
      router.replace('/capture/reading');
    } catch {
      leaving.current = false;
      toast({ message: copy.errors.saveFailed });
    } finally {
      setBusy(false);
    }
  };

  return (
    <QuadCropView
      uri={pending.uri}
      width={pending.width}
      height={pending.height}
      start="cover"
      busy={busy}
      cancelLabel={copy.capture.retake}
      onCancel={() => router.back()}
      onUse={(r) => void use(r)}
    />
  );
}
