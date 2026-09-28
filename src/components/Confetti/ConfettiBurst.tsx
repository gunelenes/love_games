import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Group,
  RoundedRect,
  Circle,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

export type ConfettiBurstRef = {
  burst: () => void;
};

type Props = {
  originX: number;
  originY: number;
  width: number;
  height: number;
  count?: number;
  colors?: string[];
  duration?: number;
  gravity?: number;
};

type Particle = {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot0: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
  fadeStart: number;
};

const DEFAULT_COLORS = [
  '#FF4D6D',
  '#FFB84D',
  '#FFD166',
  '#A78BFA',
  '#4ECDC4',
  '#F472B6',
  '#60A5FA',
  '#FFFFFF',
];

function makeParticles(
  count: number,
  originX: number,
  originY: number,
  colors: string[]
): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 260 + Math.random() * 340;
    const upBias = 40 + Math.random() * 120;
    return {
      x0: originX,
      y0: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - upBias,
      rotSpeed: (Math.random() - 0.5) * 14,
      rot0: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 10,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      fadeStart: 1.6 + Math.random() * 0.8,
    };
  });
}

export const ConfettiBurst = forwardRef<ConfettiBurstRef, Props>(
  (
    {
      originX,
      originY,
      width,
      height,
      count = 70,
      colors = DEFAULT_COLORS,
      duration = 3.2,
      gravity = 900,
    },
    ref
  ) => {
    const time = useSharedValue(0);
    const running = useSharedValue(false);
    const [seed, setSeed] = useState(0);

    const particles = useMemo(
      () => makeParticles(count, originX, originY, colors),
      [count, originX, originY, colors, seed]
    );

    useFrameCallback((info) => {
      'worklet';
      if (!running.value) return;
      const dt = (info.timeSincePreviousFrame ?? 16) / 1000;
      time.value += dt;
      if (time.value > duration) {
        running.value = false;
        time.value = 0;
      }
    }, true);

    const burst = useCallback(() => {
      time.value = 0;
      running.value = true;
      setSeed((s) => s + 1);
    }, [time, running]);

    useImperativeHandle(ref, () => ({ burst }), [burst]);

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Canvas style={{ width, height }}>
          {particles.map((p, i) => (
            <ParticleView
              key={`${seed}-${i}`}
              particle={p}
              time={time}
              gravity={gravity}
              duration={duration}
            />
          ))}
        </Canvas>
      </View>
    );
  }
);

ConfettiBurst.displayName = 'ConfettiBurst';

type PVProps = {
  particle: Particle;
  time: ReturnType<typeof useSharedValue<number>>;
  gravity: number;
  duration: number;
};

function ParticleView({ particle, time, gravity, duration }: PVProps) {
  const transform = useDerivedValue(() => {
    const t = time.value;
    const x = particle.x0 + particle.vx * t;
    const y = particle.y0 + particle.vy * t + 0.5 * gravity * t * t;
    return [
      { translateX: x },
      { translateY: y },
      { rotate: particle.rot0 + particle.rotSpeed * t },
    ];
  });

  const opacity = useDerivedValue(() => {
    const t = time.value;
    if (t <= 0) return 0;
    if (t < particle.fadeStart) return 1;
    const fadeSpan = Math.max(0.001, duration - particle.fadeStart);
    return Math.max(0, 1 - (t - particle.fadeStart) / fadeSpan);
  });

  const s = particle.size;
  if (particle.shape === 'rect') {
    return (
      <Group transform={transform} opacity={opacity}>
        <RoundedRect
          x={-s / 2}
          y={-s / 3}
          width={s}
          height={s * 0.55}
          r={2}
          color={particle.color}
        />
      </Group>
    );
  }
  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={0} cy={0} r={s / 2.4} color={particle.color} />
    </Group>
  );
}
