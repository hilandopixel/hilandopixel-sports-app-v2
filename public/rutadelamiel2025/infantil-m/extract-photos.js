#!/usr/bin/env node
/**
 * extract_album_links_with_bg.js
 *
 * Usage:
 * node extract_album_links_with_bg.js "<ALBUM_URL>" "<OUTPUT_JSON>" <WIDTH> <HEIGHT>
 *
 * Extracts:
 * - href (normalized to https://photos.google.com/share/…)
 * - aria-label (date)
 * - background-image url from .RY3tic elements (image-url)
 *
 * Replaces size in imageUrl (e.g., '=w403-h303-no') with the provided WIDTH and HEIGHT.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ALBUM_URL = "https://photos.google.com/share/AF1QipNYpk5ugh2_KsJez7zHKUQaVdWAm2fW08OD6JlUtZPw-6wsm2cutI2kvwTdaXyaWA?key=bG1zNnlPajJDd0tmdGQxcmVNTjJ2X2lfbzRpNlNn"
const OUTPUT_PATH = path.resolve('fotos.json');
const TARGET_WIDTH = 5184;
const TARGET_HEIGHT = 3456;

if (isNaN(TARGET_WIDTH) || isNaN(TARGET_HEIGHT) || TARGET_WIDTH <= 0 || TARGET_HEIGHT <= 0) {
    console.error('ERROR: <WIDTH> and <HEIGHT> must be positive integers.');
    process.exit(1);
}

function normalizeHref(href) {
  if (!href) return null;
  if (href.startsWith('./share/'))
    return 'https://photos.google.com/share/' + href.replace('./share/', '');
  if (href.startsWith('/share/'))
    return 'https://photos.google.com' + href;
  if (href.startsWith('http'))
    return href;
  return 'https://photos.google.com/share/' + href.replace(/^\/?share\//, '');
}

/**
 * Cleans the Google Photos image URL and injects the new size.
 * @param {string} url The extracted image URL.
 * @param {number} width The target width.
 * @param {number} height The target height.
 * @returns {string} The resized image URL.
 */
function resizeImageUrl(url, width, height) {
    if (!url) return null;

    // 1. Remove existing size parameters (e.g., "=w403-h303-no")
    // This regex looks for '=w' followed by numbers, an optional '-h' and numbers, and optional further parameters like '-no'.
    const cleanedUrl = url.replace(/=w\d+(-h\d+)?(-[a-z]+)*\/?$/, '');

    // 2. Append the new size parameters
    return `${cleanedUrl}=w${width}-h${height}`;
}

function parseDate(dateStr) {
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? 0 : parsed;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  if (typeof page.waitForTimeout !== 'function') {
    page.waitForTimeout = async (ms) => new Promise(r => setTimeout(r, ms));
  }

  console.log('Opening album:', ALBUM_URL);
  await page.goto(ALBUM_URL, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForTimeout(3000);

  // Find the scroll container (same logic as before)
  const scrollSelector = await page.evaluate(() => {
    const el = document.querySelector('.p137Zd');
    if (!el) return null;
    let node = el.parentElement;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return node.className;
      }
      node = node.parentElement;
    }
    return null;
  });

  if (!scrollSelector) console.warn('⚠️ Could not find scrollable container. Using window scroll fallback.');
  else console.log('📦 Scroll container detected:', scrollSelector);

  const seen = new Map();
  let unchangedScrolls = 0;
  let lastCount = 0;
  let scrollDirection = 'down';

  async function extractCurrentItems() {
    // Pass target size parameters to the page evaluation context
    const batch = await page.evaluate((targetW, targetH) => {
      
      const resizeUrl = (url, width, height) => {
          if (!url) return null;
          // 1. Remove existing size parameters (e.g., "=w403-h303-no")
          const cleanUrl = url.replace(/=w\d+-h\d+-no$/, ''); 
		return `${cleanUrl}=w${width}-h${height}-no`;
      };

      const fixBg = (style) => {
        if (!style) return null;
        const m = style.match(/url\(["']?(.*?)["']?\)/);
        const rawUrl = m ? m[1] : null;
        return rawUrl ? resizeUrl(rawUrl, targetW, targetH) : null;
      };

      return Array.from(document.querySelectorAll('.p137Zd')).map(el => {
        const bgEl = el.querySelector('.RY3tic');
        const bgUrl = bgEl ? fixBg(bgEl.style.backgroundImage) : null;
		const pDate = Date.parse(el.getAttribute('aria-label'));
        return {
          href: el.getAttribute('href'),
          date: pDate,
          imageUrl: bgUrl
        };
      });
    }, TARGET_WIDTH, TARGET_HEIGHT); // Pass variables here

    let newCount = 0;
    for (const item of batch) {
      const href = normalizeHref(item.href);
      if (href && item.date && !seen.has(href)) {
        seen.set(href, { href, date: item.date, 'imageurl': item.imageUrl });
        newCount++;
      }
    }
    return newCount;
  }

  console.log('Starting scroll + extract...');
  for (let round = 1; round <= 700; round++) {
    const newItems = await extractCurrentItems();
    const total = seen.size;
    console.log(`[${round}] dir=${scrollDirection} | +${newItems} | total=${total}`);

    if (total === lastCount) unchangedScrolls++;
    else unchangedScrolls = 0;
    lastCount = total;

    if (unchangedScrolls >= 10) {
      console.log('No new items for several scrolls — stopping.');
      break;
    }

    if (scrollSelector) {
      await page.evaluate(
        (sel, direction) => {
          const el = document.querySelector(`.${sel.split(' ')[0]}`);
          if (!el) return;
          const delta = window.innerHeight * 2 * (direction === 'down' ? 1 : -1);
          el.scrollBy({ top: delta, behavior: 'smooth' });
        },
        scrollSelector,
        scrollDirection
      );
    } else {
      await page.evaluate(
        (direction) => window.scrollBy(0, window.innerHeight * 2 * (direction === 'down' ? 1 : -1)),
        scrollDirection
      );
    }

    await page.waitForTimeout(3000 + Math.random() * 800);
  }

  await extractCurrentItems();

  const result = Array.from(seen.values());
  result.sort((a, b) => parseDate(a.date) - parseDate(b.date));

  console.log(`✅ Collected ${result.length} unique items.`);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Saved to ${OUTPUT_PATH}`);

  await browser.close();
})();