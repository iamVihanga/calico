import { useState } from 'react';
import { View } from 'react-native';

import { WhenChooser } from '@/components/calico/WhenChooser';
import { Button } from '@/components/ds/Button';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { colomboToday } from '@/lib/dates';
import { toast } from '@/lib/stores/toast';
import { JUST_NOW, type When, whenVars } from '@/lib/when';

import { useIncludeSpecials, useMarkShowWatched, useProgress, useShow } from '../hooks';
import { seasonsOf } from '../logic';
import type { Show } from '../types';
import { useShowMarker } from '../useShowMarker';

type Props = { itemId: string; season?: number; onClose: () => void };

/**
 * "When did you watch it?" before marking a whole season, or a whole show switched to Watched by hand
 * (every aired episode is ticked on that date, then the show is Watched).
 */
export function WatchedWhenSheetBody({ itemId, season, onClose }: Props) {
  const show = useShow(itemId).data;
  if (!show) return null;
  return <WatchedWhen show={show} season={season} onClose={onClose} />;
}

function WatchedWhen({ show, season, onClose }: { show: Show; season?: number; onClose: () => void }) {
  const progress = useProgress(show);
  const specials = useIncludeSpecials();
  const marker = useShowMarker(show);
  const markShow = useMarkShowWatched();
  const [when, setWhen] = useState<When>(JUST_NOW);
  const s =
    season !== undefined && progress ? seasonsOf(progress.episodes, specials).find((x) => x.n === season) : null;
  if (season !== undefined && !s) return null;

  const save = () => {
    const w = whenVars(when, colomboToday());
    onClose();
    if (s) {
      marker.fillSeason(s, w);
      return;
    }
    markShow.mutate({ itemId: show.id, forceWatched: true, ...w });
    toast({ message: copy.books.statusChanged(show.title, copy.mediaStatus.watched) });
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Txt family="display" weight={700} size={22} accessibilityRole="header">
          {copy.when.watchedTitle}
        </Txt>
        <Txt family="ui" size="xs" color="textMuted">
          {s ? copy.shows.fillSeason(copy.shows.season(s.n)) : copy.when.allEpisodes(show.title)}
        </Txt>
      </View>
      <WhenChooser value={when} onChange={setWhen} testID="watched-when" />
      <Button variant="accent" size="lg" block testID="watched-when-save" onPress={save}>
        {copy.when.save}
      </Button>
    </View>
  );
}
