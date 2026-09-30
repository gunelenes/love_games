import type { Level, Track } from '@/types';

export const TRACKS: Track[] = ['romantik', 'cesur'];
export const LEVELS: Level[] = [1, 2, 3, 4, 5];

export const TRACK_META: Record<
  Track,
  { label: string; tagline: string; color: string; icon: string }
> = {
  romantik: {
    label: 'Yakınlık',
    tagline: 'Duygusal + fiziksel dokunuş',
    color: '#FF4D6D',
    icon: '💗',
  },
  cesur: {
    label: 'Keşif',
    tagline: 'Sınırları keşfet',
    color: '#B91C4D',
    icon: '🔥',
  },
};

export const LEVEL_META: Record<
  Track,
  Record<Level, { name: string; hint: string }>
> = {
  romantik: {
    1: { name: 'Fısıltı', hint: 'Flört, göz teması, gizli notlar' },
    2: { name: 'Yakınlık', hint: 'Sarılma, öpücük, kucak' },
    3: { name: 'Sırlar', hint: 'Fantezi paylaşımı, gözü kapalı keşif' },
    4: { name: 'Alev', hint: 'Ateşli anlar, yavaş & derin' },
    5: { name: 'Bağ', hint: 'Derin fiziksel + ruhsal entegrasyon' },
  },
  cesur: {
    1: { name: 'Kıvılcım', hint: 'Kışkırtıcı meydan okumalar' },
    2: { name: 'Işıltı', hint: 'Gözbağı, yavaş soyunma, sensory' },
    3: { name: 'Cesaret', hint: 'Rehber/Öğrenci, light impact' },
    4: { name: 'Zirve', hint: 'Belirlenmiş rol, yapılandırılmış sahne' },
    5: { name: 'Efsane', hint: 'Advanced, ritüel/protokol, deep dynamic' },
  },
};

export const DEFAULT_TRACK: Track = 'romantik';
export const DEFAULT_LEVEL: Level = 1;
