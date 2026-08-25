import { chromium } from 'playwright-core';

/**
 * Exercises the things a crawl cannot: menus, the mobile nav, in-page
 * navigation, and keyboard access.
 *
 *   node scripts/interactions.mjs <origin>
 */
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const origin = process.argv[2].replace(/\/$/, '');

const results = [];
const check = (name, pass, note = '') => {
  results.push({ name, pass, note });
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${note ? `  — ${note}` : ''}`);
};

const browser = await chromium.launch({ executablePath: CHROME });

/* ---------------------------------------------------------- desktop ---- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // mega-menu opens on hover, lists 11 products, closes on Escape
  await page.getByRole('link', { name: 'Products', exact: false }).first().hover();
  await page.waitForTimeout(500);
  const items = await page.locator('header a[href^="/products/"]').count();
  check('mega-menu opens', items >= 11, `${items} product links`);

  // two are expected: the nav trigger itself, and "All products" inside the menu
  const allProducts = await page.locator('header a[href="/products"]').count();
  check('nav and mega-menu both reach the full range', allProducts === 2, `${allProducts} links`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const afterEsc = await page.locator('header a[href^="/products/"]').count();
  check('Escape closes the mega-menu', afterEsc === 0);

  // in-page anchors actually move the page
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.locator('header a[href="/#projects"]').first().click();
  await page.waitForTimeout(1600);
  const atProjects = await page.evaluate(() => {
    const r = document.getElementById('projects')?.getBoundingClientRect();
    return r ? Math.abs(r.top) < 260 : false;
  });
  check('nav anchor scrolls to Projects', atProjects);

  // floor indicator tracks and navigates
  const levelHrefs = await page.locator('nav[aria-label="Levels"] a').count();
  check('floor indicator has a level per section', levelHrefs === 8, `${levelHrefs} levels`);
  const activeNow = await page.locator('nav[aria-label="Levels"] a[aria-current="true"]').count();
  check('floor indicator marks the current level', activeNow === 1);

  // primary CTA reaches the contact block
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const ctaHref = await page.locator('header a.btn-primary').first().getAttribute('href');
  check('header CTA points at contact', ctaHref === '/#contact', ctaHref ?? '');

  // Keyboard: reload first. Clicking earlier moved Chrome's sequential focus
  // starting point mid-document, so Tab would resume from there rather than
  // from the top — a test artefact, not a page one.
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check('first tab stop is the skip link', firstFocus === 'Skip to content', firstFocus ?? '');

  // focus is actually visible
  const ring = await page.evaluate(() => {
    const el = document.querySelector('header nav a');
    el.focus();
    const cs = getComputedStyle(el);
    return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
  });
  check('focus ring is visible on nav links', ring);

  await page.close();
}

/* ----------------------------------------------------------- mobile ---- */
{
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true,
  });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.waitForTimeout(500);
  const open = await page.locator('nav[aria-label="Mobile"]').isVisible();
  const mobLinks = await page.locator('nav[aria-label="Mobile"] a').count();
  check('mobile nav opens', open && mobLinks > 10, `${mobLinks} links`);

  const locked = await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden');
  check('body scroll locks while the menu is open', locked);

  await page.getByRole('button', { name: 'Close menu' }).click();
  await page.waitForTimeout(500);
  const closed = await page.locator('nav[aria-label="Mobile"]').count();
  const unlocked = await page.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden');
  check('mobile nav closes and unlocks scroll', closed === 0 && unlocked);

  // the hero film runs on mobile rather than sitting on the poster
  const playing = await page.evaluate(() => {
    const v = document.querySelector('video');
    return v && !v.paused && v.readyState >= 2;
  });
  check('hero film autoplays on mobile', playing);

  await page.close();
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${failed === 0 ? `all ${results.length} interaction checks pass` : `${failed} FAILING`}`);
await browser.close();
process.exit(failed ? 1 : 0);
