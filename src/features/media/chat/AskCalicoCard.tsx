import { router } from 'expo-router';
import { View } from 'react-native';

import { Illustration } from '@/components/calico/Illustration';
import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { layout, radius, useTheme } from '@/theme';

/** The way into the AI chat about a movie or show, under "Where it's at" on its detail screen. */
export function AskCalicoCard({ itemId }: { itemId: string }) {
  const { t } = useTheme();
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={`${copy.chat.entryTitle}: ${copy.chat.entryHand}, ${copy.chat.entryLangs}`}
      onPress={() => router.push(`/chat/${itemId}`)}
      scaleTo={0.99}
      testID="ask-calico"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 16,
        marginHorizontal: layout.gutterScreen,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: t.surfacePageWarm,
        borderRadius: radius.lg,
      }}
    >
      <Illustration name="cat-magnifier" width={54} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt family="display" weight={700} size={18}>
          {copy.chat.entryTitle}
        </Txt>
        <Txt family="hand" weight={400} size={17} leading={1.1} color="textMuted">
          {copy.chat.entryHand}
        </Txt>
        <Txt family="ui" weight={600} size="3xs" color="textAccent" style={{ marginTop: 2 }}>
          {copy.chat.entryLangs}
        </Txt>
      </View>
      <Icon name="arrow_forward" size={20} color="textAccent" />
    </Press>
  );
}
