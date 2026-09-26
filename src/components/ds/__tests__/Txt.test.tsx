import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemeProvider } from '@/theme';

import { Txt } from '../Txt';

const wrap = (ui: React.ReactElement) => render(<ThemeProvider forced="day">{ui}</ThemeProvider>);

describe('<Txt>', () => {
  it('uses the role family for Latin text', async () => {
    await wrap(<Txt role="title">Library</Txt>);
    const s = StyleSheet.flatten(screen.getByText('Library').props.style);
    expect(s.fontFamily).toBe('PlayfairDisplay_700Bold');
    expect(s.fontSize).toBe(30);
  });

  it('switches to Noto Sans Sinhala and raises line height for Sinhala', async () => {
    await wrap(<Txt role="hero">මාර්ටින් වික්‍රමසිංහ</Txt>);
    const s = StyleSheet.flatten(screen.getByText('මාර්ටින් වික්‍රමසිංහ').props.style);
    expect(s.fontFamily).toBe('NotoSansSinhala_700Bold');
    expect(s.lineHeight).toBeGreaterThanOrEqual(Math.round(48 * 1.5));
  });

  it('splits mixed strings into nested runs', async () => {
    await wrap(<Txt role="body">මඩොල් දූව is due in 3 days</Txt>);
    const run = screen.getByText('මඩොල් දූව');
    expect(StyleSheet.flatten(run.props.style).fontFamily).toBe('NotoSansSinhala_400Regular');
    const outer = screen.getByText('මඩොල් දූව is due in 3 days');
    expect(StyleSheet.flatten(outer.props.style).fontFamily).toBe('Nunito_400Regular');
  });
});

describe('touch targets', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { minTargetSlop } = require('../Press') as typeof import('../Press');
  it('grows anything under 48dp to 48dp', () => {
    expect(minTargetSlop({ minHeight: 44 })).toEqual({ top: 2, bottom: 2, left: 0, right: 0 });
    expect(minTargetSlop([{ width: 36, height: 36 }])).toEqual({ top: 6, bottom: 6, left: 6, right: 6 });
    expect(minTargetSlop({ minHeight: 52 })).toBeUndefined();
    expect(minTargetSlop({ flex: 1 })).toBeUndefined();
  });
});
