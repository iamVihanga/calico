import { useState } from 'react';
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { type CropResult, QuadCropView } from '@/features/capture/QuadCropView';
import { copy } from '@/i18n/en';
import { finishCrop, useCropStore } from '@/lib/stores/crop';
import { toast } from '@/lib/stores/toast';
import { straightenCover } from '@/lib/straighten';

/** The four-corner crop for photos picked outside the capture flow (`cropPhoto`): cover changes, collection art. */
export function CropHost() {
  const request = useCropStore((s) => s.request);
  const [busy, setBusy] = useState(false);

  const use = async ({ quad, rotation, size }: CropResult) => {
    if (!request) return;
    setBusy(true);
    try {
      finishCrop(await straightenCover(request.uri, rotation, quad, size));
    } catch {
      finishCrop(null);
      toast({ message: copy.edit.coverFailed });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={!!request}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => !busy && finishCrop(null)}
    >
      {/* A Modal is its own window on Android: gestures need their own root there. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {request && (
          <QuadCropView
            key={request.uri}
            uri={request.uri}
            width={request.width}
            height={request.height}
            start="whole"
            busy={busy}
            cancelLabel={copy.common.cancel}
            onCancel={() => finishCrop(null)}
            onUse={(r) => void use(r)}
          />
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}
