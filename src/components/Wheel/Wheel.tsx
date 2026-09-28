import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Path,
  RadialGradient,
  Shadow,
  Skia,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { Category } from '@/types';
import { colors } from '@/theme/colors';
import { darken, lighten, withAlpha } from '@/utils/color';

type WheelProps = {
  categories: Category[];
  rotation: SharedValue<number>;
  size?: number;
  highlightIndex?: number | null;
};

const DEG_TO_RAD = Math.PI / 180;
const LABEL_RATIO = 0.62;
const BEAD_COUNT = 24;
const SPARKLE_COUNT = 10;

function makePieSlice(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  sweepDeg: number
) {
  const path = Skia.Path.Make();
  const startRad = startDeg * DEG_TO_RAD;

  const outerOval = {
    x: cx - radius,
    y: cy - radius,
    width: radius * 2,
    height: radius * 2,
  };

  path.moveTo(cx, cy);
  path.lineTo(cx + radius * Math.cos(startRad), cy + radius * Math.sin(startRad));
  path.arcToOval(outerOval, startDeg, sweepDeg, false);
  path.close();

  return path;
}

function makeSparklePath(x: number, y: number, size: number) {
  const p = Skia.Path.Make();
  const s = size;
  const w = s * 0.16;
  p.moveTo(x, y - s);
  p.lineTo(x + w, y - w);
  p.lineTo(x + s, y);
  p.lineTo(x + w, y + w);
  p.lineTo(x, y + s);
  p.lineTo(x - w, y + w);
  p.lineTo(x - s, y);
  p.lineTo(x - w, y - w);
  p.close();
  return p;
}

type SparkleConfig = {
  x: number;
  y: number;
  size: number;
  delay: number;
  path: ReturnType<typeof makeSparklePath>;
};

type SparkleProps = {
  config: SparkleConfig;
  progress: SharedValue<number>;
  color: string;
};

function Sparkle({ config, progress, color }: SparkleProps) {
  const opacity = useDerivedValue(() => {
    const p = progress.value;
    const t = Math.max(0, Math.min(1, (p - config.delay) / 0.35));
    if (t < 0.4) return t / 0.4;
    return Math.max(0, 1 - (t - 0.4) / 0.6);
  });

  const transform = useDerivedValue(() => {
    const p = progress.value;
    const t = Math.max(0, Math.min(1, (p - config.delay) / 0.35));
    const s = t < 0.6 ? (t / 0.6) * 1.15 : 1.15 - ((t - 0.6) / 0.4) * 0.15;
    return [{ scale: s }];
  });

  return (
    <Group
      origin={{ x: config.x, y: config.y }}
      transform={transform}
      opacity={opacity}
    >
      <Path path={config.path} color={color}>
        <BlurMask blur={3} style="solid" />
      </Path>
    </Group>
  );
}

export function Wheel({
  categories,
  rotation,
  size = 320,
  highlightIndex = null,
}: WheelProps) {
  const radius = size / 2;
  const cx = radius;
  const cy = radius;
  const n = categories.length;
  const sliceAngle = 360 / n;
  const hubRadius = radius * 0.19;
  const rimRadius = radius - 4;
  const beadRadius = radius - 14;
  const winner =
    highlightIndex !== null && highlightIndex !== undefined
      ? categories[highlightIndex]
      : null;

  const paths = useMemo(() => {
    return categories.map((_, i) => {
      const startDeg = i * sliceAngle - 90 - sliceAngle / 2;
      return makePieSlice(cx, cy, rimRadius, startDeg, sliceAngle);
    });
  }, [categories, rimRadius, cx, cy, sliceAngle]);

  const separators = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i < n; i++) {
      const angleDeg = i * sliceAngle - 90 - sliceAngle / 2;
      const rad = angleDeg * DEG_TO_RAD;
      p.moveTo(cx, cy);
      p.lineTo(cx + rimRadius * Math.cos(rad), cy + rimRadius * Math.sin(rad));
    }
    return p;
  }, [n, sliceAngle, cx, cy, rimRadius]);

  const beadPositions = useMemo(() => {
    return Array.from({ length: BEAD_COUNT }, (_, i) => {
      const angle = (i / BEAD_COUNT) * 2 * Math.PI - Math.PI / 2;
      return {
        x: cx + beadRadius * Math.cos(angle),
        y: cy + beadRadius * Math.sin(angle),
      };
    });
  }, [cx, cy, beadRadius]);

  const sparkles = useMemo<SparkleConfig[]>(() => {
    return Array.from({ length: SPARKLE_COUNT }, (_, i) => {
      // Winner slice sits at the top (-90°) after landing.
      // Distribute sparkles in a fan around top.
      const angleOffset = (Math.random() - 0.5) * 55;
      const rDist = radius * (0.32 + Math.random() * 0.55);
      const midDeg = -90 + angleOffset;
      const rad = midDeg * DEG_TO_RAD;
      const x = cx + rDist * Math.cos(rad);
      const y = cy + rDist * Math.sin(rad);
      const s = 6 + Math.random() * 12;
      return {
        x,
        y,
        size: s,
        delay: (i / SPARKLE_COUNT) * 0.5,
        path: makeSparklePath(x, y, s),
      };
    });
  }, [cx, cy, radius, highlightIndex]);

  const canvasTransform = useDerivedValue(() => {
    return [{ rotate: rotation.value * DEG_TO_RAD }];
  });

  const labelLayerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Ambient outer glow — a slow pulsing halo always visible
  const ambient = useSharedValue(0);
  useEffect(() => {
    ambient.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [ambient]);

  // Winner reveal pulse — drives dim/glow/sparkle animations
  const revealPulse = useSharedValue(0);
  const sparkleProgress = useSharedValue(0);

  useEffect(() => {
    if (winner) {
      revealPulse.value = 0;
      revealPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
      sparkleProgress.value = 0;
      sparkleProgress.value = withTiming(1, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      revealPulse.value = withTiming(0, { duration: 200 });
      sparkleProgress.value = 0;
    }
  }, [winner, revealPulse, sparkleProgress]);

  // 0 when no winner → non-winner dim not applied
  // grows to 0.55 when winner set
  const dimAlpha = useDerivedValue(() => {
    if (!winner) return 0;
    return 0.55 + revealPulse.value * 0.08;
  });

  const winnerGlowAlpha = useDerivedValue(() => {
    if (!winner) return 0;
    return 0.45 + revealPulse.value * 0.4;
  });

  const ambientGlowAlpha = useDerivedValue(() => {
    if (winner) return 0.15;
    return 0.15 + ambient.value * 0.2;
  });

  // All beads share one pulse — simpler and complies with rules of hooks.
  const beadOpacity = useDerivedValue(() => 0.5 + ambient.value * 0.45);

  const winnerColor = winner?.color ?? colors.accent;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* --- outer ambient glow (behind wheel) --- */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius - 1}
          style="stroke"
          strokeWidth={18}
          color={winnerColor}
          opacity={ambientGlowAlpha}
        >
          <BlurMask blur={22} style="normal" />
        </Circle>

        {/* --- deep drop shadow beneath the wheel disc --- */}
        <Circle cx={cx} cy={cy} r={rimRadius}>
          <Shadow dx={0} dy={16} blur={32} color="rgba(0,0,0,0.65)" />
        </Circle>

        {/* --- rotating slice group --- */}
        <Group origin={{ x: cx, y: cy }} transform={canvasTransform}>
          {categories.map((cat, i) => (
            <Path key={cat.id} path={paths[i]}>
              <RadialGradient
                c={vec(cx, cy)}
                r={rimRadius}
                colors={[
                  lighten(cat.color, 0.5),
                  cat.color,
                  darken(cat.color, 0.35),
                ]}
                positions={[0.1, 0.55, 1]}
              />
            </Path>
          ))}

          {/* Dim overlay on non-winner slices */}
          {winner ? (
            <Group opacity={dimAlpha}>
              {categories.map((cat, i) => {
                if (i === highlightIndex) return null;
                return <Path key={`dim-${cat.id}`} path={paths[i]} color={colors.bg} />;
              })}
            </Group>
          ) : null}

          {/* Winner glow — brighter overlay + colored bleed */}
          {winner && highlightIndex != null ? (
            <Group>
              <Path
                path={paths[highlightIndex]}
                color={lighten(winnerColor, 0.35)}
                opacity={winnerGlowAlpha}
              >
                <BlurMask blur={4} style="solid" />
              </Path>
              <Path
                path={paths[highlightIndex]}
                style="stroke"
                strokeWidth={4}
                color="white"
                opacity={winnerGlowAlpha}
              >
                <BlurMask blur={6} style="solid" />
              </Path>
            </Group>
          ) : null}

          {/* slice separators */}
          <Path
            path={separators}
            style="stroke"
            strokeWidth={1.5}
            color="rgba(255,255,255,0.32)"
          />
        </Group>

        {/* --- bead ring (perimeter accents) --- */}
        {beadPositions.map((b, i) => (
          <Circle
            key={`bead-${i}`}
            cx={b.x}
            cy={b.y}
            r={2.4}
            color={i % 2 === 0 ? colors.gold : 'white'}
            opacity={beadOpacity}
          >
            <BlurMask blur={2} style="solid" />
          </Circle>
        ))}

        {/* --- neon outer border --- */}
        <Circle
          cx={cx}
          cy={cy}
          r={rimRadius}
          style="stroke"
          strokeWidth={4}
        >
          <SweepGradient
            c={vec(cx, cy)}
            colors={[
              winnerColor,
              withAlpha(colors.gold, 0.85),
              'rgba(255,255,255,0.9)',
              winnerColor,
              withAlpha(colors.gold, 0.85),
              'rgba(255,255,255,0.9)',
              winnerColor,
            ]}
          />
          <BlurMask blur={1.5} style="solid" />
        </Circle>

        {/* soft inner rim highlight (top light) */}
        <Circle
          cx={cx}
          cy={cy}
          r={rimRadius - 2}
          style="stroke"
          strokeWidth={1}
          color="rgba(255,255,255,0.18)"
        />

        {/* subtle inner rim shadow */}
        <Circle
          cx={cx}
          cy={cy}
          r={rimRadius - 6}
          style="stroke"
          strokeWidth={1}
          color="rgba(0,0,0,0.35)"
        />

        {/* --- sparkles (only when winner) --- */}
        {winner
          ? sparkles.map((sp, i) => (
              <Sparkle
                key={`sp-${i}`}
                config={sp}
                progress={sparkleProgress}
                color={i % 3 === 0 ? colors.gold : 'white'}
              />
            ))
          : null}

        {/* --- central hub --- */}
        <Circle cx={cx} cy={cy} r={hubRadius}>
          <RadialGradient
            c={vec(cx - hubRadius * 0.3, cy - hubRadius * 0.3)}
            r={hubRadius * 1.4}
            colors={['#2A2A45', colors.card, '#0F0F1F']}
          />
          <Shadow dx={0} dy={3} blur={10} color="rgba(0,0,0,0.55)" />
        </Circle>
        <Circle
          cx={cx}
          cy={cy}
          r={hubRadius}
          style="stroke"
          strokeWidth={1.5}
          color="rgba(255,255,255,0.28)"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={hubRadius - 3}
          style="stroke"
          strokeWidth={1}
          color="rgba(255,255,255,0.1)"
        />
      </Canvas>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, labelLayerStyle]}
      >
        {categories.map((cat, i) => {
          const midDeg = i * sliceAngle - 90;
          const midRad = midDeg * DEG_TO_RAD;
          const r = radius * LABEL_RATIO;
          const x = cx + r * Math.cos(midRad);
          const y = cy + r * Math.sin(midRad);
          return (
            <View
              key={cat.id}
              style={[
                styles.label,
                {
                  left: x - 44,
                  top: y - 32,
                  transform: [{ rotate: `${midDeg + 90}deg` }],
                },
              ]}
            >
              <Text style={styles.icon}>{cat.icon}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {cat.name}
              </Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    width: 88,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
    marginBottom: 2,
  },
  name: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
  },
});
