import { onlineManager } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverReadingAnimation, FIELD_STAGGER_MS } from '@/components/calico/CoverReadingAnimation';
import { Button } from '@/components/ds/Button';
import { Txt } from '@/components/ds/Txt';
import { ABORT_AFTER_MS, extractBook, ExtractError, SLOW_AFTER_MS, uploadCover } from '@/features/capture/api';
import { saveDraft } from '@/features/capture/drafts';
import { capture, useCaptureStore } from '@/features/capture/store';
import { copy } from '@/i18n/en';
import { toast } from '@/lib/stores/toast';
import { layout, radius, useTheme } from '@/theme';

/** "Reading the cover" (prototype `reading`, plan §9.6 steps 4–5). */
export default function Reading() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const front = useCaptureStore((s) => s.front);
  const extraction = useCaptureStore((s) => s.extraction);
  const [slow, setSlow] = useState(false);
  const [done, setDone] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  const left = useRef(false);

  const toReview = (delay = 0) => {
    setTimeout(() => {
      if (left.current) return;
      left.current = true;
      router.replace({ pathname: '/capture/review', params: { from: 'cover' } });
    }, delay);
  };

  useEffect(() => {
    const goOffline = async () => {
      await saveDraft(capture());
      left.current = true;
      router.dismissTo('/');
      toast({ message: copy.capture.offline });
    };

    const run = async () => {
      const d = capture();
      if (!d.front) return toReview();
      if (!onlineManager.isOnline()) return goOffline();

      let paths: string[];
      try {
        const frontPath = await uploadCover(d.itemId, 'front', d.front);
        const backPath = d.back ? await uploadCover(d.itemId, 'back', d.back) : null;
        capture().patch({ frontPath, backPath });
        paths = [frontPath, ...(backPath ? [backPath] : [])];
      } catch {
        return goOffline();
      }

      const c = new AbortController();
      ctrl.current = c;
      const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
      const abortTimer = setTimeout(() => c.abort(), ABORT_AFTER_MS);
      try {
        const { fields } = await extractBook(d.itemId, paths, c.signal);
        capture().patch({ extraction: fields, error: null });
        setDone(true);
        toReview(4 * FIELD_STAGGER_MS + 700); // let the fields fill in first
      } catch (e) {
        if (left.current) return;
        const code = e instanceof ExtractError ? e.code : 'ai_failed';
        if (code === 'offline') return goOffline();
        if (code === 'daily_limit') {
          capture().patch({ error: 'daily_limit', resetsAt: e instanceof ExtractError ? e.resetsAt : null });
          toast({ message: copy.capture.dailyLimit });
        } else {
          capture().patch({ error: 'ai_failed' });
          toast({ message: copy.capture.aiFailed });
        }
        toReview();
      } finally {
        clearTimeout(slowTimer);
        clearTimeout(abortTimer);
      }
    };
    void run();
    return () => {
      left.current = true;
      ctrl.current?.abort();
    };
  }, []);

  const fields = [
    { label: copy.review.titleSi, value: extraction?.title_native ?? '' },
    { label: copy.review.titleEn, value: extraction?.title_romanized ?? '' },
    { label: copy.review.authorSi, value: extraction?.author_native ?? '' },
    { label: copy.review.authorEn, value: extraction?.author_romanized ?? '' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{ paddingTop: insets.top + 22, paddingHorizontal: layout.gutterScreen, paddingBottom: 40 }}
      testID="screen-reading"
    >
      <CoverReadingAnimation cover={front} fields={fields} done={done} />
      {slow && !done && (
        <View style={{ marginTop: 24, padding: 16, backgroundColor: t.statusWarningSoft, borderRadius: radius.lg }}>
          <Txt family="ui" size={14} tint={t.inkOnWarm}>
            {copy.capture.slow}
          </Txt>
          <Button
            variant="secondary"
            style={{ marginTop: 12 }}
            onPress={() => {
              ctrl.current?.abort();
              toReview();
            }}
          >
            {copy.capture.fillMyself}
          </Button>
        </View>
      )}
    </ScrollView>
  );
}
