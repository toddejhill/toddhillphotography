// Add new categories or locations here.
//
// Two-tier structure:
//   - Top-level: categories (Travel, Portraits, ...)
//   - Each category can either have `images` directly, OR have `locations` (sub-tabs).
//
// Items support photos and videos:
//   { src: "...", caption: "..." }                                  // image (default)
//   { type: "video", src: "...", poster: "...", caption: "..." }    // video
//
// `poster` is the still frame shown before play (recommended for videos).

const GALLERIES = {
  travel: {
    name: "Travel",
    featured: true,
    locations: {
      greece: {
        name: "Greece",
        images: [
          { src: "images/travel/greece/Milos_Summer_2024_001.JPG" },
          { src: "images/travel/greece/Milos_Summer_2024_002.jpg" },
        ],
      },
      colombia: {
        name: "Colombia",
        images: [
          { type: "video", src: "images/travel/colombia/Monkey_Jungle_2026.mp4" },
        ],
      },
    },
  },

  // Example future category with no sub-locations:
  //
  // portraits: {
  //   name: "Portraits",
  //   featured: false,
  //   images: [
  //     { src: "images/portraits/01.jpg", caption: "Studio, New York" },
  //   ],
  // },
};

// Which category is shown first on the portfolio page:
const DEFAULT_CATEGORY = "travel";

// How many items to show on the homepage featured grid:
const HOME_FEATURED_COUNT = 6;

// Copyright / protection settings:
const COPYRIGHT_OWNER = "Todd Hill";
const SHOW_WATERMARK = true;          // visible "© Todd Hill" on each image
const PROTECT_IMAGES = true;          // disable right-click, drag, and selection
