import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

const tiles = {
  day: require('../../../assets/illustrations/paper-day@3x.png'),
  night: require('../../../assets/illustrations/paper-night@3x.png'),
};

/**
 * The prototype's paper fleck (`--fleck`): a faint dot every 4dp over the whole screen. A repeated
 * 4dp tile, so it costs nothing while scrolling; it sits above the screens (screens paint their own
 * backgrounds) and lets every touch through.
 */
export function Paper() {
  const { name } = useTheme();
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
      testID="paper"
    >
      <Image source={tiles[name === 'night' ? 'night' : 'day']} resizeMode="repeat" style={StyleSheet.absoluteFill} />
    </View>
  );
}
