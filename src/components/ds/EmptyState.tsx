import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { space } from '@/theme';

import { Txt } from './Txt';

type Props = {
  hand?: string;
  title?: string;
  body?: string;
  /** Usually a <Kiri pose=... /> */
  art?: ReactNode;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ hand, title, body, art, action, style }: Props) {
  return (
    <View
      style={[{ alignItems: 'center', gap: space[5], paddingVertical: space[9], paddingHorizontal: space[7] }, style]}
    >
      {art}
      <View style={{ gap: space[3], maxWidth: 300, alignItems: 'center' }}>
        {hand && (
          <Txt family="hand" weight={700} size="xl" leading={1.1} color="textAccent" align="center">
            {hand}
          </Txt>
        )}
        {title && (
          <Txt role="section" align="center">
            {title}
          </Txt>
        )}
        {body && (
          <Txt role="body" size="xs" color="textSecondary" align="center">
            {body}
          </Txt>
        )}
      </View>
      {action}
    </View>
  );
}
