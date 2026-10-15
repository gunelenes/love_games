import type { Pose } from '@/types';

/**
 * Göz Ucuyla / Glimpse deck — half-revealed, suggestive sketches; the
 * description is a prompt that lets imagination finish the frame.
 * Add a card: drop the image into assets/glimpses/ and append an entry.
 */
export const GLIMPSES: Pose[] = [
  {
    id: 'covered-eyes',
    name: 'Kapanan Gözler',
    description:
      'Bir el gözlerini örtüyor, parmaklar dudaklarında. O el şimdi ne yapacak? Partnerinin gözlerini kapat ve göster.',
    image: require('../../assets/glimpses/covered-eyes.jpeg'),
    nameI18n: { en: 'Covered Eyes' },
    descriptionI18n: {
      en: 'A hand over the eyes, fingertips on the lips. What does that hand do next? Cover your partner’s eyes and show them.',
    },
  },
  {
    id: 'lifted-hem',
    name: 'Sıyrılan Kumaş',
    description:
      'Kumaş yukarı sıyrılmış, bir el karında duruyor. Bir sonraki karede o el nerede? Partnerinin üzerinde göster.',
    image: require('../../assets/glimpses/lifted-hem.jpeg'),
    nameI18n: { en: 'Lifted Hem' },
    descriptionI18n: {
      en: 'Fabric pulled up, a hand resting on the stomach. Where is that hand in the next frame? Show it on your partner.',
    },
  },
  {
    id: 'from-behind',
    name: 'Arkadan Sarılış',
    description:
      'Güçlü kollar arkadan sarılmış, bakışı yarı kapalı. Kulağına ne fısıldandı? Aynı cümleyi partnerine fısılda.',
    image: require('../../assets/glimpses/from-behind.jpeg'),
    nameI18n: { en: 'From Behind' },
    descriptionI18n: {
      en: 'Strong arms wrapped from behind, eyes half closed. What was just whispered in her ear? Whisper the same to your partner.',
    },
  },
  {
    id: 'tilted-jaw',
    name: 'Kaldırılan Çene',
    description:
      'Bir el çeneyi nazikçe yukarı kaldırıyor, boyun açıkta. Bu anın bir saniye sonrası nasıl? Kelimeler değil, dudaklar anlatsın.',
    image: require('../../assets/glimpses/tilted-jaw.jpeg'),
    nameI18n: { en: 'Tilted Jaw' },
    descriptionI18n: {
      en: 'A hand gently tilts the jaw up, neck exposed. What happens one second later? Let lips tell it, not words.',
    },
  },
  {
    id: 'hand-in-hair',
    name: 'Saçlardaki El',
    description:
      'Parmaklar saçlara gömülmüş, nefesler birbirine karışmış. Kadrajın dışında kalanı partnerine üç kelimeyle anlat.',
    image: require('../../assets/glimpses/hand-in-hair.jpeg'),
    nameI18n: { en: 'Hand in Hair' },
    descriptionI18n: {
      en: 'Fingers buried in hair, breaths tangled. Describe what lies outside the frame to your partner in three words.',
    },
  },
];
