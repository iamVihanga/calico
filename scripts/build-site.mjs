// Builds the public pages (privacy policy, account deletion, terms) linked from the Play listing and
// Settings → About. Usage: CONTACT_EMAIL=you@example.com node scripts/build-site.mjs → site/dist/
// Deploy site/dist to any static host (e.g. Vercel with output directory `site/dist`).
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../site/', import.meta.url).pathname;
const out = join(root, 'dist');
const email = process.env.CONTACT_EMAIL;
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Set CONTACT_EMAIL to the address shown on the privacy and deletion pages.');
  process.exit(1);
}
const updated = process.env.POLICY_UPDATED ?? '26 September 2026';
const nav = readFileSync(join(root, '_nav.html'), 'utf8').trim();

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const f of readdirSync(root)) {
  if (f.endsWith('.html') && !f.startsWith('_')) {
    const html = readFileSync(join(root, f), 'utf8')
      .replaceAll('{{NAV}}', nav)
      .replaceAll('{{CONTACT_EMAIL}}', email)
      .replaceAll('{{UPDATED}}', updated);
    if (html.includes('{{')) throw new Error(`Unfilled placeholder in ${f}`);
    writeFileSync(join(out, f), html);
  } else if (f.endsWith('.css')) {
    copyFileSync(join(root, f), join(out, f));
  }
}
console.log(`site/dist: ${readdirSync(out).join(', ')}`);
