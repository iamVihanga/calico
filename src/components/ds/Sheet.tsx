import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { type ReactNode, useCallback, useEffect } from 'react';
import { BackHandler, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, radius, shadow, space, useTheme } from '@/theme';

import { Portal } from './Portal';
import { InSheetContext } from './TextField';
import { Txt } from './Txt';

/** `art`: a small illustration beside the header (design/v2's Add sheet flower). */
type HeaderProps = { title?: string; hand?: string; art?: ReactNode };

type PanelProps = HeaderProps & {
  children?: ReactNode;
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function SheetHeader({ title, hand, art }: HeaderProps) {
  if (!title && !hand) return null;
  const text = (
    <View style={{ gap: 4, flex: art ? 1 : undefined }}>
      {hand && (
        <Txt family="hand" weight={400} size="lg" leading={1} color="textAccent">
          {hand}
        </Txt>
      )}
      {title && (
        <Txt role="title" size="xl" style={{ letterSpacing: -0.02 * 24 }}>
          {title}
        </Txt>
      )}
    </View>
  );
  if (!art) return text;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ marginTop: 2 }}>{art}</View>
      {text}
    </View>
  );
}

function SheetBody({ title, hand, art, children, actions }: PanelProps) {
  return (
    <View style={{ gap: space[5], paddingHorizontal: layout.gutterScreen, paddingTop: space[3] }}>
      <SheetHeader title={title} hand={hand} art={art} />
      {children}
      {actions && <View style={{ gap: space[3] }}>{actions}</View>}
    </View>
  );
}

/** Static sheet panel (dev gallery, previews). Same look as the modal sheet. */
export function SheetPanel({ style, ...props }: PanelProps) {
  const { t } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.surfacePage,
          borderRadius: radius.xl,
          boxShadow: shadow.sheet,
          paddingBottom: 30,
        },
        style,
      ]}
    >
      <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}>
        <View style={{ width: 44, height: 5, borderRadius: radius.pill, backgroundColor: t.borderStrong }} />
      </View>
      <SheetBody {...props} />
    </View>
  );
}

type SheetProps = PanelProps & {
  open: boolean;
  onClose: () => void;
  testID?: string;
};

/**
 * Bottom sheet from the prototype: page-coloured paper, 28dp top corners, biscuit handle,
 * ink scrim, dynamic height (max 88%). Android back closes it.
 *
 * A plain BottomSheet mounted only while open, not BottomSheetModal: the modal's present() waits
 * for requestAnimationFrame, which on Android can stall until the next touch, so sheets opened late
 * or not at all. It renders through `Portal`, so it covers the whole screen wherever it's used.
 */
export function Sheet({ open, onClose, testID, ...panel }: SheetProps) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  const backdrop = useCallback(
    (p: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...p}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={1}
        style={[p.style, { backgroundColor: t.surfaceScrim }]}
      />
    ),
    [t.surfaceScrim],
  );

  if (!open) return null;
  return (
    <Portal>
      <BottomSheet
        index={0}
        animateOnMount
        enablePanDownToClose
        // Text fields (TextField) lift the sheet above the keyboard; it settles back when they blur.
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        onClose={onClose}
        enableDynamicSizing
        maxDynamicContentSize={Math.round(height * 0.88)}
        // Sideways drags belong to the content (the page ruler, chip rows), not to the sheet.
        activeOffsetY={[-8, 8]}
        failOffsetX={[-8, 8]}
        backdropComponent={backdrop}
        backgroundStyle={{
          backgroundColor: t.surfacePage,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          boxShadow: shadow.sheet,
        }}
        handleStyle={{ paddingTop: 12, paddingBottom: 6 }}
        handleIndicatorStyle={{ width: 44, height: 5, borderRadius: radius.pill, backgroundColor: t.borderStrong }}
        topInset={insets.top}
      >
        <BottomSheetScrollView testID={testID} contentContainerStyle={{ paddingBottom: 30 + insets.bottom }}>
          <InSheetContext.Provider value>
            <SheetBody {...panel} />
          </InSheetContext.Provider>
        </BottomSheetScrollView>
      </BottomSheet>
    </Portal>
  );
}
