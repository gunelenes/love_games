import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import { ConfettiBurst, type ConfettiBurstRef } from '@/components/Confetti/ConfettiBurst';
import { ResultCard } from '@/components/ResultCard/ResultCard';
import { BackButton } from '@/components/ui/BackButton';
import { SettingsButton } from '@/components/ui/SettingsButton';
import { CategoryPanel } from '@/components/Wheel/CategoryPanel';
import { Wheel } from '@/components/Wheel/Wheel';
import { WheelPointer } from '@/components/Wheel/WheelPointer';
import { SpinButton } from '@/components/Wheel/SpinButton';
import { TrackLevelBar } from '@/components/TrackLevelBar/TrackLevelBar';
import { useCategoryPrefs } from '@/hooks/useCategoryPrefs';
import { useContent } from '@/hooks/useContent';
import { usePlayPrefs } from '@/hooks/usePlayPrefs';
import { useWheelSpin } from '@/hooks/useWheelSpin';
import type { RootStackParamList } from '@/navigation/RootNav';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import type { Category } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Wheel'>;

const { width, height } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width - 48, 360);

export function WheelScreen({ navigation }: Props) {
  const { categories } = useContent();
  const play = usePlayPrefs();
  const filteredCategories = React.useMemo(
    () =>
      categories.filter((c) => c.track === play.track && c.level <= play.level),
    [categories, play.track, play.level]
  );
  const prefs = useCategoryPrefs(filteredCategories);
  const [selected, setSelected] = useState<Category | null>(null);
  const [prompt, setPrompt] = useState('');
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const confettiRef = useRef<ConfettiBurstRef | null>(null);

  const handleComplete = useCallback((cat: Category, index: number) => {
    setSelected(cat);
    setWinningIndex(index);
    const nextPrompt =
      cat.prompts[Math.floor(Math.random() * cat.prompts.length)];
    setPrompt(nextPrompt);
    confettiRef.current?.burst();
    setTimeout(() => setCardVisible(true), 450);
  }, []);

  const { rotation, spin, isSpinning } = useWheelSpin({
    categories: prefs.activeCategories,
    onComplete: handleComplete,
  });

  const handleAgain = useCallback(() => {
    setCardVisible(false);
    setWinningIndex(null);
    setTimeout(() => spin(), 260);
  }, [spin]);

  const handleClose = useCallback(() => {
    setCardVisible(false);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setSettingsVisible(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsVisible(false);
    // Clear stale winner index — the active list may have changed.
    setWinningIndex(null);
    setCardVisible(false);
  }, []);

  return (
    <View style={styles.root}>
      <AuroraBackground width={width} height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.goBack()} />
          <SettingsButton
            onPress={handleOpenSettings}
            disabled={isSpinning}
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>ÇARK OYUNU</Text>
          <Text style={styles.title}>Çarkı Çevir</Text>
        </View>

        <TrackLevelBar
          track={play.track}
          level={play.level}
          onTrackChange={play.setTrack}
          onLevelChange={play.setLevel}
          disabled={isSpinning}
        />

        <View style={styles.wheelWrap}>
          <View style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
            <Wheel
              categories={prefs.activeCategories}
              rotation={rotation}
              size={WHEEL_SIZE}
              highlightIndex={winningIndex}
            />

            <View style={styles.pointerWrap} pointerEvents="none">
              <WheelPointer size={28} />
            </View>

            <View style={styles.spinBtnWrap} pointerEvents="box-none">
              <SpinButton
                onPress={spin}
                disabled={isSpinning}
                size={WHEEL_SIZE * 0.28}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          {selected ? (
            <Text style={styles.footerText}>
              Son: <Text style={{ color: selected.color, fontWeight: '700' }}>
                {selected.name}
              </Text>
            </Text>
          ) : (
            <Text style={styles.footerText}>
              Çevirmek için ortadaki butona bas
            </Text>
          )}
        </View>
      </SafeAreaView>

      <ConfettiBurst
        ref={confettiRef}
        originX={width / 2}
        originY={height / 2 - 20}
        width={width}
        height={height}
        count={80}
        colors={
          selected
            ? [selected.color, '#FFD166', '#FFFFFF', '#F472B6', '#A78BFA']
            : undefined
        }
      />

      <ResultCard
        visible={cardVisible}
        category={selected}
        prompt={prompt}
        onClose={handleClose}
        onAgain={handleAgain}
      />

      <CategoryPanel
        visible={settingsVisible}
        onClose={handleCloseSettings}
        prefs={prefs}
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
    paddingTop: 4,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 8,
  },
  eyebrow: {
    ...typography.small,
    color: colors.accent,
    marginBottom: 6,
  },
  title: {
    ...typography.title,
    color: colors.fg,
    marginBottom: 6,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.fgDim,
    textAlign: 'center',
  },
  wheelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pointerWrap: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  spinBtnWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  footerText: {
    ...typography.body,
    color: colors.fgDim,
  },
});
