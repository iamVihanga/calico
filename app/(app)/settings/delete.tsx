import { onlineManager } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { Input } from '@/components/ds/Input';
import { Skeleton } from '@/components/ds/Skeleton';
import { Txt } from '@/components/ds/Txt';
import { deleteAccount } from '@/features/account/api';
import { deletionCounts } from '@/features/account/logic';
import { signOut } from '@/features/auth/signOut';
import { useLibraryItems } from '@/features/library/items';
import { copy } from '@/i18n/en';
import { toast } from '@/lib/stores/toast';
import { layout, useTheme } from '@/theme';

/**
 * Delete account (plan §11.13): the counts of what goes, type DELETE, then `delete-account` removes the
 * covers and the user (everything cascades) and the phone signs out and forgets it all.
 */
export default function DeleteAccount() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { items, isPending } = useLibraryItems();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const n = deletionCounts(items);
  const armed = typed.trim().toUpperCase() === copy.account.deleteWord;

  const run = async () => {
    if (!onlineManager.isOnline()) {
      toast({ message: copy.account.deleteOffline });
      return;
    }
    setBusy(true);
    try {
      await deleteAccount();
      await signOut(); // clears the cache, drafts and reminders; the auth gate returns to Welcome
    } catch {
      setBusy(false);
      toast({ message: copy.account.deleteFailed });
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
      testID="screen-delete-account"
    >
      <View style={{ paddingHorizontal: 16 }}>
        <IconButton icon="arrow_back" label={copy.settings.back} tone="card" onPress={() => router.back()} />
      </View>
      <View style={{ paddingHorizontal: layout.gutterScreen, paddingTop: 20, gap: 14 }}>
        <Txt family="display" weight={700} size={28} accessibilityRole="header" style={{ letterSpacing: -0.02 * 28 }}>
          {copy.account.deleteTitle}
        </Txt>
        {/* Counts only once the library has loaded: "0 books" while loading would be wrong. */}
        {isPending ? (
          <Skeleton height={60} />
        ) : (
          <Txt family="ui" size={15} color="textSecondary" testID="delete-body">
            {copy.account.deleteBody(n.book, n.movie, n.show)}
          </Txt>
        )}
        <Input
          label={copy.account.typeDelete}
          value={typed}
          onChange={setTyped}
          autoCapitalize="characters"
          autoCorrect={false}
          testID="delete-confirm-input"
        />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
          <Button variant="secondary" block style={{ flex: 1, minHeight: 52 }} onPress={() => router.back()}>
            {copy.account.cancel}
          </Button>
          <Button
            variant="danger"
            block
            style={{ flex: 1, minHeight: 52 }}
            disabled={!armed || busy}
            loading={busy}
            testID="delete-everything"
            onPress={() => void run()}
          >
            {copy.account.deleteEverything}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
