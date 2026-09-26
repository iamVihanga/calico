import { Accelerometer } from 'expo-sensors';
import { useEffect } from 'react';

const G_THRESHOLD = 1.8;
const WINDOW_MS = 500;

/** Two readings above 1.8g within 500ms is a shake (plan §11.7). Pure, so it can be tested. */
export function shakeDetector(onShake: () => void) {
  let last = 0;
  return ({ x, y, z }: { x: number; y: number; z: number }, now: number = Date.now()) => {
    if (Math.sqrt(x * x + y * y + z * z) < G_THRESHOLD) return;
    if (last && now - last <= WINDOW_MS) {
      last = 0;
      onShake();
    } else {
      last = now;
    }
  };
}

/** Listen for a shake while `active` (the Up next screen is focused). */
export function useShake(active: boolean, onShake: () => void) {
  useEffect(() => {
    if (!active) return;
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(shakeDetector(onShake));
    return () => sub.remove();
  }, [active, onShake]);
}
