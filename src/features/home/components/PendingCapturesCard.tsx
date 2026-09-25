import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

import { coverRadius } from '@/components/calico/GeneratedCover';
import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { type PendingCapture, useDrafts } from '@/features/capture/drafts';
import { capture } from '@/features/capture/store';
import { copy } from '@/i18n/en';
import { layout, radius, shadow, useTheme } from '@/theme';

/** Opens the oldest draft in Review (read or not: the photo is there to fill it in from). */
function openDraft(d: PendingCapture) {
  capture().patch({
    itemId: d.itemId,
    isbn: d.isbn,
    lookup: d.lookup,
    front: d.front,
    back: d.back,
    pending: null,
    frontPath: d.frontPath,
    backPath: d.backPath,
    extraction: d.extraction,
    error: null,
    resetsAt: null,
  });
  router.push({ pathname: '/capture/review', params: { from: 'draft' } });
}

/** "1 cover waiting to be read" (plan §9.6 step 7). */
export function PendingCapturesCard() {
  const { t } = useTheme();
  const drafts = useDrafts((s) => s.drafts);
  if (drafts.length === 0) return null;
  const first = [...drafts].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))[0]!;
  const waiting = drafts.some((d) => d.state === 'waiting');
  return (
    <View style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 22 }}>
      <Press
        accessibilityRole="button"
        testID="pending-captures"
        onPress={() => openDraft(first)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 14,
          backgroundColor: t.surfaceCard,
          borderRadius: radius.lg,
          boxShadow: shadow.sm,
        }}
      >
        <View style={[{ width: 40, height: 60, overflow: 'hidden', backgroundColor: t.surfaceSunk }, coverRadius]}>
          <Image source={{ uri: first.front }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt family="ui" weight={700} size="sm">
            {drafts.length === 1 ? copy.capture.pendingOne : copy.capture.pendingMany(drafts.length)}
          </Txt>
          {waiting && (
            <Txt family="ui" size="2xs" color="textMuted">
              {copy.capture.pendingHint}
            </Txt>
          )}
        </View>
        <Icon name={waiting ? 'schedule' : 'arrow_forward'} size={20} color="textAccent" />
      </Press>
    </View>
  );
}
