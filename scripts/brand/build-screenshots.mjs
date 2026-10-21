/**
 * Store screenshots: raw phone captures → framed marketing shots.
 *
 * Input:  store/screenshots/raw/{locale}/NN-name.{png,jpg}   (NN picks the caption;
 *         a locale with no raw folder reuses the en-US captures)
 * Output: store/screenshots/ios/{locale}/NN.png    1290×2796 (App Store 6.9")
 *         store/screenshots/ios-6.5/{locale}/NN.png 1284×2778 (App Store 6.5")
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
  'de-DE': {
    '01': ['Spiele für', 'euch zwei'],
    '02': ['Dreht das Rad,', 'das Glück wählt'],
    '03': ['Jede Karte eine', 'kleine Einladung'],
    '04': ['Zwei Wege,', 'je fünf Stufen'],
    '05': ['Euer Ort,', 'live synchron'],
    '06': ['Spielt in', '12 Sprachen'],
  },
  'fr-FR': {
    '01': ['Des jeux', 'pour deux'],
    '02': ['Tournez la roue,', 'le sort décide'],
    '03': ['Chaque carte,', 'une invitation'],
    '04': ['Deux chemins,', 'cinq niveaux'],
    '05': ['Votre espace,', 'synchronisé'],
    '06': ['Jouez en', '12 langues'],
  },
  'es-ES': {
    '01': ['Juegos hechos', 'para dos'],
    '02': ['Gira la ruleta,', 'decide el azar'],
    '03': ['Cada carta,', 'una invitación'],
    '04': ['Dos caminos,', 'cinco niveles'],
    '05': ['Vuestro espacio,', 'sincronizado'],
    '06': ['Juega en', '12 idiomas'],
  },
  it: {
    '01': ['Giochi fatti', 'per due'],
    '02': ['Gira la ruota,', 'sceglie il fato'],
    '03': ['Ogni carta,', 'un piccolo invito'],
    '04': ['Due percorsi,', 'cinque livelli'],
    '05': ['Il vostro spazio,', 'sincronizzato'],
    '06': ['Gioca in', '12 lingue'],
  },
  ja: {
    '01': ['二人のための', 'ゲーム'],
    '02': ['ルーレットを回して', '運命におまかせ'],
    '03': ['どのカードも', '小さな招待状'],
    '04': ['2つのルート', '各5レベル'],
    '05': ['二人の共有スペース', 'リアルタイム同期'],
    '06': ['12の言語で', '遊べる'],
  },
  ko: {
    '01': ['둘을 위한', '커플 게임'],
    '02': ['룰렛을 돌리면', '운명이 정해요'],
    '03': ['모든 카드는', '작은 초대장'],
    '04': ['두 가지 길,', '각 5단계'],
    '05': ['둘만의 공간,', '실시간 동기화'],
    '06': ['12개 언어로', '함께 즐기세요'],
  },
  'zh-Hant': {
    '01': ['專為兩人', '打造的遊戲'],
    '02': ['轉動轉盤', '讓命運決定'],
    '03': ['每張卡', '都是小小邀請'],
    '04': ['兩條路線', '各有五個等級'],
    '05': ['你們的共享空間', '即時同步'],
    '06': ['支援', '12 種語言'],
  },
  id: {
    '01': ['Game seru', 'untuk berdua'],
    '02': ['Putar rodanya,', 'takdir memilih'],
    '03': ['Setiap kartu,', 'undangan kecil'],
    '04': ['Dua jalur,', 'lima level'],
    '05': ['Ruang berdua,', 'sinkron langsung'],
    '06': ['Main dalam', '12 bahasa'],
  },
  hi: {
    '01': ['दो लोगों के लिए', 'बने खेल'],
    '02': ['पहिया घुमाइए,', 'क़िस्मत चुनेगी'],
    '03': ['हर कार्ड', 'एक छोटा न्योता'],
    '04': ['दो रास्ते,', 'पाँच-पाँच लेवल'],
    '05': ['आपकी साझा जगह,', 'तुरंत सिंक'],
    '06': ['12 भाषाओं में', 'खेलिए'],
  },
  'ar-SA': {
    '01': ['ألعاب صُمّمت', 'لشخصين'],
    '02': ['أدِر العجلة', 'ودع القدر يختار'],
    '03': ['كل بطاقة', 'دعوة صغيرة'],
    '04': ['طريقان،', 'لكلٍّ خمسة مستويات'],
    '05': ['مساحتكما المشتركة', 'متزامنة فورًا'],
    '06': ['العب بـ', '12 لغة'],
  },
};
CAPTIONS['en-GB'] = CAPTIONS['en-US'];
CAPTIONS['es-MX'] = { ...CAPTIONS['es-ES'], '05': ['Su espacio,', 'sincronizado'] };

/**
 * Fredoka has no CJK / Devanagari / Arabic glyphs, so those locales use a
 * bold font: Windows system fonts, plus a bundled Noto Devanagari (on Linux,
 * point the Windows entries at Noto CJK / Arabic).
 */
const WINFONTS = process.env.WINDIR ? path.join(process.env.WINDIR, 'Fonts') : '/usr/share/fonts';
const SYSTEM_FONTS = {
  ja: ['Yu Gothic', path.join(WINFONTS, 'YuGothB.ttc')],
  ko: ['Malgun Gothic', path.join(WINFONTS, 'malgunbd.ttf')],
  'zh-Hant': ['Microsoft JhengHei', path.join(WINFONTS, 'msjhbd.ttc')],
  // Bundled (OFL): Nirmala UI breaks Devanagari mark positioning in resvg.
  hi: ['Noto Sans Devanagari', path.join(ROOT, 'scripts/brand/fonts/NotoSansDevanagari-Bold.ttf')],
  'ar-SA': ['Segoe UI', path.join(WINFONTS, 'segoeuib.ttf')],
};

/** Rough advance width per char in em, to shrink long lines instead of clipping. */
const emWidth = (str) =>
  [...str].reduce((n, c) => n + (/[　-鿿가-힯＀-￯]/.test(c) ? 1 : 0.58), 0);

const TARGETS = {
  ios: { w: 1290, h: 2796, caption: 118, captionTop: 250, phoneTop: 560, side: 120 },
  // App Store Connect's 6.5" slot (shown instead of 6.9" on some versions).
  'ios-6.5': { w: 1284, h: 2778, caption: 117, captionTop: 248, phoneTop: 556, side: 120 },
  play: { w: 1080, h: 1920, caption: 84, captionTop: 170, phoneTop: 380, side: 210 },
};

/** Fraction of the capture height taken by the status bar (iPhone, portrait). */
const STATUS_BAR = 0.053;

/**
 * resvg mis-orders Devanagari (pre-base vowel signs, dropped spaces), so these
 * locales get their caption from Pango/HarfBuzz via sharp's text input instead.
 */
const PANGO = new Set(['hi']);

const captionSize = (t, [l1, l2]) =>
  Math.min(t.caption, Math.floor((t.w * 0.86) / Math.max(emWidth(l1), emWidth(l2))));
const baselines = (t, size) => [t.captionTop + t.caption * 1.08 - size * 0.53, t.captionTop + t.caption * 1.08 + size * 0.54];

async function pangoCaption(t, lines, [family, fontfile]) {
  const size = captionSize(t, lines);
  const layers = [];
  for (const [i, line] of lines.entries()) {
    const glyphs = await sharp({
      text: { text: `<span foreground="white">${esc(line)}</span>`, font: `${family} Bold ${size}`, fontfile, dpi: 72, rgba: true },
    }).png().toBuffer();
    const { width, height } = await sharp(glyphs).metadata();
    const input = i === 0 ? glyphs : await sharp(Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g"><stop offset="0" stop-color="${COLORS.flameB}"/><stop offset="1" stop-color="${COLORS.flameA}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
    )).composite([{ input: glyphs, blend: 'dest-in' }]).png().toBuffer();
    layers.push({ input, left: Math.round((t.w - width) / 2), top: Math.round(baselines(t, size)[i] - size * 0.95) });
  }
  return layers;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function background({ w, h }, [l1, l2], t, phone, family, withText = true) {
  const size = captionSize(t, [l1, l2]);
  const [y1, y2] = baselines(t, size);
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
  ${withText ? `<text x="${w / 2}" y="${y1}" text-anchor="middle" font-family="${family}" font-weight="bold" font-size="${size}" fill="#FFFFFF">${esc(l1)}</text>
  <text x="${w / 2}" y="${y2}" text-anchor="middle" font-family="${family}" font-weight="bold" font-size="${size}" fill="url(#hot)">${esc(l2)}</text>` : ''}
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

  const bg = new Resvg(background(t, caption, t, { x, y, pw, ph, r, bezel }, SYSTEM_FONTS[locale]?.[0] ?? 'Fredoka', !PANGO.has(locale)), {
    font: {
      fontFiles: [FONT, ...(SYSTEM_FONTS[locale] ? [SYSTEM_FONTS[locale][1]] : [])],
      loadSystemFonts: false,
      defaultFontFamily: 'Fredoka',
    },
  }).render().asPng();

  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}"><rect width="${pw}" height="${ph}" rx="${r}" fill="#fff"/></svg>`);
  const screen = await sharp(file)
    .extract({ left: 0, top: crop, width: srcW, height: srcH })
    .resize(pw, ph, { kernel: 'lanczos3' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const out = await sharp(bg)
    .composite([
      ...(PANGO.has(locale) ? await pangoCaption(t, caption, SYSTEM_FONTS[locale]) : []),
      { input: screen, left: x, top: y },
    ])
    .flatten({ background: COLORS.bgSolid })
    .removeAlpha()
    .png()
    .toBuffer();

  const dest = path.join(ROOT, 'store/screenshots', kind, locale, `${num}.png`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return path.relative(ROOT, dest);
}

// Every caption locale gets a set; locales without their own captures reuse en-US.
for (const locale of process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(CAPTIONS)) {
  const dir = fs.existsSync(path.join(RAW, locale)) ? path.join(RAW, locale) : path.join(RAW, 'en-US');
  for (const name of fs.readdirSync(dir).sort()) {
    const m = name.match(/^(\d\d)-.*\.(png|jpe?g)$/i);
    if (!m) continue;
    for (const kind of Object.keys(TARGETS)) {
      console.log(await compose(path.join(dir, name), locale, m[1], kind));
    }
  }
}
