import { Stack } from 'expo-router';

/** Capture flow: camera → crop → reading → review. Camera and crop are full-bleed ink screens. */
export default function CaptureLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
