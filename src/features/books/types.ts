import type { Enums } from '@/types/db';

export type ItemStatus = Enums<'item_status'>;
export type BookStatus = Extract<ItemStatus, 'wishlist' | 'to_read' | 'reading' | 'read' | 'abandoned'>;
export type BookFormat = Enums<'book_format'>;
export type Ownership = 'owned' | 'library' | 'friend' | 'none';
export type LeadScript = 'en' | 'si';

export type Loan = {
  id: string;
  direction: Enums<'loan_direction'>;
  party: string;
  borrowedOn: string;
  dueOn: string | null;
  dueStamps: string[];
  renewalCount: number;
};

/** A book as the app uses it: `items` + `books` + its open loan, flattened. */
export type Book = {
  id: string;
  status: BookStatus;
  title: string;
  titleNative: string | null;
  author: string | null;
  authorNative: string | null;
  language: string;
  format: BookFormat;
  ownership: Ownership;
  totalPages: number | null;
  currentPage: number;
  rating: number | null;
  note: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  coverPath: string | null;
  coverUrl: string | null;
  wishlistPriority: 'someday' | 'soon' | 'must' | null;
  abandonReason: string | null;
  loan: Loan | null;
};

export type ReadingSession = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  outcome: 'reading' | 'read' | 'abandoned' | 'paused';
  rating: number | null;
};

export type PageLog = { id: string; page: number; loggedAt: string };

export type BookDetail = Book & { sessions: ReadingSession[]; collections: { id: string; name: string }[] };
