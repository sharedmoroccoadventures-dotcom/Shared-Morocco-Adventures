// Speed patch 2: cheaper tour rail + map repaint (run after speed-patch.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fails = 0;
function patch(file, pairs) {
  const p = path.join(ROOT, file); let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) { if (!s.includes(a)) { console.log('NO MATCH', file, a.slice(0, 70)); fails++; } else s = s.split(a).join(b); }
  fs.writeFileSync(p, s);
}
patch('js/site.js', [
  ["    const pin = $('.hscroll__pin', sec), track = $('.hscroll__track', sec), stage = $('.hscroll__stage', sec);",
   "    const pin = $('.hscroll__pin', sec), track = $('.hscroll__track', sec), bar = $('.hscroll__bar', sec);\n    let lastX = -1;"],
  ["      if (!on) { pin.style.removeProperty('--h'); track.style.removeProperty('--x'); return; }",
   "      if (!on) { pin.style.removeProperty('--h'); track.style.transform = ''; return; }"],
  ["      track.style.setProperty('--x', (p * dist).toFixed(1));\n      stage.style.setProperty('--p', p.toFixed(4));",
   "      const x = Math.round(p * dist);\n      if (x === lastX) return; lastX = x;\n      track.style.transform = `translate3d(${-x}px,0,0)`;\n      bar.style.setProperty('--p', p.toFixed(4));"],
  ["    let current = -1;\n    const show = p => {\n",
   "    let current = -1, lastP = -1;\n    const show = p => {\n      p = Math.round(p * 1000) / 1000; if (p === lastP) return; lastP = p;\n"],
]);
patch('css/site.css', [
  ["transform: translate3d(calc(var(--x, 0) * -1px), 0, 0); will-change: transform; }", "will-change: transform; }"],
  [".map svg { width: 100%; height: 100%; overflow: visible; }", ".map svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }\n.map .map__live { will-change: transform; }"],
]);
patch('tools/lib/map.mjs', [
  ['return `<svg viewBox="0 0 1000 940" role="img"', 'return `<svg class="map__base" viewBox="0 0 1000 940" role="img"'],
  ['  <path class="route-bg" d="${smooth(xy)}"/>', '</svg><svg class="map__live" viewBox="0 0 1000 940" aria-hidden="true">\n  <path class="route-bg" d="${smooth(xy)}"/>'],
]);
console.log(fails ? `${fails} patch step(s) did not match` : 'Speed patch 2 applied');
