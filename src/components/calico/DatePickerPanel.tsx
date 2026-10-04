import { View } from 'react-native';

import { Button } from '@/components/ds/Button';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import type { LocalDate } from '@/lib/dates';

import { Calendar } from './Calendar';

export type QuickDate = { label: string; date: LocalDate | null };

type Props = {
  title: string;
  value: LocalDate | null;
  onChange: (d: LocalDate | null) => void;
  quick: QuickDate[];
  min?: LocalDate;
  max?: LocalDate;
  onDone: () => void;
  testID?: string;
};

/** A date to pick: quick choices first, then any day on the calendar, then Done. */
export function DatePickerPanel({ title, value, onChange, quick, min, max, onDone, testID = 'date-picker' }: Props) {
  return (
    <View style={{ gap: 14 }} testID={testID}>
      <Txt family="display" weight={700} size={20} accessibilityRole="header">
        {title}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {quick.map((q, i) => (
          <Tag
            key={q.label}
            selected={q.date === value}
            testID={`${testID}-quick-${i}`}
            onPress={() => onChange(q.date)}
          >
            {q.label}
          </Tag>
        ))}
      </View>
      <Calendar value={value} onChange={onChange} min={min} max={max} testID={`${testID}-calendar`} />
      <Button variant="accent" size="lg" block testID={`${testID}-done`} onPress={onDone}>
        {copy.loanDates.done}
      </Button>
    </View>
  );
}
