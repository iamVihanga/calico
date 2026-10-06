import { copy } from '@/i18n/en';

import { greeting, isDaytime } from '../logic';

describe('Home greeting by the clock', () => {
  it('the sun from 6 am until 6 pm, the moon otherwise', () => {
    expect([0, 5, 6, 12, 17, 18, 23].map(isDaytime)).toEqual([false, false, true, true, true, false, false]);
  });

  it('morning, afternoon, evening', () => {
    expect(greeting(9)).toBe(copy.home.greetingMorning);
    expect(greeting(14)).toBe(copy.home.greetingAfternoon);
    expect(greeting(20)).toBe(copy.home.greetingEvening);
  });
});
