import React from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { darken, lighten, withAlpha } from '@/utils/color';
import type { RootStackParamList } from '@/navigation/RootNav';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const { width, height } = Dimensions.get('window');

type GameCardData = {
  key: 'Wheel' | 'Dice' | 'BoxList';
  name: string;
  tagline: string;
  icon: string;
  color: string;
};

const GAMES: GameCardData[] = [
  {
    key: 'Wheel',
    name: 'Çark',
    tagline: 'Çevir, kategorini bul',
    icon: '🎡',
    color: '#FF4D6D',
  },
  {
    key: 'Dice',
    name: 'Zar',
    tagline: 'At, sürpriz seni bulsun',
    icon: '🎲',
    color: '#7C3AED',
  },
  {
    key: 'BoxList',
    name: 'Kutular',
    tagline: 'Notları karıştır, birbirinize sürpriz yap',
    icon: '📦',
    color: '#10B981',
  },
];

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <AuroraBackground width={width} height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>SEVGİLİLER İÇİN</Text>
          <Text style={styles.title}>Sevgi Oyunları</Text>
          <Text style={styles.subtitle}>
            Birlikte oynayabileceğiniz mini oyunlar
          </Text>
        </View>

        <View style={styles.cards}>
          {GAMES.map((g) => (
            <GameCard
              key={g.key}
              data={g}
              onPress={() => navigation.navigate(g.key)}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Daha fazla oyun yolda ✨</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function GameCard({
  data,
  onPress,
}: {
  data: GameCardData;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 14, stiffness: 260 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 10, stiffness: 200 });
        }}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: darken(data.color, 0.15),
            borderColor: withAlpha(data.color, 0.5),
            shadowColor: data.color,
            opacity: pressed ? 0.96 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.cardGlow,
            { backgroundColor: withAlpha(lighten(data.color, 0.35), 0.35) },
          ]}
        />
        <View style={styles.cardBar}>
          <View
            style={[
              styles.cardBarInner,
              { backgroundColor: withAlpha('#FFFFFF', 0.7) },
            ]}
          />
        </View>
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: withAlpha('#FFFFFF', 0.15),
                borderColor: withAlpha('#FFFFFF', 0.3),
              },
            ]}
          >
            <Text style={styles.icon}>{data.icon}</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardName}>{data.name}</Text>
            <Text style={styles.cardTagline}>{data.tagline}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  eyebrow: {
    ...typography.small,
    color: colors.accent,
    marginBottom: 6,
  },
  title: {
    ...typography.title,
    color: colors.fg,
    fontSize: 38,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.fgDim,
    textAlign: 'center',
  },
  cards: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 18,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    position: 'relative',
    minHeight: 130,
  },
  cardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.6,
  },
  cardBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardBarInner: {
    flex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 42,
  },
  cardText: {
    flex: 1,
  },
  cardName: {
    ...typography.title,
    color: 'white',
    fontSize: 26,
    marginBottom: 4,
  },
  cardTagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
  },
  arrow: {
    fontSize: 40,
    color: 'rgba(255,255,255,0.55)',
    marginRight: 6,
    fontWeight: '300',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  footerText: {
    ...typography.small,
    color: colors.fgDim,
    letterSpacing: 0.8,
  },
});
