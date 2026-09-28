import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Easing,
  runOnJS,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const FACE_ROT_X = [0, 0, 0, 0, -90, 90];
const FACE_ROT_Y = [0, -90, 180, 90, 0, 0];

const PREP_DURATION = 150;
const RISE_DURATION = 700;
const FALL_DURATION = 800;
const BOUNCE_UP = 200;
const SETTLE_DURATION = 300;
const ROTATION_MAIN = 2000;
const ROTATION_SETTLE = 300;

const GROUND_OVERSHOOT = 22;
const BOUNCE_HEIGHT = -34;

export type DiceAnimState = {
  rotX: SharedValue<number>;
  rotY: SharedValue<number>;
  rotZ: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
};

type ThrowConfig = {
  peakY: number;
  driftX: number;
  spinsX: number;
  spinsY: number;
  spinsZ: number;
};

type Options<TA extends { id: string }, TB extends { id: string }> = {
  facesA: TA[];
  facesB: TB[];
  onComplete: (a: TA, aIdx: number, b: TB, bIdx: number) => void;
  historySize?: number;
};

function computeFinal(current: number, targetTerm: number, spins: number) {
  const currentMod = ((current % 360) + 360) % 360;
  const targetMod = ((targetTerm % 360) + 360) % 360;
  const delta = (targetMod - currentMod + 360) % 360;
  return current + spins * 360 + delta;
}

function pickTarget<T extends { id: string }>(
  list: T[],
  history: string[]
): { target: T; index: number } {
  const available = list.filter((f) => !history.includes(f.id));
  const pool = available.length > 0 ? available : list;
  const target = pool[Math.floor(Math.random() * pool.length)];
  const index = list.findIndex((f) => f.id === target.id);
  return { target, index };
}

function useDiceState(initialX: number, initialY: number): DiceAnimState {
  return {
    rotX: useSharedValue(initialX),
    rotY: useSharedValue(initialY),
    rotZ: useSharedValue(0),
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    scale: useSharedValue(1),
  };
}

function animateDice(
  dice: DiceAnimState,
  targetIndex: number,
  cfg: ThrowConfig,
  onFinish?: () => void
) {
  const targetXTerm = FACE_ROT_X[targetIndex];
  const targetYTerm = FACE_ROT_Y[targetIndex];

  const finalX = computeFinal(dice.rotX.value, targetXTerm, cfg.spinsX);
  const finalY = computeFinal(dice.rotY.value, targetYTerm, cfg.spinsY);
  const finalZ = computeFinal(dice.rotZ.value, 0, cfg.spinsZ);

  // Arc trajectory on translateY: prep → rise → fall past ground → bounce → settle
  dice.translateY.value = withSequence(
    withTiming(-10, {
      duration: PREP_DURATION,
      easing: Easing.out(Easing.quad),
    }),
    withTiming(cfg.peakY, {
      duration: RISE_DURATION,
      easing: Easing.out(Easing.cubic),
    }),
    withTiming(GROUND_OVERSHOOT, {
      duration: FALL_DURATION,
      easing: Easing.in(Easing.cubic),
    }),
    withTiming(BOUNCE_HEIGHT, {
      duration: BOUNCE_UP,
      easing: Easing.out(Easing.quad),
    }),
    withTiming(0, {
      duration: SETTLE_DURATION,
      easing: Easing.inOut(Easing.quad),
    })
  );

  // Sideways drift, coming back a little to center
  dice.translateX.value = withSequence(
    withTiming(0, { duration: PREP_DURATION }),
    withTiming(cfg.driftX, {
      duration: RISE_DURATION + FALL_DURATION,
      easing: Easing.out(Easing.cubic),
    }),
    withTiming(cfg.driftX * 0.65, {
      duration: BOUNCE_UP + SETTLE_DURATION,
      easing: Easing.inOut(Easing.quad),
    })
  );

  // Squash then release
  dice.scale.value = withSequence(
    withTiming(0.85, {
      duration: PREP_DURATION,
      easing: Easing.out(Easing.quad),
    }),
    withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })
  );

  // Rotations — prep back-tilt, then chaotic tumble, then settle to target face
  dice.rotX.value = withSequence(
    withTiming(dice.rotX.value - 20, {
      duration: PREP_DURATION,
      easing: Easing.out(Easing.quad),
    }),
    withTiming(finalX + 10, {
      duration: ROTATION_MAIN,
      easing: Easing.out(Easing.cubic),
    }),
    withTiming(finalX, {
      duration: ROTATION_SETTLE,
      easing: Easing.inOut(Easing.quad),
    })
  );

  dice.rotY.value = withSequence(
    withTiming(dice.rotY.value - 25, {
      duration: PREP_DURATION,
      easing: Easing.out(Easing.quad),
    }),
    withTiming(finalY - 12, {
      duration: ROTATION_MAIN,
      easing: Easing.out(Easing.cubic),
    }),
    withTiming(
      finalY,
      { duration: ROTATION_SETTLE, easing: Easing.inOut(Easing.quad) },
      (finished) => {
        'worklet';
        if (finished && onFinish) runOnJS(onFinish)();
      }
    )
  );

  dice.rotZ.value = withSequence(
    withTiming(dice.rotZ.value + 15, {
      duration: PREP_DURATION,
      easing: Easing.out(Easing.quad),
    }),
    withTiming(finalZ - 6, {
      duration: ROTATION_MAIN,
      easing: Easing.out(Easing.cubic),
    }),
    withTiming(finalZ, {
      duration: ROTATION_SETTLE,
      easing: Easing.inOut(Easing.quad),
    })
  );
}

export function useDualDiceRoll<
  TA extends { id: string },
  TB extends { id: string }
>({ facesA, facesB, onComplete, historySize = 3 }: Options<TA, TB>) {
  const diceA = useDiceState(-15, 25);
  const diceB = useDiceState(-20, -30);

  const [faceIndexA, setFaceIndexA] = useState(0);
  const [faceIndexB, setFaceIndexB] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const historyA = useRef<string[]>([]);
  const historyB = useRef<string[]>([]);
  const cycleAIntRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleBIntRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cycleAIntRef.current) clearInterval(cycleAIntRef.current);
      if (cycleBIntRef.current) clearInterval(cycleBIntRef.current);
    };
  }, []);

  const roll = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const { target: tA, index: iA } = pickTarget(facesA, historyA.current);
    const { target: tB, index: iB } = pickTarget(facesB, historyB.current);

    // Roulette-style content cycling during the roll.
    if (cycleAIntRef.current) clearInterval(cycleAIntRef.current);
    if (cycleBIntRef.current) clearInterval(cycleBIntRef.current);
    cycleAIntRef.current = setInterval(() => {
      setFaceIndexA((f) => (f + 1) % facesA.length);
    }, 85);
    cycleBIntRef.current = setInterval(() => {
      setFaceIndexB((f) => (f + 1) % facesB.length);
    }, 105);

    const finish = () => {
      if (cycleAIntRef.current) {
        clearInterval(cycleAIntRef.current);
        cycleAIntRef.current = null;
      }
      if (cycleBIntRef.current) {
        clearInterval(cycleBIntRef.current);
        cycleBIntRef.current = null;
      }
      setFaceIndexA(iA);
      setFaceIndexB(iB);
      historyA.current = [...historyA.current, tA.id].slice(-historySize);
      historyB.current = [...historyB.current, tB.id].slice(-historySize);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsRolling(false);
      onComplete(tA, iA, tB, iB);
    };

    // A leans left+up, B leans right+up — feel of two dice thrown from a cupped hand
    const cfgA: ThrowConfig = {
      peakY: -170 - Math.random() * 30,
      driftX: -30 - Math.random() * 20,
      spinsX: 3 + Math.floor(Math.random() * 2),
      spinsY: 4 + Math.floor(Math.random() * 2),
      spinsZ: 2 + Math.floor(Math.random() * 2),
    };
    const cfgB: ThrowConfig = {
      peakY: -190 - Math.random() * 30,
      driftX: 25 + Math.random() * 20,
      spinsX: 3 + Math.floor(Math.random() * 2),
      spinsY: 4 + Math.floor(Math.random() * 2),
      spinsZ: 2 + Math.floor(Math.random() * 2),
    };

    animateDice(diceA, iA, cfgA);
    animateDice(diceB, iB, cfgB, finish);
  }, [isRolling, facesA, facesB, historySize, onComplete, diceA, diceB]);

  return { diceA, diceB, faceIndexA, faceIndexB, roll, isRolling };
}
