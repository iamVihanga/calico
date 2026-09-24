import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { BackHandler, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, radius, shadow, space, useTheme } from '@/theme';

import { Txt } from './Txt';

type HeaderProps = { title?: string; hand?: string };

type PanelProps = HeaderProps & {
  children?: ReactNode;
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function SheetHeader({ title, hand }: HeaderProps) {
  if (!title && !hand) return null;
  return (
    <View style={{ gap: 4 }}>
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
}

function SheetBody({ title, hand, children, actions }: PanelProps) {
  return (
    <View style={{ gap: space[5], paddingHorizontal: layout.gutterScreen, paddingTop: space[3] }}>
      <SheetHeader title={title} hand={hand} />
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
 */
export function Sheet({ open, onClose, testID, ...panel }: SheetProps) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (open) ref.current?.present();
    else ref.current?.dismiss();
  }, [open]);

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

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      enableDynamicSizing
      maxDynamicContentSize={Math.round(height * 0.88)}
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
        <SheetBody {...panel} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
