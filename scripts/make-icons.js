const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

/** Dark tile + white ring + amber center — reads clearly on home screen / launcher */
function writeBrandedIcon(size, outPath) {
  const png = new PNG({ width: size, height: size });
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const rOuter = size * 0.4;
  const rInner = size * 0.26;
  const rDot = size * 0.1;

  const bgR = 26;
  const bgG = 26;
  const bgB = 26;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const i = (size * y + x) << 2;

      let r = bgR;
      let g = bgG;
      let b = bgB;

      if (dist <= rOuter && dist >= rInner) {
        r = 255;
        g = 255;
        b = 255;
      }
      if (dist < rDot) {
        r = 245;
        g = 158;
        b = 11;
      }

      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = 255;
    }
  }

  return new Promise(function (resolve, reject) {
    png
      .pack()
      .pipe(fs.createWriteStream(outPath))
      .on("finish", resolve)
      .on("error", reject);
  });
}

async function main() {
  const dir = path.join(__dirname, "..", "icons");
  fs.mkdirSync(dir, { recursive: true });
  await writeBrandedIcon(192, path.join(dir, "icon-192.png"));
  await writeBrandedIcon(512, path.join(dir, "icon-512.png"));
  console.log("Wrote icons/icon-192.png and icons/icon-512.png");
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
