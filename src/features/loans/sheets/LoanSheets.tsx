import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { Input } from '@/components/ds/Input';
import { Press } from '@/components/ds/Press';
import { SegmentedControl } from '@/components/ds/SegmentedControl';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { newId } from '@/features/books/api';
import { useBook, useLeadScript } from '@/features/books/hooks';
import { leadTitle } from '@/features/books/logic';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import { addLocalDays, colomboToday, daysBetween, fmtShort } from '@/lib/dates';
import { askForReminders, declineReminders, remindersAllowed, remindersAsked } from '@/lib/notifications';
import { openSheet } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { radius, shadow, useTheme } from '@/theme';

import type { LoanKind } from '../api';
import { useAddLoan, useRenew, useReturn } from '../hooks';
import { DEFAULT_RENEW, LOAN_DUE_CHOICES, renewOptions } from '../logic';
import { requestReminderSync } from '../reminders';

type Props = { itemId: string; onClose: () => void };

function Title({ children }: { children: string }) {
  return (
    <Txt family="display" weight={700} size={22} style={{ letterSpacing: -0.02 * 22 }} accessibilityRole="header">
      {children}
    </Txt>
  );
}

/**
 * First borrowed loan with a due date → explain reminders before Android asks (plan §9.5). Never at
 * launch, never twice.
 */
export async function maybeAskForReminders() {
  if (remindersAsked()) return;
  if (await remindersAllowed()) {
    declineReminders(); // already allowed: nothing to ask, just remember it
    requestReminderSync();
    return;
  }
  openSheet('notif');
}

/** Renew sheet (prototype sheetRenew): +7 / +14 / +21 / +30 days from the current due date. */
export function RenewSheetBody({ itemId, onClose }: Props) {
  const { t } = useTheme();
  const lead = useLeadScript();
  const book = useBook(itemId).data;
  const renew = useRenew();
  const [pick, setPick] = useState<number>(DEFAULT_RENEW);
  if (!book?.loan) return null;
  const options = renewOptions(book.loan.dueOn, colomboToday());
  const chosen = options.find((o) => o.days === pick) ?? options[1]!;

  return (
    <View>
      <Title>{copy.loan.renewTitle(leadTitle(book, lead).main)}</Title>
      <Txt family="ui" size="xs" color="textMuted" style={{ marginTop: 6 }}>
        {copy.loan.newDue}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {options.map((o) => {
          const on = o.days === pick;
          return (
            <Press
              key={o.days}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={copy.loan.renewChoiceA11y(o.days, fmtShort(o.date))}
              testID={`renew-${o.days}`}
              onPress={() => setPick(o.days)}
              style={{
                flex: 1,
                minHeight: 62,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: on ? 'transparent' : t.borderStrong,
                backgroundColor: on ? t.accentPrimary : t.surfaceCard,
              }}
            >
              <Txt
                family="ui"
                weight={700}
                size="xs"
                leading={1.3}
                align="center"
                tint={on ? t.textOnAccent : t.textSecondary}
              >
                {copy.loan.renewChoice(o.days, fmtShort(o.date))}
              </Txt>
            </Press>
          );
        })}
      </View>
      <Button
        variant="accent"
        size="lg"
        block
        style={{ marginTop: 18 }}
        testID="renew-confirm"
        onPress={() => {
          onClose();
          renew(book, chosen.date);
        }}
      >
        {copy.loan.renew}
      </Button>
    </View>
  );
}

/** Long-press on a Home slip, or a reminder's "Returned" action (prototype sheetLoanQuick). */
export function LoanQuickSheetBody({ itemId, onClose }: Props) {
  const { t } = useTheme();
  const lead = useLeadScript();
  const book = useBook(itemId).data;
  const doReturn = useReturn();
  if (!book?.loan) return null;
  const loan = book.loan;
  const due = loan.dueOn ? copy.loan.dueLine(daysBetween(colomboToday(), loan.dueOn)) : copy.loanForm.noDue;
  const row = (icon: 'event_repeat' | 'assignment_return', label: string, run: () => void, testID: string) => (
    <Press
      accessibilityRole="button"
      testID={testID}
      onPress={run}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingHorizontal: 16,
        borderRadius: radius.lg,
        backgroundColor: t.surfaceCard,
        boxShadow: shadow.sm,
      }}
    >
      <Icon name={icon} size={20} color="textAccent" />
      <Txt family="ui" weight={600} size={15}>
        {label}
      </Txt>
    </Press>
  );
  return (
    <View style={{ gap: 10 }}>
      <View style={{ marginBottom: 2 }}>
        <Txt family="display" weight={700} size={20} accessibilityRole="header">
          {leadTitle(book, lead).main}
        </Txt>
        <Txt family="ui" size="xs" color="textMuted">
          {copy.loan.quickDue(due, loan.party)}
        </Txt>
      </View>
      {loan.direction === 'borrowed' &&
        row('event_repeat', copy.loan.renew, () => openSheet('renew', { itemId }), 'quick-renew')}
      {row(
        'assignment_return',
        copy.loan.returned,
        () => {
          onClose();
          doReturn(book, lead);
        },
        'quick-returned',
      )}
    </View>
  );
}

/** Add a loan to a book you already have: from a library, from a friend, or lent out (plan §9.1). */
export function LoanFormSheetBody({ itemId, onClose }: Props) {
  const { t } = useTheme();
  const book = useBook(itemId).data;
  const profile = useProfile().data;
  const add = useAddLoan();
  const updateProfile = useUpdateProfile();
  const today = colomboToday();
  const defaultDays = (LOAN_DUE_CHOICES as readonly number[]).includes(profile?.default_loan_days ?? 0)
    ? (profile?.default_loan_days ?? 14)
    : 14;
  const [kind, setKind] = useState<LoanKind>(book?.ownership === 'owned' ? 'lent' : 'library');
  const [party, setParty] = useState(kind === 'library' ? (profile?.default_library ?? '') : '');
  const [dueDays, setDueDays] = useState<number | null>(kind === 'library' ? defaultDays : null);
  const [error, setError] = useState<string | undefined>();
  if (!book) return null;

  const switchKind = (k: LoanKind) => {
    setKind(k);
    setParty(k === 'library' ? (profile?.default_library ?? '') : '');
    setDueDays(k === 'library' ? defaultDays : null);
    setError(undefined);
  };

  const save = () => {
    const name = party.trim();
    if (!name) {
      setError(copy.loanForm.needParty);
      return;
    }
    const dueOn = dueDays === null ? null : addLocalDays(today, dueDays);
    add.mutate({ id: newId(), itemId, kind, party: name, borrowedOn: today, dueOn });
    onClose();
    toast({ message: copy.loanForm.saved(name) });
    if (kind === 'library' && !profile?.default_library) updateProfile.mutate({ default_library: name });
    if (kind !== 'lent' && dueOn) void maybeAskForReminders();
  };

  return (
    <View style={{ gap: 16 }}>
      <Title>{copy.loanForm.title}</Title>
      <SegmentedControl
        items={(['library', 'friend', 'lent'] as const).map((k) => ({ id: k, label: copy.loanForm.kind[k] }))}
        value={kind}
        onChange={switchKind}
      />
      <Input
        label={
          kind === 'library'
            ? copy.loanForm.libraryName
            : kind === 'friend'
              ? copy.loanForm.friendName
              : copy.loanForm.lentName
        }
        value={party}
        onChange={(v) => {
          setParty(v);
          setError(undefined);
        }}
        error={error}
        testID="loan-party"
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt role="label" size={10} color="textMuted">
          {kind === 'lent' ? copy.loanForm.lentOn : copy.loanForm.borrowed}
        </Txt>
        <Txt family="ui" weight={600} size="xs" color="textSecondary">
          {copy.review.todayDate(fmtShort(today))}
        </Txt>
      </View>
      <View style={{ gap: 8 }}>
        <Txt role="label" size={10} color="textMuted">
          {kind === 'library' ? copy.loanForm.due : copy.loanForm.dueOptional}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {kind !== 'library' && (
            <Tag selected={dueDays === null} onPress={() => setDueDays(null)} testID="loan-due-none">
              {copy.loanForm.noDue}
            </Tag>
          )}
          {LOAN_DUE_CHOICES.map((d) => (
            <Tag key={d} selected={dueDays === d} onPress={() => setDueDays(d)} testID={`loan-due-${d}`}>
              {`+${d}`}
            </Tag>
          ))}
        </View>
        {dueDays !== null && (
          <Txt family="ui" size="2xs" tint={t.textMuted}>
            {fmtShort(addLocalDays(today, dueDays))}
          </Txt>
        )}
      </View>
      <Button variant="accent" size="lg" block onPress={save} testID="loan-save">
        {copy.loanForm.save}
      </Button>
    </View>
  );
}

/** "Reminders for library books" (prototype sheetNotif): the only path to the system prompt. */
export function NotifSheetBody({ onClose }: { onClose: () => void }) {
  return (
    <View>
      <Title>{copy.reminders.askTitle}</Title>
      <Txt family="ui" size={14} color="textMuted" style={{ marginTop: 8 }}>
        {copy.reminders.askBody}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        <Button
          variant="secondary"
          block
          style={{ flex: 1, minHeight: 52 }}
          testID="notif-skip"
          onPress={() => {
            declineReminders();
            onClose();
          }}
        >
          {copy.reminders.notNow}
        </Button>
        <Button
          variant="accent"
          block
          style={{ flex: 1, minHeight: 52 }}
          testID="notif-allow"
          onPress={async () => {
            onClose();
            const granted = await askForReminders();
            if (granted) requestReminderSync();
            toast({ message: granted ? copy.reminders.on : copy.reminders.denied });
          }}
        >
          {copy.reminders.allow}
        </Button>
      </View>
    </View>
  );
}
