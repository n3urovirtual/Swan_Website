# SWAN — project website

Static website for **SWAN** (*Spin for Well-being: Active lifestyles through
therapeutic table tennis for individuals with Neurodegenerative diseases*), an
Erasmus+ Sport Cooperation Partnership (Project ID 101155590, 2024–2027).

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
  fonts/            self-hosted webfonts (+ their OFL licences)
  img/              swan mark, EU funding emblem
```

## Before publishing — things to fill in

Every one of these is marked with a `TODO` comment in the HTML, so
`grep -rn "TODO" *.html` will list them.

- **Social links** — LinkedIn and Facebook URLs (header and footer, all 5 pages).
- **Contact address** — footer "Contact the consortium" link and the Partners CTA.
- **Deliverable links** — `resources.html`, the three "View report" buttons for
  D2.1.1, D2.1.2 and D2.1.3.
- **News entries** — the five entries in `news.html` are **sample content**
  written from the project's own published material. Replace the dates, titles
  and text with your real updates before the site goes live.
- **Partners** — three partners are filled in from information already published
  on the site (University of Ljubljana, ITTF Foundation, KTG R&I); two of those
  need their country confirmed, and four partner slots are placeholders.

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
`#C5DCEA` / `#E4EFF7`, peach `#FCEAE4` — plus a single coral accent `#D2694A`
used only for the ball motif and the current-page marker. All defined as custom
properties at the top of `style.css`.

**Typefaces** are Bricolage Grotesque (headings), Instrument Sans (body) and
DM Mono (dates, deliverable codes, labels).

**The recurring arc** — a dotted curve with a ball on it — is the same shape read
three ways: a table tennis rally, a neural connection forming, and the curve of a
swan's neck. It runs animated in the home page hero and appears quietly
elsewhere as eyebrow ticks and page decoration.

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
animation and the scroll reveals). Given that the site's own audience includes
people living with neurodegenerative diseases, please keep body text at its
current size and spacing when editing.

## Deploying

Any static host works. For **GitHub Pages**: Settings → Pages → deploy from the
branch root. No build command.

## Funding notice

The EU emblem and the funding disclaimer in the footer are contractual
obligations under the grant agreement — please keep them on every page. The
emblem in `assets/img/eu-funded.svg` is a rebuilt SVG; if you need the official
artwork, download it from the European Commission's
[co-funding logo page](https://commission.europa.eu/funding-tenders/managing-your-project/communicating-and-raising-eu-visibility_en)
and replace that file.
