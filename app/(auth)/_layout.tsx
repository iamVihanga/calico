import { Stack } from 'expo-router';
import { View } from 'react-native';

import { Paper } from '@/components/calico/Paper';

export default function AuthLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <Paper />
    </View>
  );
}
