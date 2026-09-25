import { Sheet } from '@/components/ds/Sheet';
import {
  ConfirmDeleteSheetBody,
  FinishSheetBody,
  OverflowSheetBody,
  StartReadingSheetBody,
  StopSheetBody,
} from '@/features/books/sheets/BookSheets';
import { RulerSheetBody } from '@/features/books/sheets/RulerSheet';
import { copy } from '@/i18n/en';
import { type SheetName, useSheetStore } from '@/lib/stores/sheet';

import { AddSheetBody } from './sheets/AddSheet';

/** Renders whichever global sheet is open (plan §9.1). Phases register more sheets here. */
export function SheetHost() {
  const sheet = useSheetStore((s) => s.sheet);
  const close = useSheetStore((s) => s.close);
  // A sheet that opens another (ruler → finish) gets dismissed after the swap; only close if still current.
  const closer = (name: SheetName) => () => {
    if (useSheetStore.getState().sheet?.name === name) close();
  };
  const id = sheet && 'params' in sheet && sheet.params ? (sheet.params as { itemId: string }).itemId : '';

  return (
    <>
      <Sheet
        open={sheet?.name === 'add'}
        onClose={closer('add')}
        hand={copy.add.hand}
        title={copy.add.title}
        testID="sheet-add"
      >
        <AddSheetBody onClose={closer('add')} />
      </Sheet>
      <Sheet open={sheet?.name === 'ruler'} onClose={closer('ruler')} testID="sheet-ruler">
        {sheet?.name === 'ruler' && <RulerSheetBody key={id} itemId={id} onClose={closer('ruler')} />}
      </Sheet>
      <Sheet open={sheet?.name === 'finish'} onClose={closer('finish')} testID="sheet-finish">
        {sheet?.name === 'finish' && <FinishSheetBody key={id} itemId={id} onClose={closer('finish')} />}
      </Sheet>
      <Sheet open={sheet?.name === 'stop'} onClose={closer('stop')} testID="sheet-stop">
        {sheet?.name === 'stop' && <StopSheetBody key={id} itemId={id} onClose={closer('stop')} />}
      </Sheet>
      <Sheet
        open={sheet?.name === 'startReading'}
        onClose={closer('startReading')}
        title={sheet?.name === 'startReading' && sheet.params.reread ? copy.startDate.reread : copy.startDate.title}
        testID="sheet-start"
      >
        {sheet?.name === 'startReading' && (
          <StartReadingSheetBody key={id} itemId={id} reread={sheet.params.reread} onClose={closer('startReading')} />
        )}
      </Sheet>
      <Sheet open={sheet?.name === 'overflow'} onClose={closer('overflow')} testID="sheet-overflow">
        {sheet?.name === 'overflow' && <OverflowSheetBody key={id} itemId={id} onClose={closer('overflow')} />}
      </Sheet>
      <Sheet open={sheet?.name === 'confirmDelete'} onClose={closer('confirmDelete')} testID="sheet-delete">
        {sheet?.name === 'confirmDelete' && (
          <ConfirmDeleteSheetBody key={id} itemId={id} onClose={closer('confirmDelete')} />
        )}
      </Sheet>
    </>
  );
}
