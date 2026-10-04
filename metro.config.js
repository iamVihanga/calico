// Sentry's Expo config adds Debug IDs to the bundle and source maps so release crashes symbolicate.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

// Evaluate a module the first time it's used instead of at startup (shortens the static splash).
// Side-effect imports (`import 'x'`) still run in order.
const getTransformOptions = config.transformer.getTransformOptions;
config.transformer.getTransformOptions = async (...args) => {
  const options = (await getTransformOptions?.(...args)) ?? {};
  return { ...options, transform: { ...options.transform, inlineRequires: true } };
};

module.exports = config;
