import { Sheet } from '@/components/ds/Sheet';
import {
  ChangeCoverSheetBody,
  ConfirmDeleteSheetBody,
  FinishSheetBody,
  OverflowSheetBody,
  StartReadingSheetBody,
  StopSheetBody,
} from '@/features/books/sheets/BookSheets';
import { ExportSheetBody, SettingSheetBody } from '@/features/account/SettingSheets';
import { RulerSheetBody } from '@/features/books/sheets/RulerSheet';
import {
  AddToCollectionSheetBody,
  CollectionMenuSheetBody,
  NewCollectionSheetBody,
  TraySheetBody,
} from '@/features/collections/CollectionSheets';
import {
  LoanFormSheetBody,
  LoanQuickSheetBody,
  NotifSheetBody,
  RenewSheetBody,
} from '@/features/loans/sheets/LoanSheets';
import {
  FranchiseSheetBody,
  MediaOverflowSheetBody,
  TmdbPreviewSheetBody,
  WatchAgainSheetBody,
} from '@/features/media/sheets/MediaSheets';
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
      <Sheet open={sheet?.name === 'changeCover'} onClose={closer('changeCover')} testID="sheet-change-cover">
        {sheet?.name === 'changeCover' && <ChangeCoverSheetBody key={id} itemId={id} onClose={closer('changeCover')} />}
      </Sheet>
      <Sheet open={sheet?.name === 'confirmDelete'} onClose={closer('confirmDelete')} testID="sheet-delete">
        {sheet?.name === 'confirmDelete' && (
          <ConfirmDeleteSheetBody key={id} itemId={id} onClose={closer('confirmDelete')} />
        )}
      </Sheet>
      <Sheet open={sheet?.name === 'renew'} onClose={closer('renew')} testID="sheet-renew">
        {sheet?.name === 'renew' && <RenewSheetBody key={id} itemId={id} onClose={closer('renew')} />}
      </Sheet>
      <Sheet open={sheet?.name === 'loanQuick'} onClose={closer('loanQuick')} testID="sheet-loan-quick">
        {sheet?.name === 'loanQuick' && <LoanQuickSheetBody key={id} itemId={id} onClose={closer('loanQuick')} />}
      </Sheet>
      <Sheet open={sheet?.name === 'loanForm'} onClose={closer('loanForm')} testID="sheet-loan-form">
        {sheet?.name === 'loanForm' && <LoanFormSheetBody key={id} itemId={id} onClose={closer('loanForm')} />}
      </Sheet>
      <Sheet open={sheet?.name === 'tmdbPreview'} onClose={closer('tmdbPreview')} testID="sheet-tmdb-preview">
        {sheet?.name === 'tmdbPreview' && (
          <TmdbPreviewSheetBody key={sheet.params.tmdbId} p={sheet.params} onClose={closer('tmdbPreview')} />
        )}
      </Sheet>
      <Sheet open={sheet?.name === 'franchise'} onClose={closer('franchise')} testID="sheet-franchise">
        {sheet?.name === 'franchise' && <FranchiseSheetBody key={id} p={sheet.params} onClose={closer('franchise')} />}
      </Sheet>
      <Sheet open={sheet?.name === 'watchAgain'} onClose={closer('watchAgain')} testID="sheet-watch-again">
        {sheet?.name === 'watchAgain' && <WatchAgainSheetBody key={id} itemId={id} onClose={closer('watchAgain')} />}
      </Sheet>
      <Sheet open={sheet?.name === 'mediaOverflow'} onClose={closer('mediaOverflow')} testID="sheet-media-overflow">
        {sheet?.name === 'mediaOverflow' && (
          <MediaOverflowSheetBody key={id} itemId={id} onClose={closer('mediaOverflow')} />
        )}
      </Sheet>
      <Sheet open={sheet?.name === 'tray'} onClose={closer('tray')} testID="sheet-tray">
        {sheet?.name === 'tray' && <TraySheetBody p={sheet.params} onClose={closer('tray')} />}
      </Sheet>
      <Sheet
        open={sheet?.name === 'addToCollection'}
        onClose={closer('addToCollection')}
        testID="sheet-add-to-collection"
      >
        {sheet?.name === 'addToCollection' && (
          <AddToCollectionSheetBody itemId={sheet.params.itemId} title={sheet.params.title} />
        )}
      </Sheet>
      <Sheet open={sheet?.name === 'newCollection'} onClose={closer('newCollection')} testID="sheet-new-collection">
        {sheet?.name === 'newCollection' && (
          <NewCollectionSheetBody p={sheet.params} onClose={closer('newCollection')} />
        )}
      </Sheet>
      <Sheet open={sheet?.name === 'collectionMenu'} onClose={closer('collectionMenu')} testID="sheet-collection-menu">
        {sheet?.name === 'collectionMenu' && (
          <CollectionMenuSheetBody collectionId={sheet.params.collectionId} onClose={closer('collectionMenu')} />
        )}
      </Sheet>
      <Sheet open={sheet?.name === 'setting'} onClose={closer('setting')} testID="sheet-setting">
        {sheet?.name === 'setting' && (
          <SettingSheetBody key={sheet.params.field} p={sheet.params} onClose={closer('setting')} />
        )}
      </Sheet>
      <Sheet open={sheet?.name === 'export'} onClose={closer('export')} testID="sheet-export">
        {sheet?.name === 'export' && <ExportSheetBody onClose={closer('export')} />}
      </Sheet>
      <Sheet open={sheet?.name === 'notif'} onClose={closer('notif')} testID="sheet-notif">
        {sheet?.name === 'notif' && <NotifSheetBody onClose={closer('notif')} />}
      </Sheet>
    </>
  );
}
