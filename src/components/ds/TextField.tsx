import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { createContext, forwardRef, useContext } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

/** True inside a `Sheet` (it provides it). */
export const InSheetContext = createContext(false);

/**
 * The one text input the design system renders. Inside a sheet it's the bottom sheet's own input:
 * the sheet only rises above the keyboard when the focused input tells it so, and a plain
 * TextInput doesn't, so the keyboard covered the field.
 */
export const TextField = forwardRef<TextInput, TextInputProps>(function TextField(props, ref) {
  const inSheet = useContext(InSheetContext);
  return inSheet ? <BottomSheetTextInput ref={ref as never} {...props} /> : <TextInput ref={ref} {...props} />;
});
