import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import {
  ConfettiBurst,
  type ConfettiBurstRef,
} from '@/components/Confetti/ConfettiBurst';
import { BackButton } from '@/components/ui/BackButton';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { withAlpha } from '@/utils/color';
import type { Pose } from '@/types';

/**
 * Shared "art card" deck used by Poses and Glimpses: draw from a
 * shuffle bag (every card once per round, then a fresh shuffle),
 * reveal with spring + shimmer +
 * confetti. Each game only supplies its items, i18n namespace and a
 * colour theme. Items arrive already localized from useContent; their
 * art is a remote Storage URL, so the deck has loading + offline states.
 */

export type ArtDeckTheme = {
  /** Eyebrow, ornaments, frame + hint borders */
  accent: string;
  /** Outer card body */
  cardBg: string;
  /** Inner framed area */
  frameBg: string;
  /** Behind the image while it loads */
  imageBg: string;
  nameColor: string;
  descColor: string;
  buttonBg: string;
  buttonText: string;
  shimmerColor: string;
  hintBg: string;
  confetti: string[];
};

export type ArtDeckLabels = {
  eyebrow: string;
  title: string;
  subtitle: string;
  draw: string;
  next: string;
  hint: string;
};

type Props = {
  items: Pose[];
  /** Content provider is still on its first cloud fetch. */
  loading: boolean;
  onRetry: () => Promise<void>;
  labels: ArtDeckLabels;
  /** Keep this a module-level constant — styles are memoized on identity. */
  theme: ArtDeckTheme;
  ornament?: string;
  onBack: () => void;
};

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 56, 320);
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.38, 440);

export function ArtDeckGame({
  items,
  loading,
  onRetry,
  labels,
  theme,
  ornament = '❦',
  onBack,
}: Props) {
  const { t } = useTranslation();
  const confettiRef = useRef<ConfettiBurstRef | null>(null);
  // Ids still to be drawn this round, in draw order.
  const bagRef = useRef<string[]>([]);
  // Ids already drawn this round — keeps cards added mid-round from
  // re-dealing ones the couple has already seen.
  const drawnRef = useRef<Set<string>>(new Set());
  const lastIdRef = useRef<string | null>(null);
  const drawCountRef = useRef(0);

  const themed = useMemo(() => makeThemedStyles(theme), [theme]);

  const [current, setCurrent] = useState<Pose | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const pickItem = useCallback((): Pose | null => {
    if (items.length === 0) return null;
    const byId = new Map(items.map((p) => [p.id, p]));

    // Content may have changed since the bag was dealt (admin edit,
    // cloud refresh): drop removed cards, slot new ones in at random.
    const bag = bagRef.current.filter((id) => byId.has(id));
    for (const p of items) {
      if (!bag.includes(p.id) && !drawnRef.current.has(p.id)) {
        bag.splice(Math.floor(Math.random() * (bag.length + 1)), 0, p.id);
      }
    }

    if (bag.length === 0) {
      // Round over — reshuffle everything, but never open the new round
      // with the card that just closed the previous one.
      drawnRef.current = new Set();
      bag.push(...shuffle(items.map((p) => p.id)));
      if (bag.length > 1 && bag[0] === lastIdRef.current) {
        const j = 1 + Math.floor(Math.random() * (bag.length - 1));
        [bag[0], bag[j]] = [bag[j], bag[0]];
      }
    }

    const id = bag.shift()!;
    bagRef.current = bag;
    drawnRef.current.add(id);
    lastIdRef.current = id;
    return byId.get(id)!;
  }, [items]);

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
    const item = pickItem();
    if (!item) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    drawCountRef.current += 1;
    setCurrent(item);
    setCardKey(drawCountRef.current);
    reveal.value = 0;
    reveal.value = withSpring(1, { damping: 14, stiffness: 160 });
    confettiRef.current?.burst();
  }, [pickItem, reveal]);

  const empty = items.length === 0;
  const waiting = loading || retrying;

  const handleRetry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }, [onRetry, retrying]);

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
          <BackButton onPress={onBack} />
        </View>

        <View style={styles.header}>
          <Text style={[styles.eyebrow, themed.eyebrow]}>{labels.eyebrow}</Text>
          <Text style={styles.title}>{labels.title}</Text>
          <Text style={styles.subtitle}>{labels.subtitle}</Text>
        </View>

        <View style={styles.cardArea}>
          {current ? (
            <Animated.View style={[styles.cardWrap, cardStyle]} key={cardKey}>
              <ArtCard
                item={current}
                ornament={ornament}
                themed={themed}
                shimmerStyle={shimmerStyle}
              />
            </Animated.View>
          ) : (
            <View style={styles.hintWrap}>
              <View style={[styles.hintCard, themed.hintCard]}>
                <View style={styles.hintInner}>
                  <Text style={[styles.hintIcon, themed.hintIcon]}>
                    {ornament}
                  </Text>
                  <Text style={styles.hintText}>
                    {!empty
                      ? labels.hint
                      : waiting
                        ? t('artDeck.loading')
                        : t('artDeck.offline')}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <DrawButton
            onPress={empty ? handleRetry : handleDraw}
            label={
              empty ? t('artDeck.retry') : current ? labels.next : labels.draw
            }
            disabled={empty && waiting}
            themed={themed}
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
        colors={theme.confetti}
      />
    </View>
  );
}

/** Fisher–Yates, returns a new array. */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type ThemedStyles = ReturnType<typeof makeThemedStyles>;

function ArtCard({
  item,
  ornament,
  themed,
  shimmerStyle,
}: {
  item: Pose;
  ornament: string;
  themed: ThemedStyles;
  shimmerStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  return (
    <View style={[styles.card, themed.card]}>
      <View style={[styles.cardFrame, themed.cardFrame]}>
        <View style={[styles.imageWrap, themed.imageWrap]}>
          <Image
            source={item.image}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={item.id}
            transition={220}
          />
          <Animated.View
            style={[styles.shimmer, themed.shimmer, shimmerStyle]}
            pointerEvents="none"
          />
          <View style={styles.imageVignette} pointerEvents="none" />
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, themed.dividerLine]} />
          <Text style={[styles.dividerOrnament, themed.dividerOrnament]}>
            {ornament}
          </Text>
          <View style={[styles.dividerLine, themed.dividerLine]} />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.itemName, themed.itemName]}>{item.name}</Text>
          {item.description ? (
            <Text style={[styles.itemDesc, themed.itemDesc]}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function DrawButton({
  onPress,
  label,
  disabled,
  themed,
}: {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  themed: ThemedStyles;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() =>
          (scale.value = withSpring(0.94, { damping: 14, stiffness: 260 }))
        }
        onPressOut={() =>
          (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))
        }
        style={({ pressed }) => [
          styles.drawBtn,
          themed.drawBtn,
          { opacity: disabled ? 0.5 : pressed ? 0.95 : 1 },
        ]}
      >
        <Text style={[styles.drawLabel, themed.drawLabel]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// Colour-only styles, computed once per theme (outside any worklet).
function makeThemedStyles(t: ArtDeckTheme) {
  return StyleSheet.create({
    eyebrow: { color: t.accent },
    card: { backgroundColor: t.cardBg },
    cardFrame: {
      borderColor: withAlpha(t.accent, 0.55),
      backgroundColor: t.frameBg,
    },
    imageWrap: { backgroundColor: t.imageBg },
    shimmer: { backgroundColor: t.shimmerColor },
    dividerLine: { backgroundColor: withAlpha(t.accent, 0.5) },
    dividerOrnament: { color: withAlpha(t.accent, 0.9) },
    itemName: { color: t.nameColor },
    itemDesc: { color: t.descColor },
    hintCard: {
      borderColor: withAlpha(t.accent, 0.35),
      backgroundColor: t.hintBg,
    },
    hintIcon: { color: withAlpha(t.accent, 0.7) },
    drawBtn: { backgroundColor: t.buttonBg, shadowColor: t.buttonBg },
    drawLabel: { color: t.buttonText },
  });
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
    padding: 10,
    overflow: 'hidden',
  },
  imageWrap: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
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
  },
  dividerOrnament: {
    fontSize: 14,
  },
  textBlock: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  itemName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
    marginBottom: 6,
  },
  itemDesc: {
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
    borderStyle: 'dashed',
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  drawLabel: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
});
