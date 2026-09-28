import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type Props = {
  onPress: () => void;
  color?: string;
};

export function BackButton({ onPress, color = 'rgba(255,255,255,0.85)' }: Props) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.9, { damping: 14, stiffness: 250 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 200 }))}
        style={styles.btn}
      >
        <View style={styles.circle}>
          <Text style={[styles.arrow, { color }]}>‹</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
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
  arrow: {
    fontSize: 34,
    fontWeight: '400',
    marginTop: -4,
  },
});
