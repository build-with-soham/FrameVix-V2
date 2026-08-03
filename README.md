# 🎬 FrameVix

A cinematic streaming platform for original short films, documentaries and trailers — built with plain **HTML5, CSS3 and vanilla JavaScript (ES6)**. No React, no backend, no build tools.

Videos never leave the site — everything plays through an embedded YouTube player right on the page.

---

## Folder Structure

```
FrameVix/
│
├── index.html          Home — hero banner + Originals / Trending / Latest rows
├── browse.html          Full catalog — category filters + live search
├── mylist.html           Everything you've bookmarked (localStorage watchlist)
├── movie.html            Movie detail page — poster, player, related titles
├── about.html            The story behind FrameVix, animated stats, timeline
├── contact.html          Contact form + social links
│
├── css/
│   ├── style.css          Variables, layout, every component's base look
│   ├── animations.css     All keyframes & scroll-reveal / hover animation classes
│   └── responsive.css     Breakpoint overrides
│
├── js/
│   ├── movies.js          Data layer: loads movies.json, search/filter helpers,
│   │                      DOM builders (card/row/grid), localStorage watchlist
│   └── app.js              Shared UI (navbar, loader, search, back-to-top,
│                           scroll reveal) + one init function per page
│
├── assets/
│   ├── logo/
│   │   ├── logo-icon.png    Cropped "F" filmstrip mark — used in the navbar/footer
│   │   └── logo-full.png    Full logo with wordmark, kept for future use (favicon, etc.)
│   ├── images/
│   │   └── bg-cinematic.jpg Moodboard image used as the site-wide background layer
│   ├── icons/
│   └── posters/
│
├── data/
│   └── movies.json          Your video catalog — edit this to add/remove titles
│
└── README.md
```

## What Changed in This Update

- **Real logo.** The navbar and footer now use your actual `logo-icon.png` (cropped
  from the full logo) next to the FrameVix wordmark, instead of a plain red "F" box.
- **Display font.** Big headings — the hero title (e.g. "The Storyverse"), page
  titles, and the loader — now use **Orbitron**, a geometric font that matches the
  wide, technical letterforms in your logo. Body text and card titles stay on
  Poppins/Inter for readability.
- **Cinematic background.** Your moodboard image (poster wall + director's chair)
  now sits fixed behind every page at low opacity (`.cinematic-bg` in `style.css`),
  so that reddish glow is present site-wide, not just on one page.
- **"My List" (Watch Later).** Every card now has a bookmark button in its top-right
  corner — click it to save a title without leaving the row you're browsing. Saved
  titles live in `localStorage` and show up on the new **My List** page (also linked
  in the navbar). The movie detail page's button was renamed to "Watch Later" to
  match, and both stay in sync live via a small custom event (`watchlist-change`).

## How to Run It

Because the site fetches `data/movies.json` with `fetch()`, opening `index.html` by
double-clicking it will hit a browser CORS restriction on local files. Two easy fixes:

1. **VS Code Live Server** (you already use VS Code) — right-click `index.html` →
   "Open with Live Server".
2. **Any static server** — e.g. `npx serve` or Python's `python -m http.server` from
   the project folder, then visit `http://localhost:PORT`.

If you *do* open it directly from disk, the site still works — `movies.js` falls back
to an inline copy of the data automatically.

## Adding a New Video

Open `data/movies.json` and add an object like this:

```json
{
  "id": "your-unique-slug",
  "title": "Your Film Title",
  "youtubeId": "the-11-character-youtube-id",
  "genre": "Horror",
  "category": "Short Films",
  "year": 2026,
  "duration": "5:30",
  "description": "One or two sentences describing the film.",
  "trending": false,
  "original": true,
  "latest": true
}
```

- `category` must be exactly `"Short Films"`, `"Documentaries"`, or `"Trailers"` to
  match the filter chips on the Browse page.
- `trending` / `original` / `latest` are just booleans that decide which home-page
  rows a video shows up in — set as many as you like.
- The thumbnail is pulled automatically from YouTube's CDN
  (`img.youtube.com/vi/{youtubeId}/...`), so you don't need to upload a poster image.

## How the Code Is Organized

- **`movies.js` never touches the DOM's layout** — it only knows about data and how
  to build reusable pieces (a card, a row, a grid). Read this file first; it's the
  "backend" of the site even though there's no server.
- **`app.js` decides what each page shows.** It checks `document.body.dataset.page`
  (set on the `<body>` tag of every HTML file) and calls the matching `init...Page()`
  function. This is the same pattern real apps use for client-side routing, just
  simplified since we have separate HTML files instead of one single-page app.
- **Animations live entirely in `animations.css`**, separate from layout, so you can
  tune timing/easing without touching anything structural.
- **The watchlist** is a tiny `localStorage` wrapper (`Watchlist` in `movies.js`) —
  a good next thing to read if you want to see how simple client-side "saving" works
  without a database.

## Possible Next Steps (v2 ideas)

- Swap the inline SVG icons for a proper icon set.
- Add a real backend (Node/Express + a database) so the contact form and watchlist
  persist across devices instead of just localStorage.
- Rebuild in React once you're comfortable with the vanilla version — the data shape
  in `movies.json` and the component boundaries in `movies.js` map almost directly
  onto React components and props.

---

Designed & built by Soham. 🎥
