import { act, render, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { AnimatedSplash, INTRO_MS } from '../AnimatedSplash';

const splash = (done: boolean, onHidden: () => void) => (
  <ThemeProvider>
    <AnimatedSplash done={done} onHidden={onHidden} />
  </ThemeProvider>
);
const wait = (ms: number) => act(() => new Promise<void>((r) => setTimeout(r, ms)));

// The mock module the component's `react-native-reanimated` import resolves to (jest.setup.ts).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const reanimated = require('react-native-reanimated/mock') as { useReducedMotion: () => boolean };

/** The animated splash always plays its intro on a cold start, even when the app is ready at once. */
describe('AnimatedSplash', () => {
  it('waits for the intro before fading, even when the app is already ready', async () => {
    const onHidden = jest.fn();
    await render(splash(true, onHidden));
    await wait(INTRO_MS - 400);
    expect(onHidden).not.toHaveBeenCalled();
    await waitFor(() => expect(onHidden).toHaveBeenCalledTimes(1), { timeout: 2000 });
  });

  it('keeps covering a slow start until the app is ready', async () => {
    const onHidden = jest.fn();
    const view = await render(splash(false, onHidden));
    await wait(INTRO_MS + 300);
    expect(onHidden).not.toHaveBeenCalled();
    await view.rerender(splash(true, onHidden));
    await waitFor(() => expect(onHidden).toHaveBeenCalledTimes(1));
  });

  it('with reduced motion, goes as soon as the app is ready', async () => {
    const before = reanimated.useReducedMotion;
    reanimated.useReducedMotion = () => true;
    try {
      const onHidden = jest.fn();
      await render(splash(true, onHidden));
      await waitFor(() => expect(onHidden).toHaveBeenCalledTimes(1), { timeout: 300 });
    } finally {
      reanimated.useReducedMotion = before;
    }
  });
});
