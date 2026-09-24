import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Txt } from '@/components/ds/Txt';
import type { SizeKey } from '@/theme';

export type LeadScript = 'en' | 'si';

/** Which line leads, mirroring the prototype's `lead()`: fall back when a script is missing. */
export function leadTitle(en: string | null | undefined, native: string | null | undefined, lead: LeadScript) {
  const si = native || '';
  const latin = en || si;
  if (lead === 'si' && si) return { main: si, sub: latin !== si ? latin : '' };
  return { main: latin, sub: si && si !== latin ? si : '' };
}

type Props = {
  title: string;
  titleNative?: string | null;
  lead?: LeadScript;
  size?: SizeKey | number;
  subSize?: SizeKey | number;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
};

/** Lead-script title with the other script underneath (muted). */
export function BilingualTitle({
  title,
  titleNative,
  lead = 'en',
  size = 'xl',
  subSize = 'sm',
  numberOfLines,
  style,
}: Props) {
  const { main, sub } = leadTitle(title, titleNative, lead);
  return (
    <View style={[{ gap: 2 }, style]}>
      <Txt family="display" weight={700} size={size} leading={1.16} numberOfLines={numberOfLines}>
        {main}
      </Txt>
      {!!sub && (
        <Txt family="ui" weight={600} size={subSize} leading={1.4} color="textMuted" numberOfLines={numberOfLines}>
          {sub}
        </Txt>
      )}
    </View>
  );
}
