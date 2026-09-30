import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import { BackButton } from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { useRoom } from '@/hooks/useRoom';
import { createRoom, joinRoom } from '@/services/roomService';
import type { RootStackParamList } from '@/navigation/RootNav';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { withAlpha } from '@/utils/color';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomLobby'>;

const { width, height } = Dimensions.get('window');

type Mode = 'idle' | 'creating' | 'joining';

export function RoomLobbyScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { uid, ready: authReady } = useAuth();
  const { setCode } = useRoom();
  const [mode, setMode] = useState<Mode>('idle');
  const [code, setCodeInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const goToBoxes = async (roomCode: string) => {
    await setCode(roomCode);
    navigation.replace('BoxList');
  };

  const handleCreate = async () => {
    if (!uid) {
      setError(t('boxes.identityWait'));
      return;
    }
    setBusy(true);
    setError(null);
    const res = await createRoom(uid);
    setBusy(false);
    if (res.status === 'ok') {
      setCreatedCode(res.code);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setError(res.message);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleUseCreated = async () => {
    if (!createdCode) return;
    await goToBoxes(createdCode);
  };

  const handleJoin = async () => {
    if (!uid) {
      setError(t('boxes.identityWait'));
      return;
    }
    setBusy(true);
    setError(null);
    const res = await joinRoom(code, uid);
    setBusy(false);
    if (res.status === 'ok') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await goToBoxes(res.code);
      return;
    }
    if (res.status === 'not_found') {
      setError(t('boxes.roomNotFound'));
    } else if (res.status === 'full') {
      setError(t('boxes.roomFull'));
    } else {
      setError(res.message);
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return (
    <View style={styles.root}>
      <AuroraBackground width={width} height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{t('boxes.lobbyEyebrow')}</Text>
            <Text style={styles.title}>{t('boxes.lobbyTitle')}</Text>
            <Text style={styles.subtitle}>{t('boxes.lobbySubtitle')}</Text>
          </View>

          {!authReady ? (
            <View style={styles.centerHint}>
              <Text style={styles.hintText}>{t('app.loading')}</Text>
            </View>
          ) : mode === 'idle' && !createdCode ? (
            <View style={styles.body}>
              <BigCard
                accent="#7C3AED"
                icon="✨"
                title={t('boxes.createNew')}
                sub={t('boxes.createNewSub')}
                onPress={() => setMode('creating')}
                disabled={busy}
              />
              <BigCard
                accent="#10B981"
                icon="🔑"
                title={t('boxes.join')}
                sub={t('boxes.joinSub')}
                onPress={() => setMode('joining')}
                disabled={busy}
              />
            </View>
          ) : mode === 'creating' && !createdCode ? (
            <View style={styles.body}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('boxes.createNew')}</Text>
                <Text style={styles.cardText}>{t('boxes.createNewSub')}</Text>
                <Pressable
                  onPress={handleCreate}
                  disabled={busy}
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: '#7C3AED', opacity: busy ? 0.55 : 1 },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {busy ? t('boxes.generatingCode') : t('boxes.generateCode')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode('idle')}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkText}>{t('boxes.back')}</Text>
                </Pressable>
              </View>
            </View>
          ) : createdCode ? (
            <View style={styles.body}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('boxes.codeReadyTitle')}</Text>
                <Text style={styles.cardText}>{t('boxes.codeReadyText')}</Text>
                <View
                  style={[
                    styles.codeBox,
                    { borderColor: withAlpha('#7C3AED', 0.6) },
                  ]}
                >
                  <Text style={styles.codeText} selectable>
                    {createdCode}
                  </Text>
                </View>
                <Pressable
                  onPress={handleUseCreated}
                  style={[styles.primaryBtn, { backgroundColor: '#7C3AED' }]}
                >
                  <Text style={styles.primaryBtnText}>{t('boxes.goToBoxes')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.body}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('boxes.joinTitle')}</Text>
                <Text style={styles.cardText}>{t('boxes.joinText')}</Text>
                <TextInput
                  value={code}
                  onChangeText={(txt) =>
                    setCodeInput(txt.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))
                  }
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="ABCD23"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={[
                    styles.codeInput,
                    { borderColor: withAlpha('#10B981', 0.6) },
                  ]}
                  maxLength={6}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Pressable
                  onPress={handleJoin}
                  disabled={busy || code.length !== 6}
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: '#10B981',
                      opacity: busy || code.length !== 6 ? 0.55 : 1,
                    },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {busy ? t('boxes.joining') : t('boxes.joinBtn')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMode('idle');
                    setError(null);
                    setCodeInput('');
                  }}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkText}>{t('boxes.back')}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {error && mode !== 'joining' ? (
            <Text style={[styles.errorText, { textAlign: 'center' }]}>
              {error}
            </Text>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function BigCard({
  accent,
  icon,
  title,
  sub,
  onPress,
  disabled,
}: {
  accent: string;
  icon: string;
  title: string;
  sub: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.bigCard,
        {
          borderColor: withAlpha(accent, 0.6),
          backgroundColor: withAlpha(accent, 0.14),
          opacity: pressed ? 0.85 : disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={styles.bigCardIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.bigCardTitle}>{title}</Text>
        <Text style={styles.bigCardSub}>{sub}</Text>
      </View>
      <Text style={styles.bigCardArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingTop: 4 },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  eyebrow: {
    ...typography.small,
    color: colors.accent,
    marginBottom: 6,
  },
  title: {
    ...typography.title,
    color: colors.fg,
    fontSize: 26,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.fgDim,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  centerHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: { color: colors.fgDim, fontSize: 13 },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
  },
  bigCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  bigCardIcon: { fontSize: 40 },
  bigCardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 3,
  },
  bigCardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  bigCardArrow: { color: 'rgba(255,255,255,0.5)', fontSize: 32 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  cardTitle: {
    color: colors.fg,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardText: {
    color: colors.fgDim,
    fontSize: 13,
    lineHeight: 18,
  },
  codeBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  codeText: {
    color: colors.fg,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeInput: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    textAlign: 'center',
    color: colors.fg,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  linkBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  linkText: {
    color: colors.fgDim,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
