import { widgetsAvailable } from './store';

/** Called from the entry file: lets Android draw and update the widgets while the app is closed. */
export function registerWidgets() {
  if (!widgetsAvailable()) return;
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { registerWidgetTaskHandler } =
    require('react-native-android-widget') as typeof import('react-native-android-widget');
  const { widgetTaskHandler } = require('./taskHandler') as typeof import('./taskHandler');
  /* eslint-enable @typescript-eslint/no-require-imports */
  registerWidgetTaskHandler(widgetTaskHandler);
}
