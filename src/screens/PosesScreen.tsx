import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import {
  ConfettiBurst,
  type ConfettiBurstRef,
} from '@/components/Confetti/ConfettiBurst';
import { BackButton } from '@/components/ui/BackButton';
import { POSES } from '@/data/poses';
import { localizePose } from '@/utils/localizedContent';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { withAlpha } from '@/utils/color';
import type { RootStackParamList } from '@/navigation/RootNav';
import type { Pose } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Poses'>;

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 56, 320);
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.38, 440);

export function PosesScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const confettiRef = useRef<ConfettiBurstRef | null>(null);
  const historyRef = useRef<string[]>([]);
  const drawCountRef = useRef(0);

  const localizedPoses = useMemo(
    () => POSES.map(localizePose),
    // Re-localize when language changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language]
  );

  const [current, setCurrent] = useState<Pose | null>(null);
  const [cardKey, setCardKey] = useState(0);

  const pickPose = useCallback((): Pose | null => {
    if (localizedPoses.length === 0) return null;
    const available = localizedPoses.filter(
      (p) => !historyRef.current.includes(p.id)
    );
    const pool = available.length > 0 ? available : localizedPoses;
    const pose = pool[Math.floor(Math.random() * pool.length)];
    historyRef.current = [...historyRef.current, pose.id].slice(-5);
    return pose;
  }, [localizedPoses]);

  const reveal = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = 0;
    shimmer.value = withTiming(1, {
      duration: 2600,
      easing: Easing.inOut(Easing.quad),
    });
  }, [cardKey, shimmer]);

  const handleDraw = useCallback(() => {
    const pose = pickPose();
    if (!pose) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    drawCountRef.current += 1;
    setCurrent(pose);
    setCardKey(drawCountRef.current);
    reveal.value = 0;
    reveal.value = withSpring(1, { damping: 14, stiffness: 160 });
    confettiRef.current?.burst();
  }, [pickPose, reveal]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [
      { translateY: (1 - reveal.value) * 24 },
      { scale: 0.92 + reveal.value * 0.08 },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.0 + shimmer.value * 0.55 * (1 - shimmer.value) * 4,
    transform: [
      { translateX: -CARD_WIDTH * 0.6 + shimmer.value * CARD_WIDTH * 1.6 },
    ],
  }));

  return (
    <View style={styles.root}>
      <AuroraBackground width={width} height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t('poses.eyebrow')}</Text>
          <Text style={styles.title}>{t('poses.title')}</Text>
          <Text style={styles.subtitle}>{t('poses.subtitle')}</Text>
        </View>

        <View style={styles.cardArea}>
          {current ? (
            <Animated.View style={[styles.cardWrap, cardStyle]} key={cardKey}>
              <PoseCard pose={current} shimmerStyle={shimmerStyle} />
            </Animated.View>
          ) : (
            <View style={styles.hintWrap}>
              <View style={styles.hintCard}>
                <View style={styles.hintInner}>
                  <Text style={styles.hintIcon}>❦</Text>
                  <Text style={styles.hintText}>{t('poses.hint')}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <DrawButton
            onPress={handleDraw}
            label={current ? t('poses.newPose') : t('poses.drawPose')}
          />
        </View>
      </SafeAreaView>

      <ConfettiBurst
        ref={confettiRef}
        originX={width / 2}
        originY={height * 0.4}
        width={width}
        height={height}
        count={40}
        colors={[colors.gold, '#F5E6D3', '#FFFFFF', colors.accent]}
      />
    </View>
  );
}

function PoseCard({
  pose,
  shimmerStyle,
}: {
  pose: Pose;
  shimmerStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardFrame}>
        <View style={styles.imageWrap}>
          <Image
            source={pose.image}
            style={styles.image}
            resizeMode="cover"
          />
          <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none" />
          <View style={styles.imageVignette} pointerEvents="none" />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerOrnament}>❦</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.poseName}>{pose.name}</Text>
          {pose.description ? (
            <Text style={styles.poseDesc}>{pose.description}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function DrawButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          (scale.value = withSpring(0.94, { damping: 14, stiffness: 260 }))
        }
        onPressOut={() =>
          (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))
        }
        style={({ pressed }) => [
          styles.drawBtn,
          {
            opacity: pressed ? 0.95 : 1,
          },
        ]}
      >
        <Text style={styles.drawLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 4,
    alignItems: 'flex-start',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 8,
  },
  eyebrow: {
    ...typography.small,
    color: colors.gold,
    marginBottom: 4,
    letterSpacing: 2.4,
  },
  title: {
    ...typography.title,
    color: colors.fg,
    fontSize: 30,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.fgDim,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FAF6EF',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 14,
  },
  cardFrame: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.gold, 0.55),
    padding: 10,
    overflow: 'hidden',
    backgroundColor: '#FDFAF4',
  },
  imageWrap: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: CARD_WIDTH * 0.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ skewX: '-18deg' }],
  },
  imageVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 24,
    borderColor: 'rgba(255,255,255,0.0)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: withAlpha(colors.gold, 0.5),
  },
  dividerOrnament: {
    color: withAlpha(colors.gold, 0.9),
    fontSize: 14,
  },
  textBlock: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  poseName: {
    color: '#2A1810',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
    marginBottom: 6,
  },
  poseDesc: {
    color: '#5A3F30',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hintWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.gold, 0.35),
    borderStyle: 'dashed',
    backgroundColor: withAlpha('#FAF6EF', 0.06),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  hintInner: {
    alignItems: 'center',
    gap: 16,
  },
  hintIcon: {
    fontSize: 48,
    color: withAlpha(colors.gold, 0.7),
  },
  hintText: {
    color: colors.fgDim,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 16,
    paddingTop: 8,
  },
  drawBtn: {
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 18,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  drawLabel: {
    color: '#2A1810',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
});
