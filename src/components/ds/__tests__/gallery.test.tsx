import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ComponentsGallery from '../../../../app/dev/components';
import { ThemeProvider } from '@/theme';

const metrics = { frame: { x: 0, y: 0, width: 412, height: 915 }, insets: { top: 24, left: 0, right: 0, bottom: 16 } };

describe('component gallery', () => {
  it('renders every component in day and night', async () => {
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <ThemeProvider forced="day">
          <BottomSheetModalProvider>
            <ComponentsGallery />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </SafeAreaProvider>,
    );
    expect(screen.getByText('Components')).toBeTruthy();
    expect(screen.getAllByText('මාර්ටින් වික්‍රමසිංහ').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByText('Night reading'));
    expect(screen.getByText('Components')).toBeTruthy();
  });
});
