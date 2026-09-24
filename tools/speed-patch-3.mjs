// Speed patch 3: map stops no longer animate geometry every frame.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = path.join(ROOT, 'css/site.css');
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n'), fails = 0;
for (const [a, b] of [
  ['transition: fill .4s, stroke .4s, r .5s var(--spring); }', 'transition: fill .4s, stroke .4s; }'],
  ['.map .stop.is-on .dot { fill: var(--saffron); stroke: #fff; r: 9; }', '.map .stop.is-on .dot { fill: var(--saffron); stroke: #fff; }\n.map .stop.is-current .dot { stroke-width: 4; }'],
  ['.map .stop.is-current .pulse { animation: pulse 1.6s var(--ease) infinite; }', '.map .stop.is-current .pulse { opacity: .6; }'],
]) { if (!s.includes(a)) { console.log('NO MATCH', a.slice(0, 60)); fails++; } else s = s.split(a).join(b); }
fs.writeFileSync(p, s);
console.log(fails ? `${fails} step(s) did not match` : 'Speed patch 3 applied');
