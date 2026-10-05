import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuroraBackground } from '@/components/Background/AuroraBackground';
import { BackButton } from '@/components/ui/BackButton';
import {
  SUBMISSION_LIMITS,
  submitFeedback,
  type SubmissionKind,
} from '@/services/submissionService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { withAlpha } from '@/utils/color';
import type { RootStackParamList } from '@/navigation/RootNav';

type SubmissionRouteName = 'Suggestions' | 'Fantasies';
type Props = NativeStackScreenProps<RootStackParamList, SubmissionRouteName>;

const { width, height } = Dimensions.get('window');

const KIND_BY_ROUTE: Record<SubmissionRouteName, SubmissionKind> = {
  Suggestions: 'suggestions',
  Fantasies: 'fantasies',
};

const ACCENT_BY_ROUTE: Record<SubmissionRouteName, string> = {
  Suggestions: '#5EA7FF',
  Fantasies: '#E26AA6',
};

export function SubmissionScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const routeName = route.name as SubmissionRouteName;
  const kind = KIND_BY_ROUTE[routeName];
  const accent = ACCENT_BY_ROUTE[routeName];
  const i18nBase = routeName === 'Suggestions' ? 'suggestions' : 'fantasies';

  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>(
    'idle'
  );
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const shake = useSharedValue(0);
  const doneScale = useSharedValue(0);

  const triggerShake = () => {
    shake.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
  };

  const handleSubmit = useCallback(async () => {
    if (status === 'submitting' || status === 'done') return;
    setStatus('submitting');
    setErrorKey(null);
    try {
      await submitFeedback(kind, text);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus('done');
      doneScale.value = 0;
      doneScale.value = withSpring(1, { damping: 12, stiffness: 160 });
    } catch (err: any) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerShake();
      const code = err?.message || 'unknown';
      if (code === 'too-short') setErrorKey('errorTooShort');
      else if (code === 'too-long') setErrorKey('errorTooLong');
      else if (code === 'Not signed in') setErrorKey('errorAuth');
      else setErrorKey('errorGeneric');
      setStatus('error');
    }
  }, [kind, text, status, doneScale]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const doneStyle = useAnimatedStyle(() => ({
    opacity: doneScale.value,
    transform: [{ scale: 0.85 + doneScale.value * 0.15 }],
  }));

  const charCount = text.trim().length;
  const canSubmit =
    charCount >= SUBMISSION_LIMITS.min && charCount <= SUBMISSION_LIMITS.max;

  return (
    <View style={styles.root}>
      <AuroraBackground width={width} height={height} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={[styles.eyebrow, { color: accent }]}>
                {t(`${i18nBase}.eyebrow`)}
              </Text>
              <Text style={styles.title}>{t(`${i18nBase}.title`)}</Text>
              <Text style={styles.subtitle}>{t(`${i18nBase}.subtitle`)}</Text>
            </View>

            {status === 'done' ? (
              <Animated.View style={[styles.doneCard, doneStyle]}>
                <Text style={styles.doneIcon}>✨</Text>
                <Text style={styles.doneTitle}>{t(`${i18nBase}.thanksTitle`)}</Text>
                <Text style={styles.doneBody}>{t(`${i18nBase}.thanksBody`)}</Text>
                <Pressable
                  onPress={() => {
                    setText('');
                    setStatus('idle');
                    doneScale.value = 0;
                  }}
                  style={[styles.secondaryBtn, { borderColor: withAlpha(accent, 0.5) }]}
                >
                  <Text style={[styles.secondaryBtnLabel, { color: accent }]}>
                    {t(`${i18nBase}.sendAnother`)}
                  </Text>
                </Pressable>
              </Animated.View>
            ) : (
              <>
                <Animated.View style={[styles.inputCard, shakeStyle]}>
                  <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder={t(`${i18nBase}.placeholder`)}
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    multiline
                    textAlignVertical="top"
                    maxLength={SUBMISSION_LIMITS.max + 50}
                    style={styles.input}
                    editable={status !== 'submitting'}
                  />
                  <View style={styles.counterRow}>
                    <Text
                      style={[
                        styles.counter,
                        {
                          color:
                            charCount > SUBMISSION_LIMITS.max
                              ? '#FF8A9A'
                              : colors.fgDim,
                        },
                      ]}
                    >
                      {charCount} / {SUBMISSION_LIMITS.max}
                    </Text>
                  </View>
                </Animated.View>

                {errorKey ? (
                  <Text style={styles.errorText}>
                    {t(`${i18nBase}.${errorKey}`)}
                  </Text>
                ) : (
                  <Text style={styles.helpText}>
                    {t(`${i18nBase}.help`)}
                  </Text>
                )}

                <Pressable
                  onPress={handleSubmit}
                  disabled={!canSubmit || status === 'submitting'}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    {
                      backgroundColor: accent,
                      shadowColor: accent,
                      opacity:
                        !canSubmit || status === 'submitting'
                          ? 0.5
                          : pressed
                            ? 0.95
                            : 1,
                    },
                  ]}
                >
                  <Text style={styles.submitLabel}>
                    {status === 'submitting'
                      ? t(`${i18nBase}.sending`)
                      : t(`${i18nBase}.submit`)}
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
  flex: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 4,
    alignItems: 'flex-start',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
  },
  eyebrow: {
    ...typography.small,
    marginBottom: 4,
    letterSpacing: 2.2,
  },
  title: {
    ...typography.title,
    color: colors.fg,
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.fgDim,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
  },
  input: {
    color: colors.fg,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 160,
    maxHeight: 240,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    marginTop: 8,
  },
  counter: {
    fontSize: 12,
    fontWeight: '600',
  },
  helpText: {
    color: colors.fgDim,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  errorText: {
    color: '#FF8A9A',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  submitBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  submitLabel: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  doneCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 16,
  },
  doneIcon: {
    fontSize: 64,
  },
  doneTitle: {
    ...typography.title,
    color: colors.fg,
    fontSize: 22,
    textAlign: 'center',
  },
  doneBody: {
    color: colors.fgDim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  secondaryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  secondaryBtnLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
