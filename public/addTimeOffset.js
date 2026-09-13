#!/usr/bin/env node
/**
 * Usage:
 *   node add_resulttime_hms_with_offset.js input.json output.json <referenceUnixTime> <offsetHH:mm:ss>
 *
 * Example:
 *   node add_resulttime_hms_with_offset.js rutamiel2019d.json rutamiel2019d_result.json 1573948800000 00:30:00
 *
 *   → Adds 30 minutes to all calculated result times
 */

const fs = require('fs');

if (process.argv.length < 6) {
  console.error('Usage: node add_resulttime_hms_with_offset.js <input.json> <output.json> <referenceUnixTime> <offsetHH:mm:ss>');
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const referenceUnixTime = parseInt(process.argv[4]);
const offsetStr = process.argv[5];

if (isNaN(referenceUnixTime)) {
  console.error('Invalid referenceUnixTime. Must be a valid Unix timestamp (in milliseconds).');
  process.exit(1);
}

/** Convert HH:mm:ss → milliseconds */
function parseHHMMSS(str) {
  const parts = str.split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error('Invalid offset format. Use HH:mm:ss');
    process.exit(1);
  }
  const [h, m, s] = parts;
  return ((h * 3600) + (m * 60) + s) * 1000;
}

/** Convert milliseconds → HH:mm:ss string */
function msToHMS(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');
}

const offsetMs = parseHHMMSS(offsetStr);
const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

const updated = data.map(item => {
  const diff = (item.date - referenceUnixTime) + offsetMs;
  const formatted = diff < 0 ? '-' + msToHMS(-diff) : msToHMS(diff);
  return { ...item, resulttime: formatted };
});

fs.writeFileSync(outputFile, JSON.stringify(updated, null, 2), 'utf8');

console.log(`✅ Added "resulttime" (HH:mm:ss) with offset ${offsetStr} to ${updated.length} items.`);
console.log(`📄 Output saved to: ${outputFile}`);
