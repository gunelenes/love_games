import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Category } from '@/types';
import { withAlpha } from '@/utils/color';

type Props = {
  categories: Category[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  canDeselect: (id: string) => boolean;
};

export function CategoryChips({
  categories,
  selectedIds,
  onToggle,
  canDeselect,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {categories.map((cat) => {
        const selected = selectedIds.has(cat.id);
        const locked = selected && !canDeselect(cat.id);
        return (
          <CategoryChip
            key={cat.id}
            category={cat}
            selected={selected}
            locked={locked}
            onPress={() => {
              if (locked) {
                void Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning
                );
                return;
              }
              void Haptics.selectionAsync();
              onToggle(cat.id);
            }}
          />
        );
      })}
    </ScrollView>
  );
}

function CategoryChip({
  category,
  selected,
  locked,
  onPress,
}: {
  category: Category;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  const progress = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 220 });
  }, [selected, progress]);

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.06)', withAlpha(category.color, 0.28)]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.12)', withAlpha(category.color, 0.75)]
    ),
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        (scale.value = withSpring(0.94, { damping: 14, stiffness: 260 }))
      }
      onPressOut={() =>
        (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))
      }
    >
      <Animated.View style={[styles.chip, style, locked && styles.chipLocked]}>
        <Text style={styles.chipIcon}>{category.icon}</Text>
        <Text
          style={[
            styles.chipLabel,
            { color: selected ? '#FFFFFF' : 'rgba(255,255,255,0.62)' },
          ]}
        >
          {category.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  chipLocked: {
    // subtle hint that this can't be turned off (min 1 gerekli)
  },
  chipIcon: {
    fontSize: 15,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
