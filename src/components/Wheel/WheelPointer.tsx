import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

type Props = {
  size?: number;
};

export function WheelPointer({ size = 28 }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View
        style={[
          styles.triangle,
          {
            borderLeftWidth: size * 0.6,
            borderRightWidth: size * 0.6,
            borderTopWidth: size,
          },
        ]}
      />
      <View style={styles.stem} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  stem: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginTop: -4,
  },
});
