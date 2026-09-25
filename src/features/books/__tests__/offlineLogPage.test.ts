import { persistQueryClientRestore, persistQueryClientSave } from '@tanstack/query-persist-client-core';
import { onlineManager, QueryClient } from '@tanstack/react-query';

import { mk, registerMutations } from '@/lib/mutations';
import { persistOptions, queryClient } from '@/lib/queryClient';

const mockLogPage = jest.fn().mockResolvedValue(undefined);
jest.mock('@/features/books/api', () => ({
  ...jest.requireActual('@/features/books/api'),
  logPage: (v: unknown) => mockLogPage(v),
}));

/** Phase 2 "done when": a page logged in airplane mode syncs after reconnecting, across a restart. */
describe('offline page log', () => {
  const restarted = new QueryClient();
  afterAll(() => {
    onlineManager.setOnline(true);
    for (const qc of [queryClient, restarted]) {
      qc.getMutationCache()
        .getAll()
        .forEach((m) => m.destroy());
      qc.clear();
    }
  });

  it('queues log_page offline and replays it with the same log id after restart', async () => {
    onlineManager.setOnline(false);
    const vars = { itemId: 'it', page: 449, logId: 'log-1', loggedAt: '2026-09-23T15:30:00Z' };
    const m = queryClient.getMutationCache().build(queryClient, { mutationKey: mk.bookLogPage });
    void m.execute(vars).catch(() => undefined);
    await Promise.resolve();
    expect(m.state.isPaused).toBe(true);

    await persistQueryClientSave({ queryClient, ...persistOptions });
    await new Promise((r) => setTimeout(r, 1100)); // persister throttle

    registerMutations(restarted);
    await persistQueryClientRestore({ queryClient: restarted, ...persistOptions });
    onlineManager.setOnline(true);
    await restarted.resumePausedMutations();

    // The client-generated log id makes the replay idempotent on the server.
    expect(mockLogPage).toHaveBeenCalledWith(vars);
  });
});
