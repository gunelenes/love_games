import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { CardFace } from './CardFace';

type Props = {
  width: number;
  height: number;
  onPress: () => void;
  disabled?: boolean;
  visibleCount?: number;
};

/**
 * Deste — arka arkaya hafif offset ile birkaç kart. Tap edilebilir.
 * On press animasyonu: bir bounce ile "kart çekildi" hissini verir.
 */
export function CardDeck({
  width,
  height,
  onPress,
  disabled = false,
  visibleCount = 4,
}: Props) {
  const scale = useSharedValue(1);
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 14, stiffness: 260 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <Animated.View style={containerStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.wrap,
          {
            width: width + (visibleCount - 1) * 4,
            height: height + (visibleCount - 1) * 4,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        {Array.from({ length: visibleCount }).map((_, i) => {
          const offset = (visibleCount - 1 - i) * 4;
          const rot = ((visibleCount - 1 - i) - (visibleCount - 1) / 2) * 1.5;
          return (
            <View
              key={i}
              style={[
                styles.deckCard,
                {
                  top: offset,
                  left: offset,
                  transform: [{ rotate: `${rot}deg` }],
                },
              ]}
            >
              <CardFace side="back" width={width} height={height} />
            </View>
          );
        })}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  deckCard: {
    position: 'absolute',
  },
});
