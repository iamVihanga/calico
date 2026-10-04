import { useState } from 'react';
import { View } from 'react-native';

import { DatePickerPanel, type QuickDate } from '@/components/calico/DatePickerPanel';
import { Press } from '@/components/ds/Press';
import { Sheet } from '@/components/ds/Sheet';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { addLocalDays, colomboToday, daysBetween, fmtDay, fmtShort, type LocalDate } from '@/lib/dates';
import { radius, useTheme } from '@/theme';

import { LOAN_DUE_CHOICES, type LoanDates, moveBorrowed, setDue } from '../logic';

type Which = 'borrowed' | 'due';

type Props = {
  value: LoanDates;
  onChange: (d: LoanDates) => void;
  /** Library loans always have a due date; friends and lent books may not. */
  dueRequired: boolean;
  lent?: boolean;
  /** `sheet` on a screen; `inline` inside a sheet (a sheet can't open another one). */
  mode: 'sheet' | 'inline';
  testID?: string;
};

/** "Today", "Yesterday", "in 14 days", "3 days ago". */
function relative(d: LocalDate, today: LocalDate) {
  const n = daysBetween(today, d);
  if (n === 0) return copy.loanDates.today;
  if (n === 1) return copy.loanDates.tomorrow;
  if (n === -1) return copy.loanDates.yesterday;
  return n > 0 ? copy.loanDates.inDays(n) : copy.loanDates.daysAgo(-n);
}

/**
 * Borrowed | Due as two tiles; each opens a picker with quick choices and a calendar. The due date moves
 * with the borrowed day until it's picked by hand (`moveBorrowed`).
 */
export function LoanDatesField({ value, onChange, dueRequired, lent = false, mode, testID = 'loan-dates' }: Props) {
  const { t } = useTheme();
  const today = colomboToday();
  const [open, setOpen] = useState<Which | null>(null);

  const borrowedQuick: QuickDate[] = [
    { label: copy.loanDates.today, date: today },
    { label: copy.loanDates.yesterday, date: addLocalDays(today, -1) },
    { label: copy.loanDates.daysAgo(2), date: addLocalDays(today, -2) },
    { label: copy.loanDates.weekAgo, date: addLocalDays(today, -7) },
  ];
  const dueQuick: QuickDate[] = [
    ...LOAN_DUE_CHOICES.map((n) => ({ label: copy.loanDates.plusDays(n), date: addLocalDays(value.borrowedOn, n) })),
    ...(dueRequired ? [] : [{ label: copy.loanDates.noDue, date: null }]),
  ];

  const tile = (which: Which, label: string, date: LocalDate | null) => {
    const shown = date ? fmtShort(date) : copy.loanDates.noDue;
    const active = open === which;
    return (
      <Press
        accessibilityRole="button"
        accessibilityLabel={copy.loanDates.tileA11y(label, date ? fmtDay(date) : copy.loanDates.noDue)}
        accessibilityState={{ expanded: active }}
        testID={`${testID}-${which}`}
        onPress={() => setOpen(active ? null : which)}
        style={{
          flex: 1,
          minHeight: 76,
          padding: 12,
          gap: 2,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: active ? t.accentPrimary : t.borderSoft,
          backgroundColor: t.surfaceCard,
        }}
      >
        <Txt role="label" size={10} color="textMuted">
          {label}
        </Txt>
        <Txt family="display" weight={700} size={20} testID={`${testID}-${which}-value`}>
          {shown}
        </Txt>
        {date && (
          <Txt family="ui" size="2xs" color="textSecondary">
            {relative(date, today)}
          </Txt>
        )}
      </Press>
    );
  };

  const panel = open && (
    <DatePickerPanel
      key={open}
      title={open === 'due' ? copy.loanDates.dueTitle : lent ? copy.loanDates.lentTitle : copy.loanDates.borrowedTitle}
      value={open === 'due' ? value.dueOn : value.borrowedOn}
      onChange={(d) => {
        if (open === 'due') onChange(setDue(value, d));
        else if (d) onChange(moveBorrowed(value, d));
      }}
      quick={open === 'due' ? dueQuick : borrowedQuick}
      min={open === 'due' ? value.borrowedOn : addLocalDays(today, -365)}
      max={open === 'due' ? addLocalDays(value.borrowedOn, 365) : today}
      onDone={() => setOpen(null)}
      testID={`${testID}-picker`}
    />
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {tile('borrowed', lent ? copy.loanDates.lent : copy.loanDates.borrowed, value.borrowedOn)}
        {tile('due', copy.loanDates.due, value.dueOn)}
      </View>
      {mode === 'inline' ? (
        panel
      ) : (
        <Sheet open={!!open} onClose={() => setOpen(null)} testID={`${testID}-sheet`}>
          {panel}
        </Sheet>
      )}
    </View>
  );
}
