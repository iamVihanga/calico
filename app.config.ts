import type { ExpoConfig } from 'expo/config';

/**
 * The Play package name can never change after the first upload, so it comes from the environment
 * (EAS environment variable `ANDROID_PACKAGE`) and a production build refuses the placeholder.
 */
const PLACEHOLDER_PACKAGE = 'com.yourname.calico';
const androidPackage = process.env.ANDROID_PACKAGE || PLACEHOLDER_PACKAGE;
if (process.env.EAS_BUILD_PROFILE === 'production' && androidPackage === PLACEHOLDER_PACKAGE) {
  throw new Error('Set ANDROID_PACKAGE (EAS environment variable) before a production build. See docs/release.md.');
}

const config: ExpoConfig = {
  name: 'Calico',
  slug: 'calico',
  scheme: 'calico',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  android: {
    package: androidPackage,
    adaptiveIcon: { foregroundImage: './assets/images/adaptive-icon.png', backgroundColor: '#FBF6EE' },
    permissions: ['CAMERA', 'POST_NOTIFICATIONS', 'VIBRATE'],
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-camera',
      {
        cameraPermission: 'Calico uses the camera to scan barcodes and photograph book covers.',
        recordAudioAndroid: false,
      },
    ],
    ['expo-image-picker', { photosPermission: 'Calico lets you pick a book cover photo from your gallery.' }],
    ['expo-notifications', { icon: './assets/images/notification-icon.png', color: '#EC6426' }],
    ['expo-splash-screen', { backgroundColor: '#FBF6EE', image: './assets/images/splash.png', imageWidth: 180 }],
    '@react-native-google-signin/google-signin',
    // Source maps upload during EAS builds when SENTRY_ORG, SENTRY_PROJECT and SENTRY_AUTH_TOKEN are set.
    '@sentry/react-native/expo',
  ],
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: process.env.EAS_PROJECT_ID } },
};

export default config;
