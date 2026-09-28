import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { darken, lighten, withAlpha } from '@/utils/color';

export type DiceFace = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type DiceProps = {
  faces: DiceFace[];
  /** Index of the face content currently shown on the die. */
  faceIndex: number;
  rotX: SharedValue<number>;
  rotY: SharedValue<number>;
  rotZ: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  size?: number;
};

export function Dice({
  faces,
  faceIndex,
  rotX,
  rotY,
  rotZ,
  translateX,
  translateY,
  scale,
  size = 200,
}: DiceProps) {
  const wrapperSize = size * 1.6;
  const face = faces[faceIndex] ?? faces[0];

  const cubeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateX: `${rotX.value}deg` },
      { rotateY: `${rotY.value}deg` },
      { rotateZ: `${rotZ.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: wrapperSize,
          height: wrapperSize,
          transform: [{ perspective: 1400 }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.face,
          {
            width: size,
            height: size,
            backgroundColor: face.color,
            borderColor: withAlpha(lighten(face.color, 0.4), 0.7),
          },
          cubeStyle,
        ]}
      >
        <View
          style={[
            styles.faceInner,
            { borderColor: withAlpha(darken(face.color, 0.35), 0.6) },
          ]}
        >
          <View
            style={[
              styles.faceGlow,
              {
                backgroundColor: withAlpha(lighten(face.color, 0.55), 0.4),
              },
            ]}
          />
          <View
            style={[
              styles.faceTopLight,
              { backgroundColor: withAlpha('#FFFFFF', 0.2) },
            ]}
          />
          <View
            style={[
              styles.faceBottomShade,
              { backgroundColor: withAlpha(darken(face.color, 0.5), 0.55) },
            ]}
          />
          <Text style={styles.icon}>{face.icon}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {face.name}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  faceInner: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceGlow: {
    position: 'absolute',
    top: '-30%',
    left: '-30%',
    width: '90%',
    height: '90%',
    borderRadius: 200,
  },
  faceTopLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '32%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  faceBottomShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  icon: {
    fontSize: 56,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  name: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    paddingHorizontal: 4,
  },
});
