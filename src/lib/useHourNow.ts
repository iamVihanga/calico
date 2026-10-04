import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** "Now", refreshed on the hour and whenever the app comes back to the foreground. */
export function useHourNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const ms = 60 * 60 * 1000 - (now.getTime() % (60 * 60 * 1000)) + 1000;
    const timer = setTimeout(() => setNow(new Date()), ms);
    return () => clearTimeout(timer);
  }, [now]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setNow(new Date()));
    return () => sub.remove();
  }, []);
  return now;
}
