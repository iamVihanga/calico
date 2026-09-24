import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { CoverName } from '@/components/calico/coverPalette';
import { space } from '@/theme';

import { Badge } from './Badge';
import { BookCover } from './BookCover';
import { Card } from './Card';
import { Press } from './Press';
import { ProgressBar } from './ProgressBar';
import { Txt } from './Txt';

type Props = {
  title: string;
  author?: string;
  cover?: CoverName;
  seed?: string;
  src?: string;
  /** 0–100 */
  progress?: number;
  meta?: string;
  badge?: string;
  action?: ReactNode;
  layout?: 'row' | 'stack';
  onPress?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function BookCard({
  title,
  author,
  cover,
  seed,
  src,
  progress,
  meta,
  badge,
  action,
  layout = 'row',
  onPress,
  testID,
  style,
}: Props) {
  if (layout === 'stack') {
    return (
      <Press
        accessibilityRole="button"
        accessibilityLabel={title}
        testID={testID}
        disabled={!onPress}
        onPress={onPress}
        style={[{ gap: space[4], width: 124 }, style]}
      >
        <BookCover title={title} author={author} cover={cover} seed={seed} src={src} size="lg" />
        <View style={{ gap: 2 }}>
          <Txt family="display" weight={700} size="xs" leading={1.25} numberOfLines={2}>
            {title}
          </Txt>
          {author && (
            <Txt family="ui" size="3xs" leading={1.3} color="textMuted" numberOfLines={1}>
              {author}
            </Txt>
          )}
        </View>
        {typeof progress === 'number' && <ProgressBar value={progress} height={6} />}
      </Press>
    );
  }
  return (
    <Card
      tone="paper"
      pad="md"
      onPress={onPress}
      testID={testID}
      accessibilityLabel={title}
      style={[{ flexDirection: 'row', gap: space[5], alignItems: 'center' }, style]}
    >
      <BookCover title={title} author={author} cover={cover} seed={seed} src={src} size="sm" />
      <View style={{ flex: 1, minWidth: 0, gap: space[3] }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space[4], justifyContent: 'space-between' }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Txt family="display" weight={700} size="md" leading={1.2}>
              {title}
            </Txt>
            {author && (
              <Txt family="ui" size="2xs" leading={1.4} color="textMuted">
                {author}
              </Txt>
            )}
          </View>
          {badge && <Badge tone="accent">{badge}</Badge>}
        </View>
        {meta && (
          <Txt family="ui" size="2xs" leading={1.4} color="textSecondary">
            {meta}
          </Txt>
        )}
        {typeof progress === 'number' && <ProgressBar value={progress} height={6} />}
      </View>
      {action}
    </Card>
  );
}
