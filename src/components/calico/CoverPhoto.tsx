import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { useCoverSource } from '@/lib/covers';

type Props = { item: { coverPath: string | null; coverUrl: string | null }; label?: string };

/** Fills its (cover-shaped, overflow-hidden) parent with the item's photo when there is one. */
export function CoverPhoto({ item, label }: Props) {
  const src = useCoverSource(item);
  if (!src) return null;
  return (
    <Image
      source={{ uri: src.uri, cacheKey: src.cacheKey }}
      cachePolicy="disk"
      contentFit="cover"
      accessibilityLabel={label}
      style={StyleSheet.absoluteFill}
      transition={120}
    />
  );
}
