// Year in footer
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Image protection ----------
if (typeof PROTECT_IMAGES !== "undefined" && PROTECT_IMAGES) {
  document.addEventListener("contextmenu", (e) => {
    const t = e.target;
    if (t && (t.tagName === "IMG" || t.tagName === "VIDEO" || t.classList?.contains("photo"))) {
      e.preventDefault();
    }
  });
  document.addEventListener("dragstart", (e) => {
    if (e.target && (e.target.tagName === "IMG" || e.target.tagName === "VIDEO")) {
      e.preventDefault();
    }
  });
  // Block common save shortcuts when an image/video is focused or hovered
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "u")) {
      e.preventDefault();
    }
  });
}

// ---------- Helpers ----------
function isVideo(item) { return item && item.type === "video"; }

// Maps an original src like "images/travel/greece/Foo.JPG" to a build-generated
// variant at images/_generated/<width>/travel/greece/Foo.jpg.
// Falls back to the original src for non-images/ paths or videos.
function variantSrc(src, width) {
  if (!src || !src.startsWith("images/")) return src;
  const rel = src.slice("images/".length).replace(/\.[^.]+$/, ".jpg");
  return `images/_generated/${width}/${rel}`;
}

function srcsetFor(src, widths) {
  return widths.map(w => `${variantSrc(src, w)} ${w}w`).join(", ");
}

const THUMB_WIDTHS = [640, 1280];
const LIGHTBOX_WIDTHS = [1280, 1920];
const THUMB_SIZES = "(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw";

function getAllItems(category) {
  if (category.images) return category.images;
  if (category.locations) {
    return Object.values(category.locations).flatMap(l => l.images);
  }
  return [];
}

function thumbHTML(item, index) {
  const wm = (typeof SHOW_WATERMARK !== "undefined" && SHOW_WATERMARK)
    ? `<span class="watermark">&copy; ${COPYRIGHT_OWNER || ""}</span>`
    : "";
  if (isVideo(item)) {
    const poster = item.poster || "";
    return `<a class="photo video-thumb" data-index="${index}">
      <img src="${poster}" alt="${item.caption || ""}" loading="lazy" />
      <span class="play-icon" aria-hidden="true">&#9654;</span>
      ${wm}
    </a>`;
  }
  const fallback = variantSrc(item.src, 1280);
  const srcset = srcsetFor(item.src, THUMB_WIDTHS);
  return `<a class="photo" data-index="${index}">
    <img src="${fallback}" srcset="${srcset}" sizes="${THUMB_SIZES}" alt="${item.caption || ""}" loading="lazy" />
    ${wm}
  </a>`;
}

function tileHTML(item) {
  // Used on homepage featured grid (uses background-image style)
  const src = isVideo(item) ? (item.poster || "") : variantSrc(item.src, 1280);
  const wm = (typeof SHOW_WATERMARK !== "undefined" && SHOW_WATERMARK)
    ? `<span class="watermark">&copy; ${COPYRIGHT_OWNER || ""}</span>`
    : "";
  const playIcon = isVideo(item) ? `<span class="play-icon" aria-hidden="true">&#9654;</span>` : "";
  return `<div class="photo" style="background-image:url('${src}')" title="${item.caption || ""}">
    ${playIcon}${wm}
  </div>`;
}

// ---------- Home: featured grid ----------
const featuredGrid = document.getElementById("featured-grid");
if (featuredGrid && typeof GALLERIES !== "undefined") {
  const pool = Object.values(GALLERIES)
    .filter(c => c.featured)
    .flatMap(getAllItems);
  const picks = pool.slice(0, HOME_FEATURED_COUNT);
  featuredGrid.innerHTML = picks.map(tileHTML).join("");
}

// ---------- Portfolio: tabs + gallery + lightbox ----------
const tabsEl = document.getElementById("category-tabs");
const galleryEl = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");

if (tabsEl && galleryEl && typeof GALLERIES !== "undefined") {
  const categoryKeys = Object.keys(GALLERIES);
  let currentCategory = categoryKeys.includes(DEFAULT_CATEGORY) ? DEFAULT_CATEGORY : categoryKeys[0];
  let currentLocation = "all";
  let currentIndex = 0;

  function activeItems() {
    const cat = GALLERIES[currentCategory];
    if (cat.locations) {
      if (currentLocation === "all") {
        return Object.values(cat.locations).flatMap(l => l.images);
      }
      return cat.locations[currentLocation]?.images || [];
    }
    return cat.images || [];
  }

  function renderTabs() {
    let html = "";
    if (categoryKeys.length > 1) {
      html += `<div class="tab-row primary">` + categoryKeys
        .map(k => `<button data-cat="${k}" class="${k === currentCategory ? "active" : ""}">${GALLERIES[k].name}</button>`)
        .join("") + `</div>`;
    }
    const cat = GALLERIES[currentCategory];
    if (cat.locations) {
      const locKeys = Object.keys(cat.locations);
      html += `<div class="tab-row secondary">`;
      html += `<button data-loc="all" class="${currentLocation === "all" ? "active" : ""}">All</button>`;
      html += locKeys
        .map(k => `<button data-loc="${k}" class="${k === currentLocation ? "active" : ""}">${cat.locations[k].name}</button>`)
        .join("");
      html += `</div>`;
    }
    tabsEl.innerHTML = html;

    tabsEl.querySelectorAll("button[data-cat]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentCategory = btn.dataset.cat;
        currentLocation = "all";
        renderTabs();
        renderGallery();
      });
    });
    tabsEl.querySelectorAll("button[data-loc]").forEach(btn => {
      btn.addEventListener("click", () => {
        currentLocation = btn.dataset.loc;
        renderTabs();
        renderGallery();
      });
    });
  }

  function renderGallery() {
    const items = activeItems();
    galleryEl.innerHTML = items.map((it, i) => thumbHTML(it, i)).join("");
    galleryEl.querySelectorAll(".photo").forEach(el => {
      el.addEventListener("click", () => openLightbox(parseInt(el.dataset.index, 10)));
    });
  }

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    trackPhotoView(activeItems()[currentIndex]);
  }

  function trackPhotoView(item) {
    if (!item || !item.src) return;
    if (typeof window.goatcounter === "undefined" || typeof window.goatcounter.count !== "function") return;
    window.goatcounter.count({
      path: "/photo/" + item.src.replace(/^images\//, ""),
      title: captionFor(item),
      event: true,
    });
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    // Stop any playing video
    const v = lightbox.querySelector("video");
    if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
  }

  function captionFor(item) {
    if (item.caption) return item.caption;
    const file = (item.src || "").split("/").pop().split("?")[0];
    const base = file.replace(/\.[^.]+$/, "");
    return base.split("_").slice(0, 3).join(" ").trim();
  }

  function updateLightbox() {
    const items = activeItems();
    const item = items[currentIndex];
    if (!item) return;

    const caption = captionFor(item);
    const stage = lightbox.querySelector(".lightbox-stage");
    const wm = (typeof SHOW_WATERMARK !== "undefined" && SHOW_WATERMARK)
      ? `<span class="watermark">&copy; ${COPYRIGHT_OWNER || ""}</span>`
      : "";
    if (isVideo(item)) {
      stage.innerHTML = `<div class="lightbox-media-wrap"><video class="lightbox-media" controls autoplay playsinline controlslist="nodownload" oncontextmenu="return false;" poster="${item.poster || ""}">
        <source src="${item.src}" />
      </video>${wm}</div>`;
    } else {
      const fallback = variantSrc(item.src, 1920);
      const srcset = srcsetFor(item.src, LIGHTBOX_WIDTHS);
      stage.innerHTML = `<div class="lightbox-media-wrap"><img class="lightbox-media" src="${fallback}" srcset="${srcset}" sizes="90vw" alt="${caption}" oncontextmenu="return false;" draggable="false" />${wm}</div>`;
    }
    lightbox.querySelector(".lightbox-caption").textContent = caption;
  }

  function step(delta) {
    const items = activeItems();
    currentIndex = (currentIndex + delta + items.length) % items.length;
    updateLightbox();
    trackPhotoView(items[currentIndex]);
  }

  if (lightbox) {
    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-prev").addEventListener("click", () => step(-1));
    lightbox.querySelector(".lightbox-next").addEventListener("click", () => step(1));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  renderTabs();
  renderGallery();
}
