import { View } from 'react-native';

import { copy } from '@/i18n/en';
import { layout, radius, useTheme } from '@/theme';

import { Button } from './Button';
import { Txt } from './Txt';

/** A query failed and there's nothing cached to show: say so, offer a retry. */
export function QueryError({ message = copy.errors.loadFailed, onRetry }: { message?: string; onRetry: () => void }) {
  const { t } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        margin: layout.gutterScreen,
        paddingVertical: 36,
        paddingHorizontal: 24,
        gap: 16,
        alignItems: 'center',
        backgroundColor: t.surfacePageWarm,
        borderRadius: radius.xl,
      }}
    >
      <Txt family="hand" weight={400} size="xl" color="textMuted" align="center">
        {message}
      </Txt>
      <Button variant="secondary" onPress={onRetry} testID="query-retry">
        {copy.errors.retry}
      </Button>
    </View>
  );
}
