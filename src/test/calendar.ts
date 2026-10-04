import { fireEvent, screen } from 'expo-router/testing-library';

/** Tap a day on a `Calendar` (testID `prefix`), stepping months until it's shown. */
export async function pickDay(prefix: string, date: string) {
  for (let i = 0; i < 24 && !screen.queryByTestId(`${prefix}-day-${date}`); i++) {
    const month = screen.getByTestId(`${prefix}-month`);
    const shownMonth = month.props.children as string;
    const [name, year] = shownMonth.split(' ');
    const shown = `${year}-${String(new Date(`${name} 1, ${year}`).getMonth() + 1).padStart(2, '0')}`;
    await fireEvent.press(screen.getByTestId(date.slice(0, 7) > shown ? `${prefix}-next` : `${prefix}-prev`));
  }
  await fireEvent.press(screen.getByTestId(`${prefix}-day-${date}`));
}
