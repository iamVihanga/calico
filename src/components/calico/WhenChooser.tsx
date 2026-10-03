import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { colomboToday, fmtLong } from '@/lib/dates';
import { clampWhen, daysInMonth, partialLabel, type When, whenVars } from '@/lib/when';

export type { When } from '@/lib/when';

type Props = { value: When; onChange: (v: When) => void; testID?: string };

const YEARS_BACK = 60;

/**
 * "Just now" / "A while ago", and for a while ago an optional year → month → day. Whatever is known
 * decides which stats it counts in (week needs a day, month a month, year a year).
 */
export function WhenChooser({ value, onChange, testID = 'when' }: Props) {
  const today = colomboToday();
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number];
  const set = (w: When) => onChange(clampWhen(w, today));
  const past = value.now ? null : value;

  const years = Array.from({ length: YEARS_BACK + 1 }, (_, i) => ty - i);
  const months = past?.year ? Array.from({ length: past.year === ty ? tm : 12 }, (_, i) => i + 1) : [];
  const lastDay =
    past?.year && past.month ? (past.year === ty && past.month === tm ? td : daysInMonth(past.year, past.month)) : 0;
  const days = Array.from({ length: lastDay }, (_, i) => i + 1);

  const v = whenVars(value, today);
  const hint = value.now
    ? null
    : v.precision === 'day'
      ? copy.when.hintDay(fmtLong(v.on))
      : v.precision
        ? copy.when.hintPeriod(partialLabel(v.on, v.precision, '') ?? '')
        : copy.when.hintNone;

  const row = (
    label: string,
    items: number[],
    selected: number | undefined,
    text: (n: number) => string,
    pick: (n?: number) => void,
    key: string,
  ) => (
    <View style={{ gap: 6 }}>
      <Txt role="label" size={10} color="textMuted">
        {label}
      </Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {items.map((n) => (
          <Tag
            key={n}
            selected={selected === n}
            testID={`${testID}-${key}-${n}`}
            onPress={() => pick(selected === n ? undefined : n)}
          >
            {text(n)}
          </Tag>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Tag selected={value.now} onPress={() => onChange({ now: true })} testID={`${testID}-now`}>
          {copy.when.now}
        </Tag>
        <Tag selected={!value.now} onPress={() => !past && onChange({ now: false })} testID={`${testID}-past`}>
          {copy.when.past}
        </Tag>
      </View>
      {past && (
        <>
          <Txt family="ui" weight={600} size="xs" color="textSecondary">
            {copy.when.dateTitle}
          </Txt>
          {row(copy.when.year, years, past.year, String, (year) => set({ now: false, year }), 'year')}
          {past.year
            ? row(
                copy.when.month,
                months,
                past.month,
                (m) => copy.when.months[m - 1] ?? String(m),
                (month) => set({ now: false, year: past.year, month }),
                'month',
              )
            : null}
          {past.year && past.month
            ? row(
                copy.when.day,
                days,
                past.day,
                String,
                (day) => set({ now: false, year: past.year, month: past.month, day }),
                'day',
              )
            : null}
          <Txt family="ui" size="xs" color="textMuted" testID={`${testID}-hint`}>
            {hint}
          </Txt>
        </>
      )}
    </View>
  );
}
