/**
 * Builds src/components/ds/iconGlyphs.json: the Material Symbols glyph map, subset to the names
 * the app uses. Names come from `name="..."` on <Icon>, `icon="..."` / `iconAfter="..."` props,
 * `icon: '...'` object fields, and scripts/icon-extra.txt.
 *
 * Run: npm run gen:icons   (node ≥ 22.18 runs .ts directly)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const codepoints = new Map<string, number>();
for (const line of readFileSync(join(root, 'assets/icons/MaterialSymbolsOutlined.codepoints'), 'utf8').split('\n')) {
  const [name, hex] = line.trim().split(' ');
  if (name && hex) codepoints.set(name, parseInt(hex, 16));
}

const patterns = [
  /<Icon\b[^>]*?\bname="([a-z0-9_]+)"/g,
  /\bicon(?:After)?="([a-z0-9_]+)"/g,
  /\bicon:\s*'([a-z0-9_]+)'/g,
  /\bname="([a-z0-9_]+)"\s+size=/g,
];

function walk(dir: string, out: string[]) {
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f.startsWith('.')) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

const used = new Set<string>();
for (const file of [...walk(join(root, 'src'), []), ...walk(join(root, 'app'), [])]) {
  const text = readFileSync(file, 'utf8');
  for (const re of patterns) for (const m of text.matchAll(re)) used.add(m[1] as string);
}
for (const line of readFileSync(join(root, 'scripts/icon-extra.txt'), 'utf8').split('\n')) {
  const name = line.trim();
  if (name && !name.startsWith('#')) used.add(name);
}

const missing: string[] = [];
const map: Record<string, number> = {};
for (const name of [...used].sort()) {
  const cp = codepoints.get(name);
  if (cp === undefined) missing.push(name);
  else map[name] = cp;
}
writeFileSync(join(root, 'src/components/ds/iconGlyphs.json'), JSON.stringify(map, null, 2) + '\n');
console.log(`iconGlyphs.json: ${Object.keys(map).length} icons`);
if (missing.length) {
  console.error(`Unknown Material Symbols names: ${missing.join(', ')}`);
  process.exit(1);
}
