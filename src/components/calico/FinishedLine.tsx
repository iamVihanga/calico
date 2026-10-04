import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import type { LocalDate } from '@/lib/dates';
import { finishedText, type Precision } from '@/lib/when';

type Props = { verb: 'read' | 'watched'; on: LocalDate | null; precision: Precision | null | undefined };

/** Under a finished item's title: "Read 3 Mar 2024", "Watched in March 2024", "Read a while ago". */
export function FinishedLine({ verb, on, precision }: Props) {
  if (!on) return null;
  const text = finishedText(on, precision);
  const exactDay = precision !== 'month' && precision !== 'year';
  return (
    <Txt
      family="hand"
      weight={400}
      size="md"
      color="textAccent"
      align="center"
      style={{ marginTop: 10 }}
      testID="finished-line"
    >
      {verb === 'read' ? copy.finished.read(text, exactDay) : copy.finished.watched(text, exactDay)}
    </Txt>
  );
}
