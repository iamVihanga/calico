// Renders Calico's launcher icons, notification icon, splash image and Play Store graphics from the
// design/v2 artwork (the painted app icon and the illustrations), with headless Chrome.
// Usage: npm run brand   (needs Google Chrome or Chromium; set CHROME=/path/to/chrome if not on PATH)
// Writes assets/images/* (used by app.config.ts) and assets/store/* (uploaded to Play Console).
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const chrome = process.env.CHROME || 'google-chrome';
const v2 = (p) => `file://${join(root, 'design/v2/assets', p)}`;

// Theme palette (src/theme/tokens.ts). The painted icon's background is exactly `forest`.
const c = {
  forest: '#1F3A32',
  fern: '#2F5145',
  night: '#11201B', // bottom of the splash gradient (prototype)
  cream: '#FBF6EE',
  honeycomb: '#E5A657',
  creamMuted: 'rgba(251,246,238,0.72)',
};

const page = (body, css = '') =>
  `<!doctype html><html><head><style>
  html,body{margin:0;background:transparent;overflow:hidden}
  @font-face{font-family:Playfair;src:url('file://${join(root, 'node_modules/@expo-google-fonts/playfair-display/700Bold/PlayfairDisplay_700Bold.ttf')}')}
  @font-face{font-family:Caveat;src:url('file://${join(root, 'node_modules/@expo-google-fonts/caveat/400Regular/Caveat_400Regular.ttf')}')}
  @font-face{font-family:Nunito;src:url('file://${join(root, 'node_modules/@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf')}')}
  .abs{position:absolute;display:block}
  ${css}</style></head><body>${body}</body></html>`;

/** The painted icon filling a square (its transparent rounded corners filled with forest). */
const squareIcon = (size) =>
  page(`<div style="width:${size}px;height:${size}px;background:${c.forest}">
    <img src="${v2('app-icon.png')}" style="width:${size}px;height:${size}px;display:block"></div>`);

/**
 * Adaptive icon foreground: the art shrunk so its corners (the moon) stay inside the launcher's
 * visible circle (72 of 108dp), its square edge feathered into the forest background layer so no
 * seam shows whatever mask the launcher uses.
 */
const adaptiveForeground =
  page(`<div style="width:1024px;height:1024px;display:flex;align-items:center;justify-content:center">
  <img src="${v2('app-icon.png')}" style="width:580px;height:580px;display:block;
    -webkit-mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent),linear-gradient(180deg,transparent,#000 7%,#000 93%,transparent);
    -webkit-mask-composite:source-in;mask-composite:intersect"></div>`);

/** White silhouette of the curled cat (alpha only matters): themed icon and status-bar icon. */
const silhouette = (size, width) =>
  page(`<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
    <img src="${v2('art/cat-loaf.png')}" style="width:${width}px;display:block;filter:brightness(0) invert(1)"></div>`);

const featureGraphic = page(
  `<div style="position:relative;width:1024px;height:500px;overflow:hidden;
     background:linear-gradient(160deg,${c.fern} 0%,${c.night} 100%)">
    <div class="abs" style="left:640px;top:70px;width:300px;height:300px;border-radius:50%;background:rgba(245,226,206,.09)"></div>
    <div class="abs" style="left:700px;top:140px;width:190px;height:190px;border-radius:50%;background:rgba(236,100,38,.25);filter:blur(40px)"></div>
    <img class="abs" src="${v2('art/cat-loaf.png')}" style="left:640px;top:110px;width:300px;filter:drop-shadow(0 18px 32px rgba(10,18,15,.55))">
    <img class="abs" src="${v2('el/moon.png')}" style="left:900px;top:56px;width:64px">
    <img class="abs" src="${v2('el/asterisk.png')}" style="left:830px;top:48px;width:28px">
    <img class="abs" src="${v2('el/heart.png')}" style="left:915px;top:300px;width:34px">
    <img class="abs" src="${v2('el/strokes.png')}" style="left:600px;top:96px;width:44px;opacity:.9">
    <img class="abs" src="${v2('el/dots.png')}" style="left:560px;top:330px;width:48px;opacity:.85">
    <img class="abs" src="${v2('art/cover-atlas.png')}" style="left:610px;top:392px;width:92px;transform:rotate(-9deg);filter:drop-shadow(0 8px 16px rgba(10,18,15,.45))">
    <img class="abs" src="${v2('art/cover-midnight.png')}" style="left:700px;top:376px;width:100px;filter:drop-shadow(0 8px 16px rgba(10,18,15,.45))">
    <img class="abs" src="${v2('art/cover-brighter.png')}" style="left:796px;top:392px;width:92px;transform:rotate(9deg);filter:drop-shadow(0 8px 16px rgba(10,18,15,.45))">
    <div class="abs" style="left:72px;top:150px;font:700 118px Playfair;letter-spacing:-.03em;color:${c.cream};line-height:1">Calico</div>
    <div class="abs" style="left:78px;top:282px;font:400 44px Caveat;color:${c.honeycomb};line-height:1">a shelf that remembers</div>
    <div class="abs" style="left:78px;top:350px;font:600 26px Nunito;color:${c.creamMuted};line-height:1.35">Books, library loans,<br>movies and shows.</div>
  </div>`,
);

// [output, width, height, html]
const outputs = [
  ['assets/images/icon.png', 1024, 1024, squareIcon(1024)],
  ['assets/images/adaptive-icon.png', 1024, 1024, adaptiveForeground],
  ['assets/images/android-icon-monochrome.png', 1024, 1024, silhouette(1024, 560)],
  ['assets/images/notification-icon.png', 96, 96, silhouette(96, 86)],
  ['assets/images/favicon.png', 48, 48, squareIcon(48)],
  ['assets/store/play-icon-512.png', 512, 512, squareIcon(512)],
  ['assets/store/feature-graphic-1024x500.jpg', 1024, 500, featureGraphic],
];

const started = Date.now();
const tmp = mkdtempSync(join(tmpdir(), 'calico-brand-'));
mkdirSync(join(root, 'assets/store'), { recursive: true });
try {
  for (const [out, w, h, html] of outputs) {
    const file = join(root, out);
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
        '--force-device-scale-factor=1',
        '--default-background-color=00000000',
        `--window-size=${w},${h}`,
        `--screenshot=${file}`,
        `file://${src}`,
      ],
      { stdio: 'ignore' },
    );
    // Chrome exits 0 even when it can't write the file, so check.
    if (!existsSync(file) || statSync(file).mtimeMs < started) throw new Error(`Chrome did not write ${out}`);
    console.log(`${out} (${w}×${h})`);
  }
  // Native splash image: the curled cat as drawn (app.config.ts sets its width and the background).
  copyFileSync(join(root, 'design/v2/assets/art/cat-loaf.png'), join(root, 'assets/images/splash.png'));
  console.log('assets/images/splash.png (cat-loaf)');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
