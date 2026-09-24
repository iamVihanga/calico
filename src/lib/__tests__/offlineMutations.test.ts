import { persistQueryClientRestore, persistQueryClientSave } from '@tanstack/query-persist-client-core';
import { onlineManager, QueryClient } from '@tanstack/react-query';

import { mk, registerMutations } from '../mutations';
import { persistOptions, queryClient } from '../queryClient';

const mockUpdateProfile = jest.fn().mockResolvedValue(undefined);
jest.mock('@/features/profile/api', () => ({
  updateProfile: (patch: unknown) => mockUpdateProfile(patch),
}));

/**
 * The offline story from plan §9.4: a mutation made offline pauses, is persisted to MMKV with the
 * query cache, and runs after an app restart once the registered mutationFn is available again.
 */
describe('offline mutations', () => {
  const restarted = new QueryClient();
  afterAll(() => {
    onlineManager.setOnline(true);
    // Stop the mutations' gc timers so they don't keep Jest alive.
    for (const qc of [queryClient, restarted]) {
      qc.getMutationCache()
        .getAll()
        .forEach((m) => m.destroy());
      qc.clear();
    }
  });

  it('persists a paused mutation and resumes it after restart', async () => {
    onlineManager.setOnline(false);
    const before = queryClient.getMutationCache().build(queryClient, { mutationKey: mk.profileUpdate });
    const pending = before.execute({ theme: 'night' }).catch(() => undefined);
    await Promise.resolve();
    expect(before.state.isPaused).toBe(true);
    expect(mockUpdateProfile).not.toHaveBeenCalled();

    await persistQueryClientSave({ queryClient, ...persistOptions });
    await new Promise((r) => setTimeout(r, 1100)); // the MMKV persister batches writes (throttleTime 1s)

    // "Restart": a fresh client with the same registry restores from storage.
    registerMutations(restarted);
    await persistQueryClientRestore({ queryClient: restarted, ...persistOptions });
    expect(restarted.getMutationCache().getAll()).toHaveLength(1);

    onlineManager.setOnline(true);
    await restarted.resumePausedMutations();
    expect(mockUpdateProfile).toHaveBeenCalledWith({ theme: 'night' });
    void pending;
  });
});
