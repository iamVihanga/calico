import { clearStorageKeepingTheme, storage, storageKeys } from '../storage';
import { useSheetStore } from '../stores/sheet';
import { TOAST_MS, toast, useToastStore } from '../stores/toast';

describe('toast store', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows a toast and hides it after 4.2s', () => {
    toast({ message: 'Returned to Colombo Public Library' });
    expect(useToastStore.getState().toast?.message).toBe('Returned to Colombo Public Library');
    jest.advanceTimersByTime(TOAST_MS - 1);
    expect(useToastStore.getState().toast).not.toBeNull();
    jest.advanceTimersByTime(1);
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('a new toast replaces the old one and restarts the timer', () => {
    toast({ message: 'one' });
    jest.advanceTimersByTime(3000);
    toast({ message: 'two' });
    jest.advanceTimersByTime(3000);
    expect(useToastStore.getState().toast?.message).toBe('two');
  });

  it('shows queued follow-ups after the current toast', () => {
    const s = useToastStore.getState();
    s.hide();
    toast({ message: 'Returned to Colombo Public Library' });
    s.enqueue({ message: 'Move to To read so you remember it?' });
    expect(useToastStore.getState().toast?.message).toBe('Returned to Colombo Public Library');
    jest.advanceTimersByTime(TOAST_MS);
    expect(useToastStore.getState().toast?.message).toBe('Move to To read so you remember it?');
    jest.advanceTimersByTime(TOAST_MS);
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('an action can drop the queued follow-ups (Undo)', () => {
    const s = useToastStore.getState();
    const undo = jest.fn(() => useToastStore.getState().clearQueue());
    toast({ message: 'Returned', action: { label: 'Undo', onPress: undo } });
    s.enqueue({ message: 'Move to To read?' });
    s.pressAction();
    expect(undo).toHaveBeenCalled();
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('pressing an action moves on to the next toast unless the action showed one', () => {
    const s = useToastStore.getState();
    toast({ message: 'one', action: { label: 'Dismiss', onPress: () => undefined } });
    s.enqueue({ message: 'two' });
    s.pressAction();
    expect(useToastStore.getState().toast?.message).toBe('two');
    s.show({ message: 'three', action: { label: 'Go', onPress: () => toast({ message: 'four' }) } });
    s.pressAction();
    expect(useToastStore.getState().toast?.message).toBe('four');
  });
});

describe('sheet store', () => {
  it('opens and closes a named sheet', () => {
    useSheetStore.getState().open('add');
    expect(useSheetStore.getState().sheet?.name).toBe('add');
    useSheetStore.getState().close();
    expect(useSheetStore.getState().sheet).toBeNull();
  });
});

describe('clearStorageKeepingTheme', () => {
  it('keeps only the theme', () => {
    storage.set(storageKeys.theme, 'night');
    storage.set(storageKeys.queryCache, '{}');
    storage.set('recent-searches', '["it"]');
    clearStorageKeepingTheme();
    expect(storage.getAllKeys()).toEqual([storageKeys.theme]);
    expect(storage.getString(storageKeys.theme)).toBe('night');
  });
});
