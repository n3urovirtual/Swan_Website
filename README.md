# SWAN — project website

Static website for **SWAN** (*Spin for Well-being: Active lifestyles through
therapeutic table tennis for individuals with Neurodegenerative diseases*), an
Erasmus+ Sport Cooperation Partnership (Project ID 101185590, 1 December 2024 – 30 September 2027).

Plain HTML, CSS and a small amount of vanilla JavaScript. No build step, no
framework, no dependencies to install. Open `index.html` in a browser, or serve
the folder with any static host.

---

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `project.html` | The Project |
| `resources.html` | Resources |
| `news.html` | News |
| `partners.html` | Partners |

Each page is self-contained: header, content, footer. The header and footer are
duplicated across the five files, so **a change to the navigation or footer has
to be made in all five**.

## Structure

```
index.html · project.html · resources.html · news.html · partners.html
assets/
  css/style.css     all styling, organised in numbered sections
  js/main.js        nav, scroll reveal, stat counters, news accordion
  js/motion.js      progress bar, parallax, map draw-in, hero depth field
  js/vendor/        GSAP + ScrollTrigger, Three.js (self-hosted)
  fonts/            self-hosted webfonts (+ their OFL licences)
  img/              SWAN logo + favicon (placeholders), EU funding emblem
```

## Before publishing — things to fill in

Every one of these is marked with a `TODO` comment in the HTML, so
`grep -rn "TODO" *.html` will list them.

- **Contact address** — footer "Contact the consortium" link and the Partners CTA.
- **Deliverable links** — `resources.html`, the three "View report" buttons for
  D2.1.1, D2.1.2 and D2.1.3.
- **News entries** — the five entries in `news.html` are **sample content**
  written from the project's own published material. Replace the dates, titles
  and text with your real updates before the site goes live.
- **Partner websites** — the "Visit website" link on each of the seven partner
  cards in `partners.html`.
- **Partner logos** — `assets/img/partners/` holds a **PNG placeholder** for
  each partner (`ittff.png`, `ul.png`, `ktg.png`, `paska.png`, `fcab.png`,
  `fftt.png`, `al.png`). Overwrite any of them with the real logo, keeping the
  filename, and both the strip and the card update. No HTML edit needed. Use a
  transparent PNG and trim the empty margin around the artwork — the card sizes
  the file by height, so built-in padding shrinks the visible logo.
- **The SWAN logo** — done: `assets/img/swan-logo.png` is the official mark
  (787×289, transparent, trimmed to the artwork).
  `assets/img/swan-mark.svg` is the square favicon and is still a placeholder;
  replace it the same way.
- **The EU emblem** — done: `assets/img/eu-funded.png` is the official artwork.

## Adding a news entry

Each entry in `news.html` is a `<details>` element. Copy a whole
`<details class="news-item"> … </details>` block, put it at the top of the list,
and edit five things:

1. `news-item__type` — Event, Milestone, Publication, Partner meeting…
2. `news-item__date` — free text, e.g. `2–4 October 2026`
3. `news-item__title`
4. `news-item__preview` — the two or three lines shown before expanding
5. the contents of `news-item__detail-inner` — the full story

The entry works without JavaScript; the script only adds the open/close
animation.

## Replacing a logo

Every logo on the site is a real file with a fixed name. **To swap one, upload
your file over the existing one and keep the filename** — no code change:

| File | Where it shows |
| --- | --- |
| `assets/img/swan-logo.png` | Header and footer, all pages |
| `assets/img/swan-mark.svg` | Browser tab icon |
| `assets/img/eu-funded.png` | Footer notice + The Project funding block |
| `assets/img/partners/<abbr>.png` | Partner strip and card |

On GitHub: open the file, click the pencil-and-bin **Delete** icon, commit; then
**Add file → Upload files** and upload yours with the same name. Or upload
straight into the folder — GitHub overwrites a file of the same name.

**If your file has a different extension** (a `.jpg`, or an `.svg` where the
site now expects a `.png`), the `src` in the HTML has to change too — the
extension is part of the path, so a different one means the old `src` no longer
points at anything. For the SWAN logo that is two lines per page (header and
footer), so a find-and-replace of `assets/img/swan-logo.png` →
`assets/img/swan-logo.<ext>` across the five HTML files does it. Partner logos
are two lines each, both in `partners.html`.

**Transparent PNGs: trim the margin.** Logos are sized by *height*, so any
transparent padding baked into the file counts as part of that height and the
visible mark comes out small. Crop the file to the artwork before uploading.

Sizing takes care of itself: logos are sized by height with `width: auto`, so
any aspect ratio works. Update the `width`/`height` attributes on the `<img>`
tags to your file's real pixel size so the browser reserves the right space
while loading.

## Adding photos

Photo slots are marked in the HTML with a comment showing the exact `<img>` tag
to paste in, for example in `index.html`:

```html
<!-- Replace the glyph below with: <img src="assets/img/photos/festival.jpg" alt="..."> -->
```

Put the file in `assets/img/photos/`, replace the `media__glyph` block with the
`<img>` tag, and write a real `alt` description. Until then the pages show
on-brand illustrated panels, so nothing looks unfinished.

## Design notes

**Colours** carry over from the previous site — deep blue `#12409B`, sky
`#C5DCEA` / `#E4EFF7`, peach `#FCEAE4` — plus the logo's cyan `#22ACE3` and a
single coral accent `#D2694A` used only for the ball motif, the coordinator pin
and the current-page marker. All defined as custom properties at the top of
`style.css`.

**Typefaces** are Bricolage Grotesque (headings), Instrument Sans (body) and
DM Mono (dates, deliverable codes, labels).

**The consortium map** on the Partners page is real geometry, not an
illustration: country outlines come from Natural Earth 1:50m (public domain),
projected equirectangularly at a 48°N standard parallel. Hovering or focusing a
pin lights up that country; selecting one jumps to its card. To change a pin,
edit its `cx`/`cy` — or regenerate the whole block, since it was produced from
the source data rather than drawn by hand.

**The recurring arc** — a dotted curve with a ball on it — is the same shape read
three ways: a table tennis rally, a neural connection forming, and the curve of a
swan's neck. It runs animated in the home page hero and appears quietly
elsewhere as eyebrow ticks and page decoration.

### Motion

Two systems, deliberately kept apart:

- **CSS + IntersectionObserver** (`main.js`) does every scroll reveal. It is the
  single source of truth for what fades in, and it works with no JavaScript
  library present.
- **GSAP + ScrollTrigger** (`motion.js`) does only what CSS cannot: the reading
  progress bar, the parallax on page-hero ornaments, and the consortium map
  drawing its own connector lines.

The home page hero also carries a **Three.js** field of drifting, linked nodes
behind the rally graphic — the network the project is building, behind the sport
that builds it. It is masked away from the text column, and it never loads at
all below 900px wide, on `prefers-reduced-motion`, or when the browser reports
data saver. Everything in `motion.js` is optional: if it fails to load, the site
still reveals, reads and works exactly as designed.

GSAP is used under its standard "no charge" licence; Three.js is MIT (licence in
`assets/js/vendor/`). Both are self-hosted for the same reason as the fonts.

### Fonts are self-hosted on purpose

The fonts are served from `assets/fonts/` rather than from Google Fonts. Loading
them from Google would send every visitor's IP address to a third country
without consent, which German and Austrian courts have found to breach the GDPR.
For an EU-funded project website that is a risk worth avoiding. All three
families are licensed under the SIL Open Font License; the licence files are in
`assets/fonts/`.

## Accessibility

Built to keep: skip link, visible keyboard focus, landmark elements, `alt` text
on meaningful images, `aria-current` on the active nav item, colour contrast at
WCAG AA, and full support for `prefers-reduced-motion` (which stops the rally
animation, the scroll reveals, and skips GSAP and Three.js entirely). Given that the site's own audience includes
people living with neurodegenerative diseases, please keep body text at its
current size and spacing when editing.

## Deploying

Any static host works. For **GitHub Pages**: Settings → Pages → deploy from the
branch root. No build command.

## Funding notice

The EU emblem and the funding disclaimer in the footer are contractual
obligations under the grant agreement — please keep them on every page. The
emblem in `assets/img/eu-funded.png` is the official artwork; if you ever need
to replace it, download it from the European Commission's
[co-funding logo page](https://commission.europa.eu/funding-tenders/managing-your-project/communicating-and-raising-eu-visibility_en)
and replace that file.
