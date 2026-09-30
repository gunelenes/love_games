/**
 * One-shot migration: bundle JSON'lara track/level ekle.
 * Default: track='romantik', level=1. Backward compat için mevcut içerik
 * tamamen Romantik L1'e düşer, sonra Firestore'da tek tek düzenlenir.
 */
const fs = require('fs');
const path = require('path');

const FILES = [
  path.join(__dirname, '..', 'src', 'data', 'categories.json'),
  path.join(__dirname, '..', 'src', 'data', 'diceFaces.json'),
  path.join(__dirname, '..', 'src', 'data', 'placeCategories.json'),
];

for (const file of FILES) {
  const raw = fs.readFileSync(file, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    console.error(`Skip (not array): ${file}`);
    continue;
  }
  const patched = data.map((item) => {
    const next = { ...item };
    if (next.track === undefined) next.track = 'romantik';
    if (next.level === undefined) next.level = 1;
    return next;
  });
  fs.writeFileSync(file, JSON.stringify(patched, null, 2) + '\n', 'utf-8');
  console.log(`✓ ${path.basename(file)} (${patched.length} entries)`);
}
