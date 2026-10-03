import { router } from 'expo-router';
import { View } from 'react-native';

import { Pinki } from '@/components/calico/Pinki';
import { Button } from '@/components/ds/Button';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { openSheet } from '@/lib/stores/sheet';
import { layout, radius, useTheme } from '@/theme';

/** New user: Pinki asleep on the empty shelf, one line, one button (design/v2 homeEmpty). */
export function HomeEmpty() {
  const { t } = useTheme();
  return (
    <View
      testID="home-empty"
      style={{
        marginHorizontal: layout.gutterScreen,
        paddingTop: 26,
        paddingHorizontal: 26,
        paddingBottom: 32,
        backgroundColor: t.surfacePageWarm,
        borderRadius: radius.xl,
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Pinki pose="asleep" width={280} />
      <Txt family="hand" weight={400} size="xl" leading={1} color="textAccent" align="center">
        {copy.homeShelf.emptyHand}
      </Txt>
      <Txt family="ui" size="sm" color="textSecondary" align="center" style={{ maxWidth: 262 }}>
        {copy.homeShelf.emptyBody}
      </Txt>
      <Button
        variant="accent"
        size="lg"
        onPress={() => openSheet('add')}
        style={{ minWidth: 196, alignSelf: 'center' }}
      >
        {copy.homeShelf.addBook}
      </Button>
      <Press
        accessibilityRole="link"
        onPress={() => router.push('/tmdb')}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Txt family="ui" weight={600} size={14} color="textSecondary" style={{ textDecorationLine: 'underline' }}>
          {copy.homeShelf.orTmdb}
        </Txt>
      </Press>
    </View>
  );
}
