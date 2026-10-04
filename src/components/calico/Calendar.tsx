import { format } from 'date-fns';
import { useState } from 'react';
import { View } from 'react-native';

import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { addMonths, inRange, monthBefore, monthGrid, monthOf, sameMonth } from '@/lib/calendar';
import { colomboToday, type LocalDate, parseLocal } from '@/lib/dates';
import { radius, useTheme } from '@/theme';

type Props = {
  value: LocalDate | null;
  onChange: (d: LocalDate) => void;
  min?: LocalDate;
  max?: LocalDate;
  testID?: string;
};

const CELL = 40;

/** A month of days (Monday first) with ‹ › months; days outside `min`–`max` can't be picked. */
export function Calendar({ value, onChange, min, max, testID = 'calendar' }: Props) {
  const { t } = useTheme();
  const today = colomboToday();
  const [month, setMonth] = useState(() => monthOf(value ?? (max && max < today ? max : today)));
  // Follow a value chosen elsewhere (a quick chip) into its month.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value && !sameMonth(monthOf(value), month)) setMonth(monthOf(value));
  }
  const canPrev = !min || monthBefore(monthOf(min), month);
  const canNext = !max || monthBefore(month, monthOf(max));

  return (
    <View testID={testID} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton
          icon="arrow_back"
          label={copy.calendar.prev}
          size="sm"
          disabled={!canPrev}
          testID={`${testID}-prev`}
          onPress={() => setMonth((m) => addMonths(m, -1))}
        />
        <Txt family="display" weight={700} size="md" testID={`${testID}-month`} accessibilityRole="header">
          {`${copy.calendar.months[month.month - 1]} ${month.year}`}
        </Txt>
        <IconButton
          icon="arrow_forward"
          label={copy.calendar.next}
          size="sm"
          disabled={!canNext}
          testID={`${testID}-next`}
          onPress={() => setMonth((m) => addMonths(m, 1))}
        />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {copy.calendar.weekdays.map((d, i) => (
          <Txt key={i} family="ui" weight={700} size={11} color="textMuted" align="center" style={{ flex: 1 }}>
            {d}
          </Txt>
        ))}
      </View>
      {monthGrid(month).map((week, w) => (
        <View key={w} style={{ flexDirection: 'row' }}>
          {week.map((d, i) => {
            if (!d) return <View key={i} style={{ flex: 1, height: CELL }} />;
            const selected = d === value;
            const enabled = inRange(d, min, max);
            const isToday = d === today;
            return (
              <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel={format(parseLocal(d), 'EEEE d MMMM yyyy')}
                  accessibilityState={{ selected, disabled: !enabled }}
                  disabled={!enabled}
                  testID={`${testID}-day-${d}`}
                  onPress={() => onChange(d)}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? t.accentPrimary : 'transparent',
                    borderWidth: isToday && !selected ? 1.5 : 0,
                    borderColor: t.accentPrimary,
                    opacity: enabled ? 1 : 0.3,
                  }}
                >
                  <Txt
                    family="ui"
                    weight={selected || isToday ? 700 : 400}
                    size={14}
                    tint={selected ? t.textOnAccent : t.textPrimary}
                  >
                    {String(Number(d.slice(8)))}
                  </Txt>
                </Press>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
