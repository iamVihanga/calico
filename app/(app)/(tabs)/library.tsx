import { EmptyState } from '@/components/ds/EmptyState';
import { ScreenHeader } from '@/components/ds/ScreenHeader';
import { Kiri } from '@/components/calico/Kiri';
import { TabScreen } from '@/components/layout/TabScreen';
import { copy } from '@/i18n/en';

/** Placeholder until Phase 2 (plan §13). */
export default function Library() {
  return (
    <TabScreen testID="screen-library">
      <ScreenHeader hand={copy.headers.libraryHand} title={copy.headers.library} />
      <EmptyState art={<Kiri pose="curled" width={140} />} body={copy.dev.phase(2)} />
    </TabScreen>
  );
}
