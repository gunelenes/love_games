import { useCallback, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Easing,
  runOnJS,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Category } from '@/types';

type Options = {
  faces: Category[];
  onComplete: (selected: Category, index: number) => void;
  historySize?: number;
};

const FACE_ROT_X = [0, 0, 0, 0, -90, 90];
const FACE_ROT_Y = [0, -90, 180, 90, 0, 0];

export function useDiceRoll({
  faces,
  onComplete,
  historySize = 3,
}: Options) {
  const rotX = useSharedValue(-15);
  const rotY = useSharedValue(25);
  const [isRolling, setIsRolling] = useState(false);
  const historyRef = useRef<string[]>([]);

  const roll = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const available = faces.filter(
      (f) => !historyRef.current.includes(f.id)
    );
    const pool = available.length > 0 ? available : faces;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const targetIndex = faces.findIndex((f) => f.id === target.id);

    const spinsX = 3 + Math.floor(Math.random() * 3);
    const spinsY = 4 + Math.floor(Math.random() * 3);

    const targetXTerm = FACE_ROT_X[targetIndex];
    const targetYTerm = FACE_ROT_Y[targetIndex];

    const currentXMod = ((rotX.value % 360) + 360) % 360;
    const currentYMod = ((rotY.value % 360) + 360) % 360;
    const targetXMod = ((targetXTerm % 360) + 360) % 360;
    const targetYMod = ((targetYTerm % 360) + 360) % 360;

    const deltaXMod = (targetXMod - currentXMod + 360) % 360;
    const deltaYMod = (targetYMod - currentYMod + 360) % 360;

    const finalX = rotX.value + spinsX * 360 + deltaXMod;
    const finalY = rotY.value + spinsY * 360 + deltaYMod;

    const finish = () => {
      historyRef.current = [...historyRef.current, target.id].slice(
        -historySize
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsRolling(false);
      onComplete(target, targetIndex);
    };

    rotX.value = withSequence(
      withTiming(rotX.value - 20, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(finalX + 8, {
        duration: 2600,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(finalX, {
        duration: 320,
        easing: Easing.inOut(Easing.quad),
      })
    );

    rotY.value = withSequence(
      withTiming(rotY.value - 25, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(finalY - 12, {
        duration: 2600,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(
        finalY,
        {
          duration: 320,
          easing: Easing.inOut(Easing.quad),
        },
        (finished) => {
          'worklet';
          if (finished) runOnJS(finish)();
        }
      )
    );
  }, [faces, rotX, rotY, isRolling, historySize, onComplete]);

  return { rotX, rotY, roll, isRolling };
}
