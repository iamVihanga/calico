import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Calico',
  slug: 'calico',
  scheme: 'calico',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  android: {
    package: 'com.yourname.calico', // decide before the first Play upload; cannot change later
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
    '@sentry/react-native/expo',
  ],
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: process.env.EAS_PROJECT_ID } },
};

export default config;
