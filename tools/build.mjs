// Generates every page of the site from content/*.json with the new design.
//   node tools/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, EMAIL, I, esc, attr, strip, noEmoji, emojiOf, chipIcon, btn, page, img, routeChain, crumbs, breadcrumbLd, faqList, band, tcard, ecard } from './lib/ui.mjs';
import { moroccoMap } from './lib/map.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = p => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', p), 'utf8'));
const out = (f, html) => { fs.writeFileSync(path.join(ROOT, f), html); built.push(f); };
const built = [];
const abs = src => src.startsWith('http') ? src : `${SITE}/${src}`;

/* ---------------- data ---------------- */
const P = { tours: C('pages/tours.json'), dt: C('pages/day-trips.json'), blog: C('pages/blog.json'), index: C('pages/index.json'), about: C('pages/about.json'), air: C('pages/airport-transfers.json'), contact: C('pages/contact.json'), credits: C('pages/photo-credits.json'), thanks: C('pages/thank-you.json'), faqs: C('pages/faqs.json') };
const home = C('pages/home-extras.json');
const tripOptions = C('pages/contact-options.json').trips;
const creditList = C('pages/photo-credits-list.json').items;

const metaChip = (card, e) => noEmoji(card.meta.find(m => emojiOf(m).replace(/️/g, '') === e) || '');
const tours = P.tours.sections[0].cards.filter(c => c.href.startsWith('tour-')).map(c => {
  const det = C(`tours/${c.href.replace('.html', '.json')}`);
  const days = parseInt(metaChip(c, '🗓')) || det.itinerary.days.length;
  const routeStr = metaChip(c, '📍');
  const text = strip(c.title + ' ' + c.blurb + ' ' + det.hero.lead).toLowerCase();
  const start = /fes/.test(routeStr.toLowerCase().split('→')[0]) ? 'fes' : /casablanca/i.test(routeStr) && /^casablanca/i.test(routeStr) ? 'casablanca' : 'marrakech';
  const tags = [days <= 4 ? 'short' : days <= 6 ? 'mid' : 'long', 'start-' + start];
  if (/sahara|merzouga|desert camp|dunes/.test(text)) tags.push('sahara');
  if (/fes|imperial|chefchaouen|meknes|volubilis|casablanca/.test(text)) tags.push('cities');
  if (/atlas|agafay|ourika|ouzoud/.test(text)) tags.push('atlas');
  if (/essaouira|coast/.test(text)) tags.push('coast');
  return {
    file: c.href, det, days, routeStr, tags,
    title: c.title, short: strip(c.title).replace(/ Group Tour$| Tour$/, '').replace(/ Group Escape$/, ' Escape'),
    badge: c.badge, blurb: c.blurb, image: c.image || det.hero.image,
    price: parseInt(String(det.price?.amount || c.price).replace(/[^0-9]/g, '')),
    route: routeStr.split(/\s*→\s*/),
  };
});
const tourBy = f => tours.find(t => t.file === f);
const popular = ['tour-4-day-sahara-desert-group-tour.html', 'tour-7-day-morocco-highlights-group-tour.html', 'tour-5-day-marrakech-adventure-ourika-agafay-ouzoud.html'].map(tourBy).filter(Boolean);
const minPrice = Math.min(...tours.map(t => t.price));

const dtCards = P.dt.sections[1].cards;
const hubs = P.dt.sections[0].cards;
const daytrips = dtCards.map(c => {
  const det = C(`daytrips/${c.href.replace('.html', '.json')}`);
  const from = /fes/i.test(c.meta.join(' ')) ? 'fes' : 'marrakech';
  return { ...c, det, from, priceNum: parseInt(c.badge.replace(/[^0-9]/g, '')), length: noEmoji(c.meta[1] || '') };
});
const posts = P.blog.sections[0].cards.map(c => ({ ...c, det: C(`blog/${c.href.replace('.html', '.json')}`), cat: noEmoji(c.badge || c.meta[0] || ''), mins: noEmoji(c.meta[1] || '') }));
const slug = s => strip(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const common = { popular };

/* ---------------- shared pieces ---------------- */
function phero({ image, eyebrow, title, lead, crumbList, extra = '', short = false, alt = '' }) {
  return `<section class="phero${short ? ' phero--short' : ''}${image ? '' : ' phero--plain'} grain" data-p="top">
  ${image ? `<div class="phero__media">${img(image, alt, { eager: true })}</div>` : ''}
  <div class="wrap phero__inner">
    ${crumbList ? crumbs(crumbList) : ''}
    ${eyebrow ? `<span class="eyebrow" data-hero-fade>${esc(strip(eyebrow))}</span>` : ''}
    <h1>${title}</h1>
    ${lead ? `<p class="lede" data-hero-fade>${lead}</p>` : ''}
    ${extra ? `<div data-hero-fade>${extra}</div>` : ''}
  </div>
</section>`;
}

const chipsHtml = list => `<div class="chips">${list.map(c => `<span class="chip">${chipIcon(emojiOf(c))}${esc(noEmoji(c))}</span>`).join('')}</div>`;
const iconChip = c => { const ic = chipIcon(emojiOf(c)); return ic ? `<span style="width:18px;display:inline-grid">${ic}</span>` : ''; };

function dayTitle(t) {
  return t.replace(/^(.+?)\s+(to|back to)\s+(.+)$/i, (m, a, k, b) => /^[A-ZÀ-ÿ]/.test(b.trim()) ? `${a} <span class="arrow">→</span> ${k.toLowerCase() === 'back to' ? 'back to ' : ''}${b}` : m);
}

function timeline(days) {
  return `<div class="timeline" data-r="fade">
  <div class="timeline__rail" aria-hidden="true"><div class="timeline__fill"></div><div class="timeline__car"></div></div>
  ${days.map(dy => `<article class="day">
    <div class="day__n" aria-hidden="true"><div><small>Day</small><b>${esc(dy.num.replace(/\D/g, ''))}</b></div></div>
    <div class="day__card" data-r="up">
      <div class="day__top"><span class="day__label">${esc(dy.num)}${dy.label ? ' · ' + esc(dy.label) : ''}</span>${dy.lead ? `<span class="day__dist">${I.car}${esc(dy.lead)}</span>` : ''}</div>
      <h3>${dayTitle(dy.title)}</h3>
      ${dy.paras.map(p => `<p>${p}</p>`).join('')}${(dy.extra || []).join('')}
    </div>
  </article>`).join('\n')}
</div>`;
}

function includes(yes, no) {
  const li = (arr, icon) => arr.map((x, i) => `<li style="--i:${i}">${icon}<span>${x}</span></li>`).join('');
  const chk = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7"/></svg>';
  const crs = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  return `<div class="incl" data-in>
  <div class="incl__col incl__col--yes"><h3>What's included</h3><ul>${li(yes, chk)}</ul></div>
  <div class="incl__col incl__col--no"><h3>Not included</h3><ul>${li(no, crs)}</ul></div>
</div>`;
}

function dock({ amount, sub, bullets, href, label, note }) {
  return `<aside class="dock" aria-label="Price and booking">
  <span class="eyebrow">From</span>
  <div class="dock__price">${esc(amount)}</div>
  <div class="dock__sub">${sub}</div>
  <ul>${bullets.map(b => `<li>${I.check}<span>${b}</span></li>`).join('')}</ul>
  ${btn(href, label, 'btn--dune')}
  <p class="dock__note">${note}</p>
</aside>`;
}
const mdock = (amount, sub, href) => `<div class="mdock"><div><small>From</small><b>${esc(amount)}</b> <small style="display:inline">per person</small></div>${btn(href, 'Check dates', 'btn--dune btn--sm')}</div>`;

const bookingNote = 'Send an enquiry first. We confirm the departure, final price and payment by email. No payment is taken on this website.';

/* ================= HOME ================= */
function buildHome() {
  const stops = [
    { name: 'Marrakech', lon: -7.99, lat: 31.63, label: [-16, 6, 'end'], img: 'images/marrakech-jemaa-el-fnaa.jpg', title: 'Marrakech', tag: 'Start · Meet the group', text: 'Where every group comes together. Jemaa el-Fnaa at dusk, the souks, rooftop mint tea and a first night with your travel crew.', href: 'day-trips-marrakech.html', link: 'Marrakech day trips' },
    { name: 'High Atlas', lon: -7.38, lat: 31.3, label: [16, -10, 'start'], img: 'images/blog-morocco-countryside.jpg', title: 'High Atlas', tag: 'Tizi n’Tichka pass', text: 'Hairpin bends over the Tizi n’Tichka pass, Berber villages and the first huge mountain views of the trip.', href: 'tour-3-day-atlas-mountains-agafay-group-escape.html', link: '3-Day Atlas escape' },
    { name: 'Aït Ben Haddou', lon: -7.13, lat: 31.05, label: [-16, 24, 'end'], img: 'images/daytrip-ait-benhaddou.jpg', title: 'Aït Ben Haddou', tag: 'UNESCO kasbah', text: 'A mud-brick ksar climbing a hillside, one of the most filmed places in Morocco and a UNESCO World Heritage site.', href: 'daytrip-ait-benhaddou-ouarzazate.html', link: 'Aït Ben Haddou day trip' },
    { name: 'Dades Gorges', lon: -5.98, lat: 31.37, label: [0, 34, 'middle'], img: 'images/blog-sahara-gateway-road.jpg', title: 'Dades Gorges', tag: 'Kasbah night', text: 'Through the Valley of Roses to red-rock canyons and a night in a kasbah-style riad with the group.', href: 'tour-4-day-sahara-desert-group-tour.html', link: '4-Day Sahara tour' },
    { name: 'Merzouga', lon: -4.01, lat: 31.1, label: [16, 6, 'start'], img: 'images/blog-desert-camp-tents.jpg', title: 'Merzouga & Erg Chebbi', tag: 'Sahara camp', text: 'Camels at golden hour into the Erg Chebbi dunes, dinner around the fire and a night under the desert stars.', href: 'blog-sahara-desert-camp-guide.html', link: 'Inside a desert camp' },
    { name: 'Ifrane', lon: -5.11, lat: 33.53, label: [16, 6, 'start'], img: 'images/daytrip-ifrane-cedar-forest.jpg', title: 'Ifrane & the Middle Atlas', tag: 'Cedar forests', text: 'Cedar forests and an alpine-style town in the Middle Atlas, a cool green surprise on the road north.', href: 'daytrip-ifrane-cedar-forest.html', link: 'Ifrane day trip' },
    { name: 'Fes', lon: -5.0, lat: 34.03, label: [16, 6, 'start'], img: 'images/fes-medina-tannery.jpg', title: 'Fes', tag: 'Medieval medina', text: 'A vast car-free medina, the leather tanneries and more than a thousand years of history around every corner.', href: 'day-trips-fes.html', link: 'Day trips from Fes' },
    { name: 'Chefchaouen', lon: -5.26, lat: 35.17, label: [16, 6, 'start'], img: 'images/tour-chefchaouen.jpg', title: 'Chefchaouen', tag: 'The blue city', text: 'Blue-washed lanes tucked into the Rif mountains, the photo everyone wants and the perfect place to slow down.', href: 'daytrip-chefchaouen-blue-city.html', link: 'Chefchaouen day trip' },
  ];

  const camel = `<svg viewBox="0 -8 64 52"><path d="M10 24C10 14 18 10 24 14 28 6 38 6 42 16c4 0 6 4 6 8s-4 6-8 6H14c-3 0-4-3-4-6zM44 20c4-6 6-12 10-13l6 1c1 2-1 3-3 3-2 1-3 5-5 11zM14 29h3v15h-3zM20 29h3v15h-3zM36 29h3v15h-3zM42 29h3v15h-3z"/><circle cx="33" cy="-2" r="3"/><path d="M29 1h8l1 9h-10z"/></svg>`;
  const walker = `<svg viewBox="0 -8 30 52"><circle cx="15" cy="-2" r="4"/><path d="M9 4h12l3 26-4 1 2 13h-4l-3-12-3 12H8l2-13-4-1z"/></svg>`;
  const caravan = `<div class="caravan" aria-hidden="true"><div class="caravan__walk">${[walker, camel, camel, camel, camel].map(s => `<span class="bob">${s}</span>`).join('')}</div></div>`;

  const hero = `<section class="hero grain" data-p="top" data-stage="Move">
  <div class="hero__media">${img('images/blog-camel-trek-closeup.jpg', 'A small group riding camels in a line across the Sahara dunes', { eager: true, h: 933 })}</div>
  <div class="hero__sun" data-depth="-30" aria-hidden="true"></div>
  <div class="hero__dunes" aria-hidden="true" data-depth="12">
    <svg viewBox="0 0 1440 260" preserveAspectRatio="none" style="height:clamp(110px,15vw,220px)"><path class="d2" fill="#16222f" fill-opacity=".85" d="M0 150C180 90 320 110 480 130s280-60 480-40c160 15 300 60 480 30v140H0z"/><path class="d1" fill="#0b141d" d="M0 200c200-40 380-10 560-25 200-17 320 25 520 15 160-8 260-30 360-20v90H0z"/></svg>
    ${caravan}
  </div>
  <div class="wrap hero__inner">
    <div class="hero__kicker"><span class="chip">${I.users} Small groups, max 16</span><span class="chip">${I.cal} Fixed weekly departures</span><span class="chip">${I.pin} Sahara · Atlas · Imperial cities</span></div>
    <h1 class="hero__title h-hero">
      <span class="line"><span>See Morocco</span></span>
      <span class="line"><span class="serif">together,</span></span>
      <span class="line"><span>for less.</span></span>
    </h1>
    <div class="hero__row">
      <div>
        <p class="hero__lede">Fixed-date group tours across the Sahara, the Atlas Mountains and Morocco’s imperial cities. Shared rides, shared riads, shared memories, and none of the private-tour markup.</p>
        <div class="btn-row">${btn('tours.html', 'Find your departure', 'btn--dune')}${btn('#journey', 'Follow the route', 'btn--ghost')}</div>
      </div>
      <div>
        <p style="margin:0 0 12px;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;opacity:.75">Next stop <span class="ticker" style="font-size:1rem;letter-spacing:.1em;color:var(--saffron);font-weight:700;margin-left:8px"><span class="ticker__list">${['Sahara', 'Atlas', 'Fes', 'Chefchaouen', 'Essaouira', 'Marrakech', 'Sahara'].map(s => `<span>${s}</span>`).join('')}</span></span></p>
        <div class="stats">
          <div class="stat"><b data-count="${minPrice}" data-prefix="€">€${minPrice}</b><span>Trips from, per person</span></div>
          <div class="stat"><b data-count="16">16</b><span>Travelers max per group</span></div>
          <div class="stat"><b data-count="${tours.length}">${tours.length}</b><span>Multi-day routes</span></div>
          <div class="stat"><b data-count="4.8" data-suffix="/5">4.8/5</b><span>Average traveler rating</span></div>
        </div>
      </div>
    </div>
  </div>
  <a class="scroll-cue" href="#discover"><i></i>Scroll</a>
</section>`;

  const marquee = `<div class="marquee" aria-hidden="true"><div class="marquee__track">${[0, 1].map(() => ['Marrakech', 'Sahara', 'Merzouga', 'Aït Ben Haddou', 'Fes', 'Chefchaouen', 'Atlas Mountains', 'Essaouira'].map(n => `<span class="marquee__item">${n}${I.star}</span>`).join('')).join('')}</div></div>`;

  const rail = `<section class="hscroll t-sand" id="discover" data-stage="Discover" aria-labelledby="discover-h">
  <div class="hscroll__pin"><div class="hscroll__stage">
    <div class="hscroll__track">
      <div class="hscroll__intro">
        <span class="eyebrow eyebrow--dune">Discover · ${tours.length} routes</span>
        <h2 class="h1" id="discover-h" data-r="words">Pick a route. <span class="serif hl">Meet</span> your people.</h2>
        <p class="muted" style="max-width:34ch">Every trip runs on fixed dates with a small group. Swipe or scroll through the routes, from a 3-day Atlas escape to a 10-day grand circuit.</p>
        <div>${btn('tours.html', 'Compare all tours')}</div>
      </div>
      ${tours.map(t => tcard(t)).join('\n')}
    </div>
    <div class="hscroll__bar" aria-hidden="true"></div>
  </div></div>
</section>`;

  const journey = `<section class="journey t-night grain" id="journey" data-stage="Explore">
  <div class="journey__pin"><div class="journey__stage">
    <div class="wrap journey__grid">
      <div class="map">${moroccoMap(stops)}</div>
      <div>
        <div class="head" style="margin-bottom:28px"><span class="eyebrow">Explore · The classic loop</span><h2 class="h2">Marrakech to the Sahara and on to <span class="serif hl">the blue city</span></h2><p class="lede muted">Scroll to travel the route our groups take across Morocco.</p></div>
        <div class="jcard">${stops.map((s, i) => `<div class="jcard__item${i === 0 ? ' is-on' : ''}">
          <div class="jcard__img">${img(s.img, s.title)}</div>
          <span class="jcard__day">Stop ${String(i + 1).padStart(2, '0')} · ${esc(s.tag)}</span>
          <h3 class="h3" style="margin:.35em 0">${esc(s.title)}</h3>
          <p class="muted" style="max-width:46ch">${esc(s.text)}</p>
          <a class="link-arrow" href="${s.href}" style="color:var(--saffron)">${esc(s.link)} ${I.arrow}</a>
        </div>`).join('')}</div>
        <div class="jprog" aria-hidden="true">${stops.map(() => '<i></i>').join('')}</div>
      </div>
    </div>
  </div></div>
</section>`;

  const art = {
    dunes: '<g class="xa-dunes" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M2 56c14-12 24-12 38 0s26 12 42 0"/><path d="M2 70c14-10 24-10 38 0s26 10 42 0"/></g><circle cx="62" cy="22" r="10" fill="#f4b43c"/>',
    camel: '<g class="xa-camel" fill="#fff"><path d="M16 50c0-12 9-16 16-11 4-9 16-9 20 3 5 0 7 4 7 9s-4 7-9 7H21c-3 0-5-4-5-8zM55 45c4-7 7-13 11-14l7 1c1 2-1 3-3 3-2 1-3 6-6 12zM21 57h3v16h-3zM27 57h3v16h-3zM45 57h3v16h-3zM51 57h3v16h-3z"/></g>',
    camp: '<g fill="#f4b43c"><polygon class="xa-star" points="14,10 16,15 21,15 17,18 18,23 14,20 10,23 11,18 7,15 12,15"/><polygon class="xa-star" points="44,4 45.5,8 49,8 46,10 47,14 44,12 41,14 42,10 39,8 42.5,8"/><polygon class="xa-star" points="70,16 71.5,20 75,20 72,22 73,26 70,24 67,26 68,22 65,20 68.5,20"/></g><path d="M20 74 42 40l22 34z" fill="#fff" fill-opacity=".9"/><path class="xa-flame" d="M70 76c-6 0-9-5-6-10 2-3 3-6 2-9 5 3 10 8 10 13 0 4-3 6-6 6z" fill="#e8612c"/>',
    board: '<path d="M4 20c20 10 40 30 76 58" stroke="#fff" stroke-width="2" stroke-dasharray="3 6" fill="none"/><rect class="xa-board" x="30" y="34" width="34" height="9" rx="4.5" fill="#f4b43c"/>',
    peaks: '<g class="xa-peaks" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"><path d="M2 76 26 34l14 20 14-30 28 52"/><path d="M48 34l6-10 6 10" stroke="#f4b43c"/></g>',
    zellige: `<g class="xa-zellige" fill="none" stroke="#fff" stroke-width="2"><path d="M42 4l9 15 17-2-2 17 15 9-15 9 2 17-17-2-9 15-9-15-17 2 2-17L2 43l15-9-2-17 17 2z"/><circle cx="42" cy="43" r="11" stroke="#f4b43c"/></g>`,
    tagine: '<g class="xa-steam" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M30 26c-4-5 4-8 0-13"/><path d="M42 24c-4-5 4-8 0-13"/><path d="M54 26c-4-5 4-8 0-13"/></g><path d="M42 36c-3 0-4-3-4-5h8c0 2-1 5-4 5zM20 62c0-14 10-24 22-26 12 2 22 12 22 26z" fill="#e8612c"/><rect x="12" y="62" width="60" height="7" rx="3.5" fill="#fff"/>',
    lantern: '<g class="xa-lantern"><path d="M42 0v14" stroke="#fff" stroke-width="2"/><path d="M34 14h16l6 12-4 26H32l-4-26z" fill="#f4b43c"/><path d="M36 26h12M34 38h16" stroke="#0b141d" stroke-width="2"/><path d="M36 52h12l-2 8h-8z" fill="#fff"/></g>',
    water: '<g class="xa-water" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M24 4v70"/><path d="M40 8v66"/><path d="M56 4v70"/></g><path d="M6 76c12-6 24 6 36 0s24 6 36 0" stroke="#f4b43c" stroke-width="2.5" fill="none"/>',
    people: '<g class="xa-people" fill="#fff"><circle cx="16" cy="44" r="9" style="--dx:10px"/><circle cx="42" cy="30" r="9" fill="#f4b43c" style="--dx:0px"/><circle cx="68" cy="44" r="9" style="--dx:-10px"/></g><path d="M16 64c4-8 22-8 26 0M42 64c4-8 22-8 26 0" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
  };
  const xps = [
    { size: 'big', title: 'The Sahara', text: 'Sunset over Erg Chebbi, silence, stars. The trip everyone talks about.', img: 'images/hero-sahara-dunes.jpg', art: 'dunes', href: 'tour-4-day-sahara-desert-group-tour.html' },
    { title: 'Camel treks', text: 'Ride out into the dunes in a line of friends, just like the caravans did.', img: 'images/blog-camel-trek-closeup.jpg', art: 'camel', href: 'blog-camel-trekking-merzouga.html' },
    { title: 'Desert camps', text: 'Berber tents, a campfire, live drums and a sky full of stars.', img: 'images/blog-desert-camp-tents.jpg', art: 'camp', href: 'blog-sahara-desert-camp-guide.html' },
    { size: 'wide', title: 'Sandboarding', text: 'Throw yourself down the slopes of Erg Chebbi. Ask about boards at the desert camp.', img: 'images/experience-sandboarding.jpg', art: 'board', href: 'blog-camel-trekking-merzouga.html' },
    { title: 'Mountains', text: 'Atlas passes, valley walks and Toubkal, North Africa’s highest peak.', img: 'images/blog-toubkal-summit.jpg', art: 'peaks', href: 'blog-atlas-mountains-hiking.html' },
    { title: 'Berber villages', text: 'Terraced valleys, argan co-ops and mint tea with local families.', img: 'images/daytrip-ourika-valley.jpg', art: 'zellige', href: 'daytrip-ourika-valley.html' },
    { size: 'wide', title: 'Street food', text: 'Tagines, msemen, snail soup if you dare. Eating together is half the trip.', img: 'images/blog-street-food-marrakech.jpg', art: 'tagine', href: 'blog-moroccan-street-food-guide.html' },
    { title: 'Medinas', text: 'Lantern-lit souks, spice pyramids and alleys made for getting lost.', img: 'images/blog-souk-lanterns.jpg', art: 'lantern', href: 'blog-marrakech-medina-guide.html' },
    { title: 'Waterfalls', text: 'Ouzoud’s 110 m falls, rainbows and the local Barbary macaques.', img: 'images/daytrip-ouzoud-waterfalls.jpg', art: 'water', href: 'daytrip-ouzoud-waterfalls.html' },
    { size: 'wide', title: 'Shared travel', text: 'Most travelers arrive solo and leave with a group chat full of friends.', img: 'images/blog-group-travelers-morocco.jpg', art: 'people', href: 'blog-morocco-tours-solo-travelers.html' },
  ];
  const experiences = `<section class="section t-cream" data-stage="Experience" aria-labelledby="xp-h">
  <div class="wrap">
    <div class="head head--row"><div><span class="eyebrow eyebrow--dune">Experience</span><h2 class="h1" id="xp-h" data-r="words">Ten ways Morocco <span class="serif hl">moves</span> you</h2></div><p class="muted" style="max-width:38ch;margin:0">From camel treks to street-food nights, these are the moments our routes are built around.</p></div>
    <div class="xp" data-stagger="scale">${xps.map((x, i) => `<a class="xp__tile${x.size ? ' xp__tile--' + x.size : ''}" href="${x.href}" style="${x.bg ? `--bg:${x.bg}` : ''}" data-cursor="Explore">
      ${x.img ? img(x.img, '') : ''}<span class="xp__num">${String(i + 1).padStart(2, '0')}</span><span class="xp__art" aria-hidden="true"><svg viewBox="0 0 84 84">${art[x.art]}</svg></span>
      <h3>${x.title}</h3><p>${x.text}</p></a>`).join('')}</div>
  </div>
</section>`;

  const dayPicks = ['daytrip-marrakech-medina-walking-tour.html', 'daytrip-ourika-valley.html', 'daytrip-agafay-desert-sunset.html', 'daytrip-chefchaouen-blue-city.html'].map(h => daytrips.find(d => d.href === h)).filter(Boolean);
  const dayTrips = `<section class="section t-sand" aria-labelledby="dt-h">
  <div class="wrap">
    <div class="head head--row"><div><span class="eyebrow eyebrow--dune">Short on time?</span><h2 class="h2" id="dt-h" data-r="words">Shared day trips from Marrakech &amp; Fes, from €15</h2></div>${btn('day-trips.html', 'All day trips')}</div>
    <div class="grid g-4">${dayPicks.map(d => ecard({ href: d.href, image: d.image, title: d.title, blurb: d.blurb }, { tag: d.badge, meta: [noEmoji(d.meta[0]), d.length] })).join('')}</div>
  </div>
</section>`;

  const story = `<section class="section t-paper" data-stage="Share" aria-labelledby="why-h">
  <div class="wrap">
    <div class="head"><span class="eyebrow eyebrow--dune">Share · Why travel shared</span><h2 class="h1" id="why-h" data-r="words">All the adventure. <span class="serif hl">None</span> of the private-tour price tag.</h2></div>
    <div class="story">
      <div class="story__sticky"><div class="story__visual">
        ${img('images/hero-sahara-dunes.jpg', 'Sahara dunes at sunset', {}).replace('<img', '<img class="is-on"')}
        ${img('images/blog-group-travelers-morocco.jpg', 'A group of travelers on a camel trek')}
        ${img('images/blog-sahara-gateway-road.jpg', 'The open road to the Sahara')}
        <span class="chip story__caption" style="background:rgba(11,20,29,.6);color:#fff">Same routes as private tours</span>
      </div></div>
      <div>
        <div class="story__step" data-step="0">
          <span class="story__num">01</span><h3 class="h2">Real budget pricing</h3>
          <p class="lede muted">We run the same iconic routes as private operators, but you share the vehicle, the guide and the cost with a small group. Trips cost a fraction of a private, chauffeur-driven itinerary without cutting the highlights.</p>
          <div class="split-cost" data-in>
            <span class="eyebrow">One minivan, one guide, one camp</span>
            <div class="van">${Array.from({ length: 16 }, (_, i) => `<span class="seat" style="--i:${i};--c:${['var(--saffron)', 'var(--dune)', 'var(--majorelle-2)', 'var(--mint)'][i % 4]}">${I.seat}</span>`).join('')}</div>
            <div class="split-cost__bar" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
            <p style="margin:14px 0 0;font-size:.95rem;opacity:.8">…split across up to 16 travelers.</p>
          </div>
        </div>
        <div class="story__step" data-step="1"><span class="story__num">02</span><h3 class="h2">Travel with your people</h3><p class="lede muted">Small groups of solo travelers, couples and friends. Most of our guests arrive alone and leave with a group chat full of new friends.</p></div>
        <div class="story__step" data-step="2"><span class="story__num">03</span><h3 class="h2">Fixed weekly departures</h3><p class="lede muted">No waiting around for a minimum group size. Our routes depart on set days every week, rain or shine, even if only a few seats are booked.</p>${btn('blog-shared-vs-private-tours.html', 'Shared vs private, compared', 'btn--ghost')}</div>
      </div>
    </div>
  </div>
</section>`;

  const colors = ['#f4b43c', '#e97a8a', '#6a78ff', '#1c9a7e', '#e8612c'];
  const chat = `<section class="section t-dark grain" data-stage="Share" aria-labelledby="chat-h">
  <div class="wrap">
    <div class="head center"><span class="eyebrow">Traveler stories</span><h2 class="h1" id="chat-h" data-r="words">What the group is <span class="serif hl">saying</span></h2></div>
    <div class="chat" data-r="up">
      <div class="chat__top"><div class="chat__avatars">${home.testimonials.map((t, i) => `<i style="background:${colors[i]}">${esc(t.name[0])}</i>`).join('')}<i style="background:var(--dune);color:#fff">+</i></div><div class="chat__title"><b>Morocco crew 🐪</b><small>Traveler reviews</small></div></div>
      <div class="chat__body">
        <div class="msg msg--me"><div class="msg__bubble"><p>Welcome to the group! Here’s what recent travelers told us 👇</p></div></div>
        ${home.testimonials.map((t, i) => `<div class="msg"><span class="msg__av" style="background:${colors[i]}">${esc(t.name[0])}</span><div class="msg__bubble"><b>${esc(t.name)}</b><p>${esc(t.quote.replace(/^"|"$/g, ''))}</p><small><span class="stars">★★★★★</span> · ${esc(t.trip)}</small></div></div>`).join('')}
        <div class="typing" aria-hidden="true"><i></i><i></i><i></i></div>
      </div>
    </div>
  </div>
</section>`;

  const steps = `<section class="section t-sand" data-stage="Travel" aria-labelledby="how-h" style="--bg-mask:var(--sand)">
  <div class="wrap">
    <div class="head"><span class="eyebrow eyebrow--dune">Travel · How it works</span><h2 class="h1" id="how-h" data-r="words">Booking a shared trip is <span class="serif hl">simple</span></h2></div>
    <div class="steps" data-p>
      <svg class="steps__line" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M40 30 C200 -10 300 70 440 30 S700 -10 800 30 S1050 70 1180 30"/></svg>
      ${home.steps.map((s, i) => `<div class="step" data-r="up" style="--i:${i}"><div class="step__n">0${i + 1}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}
    </div>
  </div>
</section>`;

  const journal = `<section class="section t-paper" aria-labelledby="blog-h">
  <div class="wrap">
    <div class="head head--row"><div><span class="eyebrow eyebrow--dune">Field notes</span><h2 class="h2" id="blog-h" data-r="words">Plan smarter with our Morocco guides</h2></div>${btn('blog.html', 'Read the blog')}</div>
    <div class="grid g-3">${posts.slice(0, 3).map(p => ecard({ href: p.href, image: p.image, title: p.title, blurb: p.blurb }, { tag: p.cat, meta: [p.mins] })).join('')}</div>
  </div>
</section>`;

  const seats = `<section class="section t-dune grain seats-cta" data-stage="Travel" data-in>
  <div class="wrap">
    <span class="eyebrow" style="color:#fff">Ready when you are</span>
    <h2 class="h-hero" data-r="words">Grab a <span class="serif">seat.</span></h2>
    <div class="seatmap" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i class="${i === 13 ? 'open' : 'on'}" style="--i:${i}"></i>`).join('')}</div>
    <p class="lede" style="margin:0 auto 34px">Sixteen seats, one minivan, one shared adventure. Fixed departures fill up fast in peak season (October to April).</p>
    <div class="btn-row" style="justify-content:center">${btn('tours.html', 'Browse group tours', 'btn--light')}${btn('contact.html', 'Ask a question', 'btn--ghost')}</div>
  </div>
</section>`;

  const body = [hero, rail, journey, experiences, dayTrips, story, chat, steps, journal, seats].join('\n');
  const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Shared Morocco Adventures', url: SITE + '/' };
  out('index.html', page({ ...common, meta: P.index.meta, section: 'home', body, preload: 'images/blog-camel-trek-closeup.jpg', extraLd: [website], rail: true }));
}

/* ================= TOURS INDEX ================= */
function buildTours() {
  const f = (group, label, items) => `<span class="filters__label">${label}</span>${items.map(([v, l], i) => `<button type="button" class="fbtn" data-group="${group}" data-value="${v}" aria-pressed="${i === 0}">${l}</button>`).join('')}`;
  const soon = P.tours.sections[0].cards.find(c => !c.href.startsWith('tour-'));
  const body = `${phero({ image: 'images/marrakech-jemaa-el-fnaa.jpg', eyebrow: P.tours.hero.eyebrow, title: P.tours.hero.h1, lead: P.tours.hero.lead, crumbList: [['index.html', 'Home'], ['', 'Group Tours']], extra: `<div class="chips">${['3 to 10 days', `From €${minPrice} pp`, 'Max 16 travelers', 'Weekly departures'].map(c => `<span class="chip">${c}</span>`).join('')}</div>` })}
<section class="section t-sand">
  <div class="wrap">
    <div class="head"><span class="eyebrow eyebrow--dune">${esc(P.tours.sections[0].eyebrow)}</span><h2 class="h2" data-r="words">${P.tours.sections[0].h2}</h2><p class="lede muted">${P.tours.sections[0].lead || 'Choose a ready-to-book fixed departure. Every itinerary is designed around shared transport, local guides and time to explore independently.'}</p></div>
    <div class="filters" data-filters="#tour-grid" role="group" aria-label="Filter tours">
      ${f('len', 'Length', [['', 'Any'], ['short', '3 to 4 days'], ['mid', '5 to 6 days'], ['long', '7+ days']])}
      <span style="flex-basis:100%;height:0"></span>
      ${f('exp', 'Vibe', [['', 'Everything'], ['sahara', 'Sahara'], ['cities', 'Imperial cities'], ['atlas', 'Atlas & Marrakech'], ['coast', 'Coast']])}
      <span style="flex-basis:100%;height:0"></span>
      ${f('start', 'From', [['', 'Anywhere'], ['start-marrakech', 'Marrakech'], ['start-fes', 'Fes'], ['start-casablanca', 'Casablanca']])}
      <span class="fcount" aria-live="polite">${tours.length} trips</span>
    </div>
    <div class="grid g-3" id="tour-grid">${tours.map((t, i) => tcard(t)).join('\n')}</div>
  </div>
</section>
${soon ? band({ eyebrow: 'Coming soon', title: esc(strip(soon.title)), text: soon.blurb, href: 'contact.html', label: 'Get notified', tone: 't-blue' }) : ''}
${band({ title: P.tours.cta?.h2 || 'Can’t find a route that fits?', text: P.tours.cta?.p, href: 'contact.html', label: 'Contact us' })}`;
  out('tours.html', page({ ...common, meta: P.tours.meta, section: 'tours', body, preload: 'images/marrakech-jemaa-el-fnaa.jpg', extraLd: [breadcrumbLd([['index.html', 'Home'], ['tours.html', 'Group Tours']])] }));
}

/* ================= TOUR DETAIL ================= */
function buildTour(t, i) {
  const d = t.det;
  const chips = d.overview?.chips || [];
  const find = re => noEmoji(chips.find(c => re.test(c)) || '');
  const [startC, endC] = [t.route[0], t.route[t.route.length - 1]];
  const facts = [
    ['Duration', `${t.days} days`],
    ['Route', t.route.length > 1 ? `${startC} → ${endC}` : startC],
    ['Group', find(/max|travel/i) || 'Max 16 travelers'],
    ['Departs', find(/depart/i) || 'Fixed weekly dates'],
  ];
  const others = tours.filter(x => x !== t).sort((a, b) => b.tags.filter(g => t.tags.includes(g)).length - a.tags.filter(g => t.tags.includes(g)).length).slice(0, 3);
  const trail = [['index.html', 'Home'], ['tours.html', 'Group Tours'], ['', strip(t.title)]];
  const body = `${phero({
    image: d.hero.image, alt: strip(d.hero.h1), eyebrow: d.hero.eyebrow, title: d.hero.h1, crumbList: trail,
    extra: `${routeChain(d.hero.lead)}<div class="facts" style="--n:5">${facts.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}<div><small>From</small><b class="big">${esc(d.price.amount)}</b></div></div>`,
  })}
<section class="section t-cream">
  <div class="wrap tour-layout">
    <div>
      <div class="block overview">
        <span class="eyebrow eyebrow--dune">${esc(d.overview.eyebrow)}</span>
        <h2 class="h2" data-r="words">${d.overview.h2}</h2>
        <div data-r="up">${d.overview.paras.map(p => `<p>${p}</p>`).join('')}</div>
        ${chipsHtml(chips)}
        <div class="figure" data-r="mask" data-p>${img(d.overview.image || d.hero.image, '')}</div>
      </div>
      <div class="block" id="itinerary">
        <span class="eyebrow eyebrow--dune">${esc(d.itinerary.eyebrow || 'Day by day')}</span>
        <h2 class="h2" data-r="words">The journey, <span class="serif hl">day by day</span></h2>
        ${timeline(d.itinerary.days)}
      </div>
      ${d.stay ? `<div class="block">
        <span class="eyebrow eyebrow--dune">${esc(d.stay.eyebrow)}</span>
        <h2 class="h2" data-r="words">${d.stay.h2}</h2>
        ${d.stay.intro.map(p => `<p class="lede muted">${p}</p>`).join('')}
        <div class="nights" data-stagger="up">${d.stay.cards.map(c => `<div class="night"><div class="night__icon" aria-hidden="true">${c.icon}</div><div><h3>${c.title}</h3>${c.html.map(p => `<p>${p}</p>`).join('')}</div></div>`).join('')}</div>
        ${d.stay.notes.map(p => `<p class="muted" style="font-size:.88rem;margin-top:16px">${p}</p>`).join('')}
      </div>` : ''}
      <div class="block">${includes(d.includes || [], d.excludes || [])}</div>
      ${d.good ? `<div class="block goodbox" data-r="up"><span class="eyebrow eyebrow--dune">${esc(d.good.eyebrow)}</span><h2 class="h3">${d.good.h2}</h2>${d.good.paras.map(p => `<p>${p}</p>`).join('')}</div>` : ''}
      ${d.faq ? `<div class="block" id="faq"><span class="eyebrow eyebrow--dune">${esc(d.faq.eyebrow)}</span><h2 class="h2" data-r="words">${d.faq.h2}</h2>${faqList(d.faq.items)}${(d.faq.extra || []).join('')}</div>` : ''}
    </div>
    ${dock({ amount: d.price.amount, sub: d.price.sub, bullets: [`${t.days} days · ${esc(t.routeStr)}`, ...chips.filter(c => !/📍/.test(c)).map(c => esc(noEmoji(c))), 'Local English/French-speaking driver-guide'], href: d.price.ctaHref, label: d.price.ctaText || 'Check dates & availability', note: bookingNote })}
  </div>
</section>
<section class="section t-sand" aria-labelledby="more-h">
  <div class="wrap">
    <div class="head head--row"><div><span class="eyebrow eyebrow--dune">Keep exploring</span><h2 class="h2" id="more-h" data-r="words">Routes you might also like</h2></div>${btn('tours.html', 'All group tours')}</div>
    <div class="grid g-3">${others.map(o => tcard(o)).join('')}</div>
  </div>
</section>
${band({ title: 'Your seat on the next departure', text: 'Tell us your dates. We reply within 24 hours with availability and the final price.', href: d.price.ctaHref, label: d.price.ctaText || 'Check dates & availability' })}
${mdock(d.price.amount, d.price.sub, d.price.ctaHref)}`;
  out(t.file, page({ ...common, meta: d.meta, section: 'tour', body, preload: d.hero.image, extraLd: [breadcrumbLd([['index.html', 'Home'], ['tours.html', 'Group Tours'], [t.file, t.title]])] }));
}

/* ================= DAY TRIPS ================= */
function buildDayTrips() {
  const hubCard = h => `<a class="xp__tile" href="${h.href}" data-cursor="Open" style="min-height:clamp(340px,30vw,400px)" data-r="mask">${img(h.image, '')}<span class="tag" style="position:absolute;top:22px;left:22px">${esc(h.badge)}</span><h3 style="font-size:var(--fs-2)">${h.title}</h3><p style="max-height:none">${h.blurb}</p><span class="link-arrow" style="margin-top:14px;color:var(--saffron)">${esc(h.price)} · See all ${I.arrow}</span></a>`;
  const f = (items) => items.map(([v, l], i) => `<button type="button" class="fbtn" data-group="from" data-value="${v}" aria-pressed="${i === 0}">${l}</button>`).join('');
  const body = `${phero({ image: P.dt.hero.image, eyebrow: P.dt.hero.eyebrow, title: P.dt.hero.h1, lead: P.dt.hero.lead, crumbList: [['index.html', 'Home'], ['', 'Day Trips']] })}
<section class="section t-cream"><div class="wrap">
  <div class="head"><span class="eyebrow eyebrow--dune">Pick your base</span><h2 class="h2" data-r="words">Two cities, <span class="serif hl">ten</span> ways out</h2></div>
  <div class="grid g-2">${hubs.map(hubCard).join('')}</div>
</div></section>
<section class="section t-sand"><div class="wrap">
  <div class="head"><span class="eyebrow eyebrow--dune">${esc(P.dt.sections[1].eyebrow)}</span><h2 class="h2" data-r="words">${P.dt.sections[1].h2}</h2>${P.dt.sections[1].lead ? `<p class="lede muted">${P.dt.sections[1].lead}</p>` : ''}</div>
  <div class="filters" data-filters="#dt-grid" role="group" aria-label="Filter day trips"><span class="filters__label">Leaving from</span>${f([['', 'Both cities'], ['marrakech', 'Marrakech'], ['fes', 'Fes']])}<span class="fcount" aria-live="polite">${daytrips.length} trips</span></div>
  <div class="grid g-3" id="dt-grid">${daytrips.map(d => ecard({ href: d.href, image: d.image, title: d.title, blurb: d.blurb, tags: d.from }, { tag: d.badge, meta: [noEmoji(d.meta[0]), d.length] })).join('')}</div>
</div></section>
${band({ title: P.dt.cta?.h2 || 'Want the full adventure?', text: P.dt.cta?.p || '', href: P.dt.cta?.href || 'tours.html', label: P.dt.cta?.label || 'Browse group tours' })}`;
  out('day-trips.html', page({ ...common, meta: P.dt.meta, section: 'day-trips', body, preload: P.dt.hero.image, extraLd: [breadcrumbLd([['index.html', 'Home'], ['day-trips.html', 'Day Trips']])] }));
}

function buildHub(file) {
  const h = C(`pages/${file.replace('.html', '.json')}`);
  const city = /fes/.test(file) ? 'Fes' : 'Marrakech';
  const trail = [['index.html', 'Home'], ['day-trips.html', 'Day Trips'], ['', `From ${city}`]];
  const secs = h.trips.map((t, i) => `<section class="trip-sec" id="${t.id}">
  <div class="split${i % 2 ? ' split--flip' : ''}">
    <div>
      <span class="eyebrow eyebrow--dune">${esc(t.eyebrow)}</span>
      <h2 class="h2" data-r="words">${t.h2}</h2>
      ${t.route ? `<div style="margin:18px 0 22px" data-r="up">${routeChain(t.route)}</div>` : ''}
      ${t.lead ? `<p><span class="day__dist">${I.car}${esc(t.lead)}</span></p>` : ''}
      ${t.paras.map(p => `<p>${p}</p>`).join('')}
      ${t.chips.length ? `<div class="chips" style="margin:18px 0">${t.chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>` : ''}
      ${t.notes.map(n => `<p class="muted" style="font-size:.92rem">${n}</p>`).join('')}
      <div class="btn-row" style="margin-top:22px">${t.links.map((l, j) => btn(l.href, esc(l.label), j ? 'btn--ghost' : 'btn--dune')).join('')}</div>
    </div>
    <div class="trip-sec__media" data-r="mask" data-p>${img(t.image, strip(t.h2))}${t.price ? `<span class="trip-sec__price">${esc(t.price)} <small style="font-weight:500">${esc(t.priceSub.split('·')[0])}</small></span>` : ''}</div>
  </div>
</section>`).join('\n');
  const tail = h.tail.map(x => x.kind === 'faq' ? `<section class="section t-sand"><div class="wrap--narrow"><span class="eyebrow eyebrow--dune">${esc(x.eyebrow || 'FAQs')}</span><h2 class="h2" data-r="words">${x.h2}</h2>${faqList(x.items)}</div></section>`
    : x.kind === 'cta' ? band({ title: x.h2, text: x.p, href: x.href, label: x.label })
      : x.kind === 'cards' ? `<section class="section t-cream"><div class="wrap"><div class="head"><h2 class="h2">${x.h2 || 'More'}</h2></div><div class="grid g-3">${x.cards.map(c => ecard({ href: c.href, image: c.image, title: c.title, blurb: c.blurb })).join('')}</div></div></section>` : '').join('\n');
  const body = `${phero({ image: h.hero.image, eyebrow: h.hero.eyebrow, title: h.hero.h1, lead: h.hero.lead, crumbList: trail })}
<section class="section t-cream" style="padding-top:40px"><div class="wrap">
  <nav class="jump" aria-label="Jump to a day trip">${(h.jump || h.trips.map(t => ({ href: '#' + t.id, text: strip(t.h2) }))).map(j => `<a href="${j.href}">${esc(noEmoji(j.text))}</a>`).join('')}</nav>
  ${secs}
</div></section>
${tail}`;
  out(file, page({ ...common, meta: h.meta, section: 'day-trips', body, preload: h.hero.image, extraLd: [breadcrumbLd([['index.html', 'Home'], ['day-trips.html', 'Day Trips'], [file, `Day trips from ${city}`]])] }));
}

function buildDaytrip(dt) {
  const d = dt.det;
  const hub = d.back?.href || (dt.from === 'fes' ? 'day-trips-fes.html' : 'day-trips-marrakech.html');
  const chips = d.overview?.chips || [];
  const trail = [['index.html', 'Home'], ['day-trips.html', 'Day Trips'], [hub, dt.from === 'fes' ? 'From Fes' : 'From Marrakech'], ['', strip(d.hero.h1)]];
  const facts = [['Leaves from', dt.from === 'fes' ? 'Fes' : 'Marrakech'], ['Length', dt.length || 'Full day'], ['Departs', noEmoji(chips.find(c => /depart|daily/i.test(c)) || '') || 'Daily'], ['Drive', noEmoji(chips.find(c => /km|walk/i.test(c)) || '').split('·')[0] || 'Short']];
  const others = daytrips.filter(x => x !== dt && x.from === dt.from).slice(0, 3);
  const body = `${phero({ image: d.hero.image, alt: strip(d.hero.h1), eyebrow: d.hero.eyebrow, title: d.hero.h1, crumbList: trail, short: true,
    extra: `${routeChain(d.hero.lead)}<div class="facts" style="--n:5">${facts.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}<div><small>From</small><b class="big">${esc(d.price.amount)}</b></div></div>` })}
<section class="section t-cream"><div class="wrap tour-layout">
  <div>
    <div class="block overview"><span class="eyebrow eyebrow--dune">${esc(d.overview.eyebrow)}</span><h2 class="h2" data-r="words">${d.overview.h2}</h2><div data-r="up">${d.overview.paras.map(p => `<p>${p}</p>`).join('')}</div>${chipsHtml(chips)}</div>
    ${d.highlights ? `<div class="block"><span class="eyebrow eyebrow--dune">${esc(d.highlights.eyebrow)}</span><h2 class="h2" data-r="words">${d.highlights.h2}</h2>
      <ol class="route" style="font-size:1.1rem;gap:12px 8px" data-stagger="scale">${d.highlights.chips.map(c => `<li><span style="background:var(--ink);color:#fff;border:0;padding:12px 18px">${esc(c)}</span></li>`).join('')}</ol>
      <div class="figure" data-r="mask" data-p>${img(d.overview.image || d.hero.image, '')}</div></div>` : ''}
    <div class="block">${includes(d.includes || [], d.excludes || [])}</div>
    ${d.good ? `<div class="block goodbox" data-r="up"><span class="eyebrow eyebrow--dune">${esc(d.good.eyebrow)}</span><h2 class="h3">${d.good.h2}</h2>${d.good.paras.map(p => `<p>${p}</p>`).join('')}</div>` : ''}
    ${d.faq ? `<div class="block"><span class="eyebrow eyebrow--dune">${esc(d.faq.eyebrow)}</span><h2 class="h2" data-r="words">${d.faq.h2}</h2>${faqList(d.faq.items)}${(d.faq.extra || []).join('')}</div>` : ''}
  </div>
  ${dock({ amount: d.price.amount, sub: d.price.sub, bullets: chips.map(c => esc(noEmoji(c))), href: d.price.ctaHref, label: d.price.ctaText || 'Reserve this day trip', note: bookingNote })}
</div></section>
${others.length ? `<section class="section t-sand"><div class="wrap"><div class="head head--row"><div><span class="eyebrow eyebrow--dune">Same base</span><h2 class="h2" data-r="words">More day trips from ${dt.from === 'fes' ? 'Fes' : 'Marrakech'}</h2></div>${btn(hub, 'See them all')}</div><div class="grid g-3">${others.map(o => ecard({ href: o.href, image: o.image, title: o.title, blurb: o.blurb }, { tag: o.badge, meta: [noEmoji(o.meta[0]), o.length] })).join('')}</div></div></section>` : ''}
${band({ title: 'Make it a multi-day adventure', text: 'Our shared group tours bundle the best day trips with the Sahara, from €' + minPrice + ' per person.', href: 'tours.html', label: 'Browse group tours' })}
${mdock(d.price.amount, d.price.sub, d.price.ctaHref)}`;
  out(dt.href, page({ ...common, meta: d.meta, section: 'daytrip', body, preload: d.hero.image, extraLd: [breadcrumbLd(trail.slice(0, 3).concat([[dt.href, strip(d.hero.h1)]]))] }));
}

/* ================= AIRPORT ================= */
function buildAirport() {
  const a = P.air;
  const cardsSecs = a.sections.filter(s => s.kind === 'cards');
  const stepsSec = a.sections.find(s => s.steps?.length);
  const faqSec = a.sections.find(s => s.faq?.length);
  const opt = c => `<div class="tcard" style="--accent:var(--majorelle)"><div class="tcard__body" style="border-top:0;padding:28px">
    <span class="tag" style="justify-self:start;${/door/i.test(c.badge) ? 'background:var(--majorelle);color:#fff' : ''}">${esc(c.badge)}</span>
    <h3 class="tcard__title" style="margin-top:10px">${c.title}</h3>
    <div class="chips">${c.meta.map(m => `<span class="chip">${chipIcon(emojiOf(m))}${esc(noEmoji(m))}</span>`).join('')}</div>
    <p class="muted" style="margin:0">${c.blurb}</p>
    <div class="tcard__foot"><div class="tcard__price"><small>${esc(c.priceSub)}</small><b>${esc(c.price.replace('From ', ''))}</b></div>${btn('contact.html?trip=Airport%20Transfer', esc(c.cta || 'Book'), 'btn--sm')}</div>
  </div></div>`;
  const body = `${phero({ image: 'images/blog-marrakech-airport.jpg', eyebrow: a.hero.eyebrow, title: a.hero.h1, lead: a.hero.lead, crumbList: [['index.html', 'Home'], ['', 'Airport Transfers']], short: true })}
${cardsSecs.map((s, i) => `<section class="section ${i % 2 ? 't-sand' : 't-cream'}"><div class="wrap"><div class="split">
  <div><span class="eyebrow eyebrow--dune">${esc(s.eyebrow)}</span><h2 class="h1" data-r="words">${s.h2}</h2><p class="lede muted">${s.lead}</p></div>
  <div class="grid" data-stagger="up">${s.cards.map(opt).join('')}</div>
</div></div></section>`).join('\n')}
${stepsSec ? `<section class="section t-dark grain"><div class="wrap"><div class="head"><span class="eyebrow">${esc(stepsSec.eyebrow)}</span><h2 class="h1" data-r="words">${stepsSec.h2}</h2></div><div class="steps">${stepsSec.steps.map((s, i) => `<div class="step" data-r="up" style="--i:${i}"><div class="step__n">0${i + 1}</div><h3>${esc(s.title)}</h3><p>${s.text}</p></div>`).join('')}</div></div></section>` : ''}
${faqSec ? `<section class="section t-cream"><div class="wrap--narrow"><span class="eyebrow eyebrow--dune">${esc(faqSec.eyebrow || 'FAQs')}</span><h2 class="h2" data-r="words">${faqSec.h2}</h2>${faqList(faqSec.faq)}</div></section>` : ''}
${band({ title: a.cta?.h2 || 'Landing soon?', text: a.cta?.p, href: a.cta?.href || 'contact.html', label: a.cta?.label || 'Book a transfer' })}`;
  out('airport-transfers.html', page({ ...common, meta: a.meta, section: 'airport-transfers', body, preload: 'images/blog-marrakech-airport.jpg', extraLd: [breadcrumbLd([['index.html', 'Home'], ['airport-transfers.html', 'Airport Transfers']])] }));
}

/* ================= BLOG ================= */
function buildBlog() {
  const cats = [...new Set(posts.map(p => p.cat))];
  const [first, ...rest] = posts;
  const body = `${phero({ image: P.blog.hero.image, eyebrow: P.blog.hero.eyebrow || 'Blog', title: P.blog.hero.h1, lead: P.blog.hero.lead, crumbList: [['index.html', 'Home'], ['', 'Blog']], short: true })}
<section class="section t-cream"><div class="wrap">
  <div class="grid" style="margin-bottom:clamp(44px,5.4vw,80px)">${ecard({ href: first.href, image: first.image, title: first.title, blurb: first.blurb }, { feature: true, tag: 'Latest · ' + first.cat, meta: [first.mins] })}</div>
  <div class="filters" data-filters="#post-grid" role="group" aria-label="Filter articles"><span class="filters__label">Topic</span>
    <button type="button" class="fbtn" data-group="cat" data-value="" aria-pressed="true">All</button>${cats.map(c => `<button type="button" class="fbtn" data-group="cat" data-value="${slug(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}
    <span class="fcount" aria-live="polite">${rest.length} articles</span></div>
  <div class="grid g-3" id="post-grid">${rest.map(p => ecard({ href: p.href, image: p.image, title: p.title, blurb: p.blurb, tags: slug(p.cat) }, { tag: p.cat, meta: [p.mins] })).join('')}</div>
</div></section>
${band({ title: P.blog.cta?.h2 || 'Ready to go?', text: P.blog.cta?.p, href: P.blog.cta?.href || 'tours.html', label: P.blog.cta?.label || 'Browse group tours' })}`;
  out('blog.html', page({ ...common, meta: P.blog.meta, section: 'blog', body, preload: P.blog.hero.image, extraLd: [breadcrumbLd([['index.html', 'Home'], ['blog.html', 'Blog']])] }));
}

function buildPost(p) {
  const d = p.det;
  const trail = [['index.html', 'Home'], ['blog.html', 'Blog'], ['', strip(d.hero.h1)]];
  const article = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: strip(d.hero.h1), description: d.meta.description,
    image: abs(d.hero.image || p.image), mainEntityOfPage: d.meta.canonical || `${SITE}/${p.href}`, articleSection: p.cat,
    author: { '@type': 'Organization', name: 'Shared Morocco Adventures', url: SITE }, publisher: { '@type': 'Organization', name: 'Shared Morocco Adventures', logo: { '@type': 'ImageObject', url: `${SITE}/images/logo-full-display.png` } },
  };
  const related = (d.related || []).slice(0, 3);
  const body = `<div class="progress" aria-hidden="true"><i></i></div>
${phero({ image: d.hero.image || p.image, alt: strip(d.hero.h1), eyebrow: d.hero.eyebrow || p.cat, title: d.hero.h1, lead: d.hero.lead, crumbList: trail, short: true, extra: `<div class="post-meta"><span>${I.clock}${d.minutes} min read</span><span>${I.pin}${esc(p.cat)}</span><span>By the Shared Morocco Adventures team</span></div>` })}
<article class="section t-cream" id="article"><div class="wrap--narrow prose" data-r="up">${d.body}</div></article>
${d.cta ? band({ title: d.cta.h2, text: d.cta.p, href: d.cta.href, label: d.cta.label }) : ''}
${related.length ? `<section class="section t-sand"><div class="wrap"><div class="head"><span class="eyebrow eyebrow--dune">Keep reading</span><h2 class="h2" data-r="words">Related guides</h2></div><div class="grid g-3">${related.map(r => ecard({ href: r.href, image: r.image, title: r.title, blurb: r.blurb })).join('')}</div></div></section>` : ''}`;
  out(p.href, page({ ...common, meta: { ...d.meta, ogType: 'article' }, section: 'blog', body, preload: d.hero.image || p.image, extraLd: [article, breadcrumbLd([['index.html', 'Home'], ['blog.html', 'Blog'], [p.href, d.hero.h1]])] }));
}

/* ================= ABOUT ================= */
function buildAbout() {
  const a = P.about;
  const values = [
    ['🎒', 'Budget first, never budget cut', 'The price is lower because we share the costs, not because we skip the highlights. Every route visits the same landmarks a private tour would.'],
    ['🧭', 'Fixed departures, always', 'Trips leave on schedule whether the group is 4 people or 16. No minimum headcount, no last minute cancellations because the group is too small.'],
    ['🌍', 'Local people, real connections', 'Every group travels with a Moroccan driver guide, and every trip ends with new friends from around the world.'],
  ];
  const company = { ice: '002790820000079', ifNum: '50151441' };
  const orgLd = { '@context': 'https://schema.org', '@type': 'TravelAgency', name: 'Shared Morocco Adventures', url: 'https://www.sharedmoroccoadventures.com/', email: EMAIL, taxID: company.ifNum,
    identifier: { '@type': 'PropertyValue', propertyID: 'ICE', value: company.ice },
    address: { '@type': 'PostalAddress', addressLocality: 'Marrakech', addressCountry: 'MA' }, areaServed: 'Morocco' };
  const body = `${phero({ image: 'images/blog-group-travelers-morocco.jpg', eyebrow: 'About us', title: a.hero.h1, lead: a.hero.lead, crumbList: [['index.html', 'Home'], ['', 'About']] })}
<section class="section t-cream"><div class="wrap--narrow"><p class="big-quote">You arrive as a stranger in a minivan. Three days later you’re sharing mint tea under the Sahara stars with friends from five countries. That’s the trip we build.</p></div></section>
<section class="section t-sand"><div class="wrap"><div class="split" style="align-items:start">
  <div><span class="eyebrow eyebrow--dune">Our story</span><h2 class="h1" data-r="words">Built for <span class="serif hl">travelers,</span> not just tourists</h2>
    <p class="lede">Every week in Marrakech we see the same thing. A traveler steps out of the medina with a dream of the Sahara, then walks straight into a private tour price made for honeymooners. Or they end up alone in the back of a car for ten hours, watching the most beautiful roads in North Africa pass by with nobody to share them with.</p>
    <p>We started Shared Morocco Adventures to change that. The idea is simple: one vehicle, one local guide, one desert camp, shared by a small group of people who have never met. Everyone pays a fair share, and nobody travels alone.</p>
    <p>It works because Morocco is a country made for sharing. Tea is poured for everyone at the table. Tagines are eaten from the same plate. At the desert camp, the drums come out and the whole group ends up around one fire. Our trips follow that same spirit. A solo backpacker from Canada, a couple from Brazil and two friends from Japan climb into the same minivan in Marrakech. By the time they reach the dunes of Merzouga, they have a group chat, a dozen inside jokes and plans to meet again somewhere else in the world.</p>
    <p>We keep groups small, never more than 16 travelers. Departures are fixed and run every week, so you never have to wait for enough people to sign up. Our guides and drivers are Moroccan, born and raised here. They know which café on the Tizi n’Tichka pass has the best view, which family in the valley makes the best bread, and how to turn a long drive into the best part of the day.</p>
    <p>We’re not a booking website, and we’re not a big foreign agency. We’re a team on the ground in Marrakech, and every trip we sell is one we run ourselves.</p></div>
  <div class="split-img" data-r="mask" data-p style="position:sticky;top:calc(var(--hdr-h) + 30px)">${img('images/blog-camel-trek-closeup.jpg', 'Travelers on a camel trek in the Sahara')}</div>
</div></div></section>
<section class="section t-cream"><div class="wrap"><div class="split">
  <div><span class="eyebrow eyebrow--dune">Registered and local</span><h2 class="h1" data-r="words">A real Moroccan company, on the ground in <span class="serif hl">Marrakech</span></h2>
    <p class="lede">Shared Morocco Adventures is a company officially registered in Marrakech, Morocco. We operate under Moroccan law with our own local team, guides and drivers, so your money stays with the people who actually make your trip happen.</p>
    <p>Before you book, you deal directly with us. We confirm your dates, your seat and the final price by email, and nothing is charged until everything is agreed.</p></div>
  <div class="value" data-r="up" style="padding:clamp(24px,3vw,36px)"><span class="value__icon" aria-hidden="true">🏛️</span><h3>Company details</h3>
    <dl class="company-facts"><div><dt>Registered in</dt><dd>Marrakech, Morocco</dd></div><div><dt>ICE</dt><dd>${company.ice}</dd></div><div><dt>Identifiant Fiscal (IF)</dt><dd>${company.ifNum}</dd></div><div><dt>Email</dt><dd><a href="mailto:${EMAIL}">${EMAIL}</a></dd></div></dl></div>
</div></div></section>
<section class="section t-dark grain"><div class="wrap">
  <div class="stats" style="margin-bottom:clamp(44px,5.4vw,80px);background:rgba(255,255,255,.1)">
    <div class="stat"><b data-count="16">16</b><span>Travelers max per group</span></div>
    <div class="stat"><b data-count="${tours.length}">${tours.length}</b><span>Multi-day routes</span></div>
    <div class="stat"><b data-count="${daytrips.length}">${daytrips.length}</b><span>Shared day trips</span></div>
    <div class="stat"><b data-count="${minPrice}" data-prefix="€">€${minPrice}</b><span>Tours from, per person</span></div>
  </div>
  <div class="head"><span class="eyebrow">What we stand for</span><h2 class="h1" data-r="words">Our approach to group travel</h2></div>
  <div class="grid g-3" data-stagger="up">${values.map(([ic, h, t]) => `<div class="value"><span class="value__icon" aria-hidden="true">${ic}</span><h3>${h}</h3><p>${t}</p></div>`).join('')}</div>
</div></section>
${band({ title: 'Come travel with the group', text: 'Pick a route, grab a seat, and meet your travel companions in Marrakech or Fes. We’ll handle the roads, the riads and the camp.', href: 'tours.html', label: 'Browse group tours' })}`;
  out('about.html', page({ ...common, meta: a.meta, section: 'about', body, preload: 'images/blog-group-travelers-morocco.jpg', extraLd: [breadcrumbLd([['index.html', 'Home'], ['about.html', 'About']]), orgLd] }));
}

/* ================= FAQS ================= */
function buildFaqs() {
  const f = P.faqs;
  const all = f.categories.flatMap(c => c.items);
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: all.map(it => ({ '@type': 'Question', name: strip(it.q), acceptedAnswer: { '@type': 'Answer', text: strip(it.a) } })) };
  const hasFaqLd = (f.meta.jsonld || []).some(s => /FAQPage/.test(s));
  const facts = [['👥', 'Max 16 travelers'], ['📅', 'Fixed weekly departures'], ['💶', `Tours from €${minPrice}`], ['⏱️', 'Replies within 24 hours']];
  const body = `${phero({ image: f.hero.image, short: true, eyebrow: 'FAQs', title: f.hero.h1, lead: f.hero.lead, crumbList: [['index.html', 'Home'], ['', 'FAQs']] })}
<section class="section t-cream faq-top"><div class="wrap">
  <div class="head head--row"><div><span class="eyebrow eyebrow--dune">Find your answer</span><h2 class="h2" data-r="words">${all.length} questions, <span class="serif hl">answered</span></h2></div>
    <div class="faq-top__search"><label class="sr" for="faq-q">Search the FAQs</label><input id="faq-q" class="faq-search" type="search" placeholder="Search, e.g. deposit, desert, solo, visa" autocomplete="off"></div></div>
  <p class="faq-empty muted" hidden style="margin:0 0 24px">No matching questions. <a href="contact.html">Ask us directly</a>, we reply within 24 hours.</p>
  <ul class="faq-facts" aria-label="Quick facts">${facts.map(([i, t]) => `<li><span aria-hidden="true">${i}</span>${t}</li>`).join('')}</ul>
  <div class="grid faq-cats" data-stagger="up">${f.categories.map(c => `<a class="xp__tile faq-cat" href="#${c.key}" data-cursor="Open">${img(c.image, '')}<span class="xp__num">${c.items.length} questions</span><span class="faq-cat__icon" aria-hidden="true">${c.icon}</span><h3>${esc(strip(c.h2))}</h3></a>`).join('')}</div>
</div></section>
${f.categories.map((c, i) => `<section class="section faq-sec ${i % 2 ? 't-cream' : 't-sand'}" data-faq-cat id="${c.key}" aria-labelledby="h-${c.key}"><div class="wrap"><div class="faq-split">
  <aside class="faq-aside">
    <div class="faq-aside__img" data-r="up">${img(c.image, '')}<span class="faq-aside__icon" aria-hidden="true">${c.icon}</span></div>
    <span class="eyebrow eyebrow--dune">${esc(c.eyebrow)}</span>
    <h2 class="h2" id="h-${c.key}" data-r="words">${c.h2}</h2>
    <p class="muted">${esc(c.intro)}</p>
  </aside>
  <div>${faqList(c.items)}</div>
</div></div></section>`).join('\n')}
${band({ title: f.cta?.h2 || 'Still have questions?', text: f.cta?.p, href: f.cta?.href || 'contact.html', label: f.cta?.label || 'Contact us' })}`;
  out('faqs.html', page({ ...common, meta: f.meta, section: 'faqs', body, solid: false, extraLd: [...(hasFaqLd ? [] : [faqLd]), breadcrumbLd([['index.html', 'Home'], ['faqs.html', 'FAQs']])] }));
}

/* ================= CONTACT ================= */
function buildContact() {
  const pill = (name, list) => `<div class="pills" role="radiogroup">${list.map(([v, l], i) => `<input type="radio" id="${name}-${i}" name="${name}" value="${attr(v)}"${i === 0 ? ' checked' : ''}><label for="${name}-${i}">${l}</label>`).join('')}</div>`;
  const body = `${phero({ eyebrow: 'Contact', title: 'Reserve your seat or <span class="serif" style="color:var(--saffron)">ask a question</span>', lead: 'We reply within 24 hours with departure dates, availability and the final price.', crumbList: [['index.html', 'Home'], ['', 'Contact']] })}
<section class="section t-cream"><div class="wrap"><div class="split" style="align-items:start">
  <div class="form-card" data-r="up">
    <h2 class="h3">Send us a message</h2>
    <p class="trip-note chip" hidden style="margin-bottom:20px">Enquiring about: <b></b></p>
    <form class="form" name="contact" method="POST" action="https://formsubmit.co/${EMAIL}">
      <input type="hidden" name="_subject" value="New enquiry from sharedmoroccoadventures.com">
      <input type="hidden" name="_next" value="https://www.sharedmoroccoadventures.com/thank-you.html">
      <input type="hidden" name="_template" value="table">
      <input type="hidden" name="_captcha" value="false">
      <p class="hp"><label>Don't fill this out if you're human: <input name="_honey" tabindex="-1" autocomplete="off"></label></p>
      <div class="form__row"><div class="field"><label for="name">Full name</label><input type="text" id="name" name="name" autocomplete="name" required></div><div class="field"><label for="email">Email</label><input type="email" id="email" name="email" autocomplete="email" required></div></div>
      <div class="form__row"><div class="field"><label for="trip">Trip of interest</label><select id="trip" name="trip">${tripOptions.map(o => `<option value="${attr(o.value)}">${esc(o.label)}</option>`).join('')}</select></div><div class="field"><label for="date">Preferred departure date</label><input type="date" id="date" name="date"></div></div>
      <div class="field"><span class="field__label" style="font-size:.8rem;font-weight:650;letter-spacing:.08em;text-transform:uppercase">Number of travelers</span>${pill('travelers', [['1', 'Just me'], ['2', '2 travelers'], ['3-4', '3 to 4'], ['5+', '5+']])}</div>
      <div class="field"><span class="field__label" style="font-size:.8rem;font-weight:650;letter-spacing:.08em;text-transform:uppercase">Room preference</span>${pill('room', [['Shared room', 'Shared room'], ['Private room', 'Private room (subject to availability)']])}</div>
      <div class="field"><label for="message">Message</label><textarea id="message" name="message" required placeholder="Tell us about your travel dates, group size, or any questions."></textarea></div>
      <div><button type="submit" class="btn btn--dune"><span>Check dates &amp; availability</span><span class="ico">${I.arrow}</span></button></div>
    </form>
  </div>
  <div style="position:sticky;top:calc(var(--hdr-h) + 30px)">
    <span class="eyebrow eyebrow--dune">Other ways to reach us</span>
    <h2 class="h1" data-r="words">We’re here to <span class="serif hl">help</span></h2>
    <p class="lede muted">Whether you’re ready to book or just weighing your options, drop us a line. We’re happy to help you pick the right route and departure date.</p>
    <div class="grid" style="margin-top:30px" data-stagger="up">
      <a class="value" href="mailto:${EMAIL}" style="text-decoration:none"><span class="value__icon" style="width:34px">${I.mail}</span><h3 style="font-size:1.05rem;word-break:break-all">${EMAIL}</h3><p>Email us any time</p></a>
      <div class="value"><span class="value__icon" style="width:34px">${I.clock}</span><h3 style="font-size:1.05rem">Response within 24 hours</h3><p>Every enquiry is answered by a person, not a bot.</p></div>
      <div class="value"><span class="value__icon" style="width:34px">${I.check}</span><h3 style="font-size:1.05rem">How booking works</h3><p>Send your preferred dates and group details. We confirm availability, price and payment instructions by email before anything is charged.</p></div>
    </div>
  </div>
</div></div></section>`;
  out('contact.html', page({ ...common, meta: P.contact.meta, section: 'contact', body, extraLd: [breadcrumbLd([['index.html', 'Home'], ['contact.html', 'Contact']])] }));
}

/* ================= SMALL PAGES ================= */
function buildThanks() {
  const body = `<section class="notfound grain"><div>
  <svg viewBox="0 0 120 120" width="120" height="120" style="margin:0 auto 30px" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="none" stroke="var(--dune)" stroke-width="4" stroke-dasharray="340" stroke-dashoffset="340" style="animation:draw 1.2s var(--ease) .2s forwards"/><path d="M38 62l15 15 30-32" fill="none" stroke="var(--saffron)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="80" stroke-dashoffset="80" style="animation:draw .8s var(--ease) 1s forwards"/></svg>
  <span class="eyebrow">Message sent</span>
  <h1 class="h1" data-r="words">Thanks! We’ll be in <span class="serif hl">touch</span> soon.</h1>
  <p class="lede muted" style="margin:0 auto 34px">Your message has been received. Our team replies within 24 hours with departure dates and next steps.</p>
  <div class="btn-row" style="justify-content:center">${btn('tours.html', 'Browse more trips', 'btn--dune')}${btn('index.html', 'Back to home', 'btn--ghost')}</div>
</div></section>`;
  out('thank-you.html', page({ ...common, meta: P.thanks.meta, section: '', body, noindex: true }));
}
function build404() {
  const body = `<section class="notfound grain"><div>
  <span class="eyebrow">Error 404</span>
  <h1 class="h-hero" data-r="words">Lost in the <span class="serif hl">dunes.</span></h1>
  <p class="lede muted" style="margin:0 auto 34px">This page wandered off with the caravan. Let’s get you back on the route.</p>
  <div class="btn-row" style="justify-content:center">${btn('index.html', 'Back to home', 'btn--dune')}${btn('tours.html', 'See group tours', 'btn--ghost')}</div>
</div></section>`;
  out('404.html', page({ ...common, meta: { title: 'Page not found | Shared Morocco Adventures', description: 'This page could not be found.' }, section: '', body, noindex: true }));
}
function buildCredits() {
  const c = P.credits;
  const body = `${phero({ eyebrow: c.hero.eyebrow, title: c.hero.h1, lead: c.hero.lead, crumbList: [['index.html', 'Home'], ['', 'Photo credits']] })}
<section class="section t-cream"><div class="wrap--narrow prose"><ul>${creditList.map(li => `<li>${li}</li>`).join('')}</ul></div></section>`;
  out('photo-credits.html', page({ ...common, meta: c.meta, section: '', body }));
}

/* ---------------- run ---------------- */
buildHome(); buildTours(); tours.forEach(buildTour);
buildDayTrips(); ['day-trips-marrakech.html', 'day-trips-fes.html'].forEach(buildHub); daytrips.forEach(buildDaytrip);
buildAirport(); buildBlog(); posts.forEach(buildPost);
buildAbout(); buildFaqs(); buildContact(); buildThanks(); build404(); buildCredits();
console.log(`Built ${built.length} pages.`);
