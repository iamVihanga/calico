import { holdController } from '../components/SeasonBlock';

describe('episode grid hold gesture', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  // The pan activates after 250ms; holding still until 550ms from touch-down fills the season.
  it('holding still fills the season', () => {
    const g = holdController();
    const held = jest.fn();
    g.start(10, 10, held);
    g.move(13, 12, () => 1); // within the 8dp slop: still a hold
    jest.advanceTimersByTime(299);
    expect(held).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(held).toHaveBeenCalledTimes(1);
  });

  it('moving turns it into a paint that commits once, including the first square', () => {
    const g = holdController();
    const held = jest.fn();
    const commit = jest.fn();
    const at = (x: number) => Math.floor(x / 43) + 1;
    g.start(10, 10, held);
    expect(g.move(60, 10, at)).toEqual(new Set([1, 2]));
    expect(g.move(62, 10, at)).toBeNull(); // same square again
    expect(g.move(100, 10, at)).toEqual(new Set([1, 2, 3]));
    jest.advanceTimersByTime(1000);
    g.end(commit);
    expect(held).not.toHaveBeenCalled();
    expect(commit).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('lifting early does nothing', () => {
    const g = holdController();
    const held = jest.fn();
    const commit = jest.fn();
    g.start(10, 10, held);
    g.end(commit);
    jest.advanceTimersByTime(1000);
    expect(held).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });
});
