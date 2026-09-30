// Renders Calico's app icons, splash, notification icon and Play Store graphics from one drawing:
// Kiri (src/components/calico/Kiri.tsx, "curled" pose) asleep on a book, in the theme palette.
// Usage: npm run brand   (needs Google Chrome or Chromium; set CHROME=/path/to/chrome if not on PATH)
// Writes assets/images/* (used by app.config.ts) and assets/store/* (uploaded to Play Console).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const chrome = process.env.CHROME || 'google-chrome';

// Theme palette (src/theme/tokens.ts)
const c = {
  cream: '#FBF6EE',
  white: '#FFFDF9',
  biscuit: '#DFBC94',
  marmalade: '#EC6426',
  espresso: '#54332E',
  ink: '#1C1714',
  forest: '#1F3A32',
  petal: '#F2C4C7',
};

// Drawing units: Kiri's 120-wide space, with a book under her instead of the shelf.
// Bounding box of the whole drawing, for centring.
const BOX = { x: 12, y: 35, w: 98, h: 72 };
const body = 'M22 58 C22 42 44 36 62 36 C86 36 98 46 98 60 C98 74 80 80 60 80 C40 80 22 74 22 58 Z';
const head = 'M36 56 m-14 0 a14 12.5 0 1 0 28 0 a14 12.5 0 1 0 -28 0';

/** Kiri asleep on a book. `p` maps each part to a colour, so the same shapes make every variant. */
function art(p, { sw = 2.6, zzz = false } = {}) {
  const line = `stroke="${p.line}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  return `
  <defs><clipPath id="kb"><path d="${body}"/></clipPath></defs>
  <!-- book: cover, page block, page lines, ribbon -->
  <rect x="12" y="79.5" width="98" height="20" rx="4.5" fill="${p.cover}" ${line}/>
  <rect x="20" y="84.2" width="86.5" height="10.6" rx="1.6" fill="${p.pages}"/>
  <path d="M24 88 H102 M24 91.4 H102" stroke="${p.pageLines}" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M90 94.6 V107 L93.6 103.6 L97.2 107 V94.6 Z" fill="${p.ribbon}" ${line} stroke-width="${sw * 0.7}"/>
  <!-- Kiri -->
  <path d="${body}" fill="${p.coat}"/>
  <g clip-path="url(#kb)">
    <ellipse cx="70" cy="42" rx="16" ry="10" fill="${p.patchA}"/>
    <ellipse cx="90" cy="60" rx="9" ry="8" fill="${p.patchB}"/>
  </g>
  <path d="${body}" fill="none" ${line}/>
  <path d="M96 64 C104 76 82 84 56 80 C44 78 36 76 34 72" fill="none" ${line}/>
  <!-- ears first, so the head covers where they join (no stroke ends on the forehead) -->
  <path d="M25 49 L23 36 L33 45 M39 45 L48 36 L47 49" fill="${p.ears}" ${line}/>
  <path d="${head}" fill="${p.coat}"/>
  <path d="${head}" fill="none" ${line}/>
  <path d="M27 56 q3 3 6 0 M39 56 q3 3 6 0" fill="none" ${line} stroke-width="${sw * 0.75}"/>
  <path d="M34.5 61 h3 l-1.5 1.8 z" fill="${p.line}"/>
  ${zzz ? `<path d="M84 16 h8 l-8 8 h8 M98 4 h6 l-6 6 h6" fill="none" ${line} stroke-width="${sw * 0.8}"/>` : ''}`;
}

const colour = {
  line: c.ink,
  coat: c.white,
  patchA: c.marmalade,
  patchB: c.ink,
  ears: c.petal, // inner ear; the app's marmalade would vanish on the marmalade icon background
  cover: c.forest,
  pages: c.cream,
  pageLines: c.biscuit,
  ribbon: c.petal,
};
// Themed (monochrome) and notification icons: only the alpha channel counts, so solid shapes in
// white with the drawn lines and dark patches cut out as transparent.
const mono = {
  line: 'black',
  coat: 'white',
  patchA: 'white',
  patchB: 'black',
  ears: 'white',
  cover: 'white',
  pages: 'black',
  pageLines: 'white',
  ribbon: 'white',
};

/** The drawing scaled to `width` px of its box and centred at (cx, cy). */
function placed(width, cx, cy, parts, opts) {
  const s = width / BOX.w;
  const tx = cx - (BOX.x + BOX.w / 2) * s;
  const ty = cy - (BOX.y + BOX.h / 2) * s;
  return `<g transform="translate(${tx} ${ty}) scale(${s})">${art(parts, opts)}</g>`;
}

function monoSvg(size, width) {
  // A luminance mask turns the black parts into holes in a white silhouette.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="black"/>${placed(width, size / 2, size / 2, mono)}
    </mask>
    <rect width="${size}" height="${size}" fill="white" mask="url(#m)"/></svg>`;
}

const font = (name, file) =>
  `@font-face{font-family:'${name}';src:url('file://${join(root, 'node_modules/@expo-google-fonts', file)}')}`;

const featureGraphic = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
  <style>${font('Playfair', 'playfair-display/900Black/PlayfairDisplay_900Black.ttf')}
  ${font('Nunito', 'nunito/600SemiBold/Nunito_600SemiBold.ttf')}
  ${font('Caveat', 'caveat/600SemiBold/Caveat_600SemiBold.ttf')}</style>
  <rect width="1024" height="500" fill="${c.cream}"/>
  <circle cx="780" cy="270" r="190" fill="${c.marmalade}"/>
  ${placed(340, 780, 286, colour, { zzz: true })}
  <text x="72" y="178" font-family="Caveat" font-size="40" fill="${c.marmalade}">your shelf, kept warm</text>
  <text x="66" y="296" font-family="Playfair" font-size="136" fill="${c.ink}">Calico</text>
  <text x="72" y="360" font-family="Nunito" font-size="30" fill="${c.espresso}">Books, library loans,</text>
  <text x="72" y="400" font-family="Nunito" font-size="30" fill="${c.espresso}">movies and shows.</text>
</svg>`;

// [output path, width, height, svg]
const icon = (size, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${bg}"/>${placed(size * 0.66, size / 2, size * 0.51, colour)}</svg>`;
const transparent = (size, width) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${placed(width, size / 2, size / 2, colour)}</svg>`;

const outputs = [
  // App icon (legacy launchers, and Expo's source for other sizes).
  ['assets/images/icon.png', 1024, 1024, icon(1024, c.marmalade)],
  // Adaptive icon foreground: 108dp canvas, art inside the 66dp safe circle. Background colour in app.config.ts.
  ['assets/images/adaptive-icon.png', 1024, 1024, transparent(1024, 530)],
  ['assets/images/android-icon-monochrome.png', 1024, 1024, monoSvg(1024, 530)],
  // Status-bar notification icon: white silhouette, tinted marmalade by Android (app.config.ts).
  ['assets/images/notification-icon.png', 96, 96, monoSvg(96, 80)],
  // Splash: the drawing on the cream splash background (imageWidth in app.config.ts).
  ['assets/images/splash.png', 1024, 1024, transparent(1024, 940)],
  ['assets/images/favicon.png', 48, 48, icon(48, c.marmalade)],
  // Play Console: 512×512 icon (32-bit PNG, full square; Play rounds the corners) and feature graphic.
  ['assets/store/play-icon-512.png', 512, 512, icon(512, c.marmalade)],
  ['assets/store/feature-graphic-1024x500.jpg', 1024, 500, featureGraphic],
];

const started = Date.now();
const tmp = mkdtempSync(join(tmpdir(), 'calico-brand-'));
mkdirSync(join(root, 'assets/store'), { recursive: true });
try {
  for (const [out, w, h, svg] of outputs) {
    const html = join(tmp, 'page.html');
    writeFileSync(html, `<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
    execFileSync(
      chrome,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--default-background-color=00000000',
        `--window-size=${w},${h}`,
        `--screenshot=${join(root, out)}`,
        `file://${html}`,
      ],
      { stdio: 'ignore' },
    );
    // Chrome exits 0 even when it can't write the file, so check.
    const file = join(root, out);
    if (!existsSync(file) || statSync(file).mtimeMs < started) throw new Error(`Chrome did not write ${out}`);
    console.log(`${out} (${w}×${h})`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
