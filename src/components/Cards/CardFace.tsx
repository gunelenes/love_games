import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { Category } from '@/types';
import { darken, lighten, withAlpha } from '@/utils/color';
import { colors } from '@/theme/colors';

type Props = {
  width: number;
  height: number;
  side: 'front' | 'back';
  category?: Category | null;
  prompt?: string;
  style?: ViewStyle;
};

/**
 * Kartın ön yüzü (kategori + prompt) veya arka yüzü (dark gradient + logo).
 * Flip kontrolü parent'ta yapılır; bu bileşen sadece hangi yüzü çizeceğini bilir.
 */
export function CardFace({
  width,
  height,
  side,
  category,
  prompt,
  style,
}: Props) {
  if (side === 'back') {
    return (
      <View style={[styles.container, { width, height }, styles.back, style]}>
        <View style={styles.backGlow} />
        <View style={styles.backInner}>
          <Text style={styles.backEmoji}>💕</Text>
          <Text style={styles.backLabel}>love_games</Text>
        </View>
      </View>
    );
  }

  const cat = category;
  const color = cat?.color ?? colors.accent;
  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: darken(color, 0.15),
          borderColor: withAlpha(lighten(color, 0.4), 0.55),
        },
        styles.front,
        style,
      ]}
    >
      <View
        style={[
          styles.frontGlow,
          { backgroundColor: withAlpha(lighten(color, 0.55), 0.4) },
        ]}
      />
      <View
        style={[
          styles.topLight,
          { backgroundColor: withAlpha('#FFFFFF', 0.18) },
        ]}
      />
      <View
        style={[
          styles.bottomShade,
          { backgroundColor: withAlpha(darken(color, 0.5), 0.55) },
        ]}
      />
      <View style={styles.frontContent}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: withAlpha('#000000', 0.28),
              borderColor: withAlpha('#FFFFFF', 0.18),
            },
          ]}
        >
          <Text style={styles.badgeIcon}>{cat?.icon ?? '✨'}</Text>
          <Text style={styles.badgeName}>{cat?.name ?? 'Kategori'}</Text>
        </View>
        <Text style={styles.prompt}>{prompt ?? ''}</Text>
        <Text style={styles.footerText}>Bir kart daha çek</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
    backfaceVisibility: 'hidden',
  },
  front: {},
  back: {
    backgroundColor: '#12112B',
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlow: {
    position: 'absolute',
    top: '-30%',
    left: '-30%',
    width: '90%',
    height: '90%',
    borderRadius: 300,
    backgroundColor: 'rgba(120, 80, 200, 0.35)',
  },
  backInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  backEmoji: {
    fontSize: 72,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  backLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  frontGlow: {
    position: 'absolute',
    top: '-25%',
    left: '-25%',
    width: '80%',
    height: '80%',
    borderRadius: 300,
  },
  topLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '32%',
  },
  bottomShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  frontContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeIcon: {
    fontSize: 18,
  },
  badgeName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  prompt: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.1,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 4,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  footerText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
