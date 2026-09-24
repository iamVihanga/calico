import { EmptyState } from '@/components/ds/EmptyState';
import { ScreenHeader } from '@/components/ds/ScreenHeader';
import { Kiri } from '@/components/calico/Kiri';
import { TabScreen } from '@/components/layout/TabScreen';
import { copy } from '@/i18n/en';

/** Placeholder until Phase 6 (plan §13). */
export default function UpNext() {
  return (
    <TabScreen testID="screen-up-next">
      <ScreenHeader hand={copy.headers.upNextHand} title={copy.headers.upNext} />
      <EmptyState art={<Kiri pose="curled" width={140} />} body={copy.dev.phase(6)} />
    </TabScreen>
  );
}
