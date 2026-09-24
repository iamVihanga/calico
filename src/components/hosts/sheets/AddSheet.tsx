import { type ReactNode, useState } from 'react';
import { View } from 'react-native';

import { coverRadius } from '@/components/calico/GeneratedCover';
import { Icon, type IconName } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { toast } from '@/lib/stores/toast';
import { alpha, radius, shadow, space, useTheme } from '@/theme';

/**
 * "What are you adding?" (prototype sheetAdd). Book expands into the three capture methods;
 * Movie and Show go to TMDB search. Destinations arrive in phases 3 (capture) and 5 (TMDB).
 */
export function AddSheetBody({ onClose }: { onClose: () => void }) {
  const { t } = useTheme();
  const [bookOpen, setBookOpen] = useState(false);
  const later = () => {
    onClose();
    toast({ message: copy.errors.notYet });
  };

  const tile = (label: string, art: ReactNode, onPress: () => void, active = false) => (
    <Press
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={label === copy.add.book ? { expanded: bookOpen } : undefined}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 112,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderRadius: radius.lg,
        backgroundColor: active ? t.surfaceAccentSoft : t.surfaceCard,
        boxShadow: active ? shadow.md : shadow.xs,
      }}
    >
      {art}
      <Txt family="ui" weight={700} size="xs" tint={active ? t.inkOnWarm : t.textSecondary}>
        {label}
      </Txt>
    </Press>
  );

  const methods: { icon: IconName; label: string; hint?: string }[] = [
    { icon: 'barcode_scanner', label: copy.add.scan, hint: copy.add.scanHint },
    { icon: 'photo_camera', label: copy.add.cover, hint: copy.add.coverHint },
    { icon: 'edit', label: copy.add.type },
  ];

  return (
    <View style={{ gap: space[4] }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {tile(
          copy.add.book,
          <View style={[{ width: 30, height: 42, backgroundColor: t.cover[0], boxShadow: shadow.xs }, coverRadius]} />,
          () => setBookOpen((o) => !o),
          bookOpen,
        )}
        {tile(
          copy.add.movie,
          <View
            style={{
              width: 42,
              height: 30,
              borderRadius: radius.xs,
              backgroundColor: t.cover[1],
              justifyContent: 'flex-end',
            }}
          >
            <View style={{ height: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: alpha.cream72 }} />
              ))}
            </View>
          </View>,
          later,
        )}
        {tile(
          copy.add.show,
          <View style={{ width: 42, height: 28, borderRadius: radius.sm, backgroundColor: t.cover[5] }} />,
          later,
        )}
      </View>
      {bookOpen && (
        <View style={{ gap: 10, marginTop: 6 }}>
          {methods.map((m) => {
            const lastUsed = m.hint === copy.add.scanHint;
            return (
              <Press
                key={m.label}
                accessibilityRole="button"
                accessibilityLabel={m.label}
                onPress={later}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  minHeight: 60,
                  paddingHorizontal: 16,
                  borderRadius: radius.lg,
                  backgroundColor: lastUsed ? t.surfaceAccentSoft : t.surfaceCard,
                  boxShadow: lastUsed ? shadow.md : shadow.xs,
                }}
              >
                <Icon name={m.icon} size={22} color="textAccent" />
                <View style={{ flex: 1 }}>
                  <Txt family="ui" weight={600} size="sm">
                    {m.label}
                  </Txt>
                </View>
                {m.hint && (
                  <Txt role="label" size={10} color="textMuted" style={{ letterSpacing: 0.4 }}>
                    {m.hint}
                  </Txt>
                )}
              </Press>
            );
          })}
        </View>
      )}
    </View>
  );
}
