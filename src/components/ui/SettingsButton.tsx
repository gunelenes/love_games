import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type Props = {
  onPress: () => void;
  disabled?: boolean;
};

export function SettingsButton({ onPress, disabled = false }: Props) {
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
          (scale.value = withSpring(0.9, { damping: 14, stiffness: 250 }))
        }
        onPressOut={() =>
          (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))
        }
        style={[styles.btn, disabled && styles.disabled]}
      >
        <View style={styles.circle}>
          <View style={styles.line} />
          <View style={[styles.line, styles.lineMid]} />
          <View style={styles.line} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
  },
  disabled: {
    opacity: 0.4,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginVertical: 2,
  },
  lineMid: {
    width: 12,
  },
});
