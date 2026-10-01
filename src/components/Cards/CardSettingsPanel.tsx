import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { useCardSelection } from '@/hooks/useCardSelection';
import type { Category } from '@/types';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { withAlpha } from '@/utils/color';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_ACTIVE = 1;

type Props = {
  visible: boolean;
  onClose: () => void;
  selection: ReturnType<typeof useCardSelection>;
  categories: Category[];
};

type ToggleProps = {
  value: boolean;
  color: string;
  disabled?: boolean;
  onToggle: () => void;
};

function Toggle({ value, color, disabled, onToggle }: ToggleProps) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      damping: 18,
      stiffness: 260,
    });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.14)', color]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 22 }],
  }));

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      hitSlop={10}
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <Animated.View style={[toggleStyles.track, trackStyle]}>
        <Animated.View style={[toggleStyles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

export function CardSettingsPanel({
  visible,
  onClose,
  selection,
  categories,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);

  const slideY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideY.value = withSpring(0, {
        damping: 22,
        stiffness: 220,
        mass: 0.9,
      });
      backdropOpacity.value = withTiming(0.65, { duration: 240 });
    } else {
      slideY.value = withTiming(SCREEN_HEIGHT, {
        duration: 260,
        easing: Easing.in(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [visible, slideY, backdropOpacity]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleClose = () => {
    setExpanded(null);
    onClose();
  };

  const handleToggle = (id: string) => {
    const wasActive = selection.selectedIds.has(id);
    if (wasActive && !selection.canDeselect(id)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    void Haptics.selectionAsync();
    selection.toggle(id);
  };

  const handleExpand = (id: string) => {
    void Haptics.selectionAsync();
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            panelStyle,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('cards.settings.title')}</Text>
              <Text style={styles.subtitle}>
                {t('cards.settings.summary', {
                  active: selection.selectedCount,
                  total: categories.length,
                  min: MIN_ACTIVE,
                })}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={12}
            >
              <Text style={styles.closeIcon}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((cat) => {
              const isActive = selection.selectedIds.has(cat.id);
              const isExpanded = expanded === cat.id;
              const cannotDisable = isActive && !selection.canDeselect(cat.id);
              return (
                <Animated.View
                  key={cat.id}
                  layout={LinearTransition.springify()
                    .damping(20)
                    .stiffness(200)}
                  style={[
                    styles.card,
                    {
                      borderColor: isActive
                        ? withAlpha(cat.color, 0.45)
                        : 'rgba(255,255,255,0.06)',
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => handleExpand(cat.id)}
                    style={styles.cardHead}
                  >
                    <View
                      style={[
                        styles.iconBubble,
                        {
                          backgroundColor: withAlpha(
                            cat.color,
                            isActive ? 0.22 : 0.1
                          ),
                          borderColor: withAlpha(
                            cat.color,
                            isActive ? 0.7 : 0.22
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.icon}>{cat.icon}</Text>
                    </View>
                    <View style={styles.cardMiddle}>
                      <Text
                        style={[styles.name, !isActive && styles.textDim]}
                      >
                        {cat.name}
                      </Text>
                      <Text style={styles.count}>
                        {t('cards.settings.promptsCount', {
                          count: cat.prompts.length,
                        })}{' '}
                        {isExpanded ? '▴' : '▾'}
                      </Text>
                    </View>
                    <Toggle
                      value={isActive}
                      color={cat.color}
                      disabled={cannotDisable}
                      onToggle={() => handleToggle(cat.id)}
                    />
                  </Pressable>

                  {isExpanded ? (
                    <Animated.View
                      entering={FadeIn.duration(180)}
                      exiting={FadeOut.duration(120)}
                      style={styles.promptList}
                    >
                      {cat.prompts.map((p, i) => (
                        <View key={i} style={styles.promptRow}>
                          <View
                            style={[
                              styles.promptDot,
                              { backgroundColor: cat.color },
                            ]}
                          />
                          <Text style={styles.promptText}>{p}</Text>
                        </View>
                      ))}
                    </Animated.View>
                  ) : null}

                  {cannotDisable ? (
                    <Text style={styles.lockNote}>
                      {t('cards.settings.lockNote', { min: MIN_ACTIVE })}
                    </Text>
                  ) : null}
                </Animated.View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const toggleStyles = StyleSheet.create({
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  handleBar: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    ...typography.subtitle,
    color: colors.fg,
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...typography.small,
    color: colors.fgDim,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.fg,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '400',
    marginTop: -2,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  cardMiddle: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    ...typography.body,
    color: colors.fg,
    fontWeight: '700',
    fontSize: 16,
  },
  count: {
    ...typography.small,
    color: colors.fgDim,
    marginTop: 2,
  },
  textDim: {
    color: colors.fgDim,
  },
  promptList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  promptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  promptText: {
    ...typography.body,
    color: colors.fg,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  lockNote: {
    ...typography.small,
    color: colors.accent,
    marginTop: 8,
    marginLeft: 56,
    fontStyle: 'italic',
  },
});
