import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ds/Button';
import { Icon, type IconName } from '@/components/ds/Icon';
import { Input } from '@/components/ds/Input';
import { Press } from '@/components/ds/Press';
import { SegmentedControl } from '@/components/ds/SegmentedControl';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { DUE_CHOICES } from '@/features/books/schema';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import type { SheetParams } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { layout, radius, shadow, useTheme } from '@/theme';

import { fmtTime, parseTime, toTime } from './logic';
import { shareExport } from './share';

const GOALS = [12, 24, 36, 52] as const;
const MINUTE_STEP = 5;

function Title({ children, hint }: { children: string; hint?: string }) {
  return (
    <View>
      <Txt family="display" weight={700} size={22} accessibilityRole="header" style={{ letterSpacing: -0.02 * 22 }}>
        {children}
      </Txt>
      {hint && (
        <Txt family="ui" size="xs" color="textMuted" style={{ marginTop: 4 }}>
          {hint}
        </Txt>
      )}
    </View>
  );
}

/** −  value  + with 48dp buttons (the accessible way to pick numbers without a wheel). */
function Stepper({
  label,
  value,
  onStep,
  testID,
}: {
  label: string;
  value: string;
  onStep: (d: 1 | -1) => void;
  testID: string;
}) {
  const { t } = useTheme();
  const btn = (icon: IconName, d: 1 | -1, a11y: string) => (
    <Press
      accessibilityRole="button"
      accessibilityLabel={a11y}
      testID={`${testID}-${d > 0 ? 'up' : 'down'}`}
      onPress={() => onStep(d)}
      style={{
        width: layout.hitMin,
        height: layout.hitMin,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.surfaceCard,
        boxShadow: shadow.xs,
      }}
    >
      <Icon name={icon} size={22} color="textSecondary" />
    </Press>
  );
  return (
    <View
      accessible={false}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
    >
      <Txt family="ui" weight={600} size={14} color="textMuted" style={{ width: 64 }}>
        {label}
      </Txt>
      {btn('remove', -1, copy.settings.earlier(label.toLowerCase()))}
      <Txt role="numeric" size="3xl" leading={1} align="center" style={{ flex: 1 }} testID={testID}>
        {value}
      </Txt>
      {btn('add', 1, copy.settings.later(label.toLowerCase()))}
    </View>
  );
}

/** One editor sheet per setting (goal, loan length, library, reminder time). */
export function SettingSheetBody({ p, onClose }: { p: SheetParams['setting']; onClose: () => void }) {
  const profile = useProfile().data;
  const update = useUpdateProfile();
  const [goal, setGoal] = useState<number | null>(profile?.reading_goal ?? null);
  const [days, setDays] = useState<number>(profile?.default_loan_days ?? 14);
  const [library, setLibrary] = useState(profile?.default_library ?? '');
  const [time, setTime] = useState(() => parseTime(profile?.reminder_time ?? '09:00:00'));

  if (p.field === 'goal') {
    return (
      <View style={{ gap: 18 }}>
        <Title hint={copy.settings.goalHint}>{copy.settings.goal}</Title>
        <Stepper
          label={copy.settings.goal}
          value={goal ? String(goal) : copy.year.none}
          testID="goal"
          onStep={(d) => setGoal((g) => Math.min(1000, Math.max(1, (g ?? 0) + d)))}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GOALS.map((g) => (
            <Tag key={g} selected={goal === g} onPress={() => setGoal(g)}>
              {String(g)}
            </Tag>
          ))}
          <Tag selected={goal === null} onPress={() => setGoal(null)}>
            {copy.settings.goalClear}
          </Tag>
        </View>
        <Save
          onPress={() => {
            update.mutate({ reading_goal: goal });
            onClose();
          }}
        />
      </View>
    );
  }
  if (p.field === 'loanDays') {
    return (
      <View style={{ gap: 18 }}>
        <Title>{copy.settings.loanLength}</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DUE_CHOICES.map((d) => (
            <Tag key={d} selected={days === d} onPress={() => setDays(d)} testID={`loan-days-${d}`}>
              {copy.settings.days(d)}
            </Tag>
          ))}
        </View>
        <Save
          onPress={() => {
            update.mutate({ default_loan_days: days });
            onClose();
          }}
        />
      </View>
    );
  }
  if (p.field === 'library') {
    return (
      <View style={{ gap: 18 }}>
        <Title hint={copy.settings.libraryHint}>{copy.settings.library}</Title>
        <Input label={copy.settings.library} value={library} onChange={setLibrary} testID="default-library" />
        <Save
          onPress={() => {
            update.mutate({ default_library: library.trim() || null });
            onClose();
          }}
        />
      </View>
    );
  }
  // Reminder time: hour and minute steppers, AM/PM (no extra date-picker dependency).
  const pm = time.h >= 12;
  const h12 = time.h % 12 || 12;
  return (
    <View style={{ gap: 16 }}>
      <Title hint={copy.settings.timeHint}>{copy.settings.reminderTime}</Title>
      <Txt role="numeric" size="4xl" align="center" testID="time-value">
        {fmtTime(toTime(time.h, time.m))}
      </Txt>
      <Stepper
        label={copy.settings.hour}
        value={String(h12)}
        testID="hour"
        onStep={(d) => setTime((x) => ({ ...x, h: (x.h + d + 24) % 24 }))}
      />
      <Stepper
        label={copy.settings.minute}
        value={String(time.m).padStart(2, '0')}
        testID="minute"
        onStep={(d) => setTime((x) => ({ ...x, m: (x.m + d * MINUTE_STEP + 60) % 60 }))}
      />
      <SegmentedControl
        items={[
          { id: 'am', label: 'AM' },
          { id: 'pm', label: 'PM' },
        ]}
        value={pm ? 'pm' : 'am'}
        onChange={(v) => setTime((x) => ({ ...x, h: v === 'pm' ? (x.h % 12) + 12 : x.h % 12 }))}
      />
      <Save
        onPress={() => {
          update.mutate({ reminder_time: toTime(time.h, time.m) });
          onClose();
        }}
      />
    </View>
  );
}

function Save({ onPress }: { onPress: () => void }) {
  return (
    <Button variant="accent" size="lg" block onPress={onPress} testID="setting-save">
      {copy.settings.save}
    </Button>
  );
}

/** Export: everything as JSON, or the books as a spreadsheet-friendly CSV. */
export function ExportSheetBody({ onClose }: { onClose: () => void }) {
  const { t } = useTheme();
  const [busy, setBusy] = useState<'json' | 'csv' | null>(null);
  const go = async (format: 'json' | 'csv') => {
    setBusy(format);
    try {
      await shareExport(format);
      onClose();
    } catch {
      toast({ message: copy.account.exportFailed });
    } finally {
      setBusy(null);
    }
  };
  const row = (format: 'json' | 'csv', icon: IconName, label: string) => (
    <Press
      accessibilityRole="button"
      testID={`export-${format}`}
      disabled={!!busy}
      onPress={() => void go(format)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingHorizontal: 16,
        borderRadius: radius.lg,
        backgroundColor: t.surfaceCard,
        boxShadow: shadow.sm,
        opacity: busy && busy !== format ? 0.5 : 1,
      }}
    >
      <Icon name={icon} size={20} color="textAccent" />
      <Txt family="ui" weight={600} size={15} style={{ flex: 1 }}>
        {busy === format ? copy.account.exporting : label}
      </Txt>
    </Press>
  );
  return (
    <View style={{ gap: 10 }}>
      <Title>{copy.account.exportTitle}</Title>
      {row('json', 'data_object', copy.account.exportJson)}
      {row('csv', 'table', copy.account.exportCsv)}
    </View>
  );
}
