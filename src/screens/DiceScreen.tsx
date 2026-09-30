import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import {
  ConfettiBurst,
  type ConfettiBurstRef,
} from '@/components/Confetti/ConfettiBurst';
import { BackButton } from '@/components/ui/BackButton';
import { Dice } from '@/components/Dice/Dice';
import { DiceShadow } from '@/components/Dice/DiceShadow';
import { TypewriterText } from '@/components/ResultCard/TypewriterText';
import { useTranslation } from 'react-i18next';
import { TrackLevelBar } from '@/components/TrackLevelBar/TrackLevelBar';
import { useContent } from '@/hooks/useContent';
import { useDualDiceRoll } from '@/hooks/useDualDiceRoll';
import { usePlayPrefs } from '@/hooks/usePlayPrefs';
import type { RootStackParamList } from '@/navigation/RootNav';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { darken, lighten, withAlpha } from '@/utils/color';
import type { Category, Place, PlaceCategory } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Dice'>;

const { width, height } = Dimensions.get('window');
const DICE_SIZE = Math.min(width * 0.28, 130);
const WRAPPER_SIZE = DICE_SIZE * 1.6;
const SHADOW_HEIGHT = 44;

export function DiceScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { diceFaces, placeCategories } = useContent();
  const play = usePlayPrefs();
  const filteredDiceFaces = React.useMemo(
    () =>
      diceFaces.filter((c) => c.track === play.track && c.level <= play.level),
    [diceFaces, play.track, play.level]
  );
  const filteredPlaceCategories = React.useMemo(
    () =>
      placeCategories.filter(
        (c) => c.track === play.track && c.level <= play.level
      ),
    [placeCategories, play.track, play.level]
  );
  const [action, setAction] = useState<Category | null>(null);
  const [placeCat, setPlaceCat] = useState<PlaceCategory | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [prompt, setPrompt] = useState('');
  const [promptKey, setPromptKey] = useState(0);
  const confettiRef = useRef<ConfettiBurstRef | null>(null);

  const revealProgress = useSharedValue(0);

  const handleComplete = useCallback(
    (act: Category, _actIdx: number, pc: PlaceCategory, _pcIdx: number) => {
      const p = act.prompts[Math.floor(Math.random() * act.prompts.length)];
      const spot = pc.places[Math.floor(Math.random() * pc.places.length)];
      setAction(act);
      setPlaceCat(pc);
      setPlace(spot);
      setPrompt(p);
      setPromptKey((k) => k + 1);
      confettiRef.current?.burst();
    },
    []
  );

  const { diceA, diceB, faceIndexA, faceIndexB, roll, isRolling } =
    useDualDiceRoll({
      facesA: filteredDiceFaces,
      facesB: filteredPlaceCategories,
      onComplete: handleComplete,
    });

  useEffect(() => {
    if (action && placeCat && !isRolling) {
      revealProgress.value = 0;
      revealProgress.value = withTiming(1, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      });
    } else if (isRolling) {
      revealProgress.value = withTiming(0, { duration: 180 });
    }
  }, [action, placeCat, isRolling, revealProgress]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealProgress.value,
    transform: [{ translateY: (1 - revealProgress.value) * 24 }],
  }));

  const accent = placeCat?.color ?? colors.accent;

  return (
    <View style={styles.root}>
      <AuroraBackground width={width} height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t('dice.eyebrow')}</Text>
          <Text style={styles.title}>{t('dice.title')}</Text>
        </View>

        <TrackLevelBar
          track={play.track}
          level={play.level}
          onTrackChange={play.setTrack}
          onLevelChange={play.setLevel}
          disabled={isRolling}
        />

        <View style={styles.diceArea}>
          <View style={styles.diceSlot}>
            <View style={styles.shadowLayer} pointerEvents="none">
              <DiceShadow
                translateX={diceA.translateX}
                translateY={diceA.translateY}
                width={WRAPPER_SIZE}
                height={SHADOW_HEIGHT}
              />
            </View>
            <Dice
              faces={filteredDiceFaces}
              faceIndex={faceIndexA}
              rotX={diceA.rotX}
              rotY={diceA.rotY}
              rotZ={diceA.rotZ}
              translateX={diceA.translateX}
              translateY={diceA.translateY}
              scale={diceA.scale}
              size={DICE_SIZE}
            />
          </View>
          <View style={styles.diceSlot}>
            <View style={styles.shadowLayer} pointerEvents="none">
              <DiceShadow
                translateX={diceB.translateX}
                translateY={diceB.translateY}
                width={WRAPPER_SIZE}
                height={SHADOW_HEIGHT}
              />
            </View>
            <Dice
              faces={filteredPlaceCategories}
              faceIndex={faceIndexB}
              rotX={diceB.rotX}
              rotY={diceB.rotY}
              rotZ={diceB.rotZ}
              translateX={diceB.translateX}
              translateY={diceB.translateY}
              scale={diceB.scale}
              size={DICE_SIZE}
            />
          </View>
        </View>

        <View style={styles.revealArea}>
          <Animated.View style={[styles.revealCard, revealStyle]}>
            {action && placeCat && place ? (
              <>
                <PlacePoster place={place} category={placeCat} />

                <View style={styles.actionRow}>
                  <View
                    style={[
                      styles.actionBadge,
                      {
                        backgroundColor: withAlpha(action.color, 0.18),
                        borderColor: withAlpha(action.color, 0.5),
                      },
                    ]}
                  >
                    <Text style={styles.actionIcon}>{action.icon}</Text>
                    <Text
                      style={[
                        styles.actionName,
                        { color: lighten(action.color, 0.35) },
                      ]}
                    >
                      {action.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.promptWrap}>
                  <TypewriterText
                    key={promptKey}
                    text={prompt}
                    style={styles.prompt}
                    speed={22}
                    startDelay={220}
                  />
                </View>
              </>
            ) : null}
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <RollButton
            onPress={roll}
            disabled={isRolling}
            color={accent}
            label={action ? t('dice.newRoll') : t('dice.rollLabel')}
          />
        </View>
      </SafeAreaView>

      <ConfettiBurst
        ref={confettiRef}
        originX={width / 2}
        originY={height * 0.35}
        width={width}
        height={height}
        count={60}
        colors={
          placeCat
            ? [placeCat.color, '#FFD166', '#FFFFFF', '#F472B6', '#A78BFA']
            : undefined
        }
      />
    </View>
  );
}

function PlacePoster({
  place,
  category,
}: {
  place: Place;
  category: PlaceCategory;
}) {
  return (
    <View style={styles.posterOuter}>
      <View
        style={[
          styles.poster,
          {
            backgroundColor: category.color,
            borderColor: withAlpha(lighten(category.color, 0.4), 0.6),
          },
        ]}
      >
        <View
          style={[
            styles.posterGlow,
            { backgroundColor: withAlpha(lighten(category.color, 0.6), 0.3) },
          ]}
        />
        <View
          style={[
            styles.posterShade,
            { backgroundColor: withAlpha(darken(category.color, 0.4), 0.55) },
          ]}
        />
        <Text style={styles.posterIcon}>{category.icon}</Text>
        <View
          style={[
            styles.posterCatBadge,
            { backgroundColor: withAlpha('#000000', 0.35) },
          ]}
        >
          <Text style={styles.posterCatText}>{category.name}</Text>
        </View>
      </View>
      <Text style={styles.placeName}>{place.name}</Text>
      {place.description ? (
        <Text style={styles.placeDesc}>{place.description}</Text>
      ) : null}
    </View>
  );
}

function RollButton({
  onPress,
  disabled,
  color,
  label,
}: {
  onPress: () => void;
  disabled: boolean;
  color: string;
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
        disabled={disabled}
        onPressIn={() =>
          (scale.value = withSpring(0.94, { damping: 14, stiffness: 260 }))
        }
        onPressOut={() =>
          (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))
        }
        style={({ pressed }) => [
          styles.rollBtn,
          {
            backgroundColor: color,
            shadowColor: color,
            opacity: disabled ? 0.55 : pressed ? 0.95 : 1,
          },
        ]}
      >
        <Text style={styles.rollLabel}>{label}</Text>
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
    paddingBottom: 4,
  },
  eyebrow: {
    ...typography.small,
    color: colors.accent,
    marginBottom: 4,
  },
  title: {
    ...typography.title,
    color: colors.fg,
    marginBottom: 4,
    fontSize: 30,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.fgDim,
    textAlign: 'center',
    fontSize: 14,
  },
  diceArea: {
    height: WRAPPER_SIZE + SHADOW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  diceSlot: {
    width: WRAPPER_SIZE,
    height: WRAPPER_SIZE + SHADOW_HEIGHT,
    position: 'relative',
  },
  shadowLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHADOW_HEIGHT,
  },
  revealArea: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  revealCard: {
    alignItems: 'center',
  },
  posterOuter: {
    alignItems: 'center',
    marginBottom: 12,
  },
  poster: {
    width: 168,
    height: 168,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  posterGlow: {
    position: 'absolute',
    top: '-25%',
    left: '-25%',
    width: '80%',
    height: '80%',
    borderRadius: 200,
  },
  posterShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  posterIcon: {
    fontSize: 70,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  posterCatBadge: {
    position: 'absolute',
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  posterCatText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  placeName: {
    marginTop: 12,
    color: colors.fg,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  placeDesc: {
    marginTop: 4,
    color: colors.fgDim,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 12,
  },
  actionRow: {
    marginTop: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  promptWrap: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  prompt: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.fg,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 16,
    paddingTop: 8,
  },
  rollBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  rollLabel: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
});
