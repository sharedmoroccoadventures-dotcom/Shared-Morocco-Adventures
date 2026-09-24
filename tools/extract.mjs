// One-time content extraction: reads the legacy hand-authored pages and writes
// structured data to content/*.json. After the redesign, content/ is the source
// of truth and tools/build.mjs generates every page from it.
//   node tools/extract.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, all, one, kids, inner, outer, text, bgUrl, hasClass, decode } from './lib/dom.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'content');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const warn = [];

function meta(doc) {
  const m = n => one(doc, x => x.tag === 'meta' && (x.attrs.name === n || x.attrs.property === n))?.attrs.content || '';
  return {
    title: text(one(doc, 'title')),
    description: decode(m('description')),
    canonical: one(doc, x => x.tag === 'link' && x.attrs.rel === 'canonical')?.attrs.href || '',
    ogTitle: decode(m('og:title')), ogDescription: decode(m('og:description')), ogImage: m('og:image'),
    jsonld: all(doc, x => x.tag === 'script' && x.attrs.type === 'application/ld+json').map(s => inner(s)),
  };
}

function main(doc) {
  const body = one(doc, 'body');
  return kids(body, x => x.tag === 'section' || x.tag === 'p' || x.tag === 'main' || x.tag === 'div');
}

function hero(sec) {
  return {
    eyebrow: text(one(sec, '.eyebrow')),
    h1: inner(one(sec, 'h1')),
    lead: inner(one(sec, '.lead')),
    image: bgUrl(sec),
  };
}

const head = sec => ({ eyebrow: text(one(sec, '.eyebrow')), h2: inner(one(sec, 'h2')) });

function overview(sec) {
  const split = one(sec, '.split');
  const col = kids(split, 'div').find(d => !hasClass(d, 'split-visual'));
  return {
    ...head(col),
    paras: kids(col, 'p').filter(p => !hasClass(p, 'card-meta')).map(inner),
    chips: all(col, '.card-meta').flatMap(cm => kids(cm, 'span').map(text)),
    image: bgUrl(one(sec, '.split-visual')),
  };
}

function itinerary(sec) {
  return all(sec, '.itinerary-day').map(d => {
    const num = one(d, '.itinerary-day-num');
    const label = text(one(num, 'span'));
    const body = kids(d, 'div')[1];
    const ps = kids(body, 'p');
    let lead = '';
    const paras = ps.map((p, i) => {
      let h = inner(p);
      if (i === 0) { const m = h.match(/^<strong>([\s\S]*?)<\/strong>\s*/); if (m) { lead = decode(m[1].replace(/<[^>]+>/g, '')).replace(/\.$/, ''); h = h.slice(m[0].length); } }
      return h;
    });
    return { num: text(num).replace(label, '').trim(), label, title: inner(one(body, 'h3')), lead, paras, extra: kids(body, x => x.tag !== 'p' && x.tag !== 'h3' && x.tag[0] !== '#').map(outer) };
  });
}

function stay(sec) {
  const c = one(sec, '.container');
  const grid = one(c, '.grid-3');
  const ps = kids(c, 'p');
  return {
    ...head(sec),
    intro: ps.filter(p => p.start < grid.start).map(inner),
    cards: kids(grid, '.mini-card').map(k => ({ icon: text(one(k, '.icon-badge')), title: inner(one(k, 'h3')), html: kids(k, 'p').map(inner) })),
    notes: ps.filter(p => p.start > grid.start).map(inner),
  };
}

const list = (sec, cls) => all(sec, x => x.tag === 'div' && hasClass(x, 'includes-panel') && hasClass(x, cls)).flatMap(p => all(p, 'li').map(inner));

function price(sec) {
  const box = one(sec, '.price-box');
  const btn = one(box, 'a');
  const other = kids(one(sec, '.split'), 'div').find(d => !hasClass(d, 'price-box'));
  return {
    price: { from: text(one(box, '.eyebrow')), amount: text(one(box, '.amount')), sub: inner(one(box, '.amount-sub')), ctaHref: btn?.attrs.href || 'contact.html', ctaText: text(btn) },
    good: other ? { ...head(other), paras: kids(other, 'p').map(inner) } : null,
  };
}

function faqItems(root) {
  return all(root, '.faq-item').map(d => { const s = one(d, 'summary'); return { q: inner(s), a: d.src.slice(s.end, d.closeStart).trim() }; });
}

function faqSection(sec) {
  const cats = all(sec, '.faq-category');
  const c = one(sec, '.container');
  const extra = kids(c, x => x.tag[0] !== '#' && !hasClass(x, 'faq-category')).map(outer);
  const cat = cats[0] || sec;
  return { ...head(cat), items: faqItems(cat), extra };
}

function card(k) {
  const media = one(k, '.card-media');
  const body = one(k, '.card-body');
  const btn = kids(k, 'a')[0] || one(k, 'a.btn');
  const priceEl = one(k, '.card-price');
  const meta = one(k, '.card-meta');
  return {
    badge: text(one(k, '.card-badge')),
    title: inner(one(k, 'h3')),
    meta: meta ? kids(meta, 'span').map(text) : [],
    blurb: kids(body, 'p').filter(p => !hasClass(p, 'card-meta')).map(inner).join(' '),
    price: priceEl ? text(one(priceEl, 'strong')) : '',
    priceSub: priceEl ? text(one(priceEl, 'span')) : '',
    href: btn?.attrs.href || '', cta: text(btn),
    image: bgUrl(media) || (one(media, 'img')?.attrs.src || ''),
    tone: media ? [...(media.attrs.class || '').split(' ')].filter(c => c !== 'card-media').join(' ') : '',
  };
}
const cards = sec => all(sec, '.card').map(card);

function classify(sec) {
  const s = outer(sec);
  if (/class="itinerary-day"/.test(s)) return 'itinerary';
  if (/class="includes-panel/.test(s)) return 'includes';
  if (/class="price-box"/.test(s)) return 'price';
  if (/class="faq-item"/.test(s)) return 'faq';
  if (/class="mini-card/.test(s) && /grid-3/.test(s)) return 'stay';
  if (/split-visual/.test(s)) return 'overview';
  if (/class="dest-chip/.test(s)) return 'chips';
  if (/cta-band/.test(s)) return 'cta';
  if (/class="card"/.test(s)) return 'cards';
  return 'other';
}

function cta(sec) { const b = one(sec, '.cta-band'); const a = one(b, 'a'); return { h2: inner(one(b, 'h2')), p: inner(one(b, 'p')), href: a?.attrs.href, label: text(a) }; }

// ---------- detail pages (tours + day trips) ----------
function detail(file) {
  const doc = parse(read(file));
  const secs = main(doc).filter(n => n.tag === 'section');
  const out = { file, slug: file.replace(/\.html$/, ''), meta: meta(doc), hero: hero(secs[0]) };
  const back = main(doc).find(n => n.tag === 'p' && /←/.test(text(n)));
  if (back) out.back = { href: one(back, 'a').attrs.href, label: text(one(back, 'a')).replace('←', '').trim() };
  for (const sec of secs.slice(1)) {
    const k = classify(sec);
    if (k === 'itinerary') out.itinerary = { ...head(sec), days: itinerary(sec) };
    else if (k === 'includes') { out.includes = list(sec, 'included'); out.excludes = list(sec, 'excluded'); }
    else if (k === 'price') Object.assign(out, price(sec));
    else if (k === 'faq') out.faq = faqSection(sec);
    else if (k === 'stay') out.stay = stay(sec);
    else if (k === 'overview') out.overview = overview(sec);
    else if (k === 'chips') out.highlights = { ...head(sec), chips: all(sec, '.dest-chip').map(text) };
    else { warn.push(`${file}: unhandled section ${k}`); (out.extra ||= []).push(outer(sec)); }
  }
  return out;
}

// ---------- listing pages ----------
function listing(file) {
  const doc = parse(read(file));
  const secs = main(doc).filter(n => n.tag === 'section');
  const out = { file, meta: meta(doc), hero: hero(secs[0]), sections: [] };
  for (const sec of secs.slice(1)) {
    const k = classify(sec);
    const h = head(sec);
    const leadP = one(sec, '.section-head')?.children.find(c => c.tag === 'p');
    if (k === 'cta') out.cta = cta(sec);
    else out.sections.push({ kind: k, id: sec.attrs.id || '', ...h, lead: leadP ? inner(leadP) : '', cards: cards(sec), steps: all(sec, '.step').map(k => ({ title: text(one(k, 'h3')), text: inner(one(k, 'p')) })), faq: faqItems(sec), chips: all(sec, '.dest-chip').map(c => ({ text: text(c), href: c.attrs.href || '' })) });
  }
  return out;
}

// ---------- day-trip hub pages ----------
function hub(file) {
  const doc = parse(read(file));
  const secs = main(doc).filter(n => n.tag === 'section');
  const out = { file, slug: file.replace(/\.html$/, ''), meta: meta(doc), hero: hero(secs[0]), trips: [], tail: [] };
  for (const sec of secs.slice(1)) {
    if (sec.attrs.id && /split-visual/.test(outer(sec))) {
      const col = kids(one(sec, '.split'), 'div').find(d => !hasClass(d, 'split-visual'));
      const ps = kids(col, 'p');
      const leadP = ps.find(p => hasClass(p, 'lead'));
      const notes = ps.filter(p => !hasClass(p, 'lead') && /<strong>(Includes|Not included)/i.test(inner(p)));
      const body = ps.filter(p => p !== leadP && !notes.includes(p));
      const pr = one(col, '.card-price');
      const links = kids(col, 'a').map(a => ({ href: a.attrs.href, label: text(a) }));
      let lead = '';
      const paras = body.map((p, i) => { let h = inner(p); if (i === 0) { const m = h.match(/^<strong>([\s\S]*?)<\/strong>\s*/); if (m) { lead = decode(m[1]).replace(/\.$/, ''); h = h.slice(m[0].length); } } return h; });
      out.trips.push({ id: sec.attrs.id, ...head(col), route: leadP ? inner(leadP) : '', lead, paras, chips: all(col, '.dest-chip').map(text), notes: notes.map(inner), price: pr ? text(one(pr, 'strong')) : '', priceSub: pr ? text(one(pr, 'span')) : '', links, image: bgUrl(one(sec, '.split-visual')) });
    } else {
      const k = classify(sec);
      if (k === 'chips' && !out.jump) { out.jump = all(sec, '.dest-chip').map(c => ({ text: text(c), href: c.attrs.href })); continue; }
      if (k === 'cta') out.tail.push({ kind: 'cta', ...cta(sec) });
      else if (k === 'faq') out.tail.push({ kind: 'faq', ...faqSection(sec) });
      else if (k === 'cards') out.tail.push({ kind: 'cards', ...head(sec), cards: cards(sec) });
      else { warn.push(`${file}: hub tail ${k}`); out.tail.push({ kind: 'html', html: inner(one(sec, '.container') || sec) }); }
    }
  }
  return out;
}

// ---------- blog ----------
function post(file) {
  const doc = parse(read(file));
  const secs = main(doc).filter(n => n.tag === 'section');
  const out = { file, slug: file.replace(/\.html$/, ''), meta: meta(doc), hero: hero(secs[0]) };
  for (const sec of secs.slice(1)) {
    const k = classify(sec);
    if (k === 'cta') out.cta = cta(sec);
    else if (k === 'cards' && !out.body) { warn.push(`${file}: cards before body`); }
    else if (k === 'cards') out.related = cards(sec);
    else if (!out.body) {
      const c = one(sec, '.container');
      const wrap = kids(c, 'div').length === 1 && kids(c, x => x.tag[0] !== '#').length === 1 ? kids(c, 'div')[0] : c;
      out.body = inner(wrap);
    } else { warn.push(`${file}: extra ${k}`); out.body += '\n' + inner(one(sec, '.container')); }
  }
  const words = (out.body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  out.minutes = Math.max(2, Math.round(words / 220));
  return out;
}

// ---------- run ----------
if (fs.existsSync(path.join(OUT, 'pages', 'tours.json')) && !process.argv.includes('--force')) {
  console.log('content/ already exists. The pages are now generated FROM content/, so re-extracting would read the new pages. Edit content/*.json and run tools/build.mjs instead (use --force only on legacy HTML).');
  process.exit(0);
}
fs.mkdirSync(path.join(OUT, 'tours'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'daytrips'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'blog'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true });
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const save = (p, d) => fs.writeFileSync(path.join(OUT, p), JSON.stringify(d, null, 2) + '\n');

const tourList = listing('tours.html');
save('pages/tours.json', tourList);
for (const f of files.filter(f => f.startsWith('tour-'))) save(`tours/${f.replace('.html', '.json')}`, detail(f));
for (const f of files.filter(f => f.startsWith('daytrip-'))) save(`daytrips/${f.replace('.html', '.json')}`, detail(f));
for (const f of ['day-trips-marrakech.html', 'day-trips-fes.html']) save(`pages/${f.replace('.html', '.json')}`, hub(f));
for (const f of files.filter(f => f.startsWith('blog-'))) save(`blog/${f.replace('.html', '.json')}`, post(f));
for (const f of ['index.html', 'day-trips.html', 'blog.html', 'airport-transfers.html', 'about.html', 'contact.html', 'photo-credits.html', 'thank-you.html']) save(`pages/${f.replace('.html', '.json')}`, listing(f));

// FAQ page keeps categories
{
  const doc = parse(read('faqs.html'));
  const cats = all(doc, '.faq-category').map(c => ({ ...head(c), items: faqItems(c) }));
  const ctaSec = all(doc, 'section').find(s => /cta-band/.test(outer(s)));
  save('pages/faqs.json', { file: 'faqs.html', meta: meta(doc), hero: hero(all(doc, 'section')[0]), categories: cats, cta: ctaSec ? cta(ctaSec) : null });
}
// Home page extras (testimonials, steps, stats, trust strip)
{
  const doc = parse(read('index.html'));
  const t = all(doc, '.testimonial').map(k => ({ quote: text(one(k, 'p')), name: text(one(k, '.testimonial-name')), trip: text(one(k, '.testimonial-trip')) }));
  const steps = all(doc, '.step').map(k => ({ title: text(one(k, 'h3')), text: text(one(k, 'p')) || text(k).replace(text(one(k, 'h3')), '').trim() }));
  save('pages/home-extras.json', { testimonials: t, steps });
}
// Contact form trip options stay in sync with the site
{
  const doc = parse(read('contact.html'));
  save('pages/contact-options.json', { trips: all(one(doc, x => x.tag === 'select' && x.attrs.name === 'trip'), 'option').map(o => ({ value: o.attrs.value, label: text(o) })) });
}
// Photo credits list (verbatim)
{
  const doc = parse(read('photo-credits.html'));
  save('pages/photo-credits-list.json', { items: all(doc, 'li').filter(li => /commons|unsplash|pexels|CC|public domain/i.test(outer(li))).map(inner) });
}

console.log(`Extracted ${files.length} pages into content/`);
if (warn.length) console.log('Notes:\n  ' + warn.join('\n  '));
