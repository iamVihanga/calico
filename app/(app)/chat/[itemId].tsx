import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Illustration } from '@/components/calico/Illustration';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { SegmentedControl } from '@/components/ds/SegmentedControl';
import { Switch } from '@/components/ds/Switch';
import { TextField } from '@/components/ds/TextField';
import { Txt } from '@/components/ds/Txt';
import type { ChatLanguage, ChatMessage } from '@/features/media/chat/api';
import { useChat, useChatPrefs, useClearChat, useSendChat } from '@/features/media/chat/hooks';
import { useMovie, useShow } from '@/features/media/hooks';
import { copy } from '@/i18n/en';
import { useOnline } from '@/lib/useOnline';
import { fontFamily, layout, radius, shadow, useTheme } from '@/theme';

const LANGUAGES = (['en', 'si'] as const).map((id) => ({ id, label: copy.chat.languages[id] }));

/**
 * Ask Calico about a movie or show: an AI overview and chat (media-chat edge function), with the
 * conversation as memory, English or Sinhala replies and spoiler-safe answers unless switched off.
 */
export default function Chat() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const online = useOnline();
  const movie = useMovie(itemId).data;
  const show = useShow(itemId).data;
  const title = movie?.title ?? show?.title ?? '';
  const chat = useChat(itemId);
  const send = useSendChat(itemId);
  const clear = useClearChat(itemId);
  const [prefs, setPrefs] = useChatPrefs(itemId);
  const [draft, setDraft] = useState('');
  const list = useRef<FlatList<ChatMessage>>(null);
  const messages = chat.data ?? [];
  const thinking = send.isPending;

  useEffect(() => {
    if (messages.length) requestAnimationFrame(() => list.current?.scrollToEnd({ animated: true }));
  }, [messages.length, thinking]);

  const ask = (text: string) => {
    const message = text.trim();
    if (!message || thinking || !online) return;
    setDraft('');
    send.mutate({ itemId, message, language: prefs.language, spoilers: prefs.spoilers });
  };

  const confirmClear = () =>
    Alert.alert(copy.chat.clearTitle, copy.chat.clearBody, [
      { text: copy.chat.cancel, style: 'cancel' },
      { text: copy.chat.clear, style: 'destructive', onPress: () => clear.mutate({ itemId }) },
    ]);

  const prompts = [
    copy.chat.prompts.overview,
    ...(show ? [copy.chat.prompts.recap] : []),
    copy.chat.prompts.cast,
    copy.chat.prompts.worth,
  ];

  return (
    <KeyboardAvoidingView behavior="height" style={{ flex: 1, backgroundColor: t.surfacePage }} testID="screen-chat">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingTop: insets.top + 8,
          paddingHorizontal: 12,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: t.borderHairline,
        }}
      >
        <IconButton icon="arrow_back" label={copy.books.back} onPress={() => router.back()} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt family="hand" weight={400} size={17} leading={1} color="textAccent">
            {copy.chat.hand}
          </Txt>
          <Txt family="display" weight={700} size={20} numberOfLines={1} accessibilityRole="header">
            {title}
          </Txt>
        </View>
        {messages.length > 0 && (
          <IconButton icon="delete" label={copy.chat.clear} onPress={confirmClear} testID="chat-clear" />
        )}
      </View>

      <View style={{ gap: 10, paddingHorizontal: layout.gutterScreen, paddingTop: 12, paddingBottom: 4 }}>
        <SegmentedControl<ChatLanguage>
          items={LANGUAGES}
          value={prefs.language}
          onChange={(language) => setPrefs({ language })}
        />
        <Switch
          label={copy.chat.spoilers}
          checked={prefs.spoilers}
          onChange={(spoilers) => setPrefs({ spoilers })}
          testID="chat-spoilers"
        />
      </View>

      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 12, padding: layout.gutterScreen, flexGrow: 1 }}
        ListEmptyComponent={
          chat.isPending ? null : (
            <View
              style={{
                alignItems: 'center',
                gap: 10,
                paddingTop: 20,
                paddingHorizontal: 22,
                paddingBottom: 24,
                backgroundColor: t.surfacePageWarm,
                borderRadius: radius.xl,
              }}
              testID="chat-empty"
            >
              <Illustration name="cat-magnifier" width={140} accessibilityLabel={copy.art.magnifier} />
              <Txt family="hand" weight={400} size={22} color="textAccent" align="center">
                {title}
              </Txt>
              <Txt family="ui" size="xs" color="textSecondary" align="center">
                {copy.chat.emptyBody}
              </Txt>
            </View>
          )
        }
        renderItem={({ item }) => <Bubble m={item} />}
        ListFooterComponent={thinking ? <Thinking /> : null}
      />

      {!thinking && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: layout.gutterScreen }}>
          {prompts.map((p) => (
            <Press
              key={p}
              accessibilityRole="button"
              disabled={!online}
              onPress={() => ask(p)}
              style={{
                minHeight: 38,
                justifyContent: 'center',
                paddingHorizontal: 14,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: t.borderStrong,
                opacity: online ? 1 : 0.5,
              }}
              testID={`chat-prompt-${p}`}
            >
              <Txt family="ui" weight={600} size="xs" color="textSecondary">
                {p}
              </Txt>
            </Press>
          ))}
        </View>
      )}

      {!online && (
        <Txt family="ui" size="2xs" color="textMuted" style={{ paddingHorizontal: layout.gutterScreen, paddingTop: 8 }}>
          {copy.chat.offline}
        </Txt>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 8,
          paddingTop: 10,
          paddingHorizontal: layout.gutterScreen,
          paddingBottom: insets.bottom + 10,
        }}
      >
        <TextField
          value={draft}
          onChangeText={setDraft}
          placeholder={copy.chat.placeholder(title)}
          placeholderTextColor={t.textMuted}
          multiline
          maxLength={2000}
          editable={online}
          accessibilityLabel={copy.chat.placeholder(title)}
          testID="chat-input"
          style={{
            flex: 1,
            maxHeight: 120,
            minHeight: 48,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: radius.lg,
            backgroundColor: t.surfaceCard,
            borderWidth: 1,
            borderColor: t.borderSoft,
            color: t.textPrimary,
            fontFamily: fontFamily('ui', 400),
            fontSize: 15,
          }}
        />
        <IconButton
          icon="arrow_upward"
          label={copy.chat.send}
          tone="accent"
          disabled={!draft.trim() || thinking || !online}
          onPress={() => ask(draft)}
          testID="chat-send"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  const { t } = useTheme();
  const mine = m.role === 'user';
  return (
    <View
      accessible
      accessibilityLabel={mine ? copy.chat.you(m.content) : copy.chat.them(m.content)}
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '88%',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: radius.lg,
        backgroundColor: mine ? t.surfaceAccentSoft : t.surfaceCard,
        boxShadow: mine ? undefined : shadow.sm,
        opacity: m.pending ? 0.7 : 1,
      }}
      testID={`chat-${m.role}`}
    >
      {!mine && (
        <Txt family="hand" weight={400} size={16} color="textAccent" style={{ marginBottom: 2 }}>
          {copy.chat.calico}
        </Txt>
      )}
      <Txt family="ui" size={15} leading={1.5} tint={mine ? t.inkOnWarm : t.textPrimary} selectable>
        {m.content}
      </Txt>
    </View>
  );
}

function Thinking() {
  const { t } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: radius.lg,
        backgroundColor: t.surfaceCard,
      }}
      testID="chat-thinking"
    >
      <Illustration name="dots" width={30} float={2400} />
      <Txt family="hand" weight={400} size={17} color="textMuted">
        {copy.chat.thinking}
      </Txt>
    </View>
  );
}
