import { useState } from 'react';
import { View } from 'react-native';

import { IconButton } from '@/components/ds/IconButton';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { addLocalDays, colomboToday, fmtDay, type LocalDate } from '@/lib/dates';

type Props = {
  value: LocalDate;
  onChange: (d: LocalDate) => void;
  /** Latest day allowed (default today). */
  max?: LocalDate;
  testID?: string;
};

/** Today · Yesterday · 2 days ago · A week ago · Other day (a − / + stepper over the past year). */
export function DayChooser({ value, onChange, max, testID = 'day' }: Props) {
  const today = colomboToday();
  const last = max && max < today ? max : today;
  const first = addLocalDays(today, -365);
  const presets = [
    { label: copy.startDate.today, date: today },
    { label: copy.startDate.yesterday, date: addLocalDays(today, -1) },
    { label: copy.startDate.daysAgo(2), date: addLocalDays(today, -2) },
    { label: copy.day.weekAgo, date: addLocalDays(today, -7) },
  ].filter((p) => p.date <= last);
  const [other, setOther] = useState(() => !presets.some((p) => p.date === value));
  const step = (n: number) => {
    const d = addLocalDays(value, n);
    if (d >= first && d <= last) onChange(d);
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {presets.map((p, i) => (
          <Tag
            key={p.date}
            selected={!other && value === p.date}
            testID={`${testID}-${i}`}
            onPress={() => {
              setOther(false);
              onChange(p.date);
            }}
          >
            {p.label}
          </Tag>
        ))}
        <Tag selected={other} testID={`${testID}-other`} onPress={() => setOther(true)}>
          {copy.day.other}
        </Tag>
      </View>
      {other && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton
            icon="remove"
            label={copy.day.earlier}
            tone="card"
            testID={`${testID}-earlier`}
            disabled={value <= first}
            onPress={() => step(-1)}
          />
          <Txt family="ui" weight={700} size="sm" align="center" style={{ flex: 1 }} testID={`${testID}-value`}>
            {fmtDay(value)}
          </Txt>
          <IconButton
            icon="add"
            label={copy.day.later}
            tone="card"
            testID={`${testID}-later`}
            disabled={value >= last}
            onPress={() => step(1)}
          />
        </View>
      )}
    </View>
  );
}
