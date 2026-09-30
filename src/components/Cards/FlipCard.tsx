import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
 * Reanimated `flip` shared value 0→1 boyunca:
 *   - Kart deste position'dan `liftOffset` kadar yukarı çıkar (yay çizerek)
 *   - rotateY 0→180 ile döner (backface visibility ile ön yüz açılır)
 *   - hafif scale up ile "havada" hissini verir
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
    const rotY = p * 180;
    return {
      transform: [
        { perspective: 1400 },
        { translateY },
        { rotateY: `${rotY}deg` },
        { scale },
      ],
    };
  });

  const frontRotation = { transform: [{ rotateY: '180deg' as const }] };

  return (
    <Animated.View style={[styles.container, { width, height }, containerStyle]}>
      <View style={styles.face}>
        <CardFace side="back" width={width} height={height} />
      </View>
      <View style={[styles.face, frontRotation]}>
        <CardFace
          side="front"
          width={width}
          height={height}
          category={category}
          prompt={prompt}
        />
      </View>
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
