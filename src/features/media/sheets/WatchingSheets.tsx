import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Poster } from '@/components/calico/Poster';
import { Button } from '@/components/ds/Button';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { colomboToday, daysBetween, fmtDay } from '@/lib/dates';
import { qk } from '@/lib/queryKeys';
import { openSheet } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { radius, shadow, useTheme } from '@/theme';

import { useSetOnHold, useShowProgress, useShows } from '../hooks';
import { countdown, epCode, upcomingShows } from '../logic';
import type { Episode, Show } from '../types';

const openShow = (id: string, onClose: () => void) => {
  onClose();
  router.push(`/show/${id}`);
};

/** Home's "Coming up": caught-up shows by their next air date (with a countdown), then those without one. */
export function UpcomingSheetBody({ onClose }: { onClose: () => void }) {
  const shows = useShows().data ?? [];
  const progress = useShowProgress().data ?? [];
  const { dated, undated } = upcomingShows(shows, progress);
  const today = colomboToday();
  return (
    <View style={{ gap: 12 }} testID="upcoming-sheet">
      {dated.map((s) => (
        <DatedRow key={s.id} show={s} today={today} onPress={() => openShow(s.id, onClose)} />
      ))}
      {undated.length > 0 && (
        <View style={{ gap: 4, marginTop: dated.length ? 10 : 0 }}>
          <Txt family="display" weight={700} size={17} accessibilityRole="header" style={{ marginBottom: 4 }}>
            {copy.upcoming.noDate}
          </Txt>
          {undated.map((s) => (
            <UndatedRow key={s.id} show={s} onPress={() => openShow(s.id, onClose)} />
          ))}
        </View>
      )}
    </View>
  );
}

function DatedRow({ show, today, onPress }: { show: Show; today: string; onPress: () => void }) {
  const { t } = useTheme();
  const qc = useQueryClient();
  const date = show.nextAirDate!;
  const when = countdown(date, today);
  const soon = daysBetween(today, date) <= 7;
  const code = show.nextSeason !== null && show.nextEpisode !== null ? epCode(show.nextSeason, show.nextEpisode) : null;
  // The episode's name when the show's episode list is cached (it was opened before).
  const name = qc
    .getQueryData<Episode[]>(qk.episodes(show.tmdbId))
    ?.find((e) => e.season === show.nextSeason && e.episode === show.nextEpisode)?.name;
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={copy.upcoming.rowA11y(show.title, code, `${when}, ${fmtDay(date)}`)}
      onPress={onPress}
      scaleTo={0.98}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 12,
        borderRadius: radius.lg,
        backgroundColor: t.surfaceCard,
        boxShadow: shadow.sm,
      }}
      testID={`upcoming-${show.id}`}
    >
      <Poster item={show} kind="show" titleSize={9} style={{ width: 58 }} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Txt family="display" weight={700} size={17} leading={1.2} numberOfLines={2}>
          {show.title}
        </Txt>
        {code && (
          <Txt family="ui" weight={700} size="xs" color="textAccent" numberOfLines={1}>
            {name ? `${code}  ${name}` : code}
          </Txt>
        )}
        {!!show.network && (
          <Txt family="ui" size="2xs" color="textMuted" numberOfLines={1}>
            {show.network}
          </Txt>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <View
          style={{
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: radius.pill,
            backgroundColor: soon ? t.surfaceAccentSoft : t.surfaceSunk,
          }}
        >
          <Txt family="ui" weight={700} size="3xs" color={soon ? 'textAccent' : 'textSecondary'}>
            {fmtDay(date)}
          </Txt>
        </View>
        <Txt
          family="hand"
          weight={400}
          size={18}
          color={soon ? 'textAccent' : 'textMuted'}
          testID={`upcoming-when-${show.id}`}
        >
          {when}
        </Txt>
      </View>
    </Press>
  );
}

function UndatedRow({ show, onPress }: { show: Show; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={copy.upcoming.rowA11y(show.title, null, copy.upcoming.notAnnounced)}
      onPress={onPress}
      scaleTo={1}
      pressedStyle={{ opacity: 0.7 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: t.borderHairline,
      }}
      testID={`upcoming-undated-${show.id}`}
    >
      <Poster item={show} kind="show" titleSize={7} shadowed={false} style={{ width: 38 }} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt family="ui" weight={600} size={15} numberOfLines={1}>
          {show.title}
        </Txt>
        <Txt family="ui" size="2xs" color="textMuted" numberOfLines={1}>
          {show.network ? `${copy.upcoming.notAnnounced} · ${show.network}` : copy.upcoming.notAnnounced}
        </Txt>
      </View>
    </Press>
  );
}

/** Shows put on hold from Home: each with Back; tapping one opens its next episode (or the show). */
export function OnHoldSheetBody({ onClose }: { onClose: () => void }) {
  const shows = useShows().data ?? [];
  const progress = useShowProgress().data ?? [];
  const setOnHold = useSetOnHold().mutate;
  const byId = new Map(progress.map((p) => [p.itemId, p]));
  const held = shows.filter((s) => s.status === 'watching' && s.onHold).sort((a, b) => a.title.localeCompare(b.title));
  // The last one brought back: nothing left to show.
  useEffect(() => {
    if (held.length === 0) onClose();
  }, [held.length, onClose]);

  return (
    <View style={{ gap: 8 }} testID="on-hold-sheet">
      <Txt family="hand" weight={400} size={17} color="textMuted" style={{ marginBottom: 4 }}>
        {copy.onHold.hint}
      </Txt>
      {held.map((s) => {
        const next = byId.get(s.id)?.next ?? null;
        const code = next ? epCode(next.season, next.episode) : null;
        return (
          <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} testID={`on-hold-${s.id}`}>
            <Press
              accessibilityRole="button"
              accessibilityLabel={code ? `${s.title}, ${code}` : s.title}
              onPress={() =>
                next
                  ? openSheet('episode', { itemId: s.id, season: next.season, episode: next.episode, showLink: true })
                  : openShow(s.id, onClose)
              }
              scaleTo={1}
              pressedStyle={{ opacity: 0.7 }}
              style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}
              testID={`on-hold-open-${s.id}`}
            >
              <Poster item={s} kind="show" titleSize={7} shadowed={false} style={{ width: 42 }} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Txt family="ui" weight={600} size={15} numberOfLines={1}>
                  {s.title}
                </Txt>
                <Txt family="ui" weight={700} size="2xs" color={code ? 'textAccent' : 'textMuted'} numberOfLines={1}>
                  {next?.name ? `${code}  ${next.name}` : (code ?? copy.onHold.caughtUp)}
                </Txt>
              </View>
            </Press>
            <Button
              variant="secondary"
              size="sm"
              accessibilityLabel={copy.onHold.backA11y(s.title)}
              testID={`on-hold-back-${s.id}`}
              onPress={() => {
                setOnHold({ itemId: s.id, on: false });
                toast({ message: copy.onHold.backDone(s.title) });
              }}
            >
              {copy.onHold.backShort}
            </Button>
          </View>
        );
      })}
    </View>
  );
}
