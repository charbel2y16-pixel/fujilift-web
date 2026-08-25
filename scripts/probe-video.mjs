import { chromium } from 'playwright-core';

/** Reads real playback metadata out of a served video. node scripts/probe-video.mjs <url> */
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2];

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
await page.setContent(`<video id="v" src="${url}" preload="metadata" muted></video>`);

const info = await page.evaluate(
  () =>
    new Promise((res) => {
      const v = document.getElementById('v');
      const done = () =>
        res({
          duration: v.duration,
          width: v.videoWidth,
          height: v.videoHeight,
          ratio: v.videoWidth && v.videoHeight ? +(v.videoWidth / v.videoHeight).toFixed(3) : null,
          readyState: v.readyState,
          error: v.error ? v.error.code : null,
        });
      if (v.readyState >= 1) done();
      v.addEventListener('loadedmetadata', done);
      v.addEventListener('error', done);
      setTimeout(done, 10000);
    }),
);

console.log(JSON.stringify(info, null, 2));
await browser.close();
