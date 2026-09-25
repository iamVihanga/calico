import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Confidence, ConfidenceField } from '@/components/calico/ConfidenceField';
import { coverRadius, GeneratedCover } from '@/components/calico/GeneratedCover';
import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { Select } from '@/components/ds/Select';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { type NewBook, newId } from '@/features/books/api';
import { useBooks, useCreateBook, useFinishBook } from '@/features/books/hooks';
import { statusLabel } from '@/features/books/logic';
import { DUE_CHOICES, type ReviewForm, reviewSchema, SOURCES, statusOptions } from '@/features/books/schema';
import { removeDraft } from '@/features/capture/drafts';
import {
  CONFIDENCE_OF,
  fieldOrder,
  findDuplicate,
  formFromExtraction,
  formFromLookup,
  isLowConfidence,
} from '@/features/capture/logic';
import { capture, type Draft } from '@/features/capture/store';
import { maybeAskForReminders } from '@/features/loans/sheets/LoanSheets';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import { addLocalDays, colomboToday, fmtShort } from '@/lib/dates';
import { toast } from '@/lib/stores/toast';
import { layout, radius, shadow, useTheme } from '@/theme';

function Label({ children }: { children: string }) {
  return (
    <Txt role="label" size={10} color="textMuted" style={{ marginBottom: 8 }}>
      {children}
    </Txt>
  );
}

/**
 * Review form (prototype `review`, brief §7.5.4). Manual entry (`?manual=1`, optional `?title=`), or
 * filled from the capture draft: `?from=cover` (AI reading, with ✦ / dotted confidence states),
 * `?from=barcode` (ISBN lookup) or `?from=draft` (an offline capture read later).
 */
export default function Review() {
  const params = useLocalSearchParams<{ title?: string; from?: 'cover' | 'barcode' | 'draft' }>();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile().data;
  const updateProfile = useUpdateProfile();
  const create = useCreateBook();
  const finish = useFinishBook();
  // The capture draft is read once: it belongs to this form from now on.
  const [draft] = useState<Draft | null>(() => (params.from ? { ...capture() } : null));
  const extraction = draft?.extraction ?? null;
  const lookup = draft?.lookup ?? null;
  const itemId = useMemo(() => draft?.itemId ?? newId(), [draft]);
  const books = useBooks().data ?? [];
  const today = colomboToday();
  const defaultDue = (DUE_CHOICES as readonly number[]).includes(profile?.default_loan_days ?? 0)
    ? (profile!.default_loan_days as ReviewForm['dueDays'])
    : 14;

  const { control, handleSubmit, setValue, formState } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      titleNative: '',
      title: params.title ?? '',
      authorNative: '',
      author: '',
      language: 'English',
      pages: '',
      format: 'physical',
      source: 'bought',
      party: profile?.default_library ?? '',
      dueDays: defaultDue,
      priority: 'soon',
      price: '',
      // F2: a scanned bought book defaults to To read; a book you're holding defaults to Reading.
      status: params.from === 'barcode' ? 'to_read' : 'reading',
      ...(lookup?.found ? formFromLookup(lookup) : {}),
      ...(extraction ? formFromExtraction(extraction) : {}),
    },
  });
  const [source, title, titleNative, dueDays, status] = useWatch({
    control,
    name: ['source', 'title', 'titleNative', 'dueDays', 'status'],
  });
  const statuses = statusOptions(source);
  const duplicate = findDuplicate(books, title, titleNative);

  /** ✦ when the AI filled the field; dotted underline when it isn't sure. */
  const confidenceOf = (name: string): Confidence => {
    const key = CONFIDENCE_OF[name];
    if (!extraction || !key) return 'manual';
    const value = extraction[key as keyof typeof extraction];
    if (value === null || value === undefined) return 'manual';
    return isLowConfidence(extraction.confidence[key]) ? 'low' : 'ai';
  };

  // Switching source: keep the status valid (Read isn't offered for borrowed books) and reset the lender.
  useEffect(() => {
    if (statuses.length && !statuses.includes(status)) setValue('status', 'to_read');
    setValue('party', source === 'library' ? (profile?.default_library ?? '') : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on source change
  }, [source]);

  const save = handleSubmit((v) => {
    const pages = v.pages ? Number(v.pages) : undefined;
    const finalStatus = v.source === 'wishlist' ? 'wishlist' : statuses.includes(v.status) ? v.status : 'to_read';
    const book: NewBook = {
      id: itemId,
      // A book added as Read is created To read, then finished, so it gets a proper reading session.
      status: finalStatus === 'read' ? 'to_read' : finalStatus,
      title: v.title || v.titleNative,
      titleNative: v.titleNative || undefined,
      author: v.author || undefined,
      authorNative: v.authorNative || undefined,
      language: v.language,
      totalPages: pages,
      format: v.format,
      ownership: v.source === 'bought' ? 'owned' : v.source === 'wishlist' ? 'none' : v.source,
      wishlistPriority: v.source === 'wishlist' ? v.priority : undefined,
      wishlistPriceLkr: v.source === 'wishlist' && v.price ? Number(v.price) : undefined,
      coverPath: draft?.frontPath ?? undefined,
      coverUrl: !draft?.frontPath && lookup?.coverUrl ? lookup.coverUrl : undefined,
      isbn: extraction?.isbn ?? draft?.isbn ?? undefined,
      publisher: extraction?.publisher ?? lookup?.publisher ?? undefined,
      publishedYear: extraction?.published_year ?? lookup?.year ?? undefined,
      aiExtracted: !!extraction,
      loan:
        v.source === 'library' || v.source === 'friend'
          ? {
              id: newId(),
              party: v.party || (v.source === 'library' ? copy.review.sources.library : copy.review.sources.friend),
              borrowedOn: today,
              dueOn: v.source === 'library' ? addLocalDays(today, v.dueDays) : undefined,
            }
          : undefined,
    };
    create.mutate(book);
    if (book.loan && v.source === 'library') {
      // The library name is remembered for next time; the first library loan offers reminders.
      if (!profile?.default_library) updateProfile.mutate({ default_library: book.loan.party });
      void maybeAskForReminders();
    }
    if (finalStatus === 'read') {
      finish.mutate({ itemId, on: today, rating: null, note: null, returnLoan: false });
    }
    const shown = v.titleNative && profile?.lead_script === 'si' ? v.titleNative : book.title;
    if (draft) {
      removeDraft(itemId);
      capture().start(); // fresh draft for the next capture
      router.dismissTo('/');
    } else {
      router.back();
    }
    toast({
      message: copy.review.added(shown),
      action: { label: copy.finish.open, onPress: () => router.push(`/book/${itemId}`) },
    });
  });

  const chips = <V extends string | number>(
    name: 'format' | 'source' | 'dueDays' | 'priority' | 'status',
    options: readonly { value: V; label: string }[],
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {options.map((o) => (
            <Tag
              key={String(o.value)}
              selected={field.value === o.value}
              onPress={() => field.onChange(o.value)}
              testID={`${name}-${o.value}`}
            >
              {o.label}
            </Tag>
          ))}
        </View>
      )}
    />
  );

  const field = (
    name: 'titleNative' | 'title' | 'authorNative' | 'author' | 'pages' | 'party' | 'price',
    label: string,
    extra?: { numeric?: boolean; placeholder?: string },
  ) => (
    <Controller
      key={name}
      control={control}
      name={name}
      render={({ field: f, fieldState }) => (
        <ConfidenceField
          confidence={confidenceOf(name)}
          label={label}
          value={f.value}
          onChange={f.onChange}
          onBlur={f.onBlur}
          error={fieldState.error?.message}
          keyboardType={extra?.numeric ? 'number-pad' : 'default'}
          placeholder={extra?.placeholder}
          testID={`review-${name}`}
        />
      )}
    />
  );

  return (
    <KeyboardAvoidingView behavior="height" style={{ flex: 1, backgroundColor: t.surfacePage }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + 8,
          paddingBottom: 8,
          paddingHorizontal: 10,
          backgroundColor: t.surfacePage,
          borderBottomWidth: 1,
          borderBottomColor: t.borderHairline,
        }}
      >
        <IconButton icon="arrow_back" label={copy.books.back} onPress={() => router.back()} />
        <Txt family="display" weight={700} size="lg" accessibilityRole="header">
          {copy.review.title}
        </Txt>
        <Press
          accessibilityRole="button"
          onPress={save}
          style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center' }}
        >
          <Txt family="ui" weight={700} size="sm" color="textAccent">
            {copy.review.save}
          </Txt>
        </Press>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: layout.gutterScreen, paddingBottom: insets.bottom + 40 }}
        testID="screen-review"
      >
        <View style={{ flexDirection: 'row', gap: 16, paddingTop: 20, paddingBottom: 4 }}>
          {draft?.front || lookup?.coverUrl ? (
            <View style={[{ width: 80, height: 120, boxShadow: shadow.cover, overflow: 'hidden' }, coverRadius]}>
              <Image
                accessibilityLabel={copy.capture.coverPhoto}
                source={{ uri: draft?.front ?? lookup?.coverUrl ?? undefined }}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          ) : (
            <GeneratedCover
              seed={itemId}
              title={titleNative || title || '…'}
              width={80}
              height={120}
              showAuthor={false}
            />
          )}
          <View style={{ flex: 1 }}>
            <Txt family="hand" weight={400} size={19} leading={1.25} color="textMuted">
              {copy.review.hint}
            </Txt>
            {params.from === 'cover' && !draft?.back && (
              <Press
                accessibilityRole="button"
                testID="review-add-back"
                // Replace: the back photo comes round to a fresh Review with both photos read.
                onPress={() => router.replace({ pathname: '/capture/camera', params: { mode: 'back' } })}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 12,
                  minHeight: 44,
                  paddingHorizontal: 14,
                  justifyContent: 'center',
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: t.borderStrong,
                }}
              >
                <Txt family="ui" weight={600} size="xs" color="textSecondary">
                  {copy.capture.addBack}
                </Txt>
              </Press>
            )}
          </View>
        </View>

        {duplicate && (
          <View
            testID="review-duplicate"
            style={{
              marginTop: 14,
              padding: 14,
              paddingHorizontal: 16,
              backgroundColor: t.statusWarningSoft,
              borderRadius: radius.md,
            }}
          >
            <Txt family="ui" size="xs" tint={t.inkOnWarm}>
              {copy.capture.duplicate(
                duplicate.titleNative && profile?.lead_script === 'si' ? duplicate.titleNative : duplicate.title,
                statusLabel(duplicate.status),
                duplicate.finishedAt?.slice(0, 4) ?? '',
              )}
            </Txt>
            <Press
              accessibilityRole="link"
              onPress={() => router.push(`/book/${duplicate.id}`)}
              style={{ minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start' }}
            >
              <Txt family="ui" weight={700} size="xs" color="textAccent">
                {copy.capture.openExisting}
              </Txt>
            </Press>
          </View>
        )}

        <View style={{ gap: 18, paddingTop: 18 }}>
          {fieldOrder(extraction?.script_on_cover).map((k) =>
            field(
              k,
              {
                titleNative: copy.review.titleSi,
                title: copy.review.titleEn,
                authorNative: copy.review.authorSi,
                author: copy.review.authorEn,
              }[k],
            ),
          )}
          <Controller
            control={control}
            name="language"
            render={({ field: f }) => (
              <Select
                label={copy.review.language}
                value={f.value}
                onChange={f.onChange}
                options={copy.review.languages.map((l) => ({ value: l, label: l }))}
              />
            )}
          />
          {field('pages', copy.review.pages, { numeric: true })}

          <View>
            <Label>{copy.review.format}</Label>
            {chips(
              'format',
              (['physical', 'ebook', 'audiobook'] as const).map((f) => ({ value: f, label: copy.books.format[f] })),
            )}
          </View>

          <View>
            <Txt family="display" weight={700} size="lg" style={{ marginBottom: 10 }}>
              {copy.review.whereFrom}
            </Txt>
            {chips(
              'source',
              SOURCES.map((s) => ({ value: s, label: copy.review.sources[s] })),
            )}
          </View>

          {source === 'library' && (
            <View style={{ gap: 14, padding: 16, backgroundColor: t.surfacePageWarm, borderRadius: radius.lg }}>
              {field('party', copy.review.libraryName)}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Label>{copy.review.borrowed}</Label>
                  <Txt family="ui" size="sm">
                    {copy.review.todayDate(fmtShort(today))}
                  </Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Label>{copy.review.due}</Label>
                  <Txt family="ui" weight={700} size="sm" color="textAccent" testID="review-due">
                    {fmtShort(addLocalDays(today, dueDays))}
                  </Txt>
                </View>
              </View>
              {chips(
                'dueDays',
                DUE_CHOICES.map((d) => ({ value: d, label: `+${d}` })),
              )}
            </View>
          )}

          {source === 'friend' && (
            <View style={{ padding: 16, backgroundColor: t.surfacePageWarm, borderRadius: radius.lg }}>
              {field('party', copy.review.friendName)}
            </View>
          )}

          {source === 'wishlist' && (
            <View style={{ gap: 12, padding: 16, backgroundColor: t.surfacePageWarm, borderRadius: radius.lg }}>
              <Label>{copy.review.priority}</Label>
              {chips(
                'priority',
                (['someday', 'soon', 'must'] as const).map((p) => ({ value: p, label: copy.review.priorities[p] })),
              )}
              {field('price', copy.review.price, { numeric: true })}
            </View>
          )}

          {statuses.length > 0 && (
            <View>
              <Label>{copy.review.status}</Label>
              {chips(
                'status',
                statuses.map((s) => ({ value: s, label: statusLabel(s) })),
              )}
            </View>
          )}

          <Button variant="accent" size="lg" block testID="review-add" onPress={save} disabled={formState.isSubmitting}>
            {copy.review.add}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
