import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type ChatLanguage = 'en' | 'si';
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: ChatLanguage;
  createdAt: string;
  /** Optimistic: sent, waiting for the reply. */
  pending?: boolean;
};

/** The conversation about one title, oldest first (RLS: the user's own rows). */
export async function fetchChat(itemId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('media_chat_messages')
    .select('id, role, content, language, created_at')
    .eq('item_id', itemId)
    .order('created_at')
    .limit(500);
  if (error) throw error;
  return data.map((m) => ({
    id: m.id,
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
    language: m.language === 'si' ? 'si' : 'en',
    createdAt: m.created_at,
  }));
}

export class ChatError extends Error {
  constructor(
    readonly code: 'daily_limit' | 'ai_failed' | 'offline',
    readonly resetsAt: string | null = null,
  ) {
    super(code);
  }
}

export type SendChatVars = { itemId: string; message: string; language: ChatLanguage; spoilers: boolean };

/** media-chat edge function: Gemini answers with the conversation as memory; both turns are saved. */
export async function sendChat(v: SendChatVars): Promise<{ reply: string; remaining: number }> {
  const { data, error } = await supabase.functions.invoke<{ reply: string; remaining: number }>('media-chat', {
    body: v,
  });
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) throw new ChatError('daily_limit', body.resetsAt ?? null);
    throw new ChatError('ai_failed');
  }
  if (error instanceof FunctionsFetchError) throw new ChatError('offline');
  if (error || !data) throw new ChatError('ai_failed');
  return data;
}

export async function clearChat({ itemId }: { itemId: string }): Promise<void> {
  const { error } = await supabase.from('media_chat_messages').delete().eq('item_id', itemId);
  if (error) throw error;
}
