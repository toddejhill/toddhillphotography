// Walks images/ for original photos and generates resized JPEGs in
// images/_generated/<width>/<same-relative-path>.jpg.
// Skips outputs that are newer than their source (incremental).
//
// Usage: npm run build

import { readdir, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "images");
const OUT_ROOT = path.join(SRC_DIR, "_generated");

const SIZES = [640, 1280, 1920];
const QUALITY = 82;
const SRC_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === OUT_ROOT) continue;
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

async function needsRebuild(src, out) {
  if (!existsSync(out)) return true;
  const [s, o] = await Promise.all([stat(src), stat(out)]);
  return s.mtimeMs > o.mtimeMs;
}

async function processOne(src) {
  const rel = path.relative(SRC_DIR, src);
  const parsed = path.parse(rel);
  const baseRel = path.join(parsed.dir, parsed.name + ".jpg");

  let built = 0;
  for (const width of SIZES) {
    const out = path.join(OUT_ROOT, String(width), baseRel);
    if (!(await needsRebuild(src, out))) continue;
    await mkdir(path.dirname(out), { recursive: true });
    await sharp(src)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(out);
    built++;
  }
  return built;
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.log(`No images/ folder found at ${SRC_DIR}`);
    return;
  }
  let total = 0;
  let touched = 0;
  for await (const file of walk(SRC_DIR)) {
    const ext = path.extname(file).toLowerCase();
    if (!SRC_EXTS.has(ext)) continue;
    total++;
    const built = await processOne(file);
    if (built > 0) {
      touched++;
      console.log(`  ${path.relative(ROOT, file)} → ${built} variant(s)`);
    }
  }
  console.log(`\nDone. ${touched}/${total} source(s) updated. Sizes: ${SIZES.join(", ")}px wide.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
