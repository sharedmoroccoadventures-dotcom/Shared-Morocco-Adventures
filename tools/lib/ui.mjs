// Shared layout + components for every generated page.
export const SITE = 'https://www.sharedmoroccoadventures.com';
export const EMAIL = 'sharedmoroccoadventures@gmail.com';

export const esc = s => String(s ?? '').replace(/&(?![#a-z0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const attr = s => String(s ?? '').replace(/&(?![#a-z0-9]+;)/gi, '&amp;').replace(/"/g, '&quot;');
export const strip = s => String(s ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&rarr;/g, '→').replace(/&middot;/g, '·').replace(/&#39;|&rsquo;/g, '’').trim();
export const noEmoji = s => String(s ?? '').replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '').trim();
export const emojiOf = s => (String(s ?? '').match(/^[\p{Extended_Pictographic}️‍]+/u) || [''])[0];

const P = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
export const I = {
  arrow: P('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowUR: P('<path d="M7 17 17 7M8 7h9v9"/>'),
  pin: P('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  car: P('<path d="M5 16h14M6 16l1.5-5.5A2 2 0 0 1 9.4 9h5.2a2 2 0 0 1 1.9 1.5L18 16M5 16v3M19 16v3"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>'),
  users: P('<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5a3 3 0 0 1 0 6M17.5 14a5 5 0 0 1 3 5"/>'),
  cal: P('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
  clock: P('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'),
  check: P('<path d="M5 12.5 10 17 19 7"/>'),
  x: P('<path d="M6 6l12 12M18 6 6 18"/>'),
  mail: P('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  bolt: P('<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>'),
  seat: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5L8 13.8 2 9.2h7.6z"/></svg>`,
  zellige: `<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M50 0l12 21 24-3-3 24 21 12-21 12 3 24-24-3-12 21-12-21-24 3 3-24L0 50l21-12-3-24 24 3z"/><circle cx="50" cy="50" r="14" fill="var(--night, #0b141d)"/></svg>`,
};
export const chipIcon = e => ({ '📍': I.pin, '🚗': I.car, '👥': I.users, '🗓': I.cal, '📅': I.cal, '⏱': I.clock, '🕐': I.clock }[e.replace(/️/g, '')] || '');

export const logoMark = (id = 'lg') => `<svg class="logo__mark" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4b43c"/><stop offset=".55" stop-color="#e8612c"/><stop offset="1" stop-color="#c2481a"/></linearGradient></defs><circle cx="32" cy="32" r="31" fill="url(#${id})"/><polygon points="32,13 34.53,20.52 42.46,20.6 36.09,25.33 38.47,32.9 32,28.3 25.53,32.9 27.91,25.33 21.54,20.6 29.47,20.52" fill="#fbf6ee"/><path class="road" d="M14 48 Q32 59 50 48" fill="none" stroke="#111d29" stroke-width="2.8" stroke-linecap="round"/><circle cx="14" cy="48" r="3" fill="#111d29"/><circle cx="50" cy="48" r="3" fill="#111d29"/></svg>`;

export const btn = (href, label, cls = '', extra = '') => `<a href="${attr(href)}" class="btn ${cls}"${extra}><span>${label}</span><span class="ico">${I.arrow}</span></a>`;

const NAV = [
  ['tours.html', 'Group Tours', ['tours', 'tour']],
  ['day-trips.html', 'Day Trips', ['day-trips', 'daytrip']],
  ['airport-transfers.html', 'Transfers', ['airport-transfers']],
  ['blog.html', 'Blog', ['blog']],
  ['about.html', 'About', ['about']],
  ['faqs.html', 'FAQs', ['faqs']],
  ['contact.html', 'Contact', ['contact']],
];

export function header(section, solid = false) {
  const links = NAV.map(([h, l, keys]) => `<a href="${h}"${keys.includes(section) ? ' aria-current="page"' : ''}>${l}</a>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="hdr${solid ? ' hdr--solid' : ''}">
  <div class="hdr__bar">
    <a href="index.html" class="logo" aria-label="Shared Morocco Adventures, home">${logoMark('lgH')}<span>Shared Morocco<small>Adventures</small></span></a>
    <nav class="nav" aria-label="Main"><span class="nav__ind" aria-hidden="true"></span>${links}</nav>
    ${btn('contact.html', 'Book a seat', 'btn--dune btn--sm hdr__cta')}
    <button class="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="menu" id="menu">
  <ul class="menu__links">${[['index.html', 'Home'], ...NAV.map(([h, l]) => [h, l])].map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>
  <div class="menu__foot"><a href="mailto:${EMAIL}">${EMAIL}</a><span>Small groups · Fixed departures · Real savings</span></div>
</div>`;
}

export function footer(popular) {
  const word = 'Together.'.split('').map(c => `<span>${c}</span>`).join('');
  return `<footer class="ftr grain">
  <div class="wrap">
    <div class="ftr__top">
      <div>
        <a href="index.html" class="logo" style="margin-bottom:28px">${logoMark('lgF')}<span>Shared Morocco<small>Adventures</small></span></a>
        <p class="ftr__lead">Budget-friendly small-group tours across Morocco. Fixed departures, sociable travelers, real savings.</p>
        ${btn('tours.html', 'Find your departure', 'btn--dune')}
      </div>
      <div><h4>Explore</h4><ul>
        <li><a href="tours.html">Group Tours</a></li><li><a href="day-trips.html">Day Trips</a></li><li><a href="airport-transfers.html">Airport Transfers</a></li><li><a href="blog.html">Blog</a></li><li><a href="about.html">About Us</a></li><li><a href="faqs.html">FAQs</a></li>
      </ul></div>
      <div><h4>Popular Trips</h4><ul>${popular.map(t => `<li><a href="${t.file}">${t.short}</a></li>`).join('')}<li><a href="tours.html">All Group Tours</a></li></ul></div>
      <div><h4>Contact</h4><ul>
        <li><a href="mailto:${EMAIL}">${EMAIL}</a></li><li><a href="contact.html">Contact form</a></li><li><span style="opacity:.7">Replies within 24 hours</span></li>
      </ul></div>
    </div>
    <div class="ftr__word" data-p aria-hidden="true">${word}</div>
  </div>
  <div class="ftr__road" aria-hidden="true"></div>
  <div class="wrap ftr__bottom"><span>&copy; ${new Date().getFullYear()} Shared Morocco Adventures. All rights reserved.</span><span><a href="photo-credits.html">Photo credits</a> · <a href="sitemap.xml">Sitemap</a></span></div>
</footer>`;
}

const FONTS = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Serif:ital@0;1&display=swap';

export function page({ meta, section, body, preload, solid = false, bodyClass = '', extraLd = [], popular, noindex = false, rail = false }) {
  const og = meta.ogImage || `${SITE}/images/hero-sahara-dunes.jpg`;
  const ld = [...(meta.jsonld || []), ...extraLd.map(o => JSON.stringify(o, null, 2))].map(s => `<script type="application/ld+json">\n${s}\n</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(strip(meta.title))}</title>
<meta name="description" content="${attr(meta.description)}">
${meta.canonical ? `<link rel="canonical" href="${attr(meta.canonical)}">` : ''}
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta name="theme-color" content="#0b141d">
<meta property="og:type" content="${meta.ogType || 'website'}">
<meta property="og:site_name" content="Shared Morocco Adventures">
<meta property="og:title" content="${attr(meta.ogTitle || strip(meta.title))}">
<meta property="og:description" content="${attr(meta.ogDescription || meta.description)}">
${meta.canonical ? `<meta property="og:url" content="${attr(meta.canonical)}">` : ''}
<meta property="og:image" content="${attr(og)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${attr(og)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
${preload ? `<link rel="preload" as="image" href="${attr(preload)}" fetchpriority="high">` : ''}
<link rel="icon" type="image/svg+xml" href="images/logo-mark.svg">
<link rel="icon" type="image/png" href="images/logo-icon.png">
<link rel="apple-touch-icon" href="images/logo-icon.png">
<link rel="stylesheet" href="css/site.css">
<script>document.documentElement.classList.add('js')</script>
<script src="js/site.js" defer></script>
${ld}
</head>
<body class="${bodyClass}">
${header(section, solid)}
${rail ? railMarkup() : ''}
<main id="main">
${body}
</main>
${footer(popular)}
</body>
</html>
`;
}

const STAGES = ['Move', 'Discover', 'Explore', 'Experience', 'Share', 'Travel'];
const railMarkup = () => `<nav class="rail" aria-hidden="true"><ul>${STAGES.map(s => `<li data-stage="${s}"><span>${s.toUpperCase()}</span><i></i></li>`).join('')}</ul></nav>`;

export const img = (src, alt = '', { eager = false, cls = '', w = 1400, h = 933, sizes = '' } = {}) =>
  `<img src="${attr(src)}" alt="${attr(alt)}" width="${w}" height="${h}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"${cls ? ` class="${cls}"` : ''}${sizes ? ` sizes="${sizes}"` : ''}>`;

export function routeChain(str) {
  const stops = strip(str).split(/\s*(?:→|->)\s*/).filter(Boolean);
  return `<ol class="route" aria-label="Route">${stops.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol>`;
}

export function crumbs(list) {
  return `<nav class="crumbs" aria-label="Breadcrumb" data-hero-fade>${list.map(([h, l], i) => (i ? '<span aria-hidden="true">/</span>' : '') + (h ? `<a href="${h}">${l}</a>` : `<span aria-current="page">${l}</span>`)).join('')}</nav>`;
}
export const breadcrumbLd = list => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: list.map(([h, l], i) => ({ '@type': 'ListItem', position: i + 1, name: strip(l), item: `${SITE}/${h || ''}`.replace(/\/index\.html$/, '/') })),
});

export function faqList(items) {
  return `<div class="faq">${items.map(it => `<details><summary>${it.q}<i aria-hidden="true"></i></summary><div class="faq__a">${/^\s*<(p|ul|ol|div)/.test(it.a) ? it.a : `<p>${it.a}</p>`}</div></details>`).join('')}</div>`;
}

export function band({ eyebrow = '', title, text = '', href = 'tours.html', label = 'Browse group tours', tone = 't-dune', second }) {
  return `<section class="section--tight" data-stage="Travel"><div class="wrap"><div class="band ${tone}" data-r="mask" data-p>
  <span class="zellige">${I.zellige}</span>
  ${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}
  <h2 class="h1" data-r="words" style="max-width:14ch">${title}</h2>
  ${text ? `<p class="lede" style="margin-bottom:30px">${text}</p>` : ''}
  <div class="btn-row">${btn(href, label, tone === 't-dune' ? 'btn--light' : 'btn--dune')}${second ? btn(second[0], second[1], 'btn--ghost') : ''}</div>
</div></div></section>`;
}

export function tcard(t, { eager = false } = {}) {
  const route = t.route.map(s => `<span>${esc(s)}</span>`).join('<i></i>');
  return `<a class="tcard" href="${t.file}" data-cursor="View trip" data-tags="${attr(t.tags.join(' '))}">
  <div class="tcard__media">${img(t.image, '', { eager })}${t.badge ? `<span class="tag tcard__badge">${esc(t.badge)}</span>` : ''}<span class="tcard__days">${t.days}<small>days</small></span><div class="tcard__route">${route}</div></div>
  <div class="tcard__body"><h3 class="tcard__title">${t.title}</h3><p class="tcard__blurb">${t.blurb}</p>
  <div class="tcard__foot"><div class="tcard__price"><small>From</small><b>€${t.price}</b><span>pp</span></div><span class="tcard__go">${I.arrow}</span></div></div>
</a>`;
}

export function ecard(c, { feature = false, tag = '', meta = [], price = '' } = {}) {
  return `<a class="ecard${feature ? ' ecard--feature' : ''}" href="${c.href}" data-cursor="Read"${c.tags ? ` data-tags="${attr(c.tags)}"` : ''} data-r="up">
  <div class="ecard__media">${img(c.image, '')}${tag ? `<span class="tag">${esc(tag)}</span>` : ''}</div>
  <div style="display:grid;gap:10px">${meta.length ? `<div class="ecard__meta">${meta.map(m => `<span>${esc(m)}</span>`).join('')}</div>` : ''}<h3>${c.title}</h3>${c.blurb ? `<p>${c.blurb}</p>` : ''}${price ? `<span class="ecard__price">${esc(price)}</span>` : ''}</div>
</a>`;
}
