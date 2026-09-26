// Sentry's Expo config adds Debug IDs to the bundle and source maps so release crashes symbolicate.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
