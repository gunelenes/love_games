import React, { useEffect } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { lighten, withAlpha } from '@/utils/color';
import type { Category } from '@/types';
import { TypewriterText } from './TypewriterText';

type Props = {
  visible: boolean;
  category: Category | null;
  prompt: string;
  onClose: () => void;
  onAgain: () => void;
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 40, 380);

export function ResultCard({
  visible,
  category,
  prompt,
  onClose,
  onAgain,
}: Props) {
  const { t } = useTranslation();
  const enter = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(40);
  const buttonsOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      enter.value = withSpring(1, { damping: 14, stiffness: 120, mass: 0.9 });
      iconScale.value = withDelay(
        250,
        withSequence(
          withSpring(1.15, { damping: 8, stiffness: 180 }),
          withSpring(1, { damping: 12, stiffness: 200 })
        )
      );
      nameOpacity.value = withDelay(
        350,
        withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
      );
      buttonsY.value = withDelay(
        900,
        withSpring(0, { damping: 16, stiffness: 140 })
      );
      buttonsOpacity.value = withDelay(
        900,
        withTiming(1, { duration: 260 })
      );
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      enter.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) });
      iconScale.value = 0;
      nameOpacity.value = 0;
      buttonsY.value = 40;
      buttonsOpacity.value = 0;
      glowPulse.value = 0;
    }
  }, [visible, enter, iconScale, nameOpacity, buttonsY, buttonsOpacity, glowPulse]);

  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(enter.value, [0, 1], [0.82, 1]);
    const translateY = interpolate(enter.value, [0, 1], [40, 0]);
    return {
      opacity: enter.value,
      transform: [{ translateY }, { scale }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glowPulse.value * 0.4,
    transform: [{ scale: 1 + glowPulse.value * 0.05 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: (1 - nameOpacity.value) * 12 }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsY.value }],
  }));

  const accent = category?.color ?? colors.accent;

  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      style={styles.overlay}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View style={[styles.cardWrap, cardStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            { backgroundColor: withAlpha(accent, 0.55) },
            glowStyle,
          ]}
        />
        <View
          style={[
            styles.card,
            { borderColor: withAlpha(accent, 0.55) },
          ]}
        >
          <View
            style={[
              styles.topBar,
              { backgroundColor: withAlpha(accent, 0.9) },
            ]}
          />

          <Animated.View style={[styles.iconWrap, iconStyle]}>
            <View
              style={[
                styles.iconBg,
                {
                  backgroundColor: withAlpha(accent, 0.18),
                  borderColor: withAlpha(accent, 0.5),
                },
              ]}
            >
              <Text style={styles.icon}>{category?.icon ?? '✨'}</Text>
            </View>
          </Animated.View>

          <Animated.Text
            style={[
              styles.name,
              { color: lighten(accent, 0.35) },
              nameStyle,
            ]}
          >
            {category?.name ?? ''}
          </Animated.Text>

          <View style={styles.divider} />

          <View style={styles.promptWrap}>
            {visible ? (
              <TypewriterText
                key={prompt}
                text={prompt}
                style={styles.prompt}
                speed={22}
                startDelay={450}
              />
            ) : (
              <Text style={styles.prompt}> </Text>
            )}
          </View>

          <Animated.View style={[styles.buttons, buttonsStyle]}>
            <Pressable
              style={({ pressed }) => [
                styles.btnGhost,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={onClose}
            >
              <Text style={styles.btnGhostText}>{t('common.close')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                {
                  backgroundColor: accent,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: accent,
                },
              ]}
              onPress={onAgain}
            >
              <Text style={styles.btnPrimaryText}>{t('wheel.spinAgain')}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  cardWrap: {
    width: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
    borderRadius: 200,
    opacity: 0.5,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 28,
    backgroundColor: '#191932',
    borderWidth: 1.5,
    paddingTop: 44,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  iconWrap: {
    marginBottom: 14,
  },
  iconBg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 42,
  },
  name: {
    ...typography.title,
    fontSize: 28,
    marginBottom: 10,
    textAlign: 'center',
  },
  divider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 18,
  },
  promptWrap: {
    minHeight: 108,
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginBottom: 22,
  },
  prompt: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 25,
    color: colors.fg,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnGhostText: {
    color: colors.fgDim,
    fontWeight: '600',
    fontSize: 16,
  },
  btnPrimary: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  btnPrimaryText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
