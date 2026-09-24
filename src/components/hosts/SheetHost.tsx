import { Sheet } from '@/components/ds/Sheet';
import { copy } from '@/i18n/en';
import { type SheetName, useSheetStore } from '@/lib/stores/sheet';

import { AddSheetBody } from './sheets/AddSheet';

/** Renders whichever global sheet is open (plan §9.1). Phases register more sheets here. */
export function SheetHost() {
  const sheet = useSheetStore((s) => s.sheet);
  const close = useSheetStore((s) => s.close);
  const is = (name: SheetName) => sheet?.name === name;

  return (
    <Sheet open={is('add')} onClose={close} hand={copy.add.hand} title={copy.add.title} testID="sheet-add">
      <AddSheetBody onClose={close} />
    </Sheet>
  );
}
