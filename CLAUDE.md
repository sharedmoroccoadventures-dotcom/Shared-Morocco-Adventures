# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static marketing/SEO site for "Shared Morocco Adventures" (budget small-group tours in Morocco), hosted on Netlify. Plain HTML/CSS/JS output, no framework, no runtime dependencies. Since the September 2026 redesign ("Caravan" design system), every page is **generated** from content files by a small Node script.

## Commands

```
node tools/build.mjs          # regenerate every .html page from content/
npx --yes serve -l 5174 .     # preview (same as .claude/launch.json)
```

Node 18+ with no npm packages. Always rebuild and commit the generated `.html` files: Netlify serves the repo root as-is, there is no build step on Netlify.

## How it fits together

- `content/` is the source of truth. Edit JSON here, then run the build.
  - `content/tours/tour-*.json`: tour detail pages (hero, overview, itinerary days, stay, includes/excludes, price, good-to-know, FAQ, original JSON-LD kept verbatim in `meta.jsonld`).
  - `content/daytrips/daytrip-*.json`: day-trip detail pages (same shape, with `highlights`).
  - `content/blog/blog-*.json`: blog posts; `body` is the article HTML.
  - `content/pages/*.json`: listing and core pages. **Order and listing data** (badge, blurb, card image, price) for tours, day trips and blog posts come from `pages/tours.json`, `pages/day-trips.json` and `pages/blog.json` cards, so a new tour/post must be added to both its detail file and the listing card array.
- `tools/build.mjs`: all page templates (home, tours, tour detail, day trips, hubs, blog, about, FAQs, contact, transfers, thank-you, 404, photo credits).
- `tools/lib/ui.mjs`: shared head, header, full-screen menu, footer, buttons, cards, icons. Change the nav or footer here once, rebuild, done.
- `tools/lib/map.mjs`: the SVG Morocco journey map (coastlines only, projected from real lat/lon).
- `tools/extract.mjs`: one-time migration from the legacy hand-written HTML. It refuses to run once `content/` exists. Do not re-run it.
- `css/site.css`: the whole design system. Tokens on `:root` (colors, type scale, easing), then components in numbered sections.
- `js/site.js`: the motion engine. JS only measures scroll and sets `--p` (0 to 1 progress) and state classes; CSS does the movement. Hooks: `data-r="up|left|right|scale|mask|wipe|words"` reveals, `data-stagger` on a parent, `data-p` / `data-p="top|pin|line"` progress, `data-in` for is-in without hiding, `data-count` counters, `data-cursor="Label"`, `data-stage` for the home MOVE→TRAVEL rail, `data-filters="#grid"` + `data-tags` for filtering.

## Conventions

- Motion must respect `prefers-reduced-motion` (handled centrally in site.css section 28 and in site.js via `reduce`). Content must stay readable without JS: reveal classes only hide things when `html.js` is set.
- Cross-page transitions use CSS `@view-transition` (progressive enhancement).
- SEO: every page keeps title, meta description, canonical, OG/Twitter tags and its JSON-LD from `content/…/meta`. The build adds BreadcrumbList everywhere and BlogPosting on posts. New pages must be added to `sitemap.xml`; `thank-you.html` and `404.html` are noindex (thank-you is also disallowed in `robots.txt`).
- Forms: `contact.html` is a Netlify Forms integration (`data-netlify`, hidden `form-name`, `bot-field` honeypot, redirects to `thank-you.html`). Keep field names (`name, email, trip, date, travelers, room, message`) stable. `contact.html?trip=<name>` preselects the trip.
- Images live in `images/`, referenced relatively. Use `img()` from ui.mjs so width/height, lazy loading and alt are always set.
- Copy style: no em dashes in new copy.
