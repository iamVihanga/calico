// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: ['node_modules/*', 'design/*', 'dist/*', '.expo/*', 'android/*', 'ios/*', 'supabase/functions/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Screens and components render text only through <Txt>.
    files: ['app/**/*.tsx', 'src/components/**/*.tsx'],
    ignores: ['src/components/ds/Txt.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'react-native', importNames: ['Text'], message: 'Use <Txt> from @/components/ds.' }] },
      ],
    },
  },
]);
