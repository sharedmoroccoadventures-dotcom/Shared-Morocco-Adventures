// Stylised Morocco journey map, projected from real coordinates.
// Only coastlines are drawn (no land borders); the land fades out inland.
const LON0 = -10.6, LAT1 = 36.1, K = 134, COS = Math.cos(33 * Math.PI / 180);
export const proj = (lon, lat) => [+((lon - LON0) * COS * K).toFixed(1), +((LAT1 - lat) * K).toFixed(1)];

const ATLANTIC = [[-10.17, 29.38], [-9.85, 29.7], [-9.72, 30.05], [-9.6, 30.42], [-9.89, 30.63], [-9.8, 31.0], [-9.77, 31.51], [-9.55, 31.9], [-9.24, 32.3], [-9.27, 32.54], [-8.85, 32.95], [-8.5, 33.25], [-8.0, 33.45], [-7.62, 33.6], [-7.2, 33.8], [-6.84, 34.02], [-6.58, 34.26], [-6.35, 34.75], [-6.15, 35.19], [-6.03, 35.47], [-5.92, 35.79], [-5.8, 35.78]];
const MED = [[-5.8, 35.78], [-5.55, 35.85], [-5.31, 35.89], [-5.3, 35.72], [-5.27, 35.62], [-5.1, 35.45], [-4.67, 35.21], [-4.3, 35.18], [-3.93, 35.25], [-3.4, 35.2], [-2.96, 35.44], [-2.93, 35.17], [-2.6, 35.12], [-2.23, 35.09], [-1.9, 35.1]];
const HIGH_ATLAS = [[-9.5, 30.75], [-9.0, 30.95], [-8.4, 31.0], [-7.9, 31.08], [-7.4, 31.25], [-6.9, 31.45], [-6.3, 31.65], [-5.7, 31.95], [-5.0, 32.2], [-4.3, 32.45], [-3.6, 32.6]];
const MIDDLE_ATLAS = [[-6.4, 32.35], [-5.9, 32.7], [-5.4, 33.05], [-4.9, 33.4], [-4.4, 33.75], [-4.0, 34.05]];
const RIF = [[-5.6, 35.3], [-5.2, 35.1], [-4.7, 34.95], [-4.2, 34.95], [-3.7, 34.9]];

const line = pts => pts.map((p, i) => (i ? 'L' : 'M') + proj(...p).join(' ')).join('');

// zig-zag peaks along a ridge
function ridge(pts, amp = 11) {
  const xy = pts.map(p => proj(...p)); let d = '';
  for (let i = 0; i < xy.length - 1; i++) {
    const [x1, y1] = xy[i], [x2, y2] = xy[i + 1];
    const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 16));
    for (let j = 0; j < n; j++) {
      const t = j / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      const peak = (j % 2 ? -amp : amp * 0.2) * (0.6 + 0.4 * Math.sin(i * 1.7 + j));
      d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + (y + peak).toFixed(1);
    }
  }
  return d;
}

// Catmull-Rom → cubic bezier through points
export function smooth(xy, t = 0.5) {
  let d = `M${xy[0][0]} ${xy[0][1]}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[i - 1] || xy[i], p1 = xy[i], p2 = xy[i + 1], p3 = xy[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t / 3, p1[1] + (p2[1] - p0[1]) * t / 3];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t / 3, p2[1] - (p3[1] - p1[1]) * t / 3];
    d += ` C${c1.map(v => v.toFixed(1)).join(' ')} ${c2.map(v => v.toFixed(1)).join(' ')} ${p2.join(' ')}`;
  }
  return d;
}

export function moroccoMap(stops, { id = 'jm' } = {}) {
  const coast = [...ATLANTIC, ...MED.slice(1)];
  const land = line(coast) + `L1000 ${proj(-1.9, 35.1)[1]}L1000 940L${proj(-10.17, 29.38)[0]} 940Z`;
  const xy = stops.map(s => proj(s.lon, s.lat));
  const [ex, ey] = proj(-4.0, 31.15);
  return `<svg class="map__base" viewBox="0 0 1000 940" role="img" aria-label="Map of the route: ${stops.map(s => s.name).join(', ')}">
  <defs>
    <linearGradient id="${id}Fade" x1="0" y1="0" x2="1" y2="1"><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="${id}Mask"><rect width="1000" height="940" fill="url(#${id}Fade)"/></mask>
  </defs>
  <g mask="url(#${id}Mask)">
    <path class="land" d="${land}"/>
    <path class="coast" d="${line(ATLANTIC)}"/>
    <path class="coast" d="${line(MED)}"/>
    <path class="atlas" d="${ridge(HIGH_ATLAS)}"/>
    <path class="atlas" d="${ridge(MIDDLE_ATLAS, 9)}"/>
    <path class="atlas" d="${ridge(RIF, 8)}"/>
  </g>
  <ellipse class="erg" cx="${ex}" cy="${ey}" rx="22" ry="34"/>
  <text class="label-sea" x="${proj(-10.3, 32.6)[0]}" y="${proj(-10.3, 32.6)[1]}" transform="rotate(-62 ${proj(-10.3, 32.6).join(' ')})">ATLANTIC</text>
  <text class="label-sea" x="${proj(-4.6, 35.72)[0]}" y="${proj(-4.6, 35.72)[1]}">MEDITERRANEAN</text>
  <g class="compass" transform="translate(900 120)"><circle r="38"/><path d="M0 -30 L7 0 L0 30 L-7 0Z"/><text y="-46" text-anchor="middle" style="fill:rgba(243,233,218,.4);font:600 14px var(--f-body)">N</text></g>
</svg><svg class="map__live" viewBox="0 0 1000 940" aria-hidden="true">
  <path class="route-bg" d="${smooth(xy)}"/>
  <path class="route" d="${smooth(xy)}"/>
  ${stops.map((s, i) => {
    const [x, y] = xy[i]; const [dx, dy, anchor] = s.label || [14, 6, 'start'];
    return `<g class="stop" data-x="${x}" data-y="${y}"><circle class="pulse" cx="${x}" cy="${y}" r="9"/><circle class="dot" cx="${x}" cy="${y}" r="7"/><text x="${x + dx}" y="${y + dy}" text-anchor="${anchor}">${s.name}</text></g>`;
  }).join('\n  ')}
  <circle class="traveler" r="7" cx="${xy[0][0]}" cy="${xy[0][1]}"/>
</svg>`;
}
