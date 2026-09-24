// Per-weight imports so only the weights we use end up in the bundle.
import { Caveat_400Regular } from '@expo-google-fonts/caveat/400Regular';
import { Caveat_700Bold } from '@expo-google-fonts/caveat/700Bold';
import { NotoSansSinhala_400Regular } from '@expo-google-fonts/noto-sans-sinhala/400Regular';
import { NotoSansSinhala_600SemiBold } from '@expo-google-fonts/noto-sans-sinhala/600SemiBold';
import { NotoSansSinhala_700Bold } from '@expo-google-fonts/noto-sans-sinhala/700Bold';
import { Nunito_300Light } from '@expo-google-fonts/nunito/300Light';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { PlayfairDisplay_900Black } from '@expo-google-fonts/playfair-display/900Black';

import { iconFont } from '@/components/ds/Icon';

/** Every font the app renders with. Keys are the registered family names used in `typography.ts`. */
export const appFonts = {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_900Black,
  Caveat_400Regular,
  Caveat_700Bold,
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_900Black,
  NotoSansSinhala_400Regular,
  NotoSansSinhala_600SemiBold,
  NotoSansSinhala_700Bold,
  ...iconFont,
};
