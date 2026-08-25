import { chromium } from 'playwright-core';

/**
 * Whole-site QA sweep. Visits every route, then reports anything that would
 * be a defect in front of a client: failed requests, console errors, images
 * that did not decode, links that 404, missing alt text, heading structure,
 * and dead in-page anchors.
 *
 *   node scripts/qa.mjs <origin>
 */
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const origin = process.argv[2].replace(/\/$/, '');

const PRODUCTS = [
  'passenger-elevators', 'hospital-bed-elevators', 'high-rise', 'mid-rise',
  'panoramic-elevator', 'vacuum-elevator', 'escalators', 'freight-elevators',
  'homelift', 'car-elevators', 'chairlifts',
];
const PROJECTS = ['platine-tower', 'rabieh-villa', 'iveco', 'sodicar'];
const ROUTES = [
  '/',
  '/products',
  ...PRODUCTS.map((s) => `/products/${s}`),
  ...PROJECTS.map((s) => `/projects/${s}`),
];

const problems = [];
const flag = (route, kind, detail) => problems.push({ route, kind, detail });

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

const linkStatus = new Map();
async function checkLink(href) {
  if (linkStatus.has(href)) return linkStatus.get(href);
  let status = 0;
  try {
    const res = await ctx.request.get(href, { maxRedirects: 3 });
    status = res.status();
  } catch {
    status = -1;
  }
  linkStatus.set(href, status);
  return status;
}

for (const route of ROUTES) {
  const page = await ctx.newPage();
  const failures = [];
  const errors = [];
  page.on('response', (r) => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const res = await page.goto(origin + route, { waitUntil: 'networkidle', timeout: 60000 });
  if (!res || res.status() >= 400) flag(route, 'route', `HTTP ${res?.status()}`);

  // Exercise the page so lazy images start, then actually wait for them.
  // Checking straight after the scroll reports every in-flight lazy image as
  // broken — Next's fallback `src` is the largest candidate, which is why they
  // all looked like they were asking for w=2560.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 260));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  });
  try {
    await page.waitForFunction(
      () => [...document.querySelectorAll('img')].every((i) => i.complete && i.naturalWidth > 0),
      null,
      { timeout: 25000 },
    );
  } catch {
    flag(route, 'image', 'some images never finished loading (see list below)');
  }

  const audit = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].map((i) => ({
      src: i.currentSrc || i.src,
      ok: i.complete && i.naturalWidth > 0,
      alt: i.getAttribute('alt'),
      hidden: i.getAttribute('aria-hidden') === 'true',
    }));
    const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    const h1 = [...document.querySelectorAll('h1')].map((h) => h.textContent.trim().slice(0, 60));
    const anchors = [...new Set(links.filter((h) => h && h.includes('#')).map((h) => h.slice(h.indexOf('#') + 1)))]
      .filter((id) => id && id !== 'main');
    const missingAnchors = anchors.filter((id) => !document.getElementById(id));
    const emptyButtons = [...document.querySelectorAll('button')]
      .filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label'))
      .length;
    return { imgs, links, h1, missingAnchors, emptyButtons, title: document.title };
  });

  for (const f of failures) flag(route, 'request', f);
  for (const e of [...new Set(errors)]) flag(route, 'console', e);
  for (const i of audit.imgs) {
    if (!i.ok) flag(route, 'image', `did not decode: ${i.src}`);
    if (i.alt === null) flag(route, 'a11y', `img without alt: ${i.src}`);
  }
  if (audit.h1.length !== 1) flag(route, 'a11y', `${audit.h1.length} <h1> (${audit.h1.join(' | ')})`);
  for (const a of audit.missingAnchors) {
    // in-page anchors only matter on the page that should hold them
    if (route === '/') flag(route, 'anchor', `#${a} has no target`);
  }
  if (audit.emptyButtons) flag(route, 'a11y', `${audit.emptyButtons} button(s) with no accessible name`);
  if (!audit.title) flag(route, 'seo', 'no <title>');

  // every internal link resolves
  const internal = [...new Set(audit.links)]
    .filter((h) => h && !h.startsWith('http') && !h.startsWith('mailto:') && !h.startsWith('tel:'))
    .map((h) => (h.startsWith('#') ? null : origin + h.split('#')[0]))
    .filter(Boolean)
    .filter((u) => u !== origin + '');
  for (const u of internal) {
    const st = await checkLink(u);
    if (st >= 400 || st < 0) flag(route, 'link', `${st} ${u}`);
  }

  await page.close();
  process.stdout.write(`  checked ${route}\r`);
}

// 404 handling
const p404 = await ctx.newPage();
const r404 = await p404.goto(`${origin}/products/does-not-exist`, { waitUntil: 'domcontentloaded' });
if (r404?.status() !== 404) flag('/products/does-not-exist', 'route', `expected 404, got ${r404?.status()}`);
await p404.close();

console.log(`\nchecked ${ROUTES.length} routes + 404\n`);
if (!problems.length) {
  console.log('no problems found');
} else {
  const byKind = {};
  for (const p of problems) (byKind[p.kind] ??= []).push(p);
  for (const [kind, list] of Object.entries(byKind)) {
    console.log(`--- ${kind} (${list.length}) ---`);
    const seen = new Set();
    for (const p of list) {
      const key = `${p.kind}|${p.detail}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`  ${p.route.padEnd(34)} ${p.detail}`);
    }
  }
}

await browser.close();
