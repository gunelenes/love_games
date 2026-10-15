import type { Pose } from '@/types';

const PLACEHOLDER = require('../../assets/glimpses/glimpse-placeholder.png');

/**
 * Göz Ucuyla / Glimpse deck — half-revealed, suggestive photos; the
 * description is a prompt that lets imagination finish the frame.
 * All entries share the placeholder for now — drop real photos into
 * assets/glimpses/ and swap each `image` require.
 */
export const GLIMPSES: Pose[] = [
  {
    id: 'open-collar',
    name: 'Açık Yaka',
    description:
      'Bir düğme daha açılsaydı ne görürdün? Partnerine fısıldayarak anlat.',
    image: PLACEHOLDER,
    nameI18n: { en: 'Open Collar' },
    descriptionI18n: {
      en: 'One more button undone — what would you see? Whisper it to your partner.',
    },
  },
  {
    id: 'half-shadow',
    name: 'Yarım Gölge',
    description:
      'Işığın bittiği yerden sonrasını sen tamamla. Gözlerini kapat ve tarif et.',
    image: PLACEHOLDER,
    nameI18n: { en: 'Half Shadow' },
    descriptionI18n: {
      en: 'Finish what lies past the edge of the light. Close your eyes and describe it.',
    },
  },
  {
    id: 'sheet-edge',
    name: 'Çarşaf Kenarı',
    description:
      'Çarşafın altında kalan anı hayal et. Bu sahnenin bir saniye sonrası nasıl?',
    image: PLACEHOLDER,
    nameI18n: { en: 'Edge of the Sheet' },
    descriptionI18n: {
      en: 'Imagine the moment hidden under the sheet. What happens one second later?',
    },
  },
  {
    id: 'bare-shoulder',
    name: 'Çıplak Omuz',
    description:
      'Bu omuzdan aşağı inen ilk öpücük nereye düşerdi? Göster, anlatma.',
    image: PLACEHOLDER,
    nameI18n: { en: 'Bare Shoulder' },
    descriptionI18n: {
      en: 'Where would the first kiss land on its way down from this shoulder? Show, don’t tell.',
    },
  },
  {
    id: 'unfinished-zip',
    name: 'Yarım Fermuar',
    description:
      'Fermuar yolun yarısında kalmış. Kalanını kim, ne kadar yavaş açar?',
    image: PLACEHOLDER,
    nameI18n: { en: 'Unfinished Zip' },
    descriptionI18n: {
      en: 'The zip stopped halfway. Who finishes it — and how slowly?',
    },
  },
  {
    id: 'bitten-lip',
    name: 'Isırılmış Dudak',
    description:
      'Bu bakışın sebebi ne olabilir? Partnerine aynı bakışı yaşatacak bir cümle kur.',
    image: PLACEHOLDER,
    nameI18n: { en: 'Bitten Lip' },
    descriptionI18n: {
      en: 'What caused this look? Say one sentence that would earn the same look from your partner.',
    },
  },
  {
    id: 'steamed-glass',
    name: 'Buğulu Cam',
    description:
      'Camın ardında olanı sadece sen görebiliyorsun. Partnerine üç kelimeyle anlat.',
    image: PLACEHOLDER,
    nameI18n: { en: 'Steamed Glass' },
    descriptionI18n: {
      en: 'Only you can see what’s behind the glass. Describe it to your partner in three words.',
    },
  },
  {
    id: 'trailing-hand',
    name: 'Kayan El',
    description:
      'Bu el bir sonraki karede nerede olurdu? Partnerinin üzerinde göster.',
    image: PLACEHOLDER,
    nameI18n: { en: 'Trailing Hand' },
    descriptionI18n: {
      en: 'Where would this hand be in the next frame? Show it on your partner.',
    },
  },
];
