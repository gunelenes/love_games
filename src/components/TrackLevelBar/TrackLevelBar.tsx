import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { LEVELS, TRACK_META, TRACKS } from '@/data/tracks';
import { colors } from '@/theme/colors';
import { withAlpha } from '@/utils/color';
import type { Level, Track } from '@/types';

type Props = {
  track: Track;
  level: Level;
  onTrackChange: (t: Track) => void;
  onLevelChange: (l: Level) => void;
  disabled?: boolean;
};

export function TrackLevelBar({
  track,
  level,
  onTrackChange,
  onLevelChange,
  disabled = false,
}: Props) {
  const { t } = useTranslation();
  const trackAccent = TRACK_META[track].color;
  const levelName = t(`tracks.${track}.levels.${level}.name`);
  const levelHint = t(`tracks.${track}.levels.${level}.hint`);

  return (
    <View style={[styles.wrap, disabled && { opacity: 0.55 }]}>
      <View style={styles.trackRow}>
        {TRACKS.map((t) => (
          <TrackChip
            key={t}
            trackKey={t}
            selected={t === track}
            onPress={() => {
              if (disabled) return;
              if (t !== track) {
                void Haptics.selectionAsync();
                onTrackChange(t);
              }
            }}
          />
        ))}
      </View>

      <View style={styles.levelRow}>
        {LEVELS.map((l) => (
          <LevelDot
            key={l}
            n={l}
            selected={l === level}
            accent={trackAccent}
            onPress={() => {
              if (disabled) return;
              if (l !== level) {
                void Haptics.selectionAsync();
                onLevelChange(l);
              }
            }}
          />
        ))}
      </View>

      <Text style={styles.levelName}>
        <Text style={{ color: trackAccent }}>L{level}</Text>
        <Text style={styles.levelSep}> · </Text>
        <Text style={styles.levelBold}>{levelName}</Text>
      </Text>
      <Text style={styles.levelHint}>{levelHint}</Text>
    </View>
  );
}

function TrackChip({
  trackKey,
  selected,
  onPress,
}: {
  trackKey: Track;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const meta = TRACK_META[trackKey];
  const trackLabel = t(`tracks.${trackKey}.label`);
  const trackTagline = t(`tracks.${trackKey}.tagline`);
  const progress = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 220 });
  }, [selected, progress]);

  const inactiveBg = 'rgba(255,255,255,0.05)';
  const inactiveBorder = 'rgba(255,255,255,0.1)';
  const activeBg = withAlpha(meta.color, 0.22);
  const activeBorder = withAlpha(meta.color, 0.65);

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveBg, activeBg]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveBorder, activeBorder]
    ),
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        (scale.value = withSpring(0.95, { damping: 14, stiffness: 260 }))
      }
      onPressOut={() =>
        (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))
      }
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.trackChip, style]}>
        <Text style={styles.trackChipIcon}>{meta.icon}</Text>
        <View>
          <Text
            style={[
              styles.trackChipLabel,
              { color: selected ? '#FFFFFF' : 'rgba(255,255,255,0.65)' },
            ]}
          >
            {trackLabel}
          </Text>
          <Text style={styles.trackChipTagline}>{trackTagline}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function LevelDot({
  n,
  selected,
  accent,
  onPress,
}: {
  n: Level;
  selected: boolean;
  accent: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const activeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * (selected ? 1.15 : 1) }],
  }));
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        (scale.value = withSpring(0.9, { damping: 14, stiffness: 260 }))
      }
      onPressOut={() =>
        (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))
      }
      hitSlop={8}
      style={styles.levelDotWrap}
    >
      <Animated.View
        style={[
          styles.levelDot,
          {
            backgroundColor: selected
              ? accent
              : 'rgba(255,255,255,0.14)',
            borderColor: selected ? accent : 'rgba(255,255,255,0.22)',
          },
          activeStyle,
        ]}
      >
        <Text
          style={[
            styles.levelDotText,
            {
              color: selected ? 'white' : 'rgba(255,255,255,0.65)',
            },
          ]}
        >
          {n}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  trackRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  trackChipIcon: { fontSize: 22 },
  trackChipLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trackChipTagline: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10.5,
    marginTop: 1,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginTop: 2,
  },
  levelDotWrap: {
    padding: 4,
  },
  levelDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  levelDotText: {
    fontSize: 13,
    fontWeight: '900',
  },
  levelName: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 2,
  },
  levelSep: {
    color: 'rgba(255,255,255,0.35)',
  },
  levelBold: {
    color: colors.fg,
    fontWeight: '800',
  },
  levelHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontStyle: 'italic',
  },
});
