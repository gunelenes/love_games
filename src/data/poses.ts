import type { Pose } from '@/types';

/**
 * Pose deck — sketch artwork lives under assets/poses/.
 * Add a pose: drop the image there and append an entry.
 */
export const POSES: Pose[] = [
  {
    id: 'throne',
    name: 'Taht',
    description:
      'Partnerin sırt üstü uzanır, sen dizlerinin üzerinde, onun üstünde yükselirsin. Kontrol tamamen sende; ritmi sen belirle.',
    image: require('../../assets/poses/throne.jpeg'),
    nameI18n: { en: 'The Throne' },
    descriptionI18n: {
      en: 'Your partner lies back while you rise above them on your knees. You hold all the control — set the rhythm.',
    },
  },
  {
    id: 'raised-leg',
    name: 'Yükselen Bacak',
    description:
      'Biri yan yatar, diğeri diz çöküp bir bacağını omzuna doğru kaldırır. Yavaş başlayın, göz temasını bırakmayın.',
    image: require('../../assets/poses/raised-leg.jpeg'),
    nameI18n: { en: 'Raised Leg' },
    descriptionI18n: {
      en: 'One lies on their side, the other kneels and lifts a leg toward their shoulder. Start slow, keep the eye contact.',
    },
  },
  {
    id: 'rider',
    name: 'Binici',
    description:
      'Partnerin uzanır, sen kucağına oturursun; elleri belinde, yön sende. Gözlerini kapat ve sadece hisset.',
    image: require('../../assets/poses/rider.jpeg'),
    nameI18n: { en: 'The Rider' },
    descriptionI18n: {
      en: 'Your partner lies back, you sit astride; their hands on your waist, you lead. Close your eyes and just feel.',
    },
  },
];
