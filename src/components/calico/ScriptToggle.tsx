import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { useLeadScript } from '@/features/books/hooks';
import { useUpdateProfile } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import { radius, useTheme } from '@/theme';

/** "A/අ" pill: which script leads titles everywhere (profiles.lead_script, optimistic). */
export function ScriptToggle() {
  const { t } = useTheme();
  const lead = useLeadScript();
  const update = useUpdateProfile();
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={copy.script.toggleLabel}
      testID="script-toggle"
      onPress={() => update.mutate({ lead_script: lead === 'si' ? 'en' : 'si' })}
      style={{
        minWidth: 62,
        height: 44,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        backgroundColor: t.surfaceAccentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      hitSlop={2}
    >
      <Txt family="ui" weight={700} size="xs" tint={t.inkOnWarm} leading={1.35}>
        {lead === 'si' ? copy.script.sinhalaFirst : copy.script.englishFirst}
      </Txt>
    </Press>
  );
}
