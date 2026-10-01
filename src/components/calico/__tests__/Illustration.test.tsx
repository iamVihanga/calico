import { render, screen } from '@testing-library/react-native';

import { Illustration } from '../Illustration';
import { illustrations, type IllustrationName } from '../illustrations.generated';

describe('Illustration', () => {
  const names = Object.keys(illustrations) as IllustrationName[];

  it('has every design/v2 illustration, each with a bundled file', () => {
    expect(names.length).toBeGreaterThanOrEqual(28);
    for (const name of names) expect(illustrations[name].source).toBeTruthy();
  });

  it('keeps the aspect ratio and is decorative unless labelled', async () => {
    await render(
      <>
        <Illustration name="cat-loaf" width={300} />
        <Illustration name="girl-reading" width={172} accessibilityLabel="A reader" />
      </>,
    );
    // Decorative art is hidden from TalkBack, so it's only found when hidden elements are included.
    expect(screen.queryByTestId('art-cat-loaf')).toBeNull();
    const cat = screen.getByTestId('art-cat-loaf', { includeHiddenElements: true });
    expect(cat).toHaveStyle({ width: 300, height: Math.round((300 * 489) / 600) });
    expect(cat.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(screen.getByLabelText('A reader')).toBeTruthy();
  });
});
