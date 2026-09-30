// The app's tsconfig has no Node types, so fs is typed here by hand.
const { readdirSync, readFileSync, statSync } = jest.requireActual<{
  readdirSync: (dir: string) => string[];
  readFileSync: (file: string, encoding: 'utf8') => string;
  statSync: (path: string) => { isDirectory: () => boolean };
}>('fs');
const join = (...parts: string[]) => parts.join('/');

/**
 * Android throws on mount for an accessibility role it doesn't know (e.g. the iOS-only "tabbar"),
 * while TypeScript accepts every role React Native lists. This keeps the app to Android's roles
 * (ReactAccessibilityDelegate.AccessibilityRole in React Native).
 */
const ANDROID_ROLES = new Set([
  'none',
  'button',
  'dropdownlist',
  'togglebutton',
  'link',
  'search',
  'image',
  'imagebutton',
  'keyboardkey',
  'text',
  'adjustable',
  'summary',
  'header',
  'alert',
  'checkbox',
  'combobox',
  'menu',
  'menubar',
  'menuitem',
  'progressbar',
  'radio',
  'radiogroup',
  'scrollbar',
  'spinbutton',
  'switch',
  'tab',
  'tablist',
  'timer',
  'list',
  'grid',
  'pager',
  'scrollview',
  'horizontalscrollview',
  'viewgroup',
  'webview',
  'drawerlayout',
  'slidingdrawer',
  'iconmenu',
  'toolbar',
]);

// This file lives in src/components/ds/__tests__/, four levels below the repo root.
const root = expect.getState().testPath!.split('/').slice(0, -5).join('/');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sources(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('accessibility roles', () => {
  it('uses only roles Android accepts', () => {
    const bad: string[] = [];
    for (const file of [...sources(join(root, 'app')), ...sources(join(root, 'src'))]) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/accessibilityRole(?:=|:\s*)["']([a-z]+)["']/g)) {
        if (!ANDROID_ROLES.has(m[1]!)) bad.push(`${file.slice(root.length + 1)}: ${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
