import { copy } from '@/i18n/en';

/** Morning until noon, afternoon until 5 pm, then evening (device time). */
export function greeting(hour: number) {
  if (hour < 12) return copy.home.greetingMorning;
  if (hour < 17) return copy.home.greetingAfternoon;
  return copy.home.greetingEvening;
}

/** Home's sun from 6 am until 6 pm, the moon otherwise (the time of day, not night reading). */
export const isDaytime = (hour: number) => hour >= 6 && hour < 18;
