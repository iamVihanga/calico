import { EmptyState } from '@/components/ds/EmptyState';
import { ScreenHeader } from '@/components/ds/ScreenHeader';
import { Kiri } from '@/components/calico/Kiri';
import { TabScreen } from '@/components/layout/TabScreen';
import { copy } from '@/i18n/en';

/** Placeholder until Phase 6 (plan §13). */
export default function Collections() {
  return (
    <TabScreen testID="screen-collections">
      <ScreenHeader hand={copy.headers.collectionsHand} title={copy.headers.collections} />
      <EmptyState art={<Kiri pose="curled" width={140} />} body={copy.dev.phase(6)} />
    </TabScreen>
  );
}
