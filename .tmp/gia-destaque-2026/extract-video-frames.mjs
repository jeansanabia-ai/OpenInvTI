import fs from "node:fs/promises";
import { chromium } from "playwright";

const outputDir = "C:/OpenInvTI/.tmp/gia-destaque-2026/video-frames";
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--allow-file-access-from-files"],
});
const page = await browser.newPage({ viewport: { width: 900, height: 1600 }, deviceScaleFactor: 1 });
await page.goto("file:///C:/OpenInvTI/.tmp/gia-destaque-2026/video-frame.html");
await page.waitForFunction(() => {
  const v = document.getElementById("v");
  return Number.isFinite(v.duration) && v.duration > 0 && v.videoWidth > 0;
}, { timeout: 30000 });

const info = await page.evaluate(() => {
  const v = document.getElementById("v");
  return { duration: v.duration, width: v.videoWidth, height: v.videoHeight };
});

for (const [name, fraction] of [["frame-captura", 0.28], ["frame-resultado", 0.72]]) {
  await page.evaluate(({ fraction }) => {
    const v = document.getElementById("v");
    v.currentTime = Math.min(v.duration - 0.1, Math.max(0, v.duration * fraction));
  }, { fraction });
  await page.waitForFunction(() => {
    const v = document.getElementById("v");
    return !v.seeking && v.readyState >= 2;
  }, { timeout: 30000 });
  await page.locator("#v").screenshot({ path: `${outputDir}/${name}.png` });
}

console.log(JSON.stringify(info));
await browser.close();
