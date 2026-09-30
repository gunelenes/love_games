import React, { useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import { SettingsModal } from '@/components/Settings/SettingsModal';
import { useRoom } from '@/hooks/useRoom';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { darken, lighten, withAlpha } from '@/utils/color';
import type { RootStackParamList } from '@/navigation/RootNav';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const { width, height } = Dimensions.get('window');

type GameKey = 'Wheel' | 'Dice' | 'BoxList' | 'Cards';

type GameCardData = {
  key: GameKey;
  i18nKey: 'wheel' | 'dice' | 'cards' | 'boxes';
  icon: string;
  color: string;
};

const GAMES: GameCardData[] = [
  { key: 'Wheel', i18nKey: 'wheel', icon: '🎡', color: '#FF4D6D' },
  { key: 'Dice', i18nKey: 'dice', icon: '🎲', color: '#7C3AED' },
  { key: 'Cards', i18nKey: 'cards', icon: '🃏', color: '#F59E0B' },
  { key: 'BoxList', i18nKey: 'boxes', icon: '📦', color: '#10B981' },
];

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { code } = useRoom();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handlePress = (key: GameKey) => {
    if (key === 'BoxList') {
      navigation.navigate(code ? 'BoxList' : 'RoomLobby');
      return;
    }
    navigation.navigate(key);
  };

  return (
    <View style={styles.root}>
      <AuroraBackground width={width} height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => setSettingsOpen(true)}
            style={styles.settingsBtn}
            hitSlop={8}
          >
            <Text style={styles.settingsIcon}>⚙︎</Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.eyebrow}>{t('home.eyebrow')}</Text>
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </View>

        <View style={styles.cards}>
          {GAMES.map((g) => (
            <GameCard
              key={g.key}
              data={g}
              name={t(`games.${g.i18nKey}.name`)}
              tagline={t(`games.${g.i18nKey}.tagline`)}
              onPress={() => handlePress(g.key)}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('home.footer')}</Text>
        </View>
      </SafeAreaView>

      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}

function GameCard({
  data,
  name,
  tagline,
  onPress,
}: {
  data: GameCardData;
  name: string;
  tagline: string;
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
            <Text style={styles.cardName}>{name}</Text>
            <Text style={styles.cardTagline}>{tagline}</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: '400',
    marginTop: -2,
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
