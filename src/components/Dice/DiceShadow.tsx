import React from 'react';
import {
  BlurMask,
  Canvas,
  Group,
  Oval,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

type Props = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  width: number;
  height: number;
  maxHeight?: number;
  color?: string;
};

/**
 * Blurred ground shadow that syncs with the dice's arc.
 * As the dice rises (translateY becomes more negative), the shadow grows
 * larger and softer; as it lands, it shrinks and sharpens.
 */
export function DiceShadow({
  translateX,
  translateY,
  width,
  height,
  maxHeight = 200,
  color = 'rgba(0,0,0,0.55)',
}: Props) {
  const cx = width / 2;
  const cy = height * 0.75;
  const rx = width * 0.28;
  const ry = height * 0.24;

  const ovalX = cx - rx;
  const ovalY = cy - ry;
  const ovalW = rx * 2;
  const ovalH = ry * 2;

  const transform = useDerivedValue(() => {
    const h = Math.max(0, -translateY.value);
    const t = Math.min(1, h / maxHeight);
    const scale = 1 + t * 0.6;
    return [{ translateX: translateX.value }, { scale }];
  });

  const opacity = useDerivedValue(() => {
    const h = Math.max(0, -translateY.value);
    const t = Math.min(1, h / maxHeight);
    return 0.55 - t * 0.4;
  });

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Group origin={{ x: cx, y: cy }} transform={transform} opacity={opacity}>
        <Oval x={ovalX} y={ovalY} width={ovalW} height={ovalH} color={color}>
          <BlurMask blur={14} style="normal" />
        </Oval>
      </Group>
    </Canvas>
  );
}
