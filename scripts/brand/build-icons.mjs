/**
 * Wisp & Flame brand assets — "Duo / Violet Pop" logo.
 *
 * Two overlapping flames (the couple); their overlap glows orange.
 * Everything is generated from the shapes below, so a colour or proportion
 * change is one edit + one run.
 *
 * Usage (renderers are not project deps, install them ad hoc):
 *   npm i --no-save @resvg/resvg-js@2.6.2 sharp@0.33.5
 *   node scripts/brand/build-icons.mjs
 *
 * Outputs:
 *   scripts/brand/icon.svg, mark.svg          — vector masters
 *   assets/icon.png                           — iOS/App Store 1024, opaque (Apple rejects alpha)
 *   assets/android-icon-{foreground,background,monochrome}.png — adaptive icon layers
 *   assets/splash-icon.png                    — splash mark (transparent)
 *   assets/favicon.png, docs/favicon.png, docs/apple-touch-icon.png
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = (p) => path.join(ROOT, p);

export const COLORS = {
  bgFrom: '#8E2DE2',
  bgTo: '#4A00E0',
  /** Solid stand-in for the gradient (splash, adaptive icon fallback). */
  bgSolid: '#6C17E1',
  flameA: '#FF4FA3',
  flameB: '#FFD23F',
  overlap: '#FF8A3D',
};

const flame = (cx, tipY, baseY) => {
  const s = (baseY - tipY) / 676;
  const X = (v) => (cx + v * s).toFixed(1), Y = (v) => (tipY + v * s).toFixed(1);
  return `M${X(0)} ${Y(0)} C ${X(92)} ${Y(136)} ${X(212)} ${Y(254)} ${X(212)} ${Y(444)} C ${X(212)} ${Y(572)} ${X(118)} ${Y(676)} ${X(0)} ${Y(676)} C ${X(-118)} ${Y(676)} ${X(-212)} ${Y(572)} ${X(-212)} ${Y(444)} C ${X(-212)} ${Y(340)} ${X(-160)} ${Y(268)} ${X(-104)} ${Y(200)} C ${X(-94)} ${Y(280)} ${X(-64)} ${Y(328)} ${X(-22)} ${Y(342)} C ${X(-50)} ${Y(234)} ${X(-54)} ${Y(116)} ${X(0)} ${Y(0)} Z`;
};
const L = flame(430, 190, 850);
const R = flame(600, 250, 850);
// Optical centre of the pair inside the 1024 box (bbox x 223–788, y 190–850).
const CX = 505.5, CY = 520;

const svg = (body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><defs>${defs}</defs>${body}</svg>\n`;
const bgGradient = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLORS.bgFrom}"/><stop offset="1" stop-color="${COLORS.bgTo}"/></linearGradient>`;
const clip = `<clipPath id="cl"><path d="${L}"/></clipPath>`;
const flames = `<path fill="${COLORS.flameA}" d="${L}"/><path fill="${COLORS.flameB}" d="${R}"/><path fill="${COLORS.overlap}" clip-path="url(#cl)" d="${R}"/>`;
/** Scale the pair about its centre and re-centre it in the box. */
const fit = (scale, inner) =>
  `<g transform="translate(512 512) scale(${scale}) translate(${-CX} ${-CY})">${inner}</g>`;

const files = {
  icon: svg(`<rect width="1024" height="1024" fill="url(#bg)"/>${flames}`, bgGradient + clip),
  mark: svg(fit(1, flames), clip),
  // Android adaptive icon: content must sit inside the 66/108 safe circle.
  fg: svg(fit(0.7, flames), clip),
  bg: svg(`<rect width="1024" height="1024" fill="url(#bg)"/>`, bgGradient),
  mono: svg(fit(0.7, `<path fill="#fff" d="${L}"/><path fill="#fff" d="${R}"/>`)),
  splash: svg(fit(0.92, flames), clip),
};

const png = (s, size) => new Resvg(s, { fitTo: { mode: 'width', value: size } }).render().asPng();
const opaque = (buf) => sharp(buf).flatten({ background: COLORS.bgSolid }).removeAlpha().png().toBuffer();

fs.writeFileSync(out('scripts/brand/icon.svg'), files.icon);
fs.writeFileSync(out('scripts/brand/mark.svg'), files.mark);
fs.writeFileSync(out('assets/icon.png'), await opaque(png(files.icon, 1024)));
fs.writeFileSync(out('assets/android-icon-foreground.png'), png(files.fg, 512));
fs.writeFileSync(out('assets/android-icon-background.png'), await opaque(png(files.bg, 512)));
fs.writeFileSync(out('assets/android-icon-monochrome.png'), png(files.mono, 432));
fs.writeFileSync(out('assets/splash-icon.png'), png(files.splash, 1024));
fs.writeFileSync(out('assets/favicon.png'), await opaque(png(files.icon, 48)));
fs.writeFileSync(out('docs/favicon.png'), await opaque(png(files.icon, 64)));
fs.writeFileSync(out('docs/apple-touch-icon.png'), await opaque(png(files.icon, 180)));
console.log('brand assets written');
