// Walks images/ for raw source videos named <name>.original.<ext> and emits
// web-optimized H.264 MP4s as <name>.mp4 next to them. The compressed output
// is what gets committed to git; the .original.* source is gitignored.
//
// Encoding: H.264 high profile, CRF 25, capped at 1920x1080, AAC audio,
// +faststart for streamable playback. Skips files whose output is newer
// than their source (incremental).
//
// Usage: npm run build  (chains from npm run build before build:dist)

import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "images");
const OUT_ROOT = path.join(SRC_DIR, "_generated");

const RAW_RE = /\.original\.(mp4|mov|webm|m4v)$/i;

const FFMPEG_ARGS = [
  "-c:v", "libx264",
  "-crf", "25",
  "-preset", "slow",
  "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "128k",
  "-movflags", "+faststart",
  "-y",
];

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

function outFor(src) {
  return src.replace(RAW_RE, ".mp4");
}

async function needsRebuild(src, out) {
  if (!existsSync(out)) return true;
  const [s, o] = await Promise.all([stat(src), stat(out)]);
  return s.mtimeMs > o.mtimeMs;
}

function runFfmpeg(src, out) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, ["-i", src, ...FFMPEG_ARGS, out], { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`));
    });
  });
}

async function main() {
  if (!existsSync(SRC_DIR)) return;
  if (!ffmpegPath) {
    console.error("[videos] ffmpeg-static did not provide a binary path on this platform.");
    process.exit(1);
  }

  let total = 0;
  let touched = 0;
  for await (const file of walk(SRC_DIR)) {
    if (!RAW_RE.test(file)) continue;
    total++;
    const out = outFor(file);
    if (!(await needsRebuild(file, out))) continue;
    const relIn = path.relative(ROOT, file);
    const relOut = path.relative(ROOT, out);
    console.log(`[videos] encoding ${relIn} -> ${relOut}`);
    await runFfmpeg(file, out);
    const sizeIn = (await stat(file)).size;
    const sizeOut = (await stat(out)).size;
    const mb = (n) => (n / (1024 * 1024)).toFixed(1);
    console.log(`[videos] ${mb(sizeIn)} MB -> ${mb(sizeOut)} MB`);
    touched++;
  }
  console.log(`[videos] Done. ${touched}/${total} source(s) updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
