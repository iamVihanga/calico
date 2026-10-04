// Renders the home-screen widget previews (shown in the launcher's widget picker) with headless Chrome.
// Usage: npm run widget-previews   (needs Google Chrome or Chromium; CHROME=/path/to/chrome if not on PATH)
// Writes assets/widgets/*.png (app.config.ts → react-native-android-widget previewImage). The mocks follow
// src/features/widgets/widgets.tsx in the day theme.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const chrome = process.env.CHROME || 'google-chrome';
const font = (p) => `file://${join(root, 'node_modules/@expo-google-fonts', p)}`;
const art = (p) => `file://${join(root, 'design/v2/assets', p)}`;

// src/theme/themes.ts (day) and tokens.ts
const t = {
  card: '#FFFDF9',
  primary: '#1C1714',
  secondary: '#6E4738',
  muted: '#8A7565',
  accent: '#EC6426',
  onAccent: '#2A1206',
  sunk: '#F3EADD',
  cover: '#1F3A32',
  coverInk: '#FBF6EE',
};

const page = (w, h, body) => `<!doctype html><html><head><style>
  @font-face{font-family:Playfair;src:url('${font('playfair-display/700Bold/PlayfairDisplay_700Bold.ttf')}')}
  @font-face{font-family:Nunito;src:url('${font('nunito/400Regular/Nunito_400Regular.ttf')}')}
  @font-face{font-family:NunitoBold;src:url('${font('nunito/700Bold/Nunito_700Bold.ttf')}')}
  html,body{margin:0;background:transparent;overflow:hidden}
  .card{box-sizing:border-box;width:${w}px;height:${h}px;padding:14px;display:flex;gap:12px;align-items:center;
    background:${t.card};border-radius:22px;font-family:Nunito;color:${t.primary}}
  .eyebrow{font:11px NunitoBold;color:${t.accent};letter-spacing:.04em}
  .title{font:16px/1.2 Playfair;margin-top:2px}
  .muted{font-size:12px;color:${t.muted}}
  .col{display:flex;flex-direction:column;flex:1;min-width:0}
  </style></head><body>${body}</body></html>`;

const reading = page(
  300,
  140,
  `<div class="card">
    <div style="width:56px;height:84px;border-radius:4px;background:${t.cover};color:${t.coverInk};
      font:9px/1.15 Playfair;padding:5px;box-sizing:border-box">Madol Doova</div>
    <div class="col" style="height:100%;justify-content:space-between">
      <div><div class="eyebrow">CONTINUE READING</div><div class="title">Madol Doova</div>
        <div class="muted">Martin Wickramasinghe</div></div>
      <div>
        <div style="height:6px;border-radius:3px;background:${t.sunk}"><div style="width:70%;height:6px;border-radius:3px;background:${t.accent}"></div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
          <span style="font:12px NunitoBold;color:${t.secondary}">Page 150 of 214</span>
          <span style="font:12px NunitoBold;color:${t.onAccent};background:${t.accent};padding:6px 12px;border-radius:999px">Log page</span>
        </div>
      </div>
    </div>
  </div>`,
);

const next = page(
  300,
  110,
  `<div class="card">
    <img src="${art('art/girl-reading.png')}" style="width:96px;height:72px;border-radius:12px;object-fit:cover;background:${t.cover}">
    <div class="col"><div class="eyebrow">UP NEXT</div><div class="title">House of the Dragon</div>
      <div style="font-size:12px;color:${t.secondary};margin-top:2px">S2 E6 · Smallfolk</div></div>
    <div style="width:48px;height:48px;border-radius:24px;background:${t.accent};color:${t.onAccent};
      display:flex;align-items:center;justify-content:center;font:22px NunitoBold">✓</div>
  </div>`,
);

const due = page(
  150,
  150,
  `<div class="card" style="align-items:stretch">
    <div class="col" style="justify-content:space-between">
      <div><div class="eyebrow">DUE SOON</div><div class="title">Gamperaliya</div></div>
      <div><div style="font:13px NunitoBold;color:${t.accent}">Due in 3 days</div>
        <div style="font-size:11px;color:${t.muted}">Colombo Public Library</div></div>
    </div>
  </div>`,
);

const outputs = [
  ['assets/widgets/continue-reading.png', 300, 140, reading],
  ['assets/widgets/next-episode.png', 300, 110, next],
  ['assets/widgets/due-soon.png', 150, 150, due],
];

mkdirSync(join(root, 'assets/widgets'), { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'calico-widgets-'));
try {
  for (const [out, w, h, html] of outputs) {
    const src = join(tmp, 'page.html');
    writeFileSync(src, html);
    execFileSync(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--hide-scrollbars',
        '--allow-file-access-from-files',
        '--force-device-scale-factor=2',
        '--default-background-color=00000000',
        `--window-size=${w},${h}`,
        `--screenshot=${join(root, out)}`,
        `file://${src}`,
      ],
      { stdio: 'ignore' },
    );
    console.log(out);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
