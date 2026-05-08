// Copies the public-facing files into dist/ for deployment.
// Excludes originals from images/ (they're build inputs, not site assets) —
// only the resized variants from images/_generated/ are served. Also excludes
// node_modules, scripts, package files, etc.
//
// Usage: npm run build:dist  (typically chained from npm run build)

import { rm, mkdir, cp, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

// Files / dirs that get copied into dist/. Anything not listed is excluded.
const INCLUDE = [
  "index.html",
  "portfolio.html",
  "about.html",
  "contact.html",
  "css",
  "js",
  "data",
];

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  for (const item of INCLUDE) {
    const src = path.join(ROOT, item);
    const dst = path.join(DIST, item);
    await cp(src, dst, { recursive: true });
  }

  // Copy only the resized variants — originals stay out of the deployed site.
  const genSrc = path.join(ROOT, "images", "_generated");
  const genDst = path.join(DIST, "images", "_generated");
  await cp(genSrc, genDst, { recursive: true });

  // Videos pass through unprocessed (no resize pipeline for video).
  await copyVideos(path.join(ROOT, "images"), path.join(DIST, "images"));

  console.log(`[dist] Copied site files into ${path.relative(ROOT, DIST)}/`);
}

const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);

async function copyVideos(srcDir, dstDir) {
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "_generated") continue;
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      await copyVideos(srcPath, dstPath);
    } else if (VIDEO_EXT.has(path.extname(entry.name).toLowerCase())) {
      await mkdir(path.dirname(dstPath), { recursive: true });
      await cp(srcPath, dstPath);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
