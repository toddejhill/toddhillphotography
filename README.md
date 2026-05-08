# Todd Hill Photography

Static portfolio site with a small Node-based image build step.

## Setup (once)

```
cd C:\CuteMonsterSuite\Photography
npm install
```

## Workflow

Drop full-resolution photos into `images/<category>/<location>/` (any size, JPG/PNG/WebP), then:

```
npm run dev
```

This generates resized variants (640 / 1280 / 1920 px wide JPEGs at q82) into `images/_generated/` and serves the site at http://localhost:8080. The build is incremental — it skips photos whose generated variants are already up to date.

If you only want to build, or only want to serve:

```
npm run build
npm run serve
```

## Adding a new category

1. Drop photos into a new folder, e.g. `images/portraits/`.
2. Open `data/galleries.js` and add an entry:

```js
portraits: {
  name: "Portraits",
  featured: false,              // true = also include on homepage
  images: [
    { src: "images/portraits/01.jpg" },                // caption auto-derived from filename
    { src: "images/portraits/02.jpg", caption: "Backlit" },  // or override explicitly
  ],
},
```

That's it — the portfolio page picks it up automatically.

## Captions

If `caption` is omitted, the lightbox auto-derives one from the filename: it takes the first three `_`-separated tokens. So `Milos_Summer_2024_001.JPG` → "Milos Summer 2024". Override per-image with an explicit `caption: "..."`.

## Image sizing

The gallery and lightbox load resized variants from `images/_generated/`, picked by the browser via `<img srcset>` based on viewport width. Original full-resolution files stay in `images/` as the source of truth.

Sizes generated: 640 (mobile thumbs), 1280 (desktop thumbs / small lightbox), 1920 (full lightbox).

## Analytics

Tracking is wired to GoatCounter (`toddejhill.goatcounter.com`):
- Every page load is counted automatically by the script tag in each HTML page's `<head>`.
- Each lightbox open fires a custom event with the photo's path so per-photo views are tracked.
- The About page reads `data/stats.json` and renders totals + most-viewed photos.

To refresh `data/stats.json` from the GoatCounter API, set `GOATCOUNTER_TOKEN` (get one at https://toddejhill.goatcounter.com/user/api) and run a build:

```
# bash / WSL / Git Bash
GOATCOUNTER_TOKEN=xxx npm run build

# PowerShell
$env:GOATCOUNTER_TOKEN="xxx"; npm run build

# cmd
set GOATCOUNTER_TOKEN=xxx&& npm run build
```

If the token isn't set, the build skips the stats fetch and leaves `data/stats.json` alone (so local builds without a token still work).

For Cloudflare Pages, add `GOATCOUNTER_TOKEN` as an environment variable in the Pages project settings, and stats refresh on every deploy.

## Deploying

Run `npm run build` first so `images/_generated/` is up to date, then drag the folder into Netlify, or push to a GitHub repo and enable GitHub Pages, or hook it to Cloudflare Pages. No server required at runtime.

The site lives at https://toddhillphotography.com.

## Contact form

The contact form uses a `mailto:` action as a placeholder. Replace `your@email.com` in `contact.html` with your real address, or swap in a service like Formspree/Netlify Forms for a proper submission flow.
