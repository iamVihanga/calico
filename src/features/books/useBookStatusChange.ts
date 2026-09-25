import { openSheet } from '@/lib/stores/sheet';

import { announceStatus, useLeadScript, useSetBookStatus } from './hooks';
import type { Book, BookStatus } from './types';

/**
 * Status rules from plan §11.1: Read opens the Finish sheet, Abandoned the Stop sheet, Reading asks
 * for a start date (or "Start a re-read?" from Read). Wishlist / To read apply directly.
 */
export function useBookStatusChange() {
  const setStatus = useSetBookStatus();
  const lead = useLeadScript();
  return (book: Pick<Book, 'id' | 'status' | 'title' | 'titleNative'>, to: BookStatus) => {
    if (to === book.status) return;
    if (to === 'read') return openSheet('finish', { itemId: book.id });
    if (to === 'abandoned') return openSheet('stop', { itemId: book.id });
    if (to === 'reading') return openSheet('startReading', { itemId: book.id, reread: book.status === 'read' });
    setStatus.mutate({ itemId: book.id, status: to });
    announceStatus(book, to, lead);
  };
}
