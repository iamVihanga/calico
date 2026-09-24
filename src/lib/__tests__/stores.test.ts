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
