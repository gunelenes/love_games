import { useCallback, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Category } from '@/types';

type Options = {
  categories: Category[];
  onComplete: (selected: Category, index: number) => void;
  historySize?: number;
};

export function useWheelSpin({
  categories,
  onComplete,
  historySize = 3,
}: Options) {
  const rotation = useSharedValue(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const historyRef = useRef<string[]>([]);

  const n = categories.length;
  const sliceAngle = 360 / n;

  useAnimatedReaction(
    () => Math.floor(rotation.value / sliceAngle),
    (curr, prev) => {
      if (prev !== null && curr !== prev) {
        runOnJS(Haptics.selectionAsync)();
      }
    },
    [sliceAngle]
  );

  const spin = useCallback(() => {
    if (isSpinning) return;
    setIsSpinning(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const available = categories.filter(
      (c) => !historyRef.current.includes(c.id)
    );
    const pool = available.length > 0 ? available : categories;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const targetIndex = categories.findIndex((c) => c.id === target.id);

    const spins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = -targetIndex * sliceAngle;
    const currentMod = ((rotation.value % 360) + 360) % 360;
    let deltaMod = targetAngle - currentMod;
    while (deltaMod > 0) deltaMod -= 360;
    const finalRotation = rotation.value + spins * 360 + deltaMod;

    const finish = () => {
      historyRef.current = [...historyRef.current, target.id].slice(
        -historySize
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSpinning(false);
      onComplete(target, targetIndex);
    };

    const pullBack = rotation.value + 18;

    rotation.value = withSequence(
      withTiming(pullBack, {
        duration: 350,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(finalRotation - 5, {
        duration: 4200,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      }),
      withTiming(finalRotation + 2.5, {
        duration: 260,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(
        finalRotation,
        {
          duration: 260,
          easing: Easing.inOut(Easing.quad),
        },
        (finished) => {
          'worklet';
          if (finished) runOnJS(finish)();
        }
      )
    );
  }, [categories, rotation, sliceAngle, isSpinning, historySize, onComplete]);

  return { rotation, spin, isSpinning };
}
