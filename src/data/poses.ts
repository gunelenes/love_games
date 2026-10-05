import type { Pose } from '@/types';

const SAMPLE = require('../../assets/poses/pose-sample.jpeg');

/**
 * Starter Kama Sutra pose deck. All entries share the sample charcoal
 * sketch for now — swap individual `image` references as new art lands
 * under assets/poses/.
 */
export const POSES: Pose[] = [
  {
    id: 'lotus-embrace',
    name: 'Lotus Kucaklaşması',
    description:
      'Yüz yüze oturun, bacaklar birbirine dolanmış. Nefeslerinizi eşitleyin, alınlarınız değsin.',
    image: SAMPLE,
    nameI18n: {
      en: 'Lotus Embrace',
      de: 'Lotus-Umarmung',
      fr: 'Étreinte du Lotus',
      es: 'Abrazo de Loto',
      it: 'Abbraccio del Loto',
      ja: '蓮の抱擁',
      ko: '연꽃의 포옹',
      'zh-TW': '蓮花擁抱',
      id: 'Pelukan Lotus',
      hi: 'कमल आलिंगन',
      ar: 'عناق اللوتس',
    },
    descriptionI18n: {
      en: 'Sit face to face, legs intertwined. Match your breath, let your foreheads touch.',
    },
  },
  {
    id: 'whispered-arch',
    name: 'Fısıltı Yayı',
    description:
      'Biriniz sırt üstü, diğeri yanında eğilmiş; kulağına yavaşça fısıldar.',
    image: SAMPLE,
    nameI18n: {
      en: 'Whispered Arch',
    },
    descriptionI18n: {
      en: 'One lies back, the other leans in to whisper slowly into their ear.',
    },
  },
  {
    id: 'braided-shoulders',
    name: 'Örülü Omuzlar',
    description:
      'Yan yana oturun, kollar birbirinin omzundan geçer, başlar yaslanır.',
    image: SAMPLE,
    nameI18n: {
      en: 'Braided Shoulders',
    },
    descriptionI18n: {
      en: 'Sit side by side, arms over each other’s shoulders, heads resting.',
    },
  },
  {
    id: 'crescent-wrap',
    name: 'Hilal Sarması',
    description:
      'Biri yan yatar, diğeri arkadan sarılır; nefesler aynı ritimde gider.',
    image: SAMPLE,
    nameI18n: {
      en: 'Crescent Wrap',
    },
    descriptionI18n: {
      en: 'One lies on their side, the other wraps from behind; breath syncs.',
    },
  },
  {
    id: 'mirror-kneel',
    name: 'Ayna Diz Çöküşü',
    description:
      'Karşılıklı diz çökün, avuçlarınızı birleştirin, gözlerinizi kaçırmayın.',
    image: SAMPLE,
    nameI18n: {
      en: 'Mirror Kneel',
    },
    descriptionI18n: {
      en: 'Kneel facing each other, press palms together, hold the gaze.',
    },
  },
  {
    id: 'tide-recline',
    name: 'Gelgit Uzanması',
    description:
      'Biriniz uzanır, diğeri kafasını göğsüne koyar; parmaklar saçta gezer.',
    image: SAMPLE,
    nameI18n: {
      en: 'Tide Recline',
    },
    descriptionI18n: {
      en: 'One reclines; the other rests their head on their chest, fingers drifting through hair.',
    },
  },
  {
    id: 'twin-moons',
    name: 'İkiz Aylar',
    description:
      'Yüz yüze yan yatın; dizler birbirine değer, eller yüzlerde dolaşır.',
    image: SAMPLE,
    nameI18n: {
      en: 'Twin Moons',
    },
    descriptionI18n: {
      en: 'Lie face to face on your sides; knees touch, hands wander across faces.',
    },
  },
  {
    id: 'silk-knot',
    name: 'İpek Düğümü',
    description:
      'Biri bağdaş kurup oturur, diğeri kucağına yerleşir; bacaklar sarılır.',
    image: SAMPLE,
    nameI18n: {
      en: 'Silk Knot',
    },
    descriptionI18n: {
      en: 'One sits cross-legged, the other settles into their lap; legs intertwine.',
    },
  },
];
