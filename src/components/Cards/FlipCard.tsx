import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { CardFace } from './CardFace';
import type { Category } from '@/types';

type Props = {
  width: number;
  height: number;
  category: Category;
  prompt: string;
  /** Deste'den kartın havalanış mesafesi (deck yukarısına doğru px cinsi) */
  liftOffset?: number;
  /** Draw başlatılana kadar ms cinsi bekleme */
  delayMs?: number;
  onFlipDone?: () => void;
};

/**
 * Deste üstünden havalanıp 3D flip ile açılan kart.
 *
 * ÖNEMLİ: Rotasyon parent'ta değil, her iki yüzde kendi animasyonu olarak
 * uygulanır. Aksi halde iOS'ta `backfaceVisibility: 'hidden'` back face'i
 * saklayamıyor (bug: flip bitince kart arka yüzü mirror'lı görünüyordu).
 * - Back face: rotateY 0° → 180° (sonunda backface, saklanır)
 * - Front face: rotateY 180° → 360° (başta backface, sonunda görünür)
 * Parent sadece translate / scale (lift + arc) uygular.
 */
export function FlipCard({
  width,
  height,
  category,
  prompt,
  liftOffset = 40,
  delayMs = 0,
  onFlipDone,
}: Props) {
  const flip = useSharedValue(0);

  useEffect(() => {
    flip.value = 0;
    flip.value = withDelay(
      delayMs,
      withTiming(
        1,
        { duration: 850, easing: Easing.out(Easing.cubic) },
        (finished) => {
          'worklet';
          if (finished && onFlipDone) runOnJS(onFlipDone)();
        }
      )
    );
  }, [flip, delayMs, onFlipDone]);

  const containerStyle = useAnimatedStyle(() => {
    const p = flip.value;
    const arc = Math.sin(p * Math.PI);
    const translateY = -p * liftOffset - arc * 12;
    const scale = 1 + arc * 0.06;
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { rotateY: `${flip.value * 180}deg` },
    ],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { rotateY: `${flip.value * 180 + 180}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.container, { width, height }, containerStyle]}>
      <Animated.View style={[styles.face, backStyle]}>
        <CardFace side="back" width={width} height={height} />
      </Animated.View>
      <Animated.View style={[styles.face, frontStyle]}>
        <CardFace
          side="front"
          width={width}
          height={height}
          category={category}
          prompt={prompt}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
});
