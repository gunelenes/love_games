import React from 'react';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArtDeckGame,
  type ArtDeckTheme,
} from '@/components/ArtDeck/ArtDeckGame';
import { useContent } from '@/hooks/useContent';
import type { RootStackParamList } from '@/navigation/RootNav';

type Props = NativeStackScreenProps<RootStackParamList, 'Glimpses'>;

// Midnight velvet card with a rose-crimson frame.
const GLIMPSES_THEME: ArtDeckTheme = {
  accent: '#F0507E',
  cardBg: '#1C0F1A',
  frameBg: '#251322',
  imageBg: '#140A12',
  nameColor: '#FBE4EC',
  descColor: '#D9A9BC',
  buttonBg: '#E8366A',
  buttonText: '#FFF4F7',
  shimmerColor: 'rgba(255,200,220,0.22)',
  hintBg: 'rgba(240,80,126,0.06)',
  confetti: ['#F0507E', '#FFB3C7', '#B5179E', '#FFFFFF'],
};

export function GlimpsesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { glimpses, loading, refresh } = useContent();
  return (
    <ArtDeckGame
      items={glimpses}
      loading={loading}
      onRetry={refresh}
      theme={GLIMPSES_THEME}
      ornament="✧"
      labels={{
        eyebrow: t('glimpses.eyebrow'),
        title: t('glimpses.title'),
        subtitle: t('glimpses.subtitle'),
        draw: t('glimpses.draw'),
        next: t('glimpses.next'),
        hint: t('glimpses.hint'),
      }}
      onBack={() => navigation.goBack()}
    />
  );
}
