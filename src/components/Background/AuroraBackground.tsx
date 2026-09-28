import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Blur,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

type Props = {
  width: number;
  height: number;
};

export function AuroraBackground({ width, height }: Props) {
  const time = useSharedValue(0);

  useFrameCallback((info) => {
    'worklet';
    time.value += (info.timeSincePreviousFrame ?? 16) / 1000;
  }, true);

  const cx1 = useDerivedValue(() => width * 0.25 + Math.sin(time.value * 0.28) * 80);
  const cy1 = useDerivedValue(() => height * 0.28 + Math.cos(time.value * 0.32) * 70);

  const cx2 = useDerivedValue(() => width * 0.78 + Math.sin(time.value * 0.24 + 1.5) * 90);
  const cy2 = useDerivedValue(() => height * 0.35 + Math.cos(time.value * 0.19 + 2.2) * 80);

  const cx3 = useDerivedValue(() => width * 0.5 + Math.sin(time.value * 0.16 + 3.1) * 110);
  const cy3 = useDerivedValue(() => height * 0.72 + Math.cos(time.value * 0.22 + 0.8) * 90);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ width, height }}>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={['#0B0B18', '#151530', '#0F0F22']}
          />
        </Rect>
        <Group>
          <Blur blur={70} />
          <Circle cx={cx1} cy={cy1} r={width * 0.42} color="#7C3AED" opacity={0.55} />
          <Circle cx={cx2} cy={cy2} r={width * 0.36} color="#EC4899" opacity={0.5} />
          <Circle cx={cx3} cy={cy3} r={width * 0.44} color="#3B82F6" opacity={0.45} />
        </Group>
        <Rect x={0} y={0} width={width} height={height} color="rgba(11, 11, 24, 0.35)" />
      </Canvas>
    </View>
  );
}
