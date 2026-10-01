import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import {
  ConfettiBurst,
  type ConfettiBurstRef,
} from '@/components/Confetti/ConfettiBurst';
import { BackButton } from '@/components/ui/BackButton';
import { SettingsButton } from '@/components/ui/SettingsButton';
import { CardDeck } from '@/components/Cards/CardDeck';
import { CardFace } from '@/components/Cards/CardFace';
import { CardSettingsPanel } from '@/components/Cards/CardSettingsPanel';
import { FlipCard } from '@/components/Cards/FlipCard';
import { useTranslation } from 'react-i18next';
import { TrackLevelBar } from '@/components/TrackLevelBar/TrackLevelBar';
import { useCardSelection } from '@/hooks/useCardSelection';
import { useContent } from '@/hooks/useContent';
import { usePlayPrefs } from '@/hooks/usePlayPrefs';
import type { RootStackParamList } from '@/navigation/RootNav';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { lighten } from '@/utils/color';
import type { Category } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Cards'>;

const { width, height } = Dimensions.get('window');
// Shrunk from 260/352 so hint + drawn card don't bleed into the level dots
// above or the deck in the footer. Keeps 1.35 aspect, still prominent.
const CARD_WIDTH = Math.min(width - 96, 228);
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.35, 300);
const DECK_SCALE = 0.55;
const DECK_PADDING = 12; // CardDeck'in offset+rotate payı için ekstra
const SCALED_DECK_WIDTH = (CARD_WIDTH + DECK_PADDING) * DECK_SCALE;
const SCALED_DECK_HEIGHT = (CARD_HEIGHT + DECK_PADDING) * DECK_SCALE;

type DrawnCard = {
  key: number;
  category: Category;
  prompt: string;
};

export function CardsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { categories } = useContent();
  const play = usePlayPrefs();
  const filteredCategories = React.useMemo(
    () =>
      categories.filter((c) => c.track === play.track && c.level <= play.level),
    [categories, play.track, play.level]
  );
  const scopeKey = `${play.track}:${play.level}`;
  const selection = useCardSelection(filteredCategories, scopeKey);
  const [drawn, setDrawn] = useState<DrawnCard | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const confettiRef = useRef<ConfettiBurstRef | null>(null);
  const drawCountRef = useRef(0);

  const historyRef = useRef<string[]>([]);

  const pickPrompt = useCallback((): {
    category: Category;
    prompt: string;
  } | null => {
    const pool = selection.selectedCategories;
    if (pool.length === 0) return null;
    const category = pool[Math.floor(Math.random() * pool.length)];
    const available = category.prompts.filter(
      (p) => !historyRef.current.includes(p)
    );
    const promptList = available.length > 0 ? available : category.prompts;
    const prompt =
      promptList[Math.floor(Math.random() * promptList.length)];
    historyRef.current = [...historyRef.current, prompt].slice(-6);
    return { category, prompt };
  }, [selection.selectedCategories]);

  const revealScale = useSharedValue(0);

  const handleDraw = useCallback(() => {
    if (drawing) return;
    const pick = pickPrompt();
    if (!pick) return;
    setDrawing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    drawCountRef.current += 1;
    setDrawn({ key: drawCountRef.current, ...pick });
    // reveal container pop
    revealScale.value = 0;
    revealScale.value = withSpring(1, { damping: 14, stiffness: 180 });
  }, [drawing, pickPrompt, revealScale]);

  const handleFlipDone = useCallback(() => {
    setDrawing(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    confettiRef.current?.burst();
  }, []);

  const handleOpenSettings = useCallback(() => {
    setSettingsVisible(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsVisible(false);
    // Clear stale drawn card — user may have deselected its category.
    setDrawn(null);
  }, []);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealScale.value,
    transform: [{ scale: 0.9 + revealScale.value * 0.1 }],
  }));

  const accent = drawn?.category.color ?? colors.accent;
  const hasSelection = selection.selectedCount > 0;

  return (
    <View style={styles.root}>
      <AuroraBackground width={width} height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.goBack()} />
          <SettingsButton
            onPress={handleOpenSettings}
            disabled={drawing}
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t('cards.eyebrow')}</Text>
          <Text style={styles.title}>{t('cards.title')}</Text>
        </View>

        <TrackLevelBar
          track={play.track}
          level={play.level}
          onTrackChange={play.setTrack}
          onLevelChange={play.setLevel}
          disabled={drawing}
        />

        <View style={styles.cardArea}>
          {drawn ? (
            <Animated.View style={[styles.reveal, revealStyle]}>
              <FlipCard
                key={drawn.key}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                category={drawn.category}
                prompt={drawn.prompt}
                onFlipDone={handleFlipDone}
                liftOffset={0}
              />
            </Animated.View>
          ) : (
            <View style={styles.hintWrap}>
              <View
                style={{
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                  opacity: 0.4,
                }}
              >
                <CardFace
                  side="back"
                  width={CARD_WIDTH}
                  height={CARD_HEIGHT}
                />
              </View>
              <Text style={styles.hintText}>{t('cards.hint')}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.deckWrap}>
            <View
              style={{
                width: SCALED_DECK_WIDTH,
                height: SCALED_DECK_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ transform: [{ scale: DECK_SCALE }] }}>
                <CardDeck
                  width={CARD_WIDTH}
                  height={CARD_HEIGHT}
                  onPress={handleDraw}
                  disabled={drawing || !hasSelection}
                />
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleDraw}
            disabled={drawing || !hasSelection}
            style={[
              styles.drawBtn,
              {
                backgroundColor: accent,
                shadowColor: accent,
                opacity: drawing || !hasSelection ? 0.5 : 1,
              },
            ]}
          >
            <Text style={styles.drawLabel}>
              {drawn ? t('cards.newCard') : t('cards.drawCard')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ConfettiBurst
        ref={confettiRef}
        originX={width / 2}
        originY={height * 0.4}
        width={width}
        height={height}
        count={50}
        colors={
          drawn
            ? [drawn.category.color, '#FFD166', '#FFFFFF', lighten(accent, 0.3)]
            : undefined
        }
      />

      <CardSettingsPanel
        visible={settingsVisible}
        onClose={handleCloseSettings}
        selection={selection}
        categories={filteredCategories}
      />
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 4,
  },
  eyebrow: {
    ...typography.small,
    color: colors.accent,
    marginBottom: 2,
  },
  title: {
    ...typography.title,
    color: colors.fg,
    fontSize: 28,
    marginBottom: 0,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.fgDim,
    fontSize: 13,
    textAlign: 'center',
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  reveal: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintWrap: {
    alignItems: 'center',
    gap: 12,
  },
  hintText: {
    color: colors.fgDim,
    fontSize: 13,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 8,
  },
  deckWrap: {
    height: SCALED_DECK_HEIGHT + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawBtn: {
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 18,
    minWidth: 220,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  drawLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
});
