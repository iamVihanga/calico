import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { Input } from '@/components/ds/Input';
import { DetailLoadState } from '@/components/ds/LoadState';
import { Select } from '@/components/ds/Select';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { useBook, useLeadScript, useUpdateBook } from '@/features/books/hooks';
import { leadTitle } from '@/features/books/logic';
import { type EditForm, editSchema } from '@/features/books/schema';
import type { Book } from '@/features/books/types';
import { copy } from '@/i18n/en';
import { toast } from '@/lib/stores/toast';
import { layout, useTheme } from '@/theme';

const TEXT_FIELDS = ['titleNative', 'title', 'authorNative', 'author'] as const;

/** Edit details (book overflow menu): titles, authors, language, pages, format. */
export default function EditBook() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useBook(id);
  if (!q.data) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 8, backgroundColor: t.surfacePage }}>
        <View style={{ paddingHorizontal: 16 }}>
          <IconButton icon="arrow_back" label={copy.books.back} tone="card" onPress={() => router.back()} />
        </View>
        <DetailLoadState q={q} />
      </View>
    );
  }
  return <EditBody book={q.data} />;
}

function EditBody({ book }: { book: Book }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const lead = useLeadScript();
  const update = useUpdateBook();
  const { control, handleSubmit, setError } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      titleNative: book.titleNative ?? '',
      title: book.title,
      authorNative: book.authorNative ?? '',
      author: book.author ?? '',
      language: book.language,
      pages: book.totalPages ? String(book.totalPages) : '',
      format: book.format,
    },
  });

  const save = handleSubmit((v) => {
    const pages = v.pages ? Number(v.pages) : null;
    if (pages !== null && pages < book.currentPage) {
      setError('pages', { message: copy.edit.pagesBelow(book.currentPage) });
      return;
    }
    const title = v.title || v.titleNative;
    update.mutate({
      itemId: book.id,
      edit: {
        title,
        titleNative: v.titleNative,
        author: v.author,
        authorNative: v.authorNative,
        language: v.language,
        totalPages: pages,
        format: v.format,
      },
    });
    router.back();
    toast({ message: copy.edit.saved(leadTitle({ title, titleNative: v.titleNative || null }, lead).main) });
  });

  const labels = {
    titleNative: copy.review.titleSi,
    title: copy.review.titleEn,
    authorNative: copy.review.authorSi,
    author: copy.review.authorEn,
  };
  const nativeFirst = !!book.titleNative || book.language === 'Sinhala';
  const order = nativeFirst ? TEXT_FIELDS : (['title', 'titleNative', 'author', 'authorNative'] as const);

  return (
    <KeyboardAvoidingView behavior="height" style={{ flex: 1, backgroundColor: t.surfacePage }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingTop: insets.top + 8,
          paddingBottom: 8,
          paddingHorizontal: 10,
          borderBottomWidth: 1,
          borderBottomColor: t.borderHairline,
        }}
      >
        <IconButton icon="arrow_back" label={copy.books.back} onPress={() => router.back()} />
        <Txt family="display" weight={700} size="lg" accessibilityRole="header">
          {copy.edit.title}
        </Txt>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          gap: 18,
          paddingTop: 20,
          paddingHorizontal: layout.gutterScreen,
          paddingBottom: insets.bottom + 40,
        }}
        testID="screen-edit-book"
      >
        {order.map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field, fieldState }) => (
              <Input
                label={labels[name]}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                maxLength={300}
                testID={`edit-${name}`}
              />
            )}
          />
        ))}
        <Controller
          control={control}
          name="language"
          render={({ field }) => (
            <Select
              label={copy.review.language}
              value={field.value}
              onChange={field.onChange}
              options={copy.review.languages.map((l) => ({ value: l, label: l }))}
            />
          )}
        />
        <Controller
          control={control}
          name="pages"
          render={({ field, fieldState }) => (
            <Input
              label={copy.review.pages}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              keyboardType="number-pad"
              maxLength={5}
              testID="edit-pages"
            />
          )}
        />
        <View>
          <Txt role="label" size={10} color="textMuted" style={{ marginBottom: 8 }}>
            {copy.review.format}
          </Txt>
          <Controller
            control={control}
            name="format"
            render={({ field }) => (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['physical', 'ebook', 'audiobook'] as const).map((f) => (
                  <Tag
                    key={f}
                    selected={field.value === f}
                    onPress={() => field.onChange(f)}
                    testID={`edit-format-${f}`}
                  >
                    {copy.books.format[f]}
                  </Tag>
                ))}
              </View>
            )}
          />
        </View>
        <Button variant="accent" size="lg" block onPress={save} testID="edit-save">
          {copy.review.save}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
