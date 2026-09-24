import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Welcome from '../../../../app/(auth)/welcome';
import { copy } from '@/i18n/en';
import { ThemeProvider } from '@/theme';

const mockSignIn = jest.fn();
jest.mock('@/features/auth/google', () => {
  class SignInCancelled extends Error {}
  return {
    SignInCancelled,
    signInWithGoogle: () => mockSignIn(SignInCancelled),
    devSignInAsSeedUser: jest.fn(),
  };
});

const metrics = { frame: { x: 0, y: 0, width: 412, height: 915 }, insets: { top: 24, left: 0, right: 0, bottom: 16 } };
const renderWelcome = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider forced="day">
        <Welcome />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

describe('Welcome', () => {
  it('shows the prototype copy', async () => {
    await renderWelcome();
    expect(screen.getByText(copy.welcome.eyebrow)).toBeTruthy();
    expect(screen.getByText(copy.welcome.title)).toBeTruthy();
    expect(screen.getByText(copy.welcome.google)).toBeTruthy();
  });

  it('shows the error row when sign-in fails', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('network'));
    await renderWelcome();
    await fireEvent.press(screen.getByTestId('sign-in-google'));
    expect(await screen.findByText(copy.welcome.error)).toBeTruthy();
  });

  it('stays quiet when the user cancels', async () => {
    mockSignIn.mockImplementationOnce((Cancelled: new () => Error) => Promise.reject(new Cancelled()));
    await renderWelcome();
    await fireEvent.press(screen.getByTestId('sign-in-google'));
    expect(screen.queryByText(copy.welcome.error)).toBeNull();
  });
});
