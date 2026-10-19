import React from 'react';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArtDeckGame,
  type ArtDeckTheme,
} from '@/components/ArtDeck/ArtDeckGame';
import { colors } from '@/theme/colors';
import { useContent } from '@/hooks/useContent';
import type { RootStackParamList } from '@/navigation/RootNav';

type Props = NativeStackScreenProps<RootStackParamList, 'Poses'>;

// White "gallery print" card with a gold frame.
const POSES_THEME: ArtDeckTheme = {
  accent: colors.gold,
  cardBg: '#FAF6EF',
  frameBg: '#FDFAF4',
  imageBg: '#FFFFFF',
  nameColor: '#2A1810',
  descColor: '#5A3F30',
  buttonBg: colors.gold,
  buttonText: '#2A1810',
  shimmerColor: 'rgba(255,255,255,0.35)',
  hintBg: 'rgba(250,246,239,0.06)',
  confetti: [colors.gold, '#F5E6D3', '#FFFFFF', colors.accent],
};

export function PosesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { poses, loading, refresh } = useContent();
  return (
    <ArtDeckGame
      items={poses}
      loading={loading}
      onRetry={refresh}
      theme={POSES_THEME}
      ornament="❦"
      labels={{
        eyebrow: t('poses.eyebrow'),
        title: t('poses.title'),
        subtitle: t('poses.subtitle'),
        draw: t('poses.drawPose'),
        next: t('poses.newPose'),
        hint: t('poses.hint'),
      }}
      onBack={() => navigation.goBack()}
    />
  );
}
