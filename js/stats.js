// Renders the "By the Numbers" section on the About page.
// Totals come from data/stats.json (manually edited or generated at build time).
// Catalog counts come live from data/galleries.js.

(function () {
  const statsRoot = document.getElementById("stats");
  if (!statsRoot || typeof GALLERIES === "undefined") return;

  // Live counts from galleries.js
  const allItems = Object.values(GALLERIES).flatMap(getAllItems);
  const totalPhotos = allItems.length;
  const totalLocations = Object.values(GALLERIES).reduce((sum, cat) => {
    return sum + (cat.locations ? Object.keys(cat.locations).length : 0);
  }, 0);

  // Plug live values in immediately
  setStat("totalPhotos", totalPhotos);
  setStat("totalLocations", totalLocations);

  // Pull analytics-driven values from stats.json
  fetch("data/stats.json", { cache: "no-store" })
    .then(r => r.ok ? r.json() : null)
    .then(stats => {
      if (!stats) return;
      setStat("totalVisitors", formatNumber(stats.totalVisitors));
      setStat("totalPhotoViews", formatNumber(stats.totalPhotoViews));
      renderTopPhotos(stats.topPhotos || [], allItems);
    })
    .catch(() => {});

  function setStat(key, value) {
    const el = statsRoot.querySelector(`[data-stat="${key}"]`);
    if (el) el.textContent = value;
  }

  function formatNumber(n) {
    if (typeof n !== "number") return "—";
    return n.toLocaleString();
  }

  function renderTopPhotos(top, all) {
    const container = document.getElementById("top-photos");
    if (!container) return;
    const byPath = new Map(all.map(it => [it.src, it]));
    const rows = top
      .map(t => {
        const item = byPath.get(t.src);
        if (!item) return null;
        const caption = captionFor(item);
        const thumb = variantSrc(item.src, 640);
        return `<a class="top-photo" href="portfolio.html">
          <img src="${thumb}" alt="${caption}" loading="lazy" />
          <div class="top-photo-meta">
            <span class="top-photo-caption">${caption}</span>
            <span class="top-photo-views">${formatNumber(t.views)} views</span>
          </div>
        </a>`;
      })
      .filter(Boolean);
    container.innerHTML = rows.join("");
  }

  // Mirrors the helpers in main.js without re-importing them.
  function captionFor(item) {
    if (item.caption) return item.caption;
    const file = (item.src || "").split("/").pop().split("?")[0];
    const base = file.replace(/\.[^.]+$/, "");
    return base.split("_").slice(0, 3).join(" ").trim();
  }

  function variantSrc(src, width) {
    if (!src || !src.startsWith("images/")) return src;
    const rel = src.slice("images/".length).replace(/\.[^.]+$/, ".jpg");
    return `images/_generated/${width}/${rel}`;
  }
})();
