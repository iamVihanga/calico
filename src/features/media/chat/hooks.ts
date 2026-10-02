import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useCallback, useState } from 'react';

import { useLeadScript } from '@/features/books/hooks';
import { copy } from '@/i18n/en';
import { mk } from '@/lib/mutations';
import { qk } from '@/lib/queryKeys';
import { storage, storageKeys } from '@/lib/storage';
import { toast } from '@/lib/stores/toast';

import { type ChatLanguage, type ChatMessage, ChatError, fetchChat, type SendChatVars } from './api';

export const useChat = (itemId: string) => useQuery({ queryKey: qk.chat(itemId), queryFn: () => fetchChat(itemId) });

/** Shows the question at once, then the reply (or takes the question back and says why). */
export function useSendChat(itemId: string) {
  const qc = useQueryClient();
  return useMutation<{ reply: string; remaining: number }, Error, SendChatVars, { pendingId: string }>({
    mutationKey: mk.chatSend,
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.chat(itemId) });
      const pendingId = `pending-${randomUUID()}`;
      qc.setQueryData<ChatMessage[]>(qk.chat(itemId), (list = []) => [
        ...list,
        {
          id: pendingId,
          role: 'user',
          content: v.message,
          language: v.language,
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ]);
      return { pendingId };
    },
    onSuccess: (res, v, ctx) => {
      qc.setQueryData<ChatMessage[]>(qk.chat(itemId), (list = []) => [
        ...list.map((m) => (m.id === ctx.pendingId ? { ...m, pending: false } : m)),
        {
          id: `reply-${ctx.pendingId}`,
          role: 'assistant',
          content: res.reply,
          language: v.language,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    onError: (e, _v, ctx) => {
      if (ctx)
        qc.setQueryData<ChatMessage[]>(qk.chat(itemId), (list = []) => list.filter((m) => m.id !== ctx.pendingId));
      const code = e instanceof ChatError ? e.code : 'ai_failed';
      toast({
        message:
          code === 'daily_limit' ? copy.chat.dailyLimit : code === 'offline' ? copy.chat.offline : copy.chat.failed,
      });
    },
    // The saved rows get server ids and timestamps.
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.chat(itemId) }),
  });
}

export function useClearChat(itemId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, { itemId: string }, { before?: ChatMessage[] }>({
    mutationKey: mk.chatClear,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: qk.chat(itemId) });
      const before = qc.getQueryData<ChatMessage[]>(qk.chat(itemId));
      qc.setQueryData<ChatMessage[]>(qk.chat(itemId), []);
      return { before };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(qk.chat(itemId), ctx?.before);
      toast({ message: copy.errors.saveFailed });
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.chat(itemId) }),
  });
}

export type ChatPrefs = { language: ChatLanguage; spoilers: boolean };

function readPrefs(): Record<string, ChatPrefs> {
  try {
    return JSON.parse(storage.getString(storageKeys.chatPrefs) ?? '{}') as Record<string, ChatPrefs>;
  } catch {
    return {};
  }
}

/** Reply language and "Spoilers OK", remembered per title; the language defaults to the lead script. */
export function useChatPrefs(itemId: string): [ChatPrefs, (patch: Partial<ChatPrefs>) => void] {
  const lead = useLeadScript();
  const [prefs, setPrefs] = useState<ChatPrefs>(
    () => readPrefs()[itemId] ?? { language: lead === 'si' ? 'si' : 'en', spoilers: false },
  );
  const update = useCallback(
    (patch: Partial<ChatPrefs>) =>
      setPrefs((p) => {
        const next = { ...p, ...patch };
        storage.set(storageKeys.chatPrefs, JSON.stringify({ ...readPrefs(), [itemId]: next }));
        return next;
      }),
    [itemId],
  );
  return [prefs, update];
}
