/**
 * Public legal / support pages (GitHub Pages, docs/). Each page carries an
 * English section and a Turkish one at #tr.
 */
const BASE = 'https://gunelenes.github.io/love_games/';

export type LegalPage = 'terms' | 'privacy' | 'support';

export function legalUrl(page: LegalPage, language: string): string {
  return `${BASE}${page}/${language.startsWith('tr') ? '#tr' : ''}`;
}
