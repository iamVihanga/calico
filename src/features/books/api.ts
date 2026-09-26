import { randomUUID } from 'expo-crypto';

import { colomboToday, type LocalDate } from '@/lib/dates';
import { currentUserId, supabase } from '@/lib/supabase';
import type { Tables } from '@/types/db';

import type { Book, BookDetail, BookFormat, BookStatus, Loan, Ownership, PageLog } from './types';

type ItemRow = Tables<'items'> & { books: Tables<'books'>[]; loans: Tables<'loans'>[] };

const BOOK_SELECT = '*, books(*), loans(*)';

export function toLoan(l: Tables<'loans'>): Loan {
  return {
    id: l.id,
    direction: l.direction,
    party: l.party,
    borrowedOn: l.borrowed_on,
    dueOn: l.due_on,
    dueStamps: l.due_stamps,
    renewalCount: l.renewal_count,
  };
}

export function toBook(row: ItemRow): Book {
  const b = row.books[0];
  const open = row.loans.find((l) => l.returned_on === null);
  return {
    id: row.id,
    status: row.status as Book['status'],
    title: row.title,
    titleNative: row.title_native,
    author: b?.author ?? null,
    authorNative: b?.author_native ?? null,
    language: b?.language ?? 'English',
    format: b?.format ?? 'physical',
    ownership: (b?.ownership ?? 'owned') as Ownership,
    totalPages: b?.total_pages ?? null,
    currentPage: b?.current_page ?? 0,
    rating: row.rating,
    note: row.note,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    coverPath: row.cover_path,
    coverUrl: row.cover_url,
    wishlistPriority: (b?.wishlist_priority ?? null) as Book['wishlistPriority'],
    abandonReason: b?.abandon_reason ?? null,
    loan: open ? toLoan(open) : null,
  };
}

// Reads -----------------------------------------------------------------------------------------

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('items')
    .select(BOOK_SELECT)
    .eq('kind', 'book')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as ItemRow[]).map(toBook);
}

export async function fetchBook(id: string): Promise<BookDetail | null> {
  const { data, error } = await supabase
    .from('items')
    .select(`${BOOK_SELECT}, reading_sessions(*), collection_items(collections(id, name))`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as ItemRow & {
    reading_sessions: Tables<'reading_sessions'>[];
    collection_items: { collections: { id: string; name: string } | null }[];
  };
  return {
    ...toBook(row),
    sessions: row.reading_sessions
      .map((s) => ({
        id: s.id,
        startedAt: s.started_at,
        finishedAt: s.finished_at,
        outcome: s.outcome as BookDetail['sessions'][number]['outcome'],
        rating: s.rating,
      }))
      .sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1)),
    collections: row.collection_items.flatMap((c) => (c.collections ? [c.collections] : [])),
  };
}

export async function fetchPageLogs(itemId: string): Promise<PageLog[]> {
  const { data, error } = await supabase
    .from('page_logs')
    .select('id, page, logged_at')
    .eq('item_id', itemId)
    .order('logged_at', { ascending: true });
  if (error) throw error;
  return data.map((l) => ({ id: l.id, page: l.page, loggedAt: l.logged_at }));
}

/** Page logs for several books at once (Home's Continue reading cards). */
export async function fetchPageLogsFor(itemIds: string[]): Promise<Record<string, PageLog[]>> {
  if (itemIds.length === 0) return {};
  const { data, error } = await supabase
    .from('page_logs')
    .select('id, item_id, page, logged_at')
    .in('item_id', itemIds)
    .order('logged_at', { ascending: true });
  if (error) throw error;
  const out: Record<string, PageLog[]> = {};
  for (const l of data) (out[l.item_id] ??= []).push({ id: l.id, page: l.page, loggedAt: l.logged_at });
  return out;
}

// Writes (RPCs; every payload carries client ids so offline replays are idempotent) ---------------

export type NewBook = {
  id: string;
  status: BookStatus;
  title: string;
  titleNative?: string;
  author?: string;
  authorNative?: string;
  language: string;
  totalPages?: number;
  currentPage?: number;
  format: BookFormat;
  ownership: Ownership;
  wishlistPriority?: 'someday' | 'soon' | 'must';
  wishlistPriceLkr?: number;
  loan?: { id: string; party: string; borrowedOn: LocalDate; dueOn?: LocalDate };
  startedAt?: LocalDate;
  /** Storage path of the user's cover photo (covers/{uid}/{itemId}/front.jpg). */
  coverPath?: string;
  /** External cover (Open Library / Google Books) when there's no photo. */
  coverUrl?: string;
  isbn?: string;
  publisher?: string;
  publishedYear?: number;
  aiExtracted?: boolean;
};

export async function createBook(b: NewBook): Promise<void> {
  const { error } = await supabase.rpc('create_book', {
    p: {
      id: b.id,
      status: b.status,
      title: b.title,
      title_native: b.titleNative ?? '',
      author: b.author ?? '',
      author_native: b.authorNative ?? '',
      language: b.language,
      total_pages: b.totalPages ?? null,
      current_page: b.currentPage ?? 0,
      format: b.format,
      ownership: b.ownership,
      wishlist_priority: b.wishlistPriority ?? null,
      wishlist_price_lkr: b.wishlistPriceLkr ?? null,
      started_at: b.startedAt ?? null,
      cover_path: b.coverPath ?? null,
      cover_url: b.coverUrl ?? null,
      isbn: b.isbn ?? '',
      publisher: b.publisher ?? '',
      published_year: b.publishedYear ?? null,
      ai_extracted: b.aiExtracted ?? false,
      ...(b.loan
        ? {
            loan: {
              id: b.loan.id,
              direction: 'borrowed',
              party: b.loan.party,
              borrowed_on: b.loan.borrowedOn,
              due_on: b.loan.dueOn ?? null,
            },
          }
        : {}),
    },
  });
  if (error) throw error;
}

export type SetStatusVars = { itemId: string; status: BookStatus; on?: LocalDate };
export async function setBookStatus({ itemId, status, on }: SetStatusVars): Promise<void> {
  const { error } = await supabase.rpc('set_book_status', {
    p_item: itemId,
    p_status: status,
    p_on: on ?? colomboToday(),
  });
  if (error) throw error;
}

export type LogPageVars = { itemId: string; page: number; logId: string; loggedAt: string };
export async function logPage({ itemId, page, logId }: LogPageVars): Promise<void> {
  const { error } = await supabase.rpc('log_page', { p_item: itemId, p_page: page, p_log_id: logId });
  if (error) throw error;
}

export type FinishVars = {
  itemId: string;
  on: LocalDate;
  rating: number | null;
  note: string | null;
  returnLoan: boolean;
};
export async function finishBook(v: FinishVars): Promise<void> {
  const { error } = await supabase.rpc('finish_book', {
    p_item: v.itemId,
    p_on: v.on,
    p_rating: v.rating as number,
    p_note: v.note as string,
    p_return_loan: v.returnLoan,
  });
  if (error) throw error;
}

export type StopVars = { itemId: string; reason: string | null; toRead: boolean };
export async function stopBook(v: StopVars): Promise<void> {
  const { error } = await supabase.rpc('stop_book', {
    p_item: v.itemId,
    p_reason: v.reason as string,
    p_to_read: v.toRead,
  });
  if (error) throw error;
}

export type NoteVars = { itemId: string; note: string };
export async function updateNote({ itemId, note }: NoteVars): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ note: note || null })
    .eq('id', itemId);
  if (error) throw error;
}

/** Edit details / new cover photo. Only the fields present change (plan: `update_book`). */
export type BookEdit = {
  title?: string;
  titleNative?: string;
  author?: string;
  authorNative?: string;
  language?: string;
  totalPages?: number | null;
  format?: BookFormat;
  coverPath?: string;
};
export type UpdateBookVars = { itemId: string; edit: BookEdit };
export async function updateBook({ itemId, edit }: UpdateBookVars): Promise<void> {
  const p: Record<string, string | number | null> = {};
  if (edit.title !== undefined) p.title = edit.title;
  if (edit.titleNative !== undefined) p.title_native = edit.titleNative;
  if (edit.author !== undefined) p.author = edit.author;
  if (edit.authorNative !== undefined) p.author_native = edit.authorNative;
  if (edit.language !== undefined) p.language = edit.language;
  if (edit.totalPages !== undefined) p.total_pages = edit.totalPages;
  if (edit.format !== undefined) p.format = edit.format;
  if (edit.coverPath !== undefined) p.cover_path = edit.coverPath;
  const { error } = await supabase.rpc('update_book', { p_item: itemId, p });
  if (error) throw error;
}

export async function deleteItem({ itemId }: { itemId: string }): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', itemId);
  if (error) throw error;
}

export type QueueVars = { itemId: string; position: string };
export async function addToUpNext({ itemId, position }: QueueVars): Promise<void> {
  const uid = await currentUserId();
  const { error } = await supabase
    .from('up_next')
    .upsert({ item_id: itemId, user_id: uid, position }, { onConflict: 'item_id', ignoreDuplicates: true });
  if (error) throw error;
}

export type QueueEntry = { itemId: string; position: string; addedAt?: string };
export async function fetchUpNextPositions(): Promise<QueueEntry[]> {
  const { data, error } = await supabase.from('up_next').select('item_id, position, added_at');
  if (error) throw error;
  return data.map((r) => ({ itemId: r.item_id, position: r.position, addedAt: r.added_at }));
}

export const newId = () => randomUUID();
