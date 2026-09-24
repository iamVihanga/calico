import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { Kiri } from '@/components/calico';
import { EmptyState } from '@/components/ds';
import { copy } from '@/i18n/en';

// Phase 0: in development the app opens the component gallery. Phase 1 replaces this with the auth gate.
export default function Index() {
  if (__DEV__) return <Redirect href="/dev/components" />;
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <EmptyState art={<Kiri pose="curled" />} hand={copy.welcome.eyebrow} title={copy.welcome.title} />
    </View>
  );
}
