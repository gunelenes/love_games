import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAgeGate } from '@/hooks/useAgeGate';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { withAlpha } from '@/utils/color';

const { width } = Dimensions.get('window');

export function AgeGateModal() {
  const { accepted, ready, accept } = useAgeGate();
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const visible = ready && !accepted;

  const checkScale = useSharedValue(0);
  React.useEffect(() => {
    checkScale.value = withSpring(checked ? 1 : 0, {
      damping: 14,
      stiffness: 260,
    });
  }, [checked, checkScale]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const submit = async () => {
    if (!checked || submitting) return;
    setSubmitting(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await accept();
    setSubmitting(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🔞</Text>
          <Text style={styles.title}>Yetişkin İçeriği</Text>
          <Text style={styles.body}>
            Bu uygulama <Text style={styles.bold}>18 yaş ve üzeri</Text>{' '}
            yetişkinlere yöneliktir. İçerik cinsel temalar, mahremiyet ve
            kink-yönelimli öneriler barındırır. Devam etmek için:
          </Text>

          <Pressable
            onPress={() => {
              setChecked((c) => !c);
              void Haptics.selectionAsync();
            }}
            style={styles.checkRow}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: checked
                    ? withAlpha(colors.accent, 0.9)
                    : 'rgba(255,255,255,0.35)',
                  backgroundColor: checked
                    ? withAlpha(colors.accent, 0.25)
                    : 'rgba(255,255,255,0.04)',
                },
              ]}
            >
              <Animated.Text style={[styles.checkMark, checkStyle]}>
                ✓
              </Animated.Text>
            </View>
            <Text style={styles.checkLabel}>
              18 yaşından büyüğüm ve karşılıklı rızayla{' '}
              <Text style={styles.bold}>partnerimle</Text> kullanacağım.
            </Text>
          </Pressable>

          <Pressable
            onPress={submit}
            disabled={!checked || submitting}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: colors.accent,
                opacity: checked && !submitting ? 1 : 0.4,
              },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? 'Kaydediliyor…' : 'Kabul Et ve Devam'}
            </Text>
          </Pressable>

          <Text style={styles.footer}>
            Bu onay yalnızca cihazınızda saklanır. Herhangi bir hesap veya
            konum bilgisi gönderilmez.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 14,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  title: {
    ...typography.title,
    fontSize: 22,
    color: colors.fg,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  body: {
    color: colors.fgDim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bold: {
    color: colors.fg,
    fontWeight: '800',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkMark: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  checkLabel: {
    flex: 1,
    color: colors.fg,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  footer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 4,
  },
});
