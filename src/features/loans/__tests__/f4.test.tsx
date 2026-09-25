import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { copy } from '@/i18n/en';
import { addLocalDays, colomboToday, fmtShort } from '@/lib/dates';
import { queryClient } from '@/lib/queryClient';
import { useSheetStore } from '@/lib/stores/sheet';
import { useToastStore } from '@/lib/stores/toast';
import { cleanupAppState } from '@/test/cleanup';

import { reminderRoute } from '../responses';

const mockRenew = jest.fn();
const mockReturn = jest.fn();
const mockReopen = jest.fn();
const mockAdd = jest.fn();

const today = colomboToday();
const due = addLocalDays(today, 3);
const fresh = () => ({
  id: 'madol',
  status: 'reading',
  title: 'Madol Doova',
  titleNative: 'මඩොල් දූව',
  author: 'Martin Wickramasinghe',
  authorNative: null,
  language: 'Sinhala',
  format: 'physical',
  ownership: 'library',
  totalPages: 214,
  currentPage: 150,
  rating: null,
  note: null,
  startedAt: addLocalDays(today, -14),
  finishedAt: null,
  createdAt: '2026-09-09T00:00:00Z',
  updatedAt: '2026-09-20T00:00:00Z',
  coverPath: null,
  coverUrl: null,
  wishlistPriority: null,
  abandonReason: null,
  loan: {
    id: 'loan-madol',
    direction: 'borrowed',
    party: 'Colombo Public Library',
    borrowedOn: addLocalDays(today, -14),
    dueOn: due,
    dueStamps: [due],
    renewalCount: 0,
  },
});
// The "server": loan mutations change it, so refetches after a mutation see the new state.
let mockMadol = fresh();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
        cb('INITIAL_SESSION', { user: { id: 'u', email: 'dilan@calico.test' } });
        return { data: { subscription: { unsubscribe: () => undefined } } };
      },
    },
  },
  currentUserId: async () => 'u',
}));
jest.mock('@/features/profile/api', () => ({
  fetchProfile: async () => ({ id: 'u', display_name: 'Dilan Kumara', theme: 'day', lead_script: 'en' }),
  updateProfile: async () => undefined,
}));
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  fetchBooks: async () => [mockMadol],
  fetchBook: async () => ({ ...mockMadol, sessions: [], collections: [] }),
  fetchPageLogs: async () => [],
  fetchPageLogsFor: async () => ({}),
  fetchUpNextPositions: async () => [],
}));
jest.mock('@/features/loans/api', () => ({
  renewLoan: async (v: { newDue: string }) => {
    mockRenew(v);
    const l = mockMadol.loan!;
    mockMadol = {
      ...mockMadol,
      loan: { ...l, dueOn: v.newDue, dueStamps: [...l.dueStamps, v.newDue], renewalCount: l.renewalCount + 1 },
    };
  },
  returnLoan: async (v: unknown) => {
    mockReturn(v);
    mockMadol = { ...mockMadol, ownership: 'none', loan: null as never };
  },
  reopenLoan: async (v: unknown) => {
    mockReopen(v);
    mockMadol = fresh();
  },
  addLoan: async (v: { id: string; party: string; borrowedOn: string; dueOn: string | null }) => {
    mockAdd(v);
    mockMadol = {
      ...fresh(),
      loan: { ...fresh().loan, id: v.id, party: v.party, dueOn: v.dueOn!, dueStamps: [v.dueOn!] },
    };
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = require('expo-notifications') as {
  getLastNotificationResponse: jest.Mock;
  requestPermissionsAsync: jest.Mock;
};

const response = (actionIdentifier: string, itemId = 'madol') => ({
  actionIdentifier,
  notification: { request: { identifier: 'loan:loan-madol:3d', content: { data: { itemId } } } },
});

describe('reminder deep links', () => {
  it('maps actions to the book and the right sheet', () => {
    expect(reminderRoute(response('renew') as never)).toBe('/book/madol?sheet=renew');
    expect(reminderRoute(response('returned') as never)).toBe('/book/madol?sheet=loanQuick');
    expect(reminderRoute(response('open') as never)).toBe('/book/madol');
    expect(reminderRoute(response('expo.modules.notifications.actions.DEFAULT') as never)).toBe('/book/madol');
    expect(
      reminderRoute({ actionIdentifier: 'renew', notification: { request: { content: { data: {} } } } } as never),
    ).toBeNull();
  });
});

/** Flow F4 (brief §8): notification → renew (+14) → later, Home slip → long-press → Returned. */
describe('F4: library due date, renew then return', () => {
  beforeEach(() => {
    mockMadol = fresh();
    jest.clearAllMocks();
    queryClient.clear();
    useToastStore.getState().hide();
    useSheetStore.getState().close();
  });
  afterAll(cleanupAppState);

  it('opens the renew sheet from the reminder and renews by 14 days', async () => {
    Notifications.getLastNotificationResponse.mockReturnValueOnce(response('renew'));
    await renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText(copy.loan.renewTitle('Madol Doova'))).toBeTruthy();
    expect(await screen.findByTestId('loan-slip')).toBeTruthy();
    expect(screen.getByTestId('due-line')).toHaveTextContent(copy.loan.dueLine(3));

    const newDue = addLocalDays(due, 14);
    await fireEvent.press(screen.getByTestId('renew-14'));
    await act(async () => {
      await fireEvent.press(screen.getByTestId('renew-confirm'));
    });
    await waitFor(() =>
      expect(mockRenew).toHaveBeenCalledWith(expect.objectContaining({ loanId: 'loan-madol', newDue })),
    );
    expect(await screen.findByText(copy.loan.renewedUntil(fmtShort(newDue)))).toBeTruthy();
    await waitFor(() => expect(screen.getAllByTestId('due-stamp-old')).toHaveLength(1));
    expect(screen.getByTestId('due-line')).toHaveTextContent(copy.loan.dueLine(17));
    expect(screen.getByText(copy.loan.renewed(1))).toBeTruthy();
  });

  it('returns from the Home slip, offers To read, and can undo', async () => {
    await renderRouter('./app', { initialUrl: '/' });
    const slip = await screen.findByTestId('due-madol');
    expect(screen.getByText(copy.loan.dueSoon)).toBeTruthy();

    await fireEvent(slip, 'longPress');
    expect(await screen.findByTestId('quick-returned')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('quick-returned'));
    });
    await waitFor(() =>
      expect(mockReturn).toHaveBeenCalledWith(expect.objectContaining({ loanId: 'loan-madol', on: today })),
    );
    expect(await screen.findByText(copy.loan.returnedTo('Colombo Public Library'))).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId('due-madol')).toBeNull());
    // Unfinished: "Move to To read?" waits behind the Returned toast.
    expect(useToastStore.getState().queue.map((q) => q.message)).toEqual([copy.loan.moveToRead]);

    await act(async () => {
      await fireEvent.press(screen.getByText(copy.common.undo));
    });
    await waitFor(() =>
      expect(mockReopen).toHaveBeenCalledWith(expect.objectContaining({ loanId: 'loan-madol', ownership: 'library' })),
    );
    expect(useToastStore.getState().queue).toEqual([]);
    expect(await screen.findByTestId('due-madol')).toBeTruthy();
  });

  it('asks about reminders the first time a library loan is added, and only then', async () => {
    mockMadol = { ...fresh(), ownership: 'owned', loan: null as never };
    await renderRouter('./app', { initialUrl: '/book/madol' });
    await fireEvent.press(await screen.findByTestId('book-overflow'));
    await fireEvent.press(await screen.findByTestId('overflow-loan'));
    await fireEvent.press(await screen.findByText(copy.loanForm.kind.library));
    await fireEvent.changeText(screen.getByTestId('loan-party'), 'Colombo Public Library');
    await fireEvent.press(screen.getByTestId('loan-due-21'));
    await act(async () => {
      await fireEvent.press(screen.getByTestId('loan-save'));
    });
    await waitFor(() =>
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'library', party: 'Colombo Public Library', dueOn: addLocalDays(today, 21) }),
      ),
    );
    expect(await screen.findByTestId('loan-slip')).toBeTruthy();

    // The explainer comes first; Android's prompt only after "Allow reminders".
    expect(await screen.findByText(copy.reminders.askTitle)).toBeTruthy();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('notif-allow'));
    });
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(copy.reminders.on)).toBeTruthy();

    // Remembered: returning and adding another loan doesn't ask again.
    const { maybeAskForReminders } = jest.requireActual('../sheets/LoanSheets') as {
      maybeAskForReminders: () => Promise<void>;
    };
    useSheetStore.getState().close();
    await act(() => maybeAskForReminders());
    expect(useSheetStore.getState().sheet).toBeNull();
  });
});
