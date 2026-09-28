import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  size?: number;
};

export function SpinButton({ onPress, disabled = false, size = 96 }: Props) {
  const scale = useSharedValue(1);
  const breath = useSharedValue(0);
  const ripple = useSharedValue(0);

  useEffect(() => {
    if (!disabled) {
      breath.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      breath.value = withTiming(0, { duration: 200 });
    }
  }, [disabled, breath]);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * (1 + breath.value * 0.04) },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + breath.value * 0.35,
    transform: [{ scale: 1.0 + breath.value * 0.15 }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 1 - ripple.value,
    transform: [{ scale: 1 + ripple.value * 1.5 }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 260 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const handlePress = () => {
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    onPress();
  };

  return (
    <View style={{ width: size * 1.6, height: size * 1.6, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            backgroundColor: colors.accent,
          },
          haloStyle,
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: 'rgba(255, 255, 255, 0.9)',
          },
          rippleStyle,
        ]}
      />

      <Animated.View style={btnStyle}>
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.btn,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              opacity: disabled ? 0.5 : pressed ? 0.95 : 1,
            },
          ]}
        >
          <View style={[styles.innerRing, { width: size * 0.82, height: size * 0.82, borderRadius: size * 0.41 }]} />
          <Text style={styles.label}>ÇEVİR</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    opacity: 0.4,
  },
  ripple: {
    position: 'absolute',
    borderWidth: 3,
  },
  btn: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.4,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
