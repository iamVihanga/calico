import type { TmdbMovie, TmdbShow } from '@shared/tmdb.ts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { Poster } from '@/components/calico/Poster';
import { RatingStars } from '@/components/calico/RatingStars';
import { Button } from '@/components/ds/Button';
import { Checkbox } from '@/components/ds/Checkbox';
import { Icon, type IconName } from '@/components/ds/Icon';
import { Input } from '@/components/ds/Input';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { newId } from '@/features/books/api';
import { useQueueBook } from '@/features/books/hooks';
import { byPosition } from '@/features/upnext/logic';
import { copy } from '@/i18n/en';
import { colomboToday, fmtShort } from '@/lib/dates';
import { openSheet, type SheetParams } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { layout, useTheme } from '@/theme';

import { fetchMovieDetails, tmdbKeys, useAddFromTmdb } from '../add';
import * as api from '../api';
import { mediaHref } from '../components/MediaTile';
import {
  MOVIES,
  useAddMedia,
  useCreateCollection,
  useDeleteMedia,
  useLogViewing,
  useMovie,
  useMovies,
  useShow,
  useShows,
} from '../hooks';
import { fmtRuntime, franchiseOthers } from '../logic';
import type { Movie } from '../types';

function Title({ children, size = 22 }: { children: string; size?: number }) {
  return (
    <Txt family="display" weight={700} size={size} style={{ letterSpacing: -0.02 * size }} accessibilityRole="header">
      {children}
    </Txt>
  );
}

/** TMDB preview (prototype sheetTmdbPreview): poster, meta, 3-line overview, Already watched / Add. */
export function TmdbPreviewSheetBody({ p, onClose }: { p: SheetParams['tmdbPreview']; onClose: () => void }) {
  const addFromTmdb = useAddFromTmdb();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const details = useQuery<TmdbMovie | TmdbShow>({
    queryKey: p.kind === 'movie' ? tmdbKeys.movie(p.tmdbId) : tmdbKeys.show(p.tmdbId),
    queryFn: () => (p.kind === 'movie' ? api.tmdbMovie(p.tmdbId) : api.tmdbShow(p.tmdbId)),
    staleTime: 60 * 60 * 1000,
  }).data;
  const movies = useMovies().data;
  const shows = useShows().data;
  const have = [...(movies ?? []), ...(shows ?? [])].find((x) => x.kind === p.kind && x.tmdbId === p.tmdbId);

  const meta = [
    p.year,
    details?.kind === 'movie'
      ? fmtRuntime(details.runtimeMin)
      : details?.kind === 'show' && details.numberOfSeasons
        ? copy.tmdb.seasons(details.numberOfSeasons)
        : null,
    details?.kind === 'movie' ? details.genres[0] : details?.kind === 'show' ? details.network : null,
  ]
    .filter(Boolean)
    .join('  ·  ');
  const overview = details?.overview ?? p.overview;

  const add = async (status: 'watchlist' | 'watched') => {
    setBusy(true);
    const id = await addFromTmdb(p, status);
    setBusy(false);
    if (id) onClose();
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Poster
          item={{ id: String(p.tmdbId), title: p.title, posterPath: p.posterPath }}
          kind={p.kind}
          size="w342"
          style={{ width: 88 }}
        />
        <View style={{ flex: 1 }}>
          <Title>{p.title}</Title>
          <Txt family="ui" size="2xs" color="textMuted">
            {meta}
          </Txt>
          {overview && (
            <Press
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityHint={expanded ? copy.tmdb.less : copy.tmdb.more}
              onPress={() => setExpanded((e) => !e)}
              scaleTo={1}
              style={{ marginTop: 8 }}
            >
              <Txt family="ui" size="xs" numberOfLines={expanded ? undefined : 3}>
                {overview}
              </Txt>
            </Press>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        {have ? (
          <Button
            variant="accent"
            block
            style={{ flex: 1, minHeight: 52 }}
            onPress={() => {
              onClose();
              router.push(mediaHref(have));
            }}
          >
            {copy.tmdb.open}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              block
              style={{ flex: 1, minHeight: 52 }}
              disabled={busy}
              testID="preview-watched"
              onPress={() => void add('watched')}
            >
              {copy.tmdb.alreadyWatched}
            </Button>
            <Button
              variant="accent"
              block
              style={{ flex: 1, minHeight: 52 }}
              loading={busy}
              testID="preview-add"
              onPress={() => void add('watchlist')}
            >
              {copy.tmdb.addWatchlist}
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

/** "IT is part of a 2-film series. Add the other one too?" (prototype sheetFranchise, plan §11.11). */
export function FranchiseSheetBody({ p, onClose }: { p: SheetParams['franchise']; onClose: () => void }) {
  const qc = useQueryClient();
  const add = useAddMedia();
  const createCollection = useCreateCollection();
  const [makeCollection, setMakeCollection] = useState(true);
  const [busy, setBusy] = useState(false);
  const c = useQuery({
    queryKey: tmdbKeys.collection(p.collectionId),
    queryFn: () => api.tmdbCollection(p.collectionId),
    staleTime: 24 * 60 * 60 * 1000,
  }).data;
  const movies = useMovies().data ?? [];
  if (!c) return null;
  const have = new Set(movies.map((m) => m.tmdbId));
  const others = franchiseOthers(c.parts, have, p.tmdbId);
  const title = c.parts.find((x) => x.tmdbId === p.tmdbId)?.title ?? c.name;

  const addAll = async () => {
    setBusy(true);
    const ids = new Map<number, string>([[p.tmdbId, p.itemId]]);
    for (const part of others) {
      const d = await fetchMovieDetails(qc, part.tmdbId).catch(() => part);
      const id = newId();
      add.mutate(api.newMediaFrom(d, id, 'watchlist'));
      ids.set(part.tmdbId, id);
    }
    if (makeCollection) {
      // Everything in the series you now have, in release order.
      const owned = qc.getQueryData<Movie[]>(MOVIES) ?? [];
      const items = c.parts
        .map((x) => ids.get(x.tmdbId) ?? owned.find((m) => m.tmdbId === x.tmdbId)?.id)
        .filter((x): x is string => !!x);
      const existing = await api.fetchCollectionPositions().catch(() => []);
      const last = [...existing].sort(byPosition).at(-1)?.position ?? null;
      createCollection.mutate({
        id: newId(),
        name: c.name,
        position: generateKeyBetween(last, null),
        items,
        positions: generateNKeysBetween(null, null, items.length),
      });
    }
    setBusy(false);
    onClose();
    toast({ message: copy.tmdb.addedAll(others.length, makeCollection ? c.name : null) });
  };

  return (
    <View style={{ gap: 12 }}>
      <Title size={20}>{copy.tmdb.franchise(title, c.parts.length, others.length)}</Title>
      <Checkbox label={copy.tmdb.alsoCollection(c.name)} checked={makeCollection} onChange={setMakeCollection} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button variant="secondary" block style={{ flex: 1, minHeight: 52 }} onPress={onClose}>
          {copy.tmdb.notNow}
        </Button>
        <Button
          variant="accent"
          block
          style={{ flex: 1, minHeight: 52 }}
          loading={busy}
          testID="franchise-add"
          onPress={() => void addAll()}
        >
          {copy.tmdb.addAll}
        </Button>
      </View>
    </View>
  );
}

/** Watched it (again): date, stars, one line (prototype sheetWatchAgain) → `log_viewing`. */
export function WatchAgainSheetBody({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const movie = useMovie(itemId).data;
  const log = useLogViewing();
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  if (!movie) return null;
  const today = colomboToday();
  return (
    <View style={{ gap: 8 }}>
      <Title>{movie.viewings.length ? copy.movies.watchAgain : copy.movies.watchFirst}</Title>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 }}>
        <Txt family="ui" size={14}>
          {copy.movies.date}
        </Txt>
        <Txt family="ui" size={14} color="textMuted">
          {copy.finish.today(fmtShort(today))}
        </Txt>
      </View>
      <RatingStars value={rating} onChange={setRating} />
      <Input
        multiline
        rows={2}
        value={note}
        onChange={setNote}
        placeholder={copy.movies.notePlaceholder}
        accessibilityLabel={copy.movies.notePlaceholder}
        testID="viewing-note"
      />
      <Button
        variant="accent"
        size="lg"
        block
        style={{ marginTop: 8 }}
        testID="viewing-save"
        onPress={() => {
          log.mutate({ id: newId(), itemId, on: today, rating: rating || null, note: note.trim() || null });
          onClose();
          toast({ message: copy.movies.saved });
        }}
      >
        {copy.movies.save}
      </Button>
    </View>
  );
}

/** ⋯ on movie and show detail: Up next, Share, Delete (with an in-sheet confirm). */
export function MediaOverflowSheetBody({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { t } = useTheme();
  const movie = useMovie(itemId).data;
  const show = useShow(itemId).data;
  const item = movie ?? show;
  const queue = useQueueBook();
  const del = useDeleteMedia();
  const [confirm, setConfirm] = useState(false);
  if (!item) return null;

  if (confirm) {
    return (
      <View style={{ gap: 8 }}>
        <Title>{copy.overflow.confirmDelete(item.title)}</Title>
        <Txt family="ui" size="xs" color="textMuted">
          {item.kind === 'movie' ? copy.mediaOverflow.deleteMovieBody : copy.mediaOverflow.deleteShowBody}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <Button variant="secondary" block style={{ flex: 1, minHeight: 52 }} onPress={() => setConfirm(false)}>
            {copy.mediaOverflow.keep}
          </Button>
          <Button
            variant="danger"
            block
            style={{ flex: 1, minHeight: 52 }}
            testID="media-delete-confirm"
            onPress={() => {
              del.mutate({ itemId });
              onClose();
              router.back();
              toast({ message: copy.overflow.deleted(item.title) });
            }}
          >
            {copy.overflow.delete}
          </Button>
        </View>
      </View>
    );
  }

  const rows: { icon: IconName; label: string; run: () => void; testID?: string }[] = [
    {
      icon: 'playlist_add',
      label: copy.overflow.upNext,
      run: () => {
        onClose();
        void queue(itemId);
      },
    },
    {
      icon: 'category',
      label: copy.overflow.addCollection,
      run: () => openSheet('addToCollection', { itemId, title: item.title }),
    },
    {
      icon: 'share',
      label: copy.overflow.share,
      run: () => {
        onClose();
        void Share.share({ message: item.year ? `${item.title} (${item.year})` : item.title });
      },
    },
    { icon: 'delete', label: copy.overflow.delete, testID: 'media-delete', run: () => setConfirm(true) },
  ];
  return (
    <View style={{ marginHorizontal: -layout.gutterScreen }}>
      {rows.map((o) => (
        <Press
          key={o.label}
          accessibilityRole="button"
          testID={o.testID}
          onPress={o.run}
          scaleTo={1}
          pressedStyle={{ backgroundColor: t.surfaceQuiet }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingHorizontal: 20 }}
        >
          <Icon name={o.icon} size={20} color="textAccent" />
          <Txt family="ui" size="sm">
            {o.label}
          </Txt>
        </Press>
      ))}
    </View>
  );
}
