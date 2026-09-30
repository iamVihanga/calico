import { Image } from 'expo-image';
import { useState } from 'react';

import { initials } from '@/components/ds/Avatar';
import { Txt, type TxtProps } from '@/components/ds/Txt';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTheme } from '@/theme';

import { useProfile } from './hooks';

/** The Google profile photo: stored on the profile at sign-up, else still in the session's metadata. */
export function useAvatarUrl(): string | null {
  const { session } = useAuth();
  const stored = useProfile().data?.avatar_url;
  const meta = session?.user.user_metadata as { avatar_url?: string; picture?: string } | undefined;
  return stored || meta?.avatar_url || meta?.picture || null;
}

/**
 * What goes inside a round avatar frame: the Google photo filling it, or the initials when there
 * is no photo or it fails to load (offline with an empty cache). The frame must clip (overflow hidden).
 */
export function AvatarFace({ name, size }: { name: string; size: TxtProps['size'] }) {
  const { t } = useTheme();
  const uri = useAvatarUrl();
  const [failed, setFailed] = useState<string | null>(null);
  if (uri && failed !== uri) {
    return (
      <Image
        source={{ uri }}
        onError={() => setFailed(uri)}
        contentFit="cover"
        cachePolicy="disk"
        style={{ width: '100%', height: '100%' }}
      />
    );
  }
  return (
    <Txt family="ui" weight={700} size={size} tint={t.inkOnWarm}>
      {initials(name)}
    </Txt>
  );
}
