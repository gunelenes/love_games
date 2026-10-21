/**
 * Store screenshots: raw phone captures → framed marketing shots.
 *
 * Input:  store/screenshots/raw/{en-US,tr}/NN-name.{png,jpg}   (NN picks the caption)
 * Output: store/screenshots/ios/{locale}/NN.png    1290×2796 (App Store 6.9")
 *         store/screenshots/play/{locale}/NN.png   1080×1920 (Play: long side ≤ 2× short side)
 *
 * Usage (same ad hoc renderers as build-icons.mjs):
 *   npm i --no-save @resvg/resvg-js@2.6.2 sharp@0.33.5
 *   node scripts/brand/build-screenshots.mjs
 *
 * The capture's status bar is cropped off (battery / carrier / notifications
 * never reach the store). Captions mirror store/README.md.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FONT = path.join(ROOT, 'scripts/brand/fonts/Fredoka-Bold.ttf');
// Same palette as build-icons.mjs (importing it would regenerate every icon).
const COLORS = { bgFrom: '#8E2DE2', bgTo: '#4A00E0', bgSolid: '#6C17E1', flameA: '#FF4FA3', flameB: '#FFD23F' };
const RAW = path.join(ROOT, 'store/screenshots/raw');
const MARK = fs
  .readFileSync(path.join(ROOT, 'scripts/brand/mark.svg'), 'utf8')
  .replace(' width="1024" height="1024"', '');

/** Line 1 white, line 2 in the flame gradient. */
const CAPTIONS = {
  'en-US': {
    '01': ['Games made', 'for two'],
    '02': ['Spin and let', 'fate decide'],
    '03': ['Every card, a', 'small invitation'],
    '04': ['Two paths,', 'five levels each'],
    '05': ['Your shared space,', 'synced live'],
    '06': ['Play in', '12 languages'],
  },
  tr: {
    '01': ['İki kişi için', 'oyunlar'],
    '02': ['Çevir, gerisini', 'kader seçsin'],
    '03': ['Her kart', 'küçük bir davet'],
    '04': ['İki yol, her birinde', 'beş seviye'],
    '05': ['Ortak alanınız,', 'anında senkron'],
    '06': ['12 dilde', 'oynayın'],
  },
};

const TARGETS = {
  ios: { w: 1290, h: 2796, caption: 118, captionTop: 250, phoneTop: 560, side: 120 },
  play: { w: 1080, h: 1920, caption: 84, captionTop: 170, phoneTop: 380, side: 210 },
};

/** Fraction of the capture height taken by the status bar (iPhone, portrait). */
const STATUS_BAR = 0.053;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function background({ w, h }, [l1, l2], t, phone) {
  const mark = MARK.replace('<svg ', `<svg x="${w / 2 - t.caption * 0.45}" y="${t.captionTop - t.caption * 1.25}" width="${t.caption * 0.9}" height="${t.caption * 0.9}" `);
  const { x, y, pw, ph, r, bezel } = phone;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${COLORS.bgFrom}"/><stop offset="1" stop-color="${COLORS.bgTo}"/></linearGradient>
    <linearGradient id="hot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${COLORS.flameB}"/><stop offset="1" stop-color="${COLORS.flameA}"/></linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${w * 0.09}"/></filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${w * 0.03}"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${w * 0.95}" cy="${h * 0.2}" r="${w * 0.42}" fill="${COLORS.flameA}" opacity="0.55" filter="url(#soft)"/>
  <circle cx="${w * 0.02}" cy="${h * 0.78}" r="${w * 0.4}" fill="${COLORS.flameB}" opacity="0.32" filter="url(#soft)"/>
  <circle cx="${w * 0.75}" cy="${h * 1.02}" r="${w * 0.35}" fill="${COLORS.flameA}" opacity="0.4" filter="url(#soft)"/>
  ${mark}
  <text x="${w / 2}" y="${t.captionTop + t.caption * 0.55}" text-anchor="middle" font-family="Fredoka" font-size="${t.caption}" fill="#FFFFFF">${esc(l1)}</text>
  <text x="${w / 2}" y="${t.captionTop + t.caption * 1.62}" text-anchor="middle" font-family="Fredoka" font-size="${t.caption}" fill="url(#hot)">${esc(l2)}</text>
  <rect x="${x - bezel}" y="${y - bezel + w * 0.03}" width="${pw + bezel * 2}" height="${ph + bezel * 2}" rx="${r + bezel}" fill="#12002E" opacity="0.6" filter="url(#shadow)"/>
  <rect x="${x - bezel}" y="${y - bezel}" width="${pw + bezel * 2}" height="${ph + bezel * 2}" rx="${r + bezel}" fill="#0C0618"/>
  <rect x="${x - bezel + 1.5}" y="${y - bezel + 1.5}" width="${pw + bezel * 2 - 3}" height="${ph + bezel * 2 - 3}" rx="${r + bezel - 1.5}" fill="none" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="3"/>
</svg>`;
}

async function compose(file, locale, num, kind) {
  const t = TARGETS[kind];
  const caption = CAPTIONS[locale]?.[num];
  if (!caption) throw new Error(`no caption for ${locale}/${num}`);

  const meta = await sharp(file).metadata();
  const crop = Math.round(meta.height * STATUS_BAR);
  const srcW = meta.width, srcH = meta.height - crop;

  const bezel = Math.round(t.w * 0.016);
  const pw = t.w - t.side * 2;
  const ph = Math.round((pw * srcH) / srcW);
  const r = Math.round(pw * 0.085);
  const x = Math.round((t.w - pw) / 2), y = t.phoneTop;

  const bg = new Resvg(background(t, caption, t, { x, y, pw, ph, r, bezel }), {
    font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'Fredoka' },
  }).render().asPng();

  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><rect width="${pw}" height="${ph}" rx="${r}" fill="#fff"/></svg>`);
  const screen = await sharp(file)
    .extract({ left: 0, top: crop, width: srcW, height: srcH })
    .resize(pw, ph, { kernel: 'lanczos3' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const out = await sharp(bg)
    .composite([{ input: screen, left: x, top: y }])
    .flatten({ background: COLORS.bgSolid })
    .removeAlpha()
    .png()
    .toBuffer();

  const dest = path.join(ROOT, 'store/screenshots', kind, locale, `${num}.png`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return path.relative(ROOT, dest);
}

for (const locale of fs.existsSync(RAW) ? fs.readdirSync(RAW) : []) {
  for (const name of fs.readdirSync(path.join(RAW, locale)).sort()) {
    const m = name.match(/^(\d\d)-.*\.(png|jpe?g)$/i);
    if (!m) continue;
    for (const kind of Object.keys(TARGETS)) {
      console.log(await compose(path.join(RAW, locale, name), locale, m[1], kind));
    }
  }
}
