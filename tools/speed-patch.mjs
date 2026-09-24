// One-off speed patch (Sept 2026): responsive WebP, lighter fonts, cheaper
// visual effects, paused off-screen animation, destinations strip removed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fails = 0;
function patch(file, pairs) {
  const p = path.join(ROOT, file); let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) {
    if (a instanceof RegExp) { const n = s.replace(a, b); if (n === s) { console.log('NO MATCH', file, a); fails++; } s = n; }
    else if (!s.includes(a)) { console.log('NO MATCH', file, a.slice(0, 70)); fails++; }
    else s = s.split(a).join(b);
  }
  fs.writeFileSync(p, s);
}

patch('tools/lib/ui.mjs', [
  ["// Shared layout + components for every generated page.\n", `// Shared layout + components for every generated page.
import fs from 'node:fs';
let OPT = {};
try { OPT = JSON.parse(fs.readFileSync(new URL('../../images/opt/manifest.json', import.meta.url), 'utf8')); } catch { /* no optimized images yet */ }
const optOf = src => OPT[String(src).replace(/^images\\//, '')] || null;
const srcsetOf = src => { const m = optOf(src); if (!m) return ''; const b = String(src).replace(/^images\\//, '').replace(/\\.[^.]+$/, ''); return m.sizes.map(w => \`images/opt/\${b}-\${w}.webp \${w}w\`).join(', '); };
export const SIZES_CARD = '(min-width: 1100px) 420px, (min-width: 700px) 45vw, 92vw';
export const SIZES_HALF = '(min-width: 900px) 50vw, 92vw';
export const preloadTag = src => { const ss = srcsetOf(src); return \`<link rel="preload" as="image" href="\${attr(src)}"\${ss ? \` imagesrcset="\${ss}" imagesizes="100vw"\` : ''} fetchpriority="high">\`; };
`],
  ["opsz,wght@12..96,400..800&family=Instrument+Serif:ital@0;1&display=swap", "wght@400..800&family=Instrument+Serif:ital@1&display=swap"],
  ['<link rel="stylesheet" href="${FONTS}">', `<link rel="preload" as="style" href="\${FONTS}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="\${FONTS}"></noscript>`],
  ['${preload ? `<link rel="preload" as="image" href="${attr(preload)}" fetchpriority="high">` : \'\'}', "${preload ? preloadTag(preload) : ''}"],
  [/export const img = \(src[\s\S]*?\n\n/, `export const img = (src, alt = '', { eager = false, cls = '', sizes = '' } = {}) => {
  const m = optOf(src), ss = srcsetOf(src);
  const w = m?.w || 1400, h = m?.h || 933;
  const sz = sizes || (eager ? '100vw' : SIZES_HALF);
  return \`<img src="\${attr(src)}"\${ss ? \` srcset="\${ss}" sizes="\${sz}"\` : ''} alt="\${attr(alt)}" width="\${w}" height="\${h}"\${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"\${cls ? \` class="\${cls}"\` : ''}>\`;
};

`],
  ["${img(t.image, '', { eager })}", "${img(t.image, '', { eager, sizes: SIZES_CARD })}"],
  ["${img(c.image, '')}${tag ?", "${img(c.image, '', { sizes: feature ? SIZES_HALF : SIZES_CARD })}${tag ?"],
]);

patch('tools/build.mjs', [
  ['[hero, marquee, rail, journey,', '[hero, rail, journey,'],
  ['tcard(t, { eager: i < 3 })', 'tcard(t)'],
]);

patch('css/site.css', [
  ['.grain::after {', '.grain-fx::after {'],
  [/ ?backdrop-filter: blur\(\d+px\); -webkit-backdrop-filter: blur\(\d+px\);/g, ''],
  ['.stat { background: rgba(11, 20, 29, .42);', '.stat { background: rgba(11, 20, 29, .72);'],
  ['.facts > div { background: rgba(11, 20, 29, .55);', '.facts > div { background: rgba(11, 20, 29, .8);'],
  ['.route span { padding: 7px 13px; border-radius: 999px; background: rgba(255, 255, 255, .1);', '.route span { padding: 7px 13px; border-radius: 999px; background: rgba(11, 20, 29, .55);'],
  ['background: rgba(251, 246, 238, .9);', 'background: rgba(251, 246, 238, .97);'],
  [' filter: drop-shadow(0 0 10px rgba(232, 97, 44, .7));', ''],
  [' filter: drop-shadow(0 0 8px var(--saffron));', ''],
  ['@media print {', `/* ---------- 30. Performance ---------- */
.off-screen, .off-screen * { animation-play-state: paused !important; }
.xp__tile, .tcard, .ecard, .day__card { contain: layout paint; }
@media print {`],
]);

patch('js/site.js', [
  ["  const resizers = [];\n", `  const resizers = [];
  // only do per-frame work for things that are near the viewport
  const near = new WeakSet();
  const nearIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? near.add(e.target) : near.delete(e.target)), { rootMargin: '60% 0px' });
  // pause decorative CSS animations while their section is off-screen
  const offIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('off-screen', !e.isIntersecting)), { rootMargin: '120px 0px' });
  $$('main > section, main > article, main > div, .ftr').forEach(s => offIO.observe(s));
`],
  ["    setup(); resizers.push(setup);\n", "    setup(); resizers.push(setup); nearIO.observe(pin);\n"],
  ["      if (!on) return;\n", "      if (!on || !near.has(pin)) return;\n"],
  ["    else handlers.push(() => { const r = pin.getBoundingClientRect();", "    else { nearIO.observe(pin); handlers.push(() => { if (!near.has(pin)) return; const r = pin.getBoundingClientRect();"],
  ["show(clamp((-r.top) / Math.max(1, r.height - vh) * 1.08)); });", "show(clamp((-r.top) / Math.max(1, r.height - vh) * 1.08)); }); }"],
  ["    const days = $$('.day', tl);\n    handlers.push(() => {\n", "    const days = $$('.day', tl);\n    nearIO.observe(tl);\n    handlers.push(() => {\n      if (!near.has(tl)) return;\n"],
  [/  \/\* ---------- marquee reacts to scroll speed ---------- \*\/[\s\S]*?\n  }\n\n/, ''],
  ["    const loop = () => { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cur.style.setProperty('--cx', cx.toFixed(1) + 'px'); cur.style.setProperty('--cy', cy.toFixed(1) + 'px'); requestAnimationFrame(loop); };\n    loop();",
   "    let looping = false;\n    const loop = () => { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cur.style.setProperty('--cx', cx.toFixed(1) + 'px'); cur.style.setProperty('--cy', cy.toFixed(1) + 'px'); if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.4) requestAnimationFrame(loop); else looping = false; };\n    W.addEventListener('pointermove', () => { if (!looping) { looping = true; requestAnimationFrame(loop); } }, { passive: true });"],
]);
console.log(fails ? `${fails} patch step(s) did not match` : 'Speed patch applied');
