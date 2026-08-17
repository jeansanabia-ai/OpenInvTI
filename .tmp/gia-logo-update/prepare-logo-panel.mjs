import fs from "node:fs/promises";
import sharp from "sharp";

const logoPath = "C:/OpenInvTI/.tmp/gia-logo-update/ferroport-logo-oficial.png";
const outputPath = "C:/OpenInvTI/.tmp/gia-logo-update/ferroport-logo-oficial-contraste.png";

const logo = await sharp(logoPath)
  .resize({ width: 300, height: 155, fit: "contain", kernel: sharp.kernel.lanczos3 })
  .png()
  .toBuffer();

const panel = await sharp({
  create: {
    width: 380,
    height: 216,
    channels: 4,
    background: { r: 7, g: 21, b: 40, alpha: 1 },
  },
})
  .composite([{ input: logo, left: 40, top: 30 }])
  .png()
  .toBuffer();

await fs.writeFile(outputPath, panel);
console.log(outputPath);
