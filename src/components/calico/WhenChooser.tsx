import { View } from 'react-native';

import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';

export type When = 'now' | 'past';

type Props = { value: When; onChange: (v: When) => void; testID?: string };

/** "Just now" / "A while ago": the second keeps old reads and viewings out of the period stats. */
export function WhenChooser({ value, onChange, testID = 'when' }: Props) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['now', 'past'] as const).map((w) => (
          <Tag key={w} selected={value === w} onPress={() => onChange(w)} testID={`${testID}-${w}`}>
            {copy.when[w]}
          </Tag>
        ))}
      </View>
      <Txt family="ui" size="xs" color="textMuted">
        {copy.when.hint}
      </Txt>
    </View>
  );
}
