import { Redirect, Stack } from 'expo-router';

/** Developer-only routes (component gallery, notification tester). Unreachable in release builds. */
export default function DevLayout() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
