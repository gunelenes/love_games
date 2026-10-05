import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '@/hooks/useLanguage';
import type { RootStackParamList } from '@/navigation/RootNav';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { withAlpha } from '@/utils/color';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';

const LANG_LABEL_KEY: Record<SupportedLanguage, string> = {
  en: 'settings.english',
  tr: 'settings.turkish',
  de: 'settings.german',
  fr: 'settings.french',
  es: 'settings.spanish',
  it: 'settings.italian',
  ja: 'settings.japanese',
  ko: 'settings.korean',
  'zh-TW': 'settings.chinese',
  id: 'settings.indonesian',
  hi: 'settings.hindi',
  ar: 'settings.arabic',
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const pick = async (lang: SupportedLanguage) => {
    if (lang === language) return;
    void Haptics.selectionAsync();
    await setLanguage(lang);
  };

  const goTo = (screen: 'Suggestions' | 'Fantasies') => {
    void Haptics.selectionAsync();
    onClose();
    navigation.navigate(screen);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>{t('settings.title')}</Text>
          <Text style={styles.label}>{t('settings.language')}</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.row}
            showsVerticalScrollIndicator={false}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <LanguageOption
                key={lang}
                value={lang}
                label={t(LANG_LABEL_KEY[lang])}
                active={language === lang}
                onPress={() => pick(lang)}
              />
            ))}
          </ScrollView>

          <Text style={styles.label}>{t('settings.community')}</Text>
          <View style={styles.linkRow}>
            <Pressable
              onPress={() => goTo('Suggestions')}
              style={({ pressed }) => [
                styles.linkBtn,
                {
                  borderColor: withAlpha('#5EA7FF', 0.4),
                  backgroundColor: withAlpha('#5EA7FF', 0.1),
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={styles.linkIcon}>💡</Text>
              <Text style={styles.linkLabel}>{t('settings.suggestions')}</Text>
            </Pressable>
            <Pressable
              onPress={() => goTo('Fantasies')}
              style={({ pressed }) => [
                styles.linkBtn,
                {
                  borderColor: withAlpha('#E26AA6', 0.4),
                  backgroundColor: withAlpha('#E26AA6', 0.12),
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={styles.linkIcon}>🌹</Text>
              <Text style={styles.linkLabel}>{t('settings.fantasies')}</Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>{t('settings.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function LanguageOption({
  label,
  active,
  onPress,
}: {
  value: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        {
          borderColor: active
            ? withAlpha(colors.accent, 0.7)
            : 'rgba(255,255,255,0.12)',
          backgroundColor: active
            ? withAlpha(colors.accent, 0.22)
            : 'rgba(255,255,255,0.04)',
        },
      ]}
    >
      <Text
        style={[
          styles.optionLabel,
          { color: active ? '#FFFFFF' : 'rgba(255,255,255,0.7)' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 14,
  },
  title: {
    ...typography.title,
    color: colors.fg,
    fontSize: 22,
    fontWeight: '800',
  },
  label: {
    ...typography.small,
    color: colors.fgDim,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  scroll: {
    // Cap at ~4 rows of pills so the whole modal still fits on short
    // phones; wraps + scrolls once we exceed that. 12 languages at
    // 3-per-row = 4 rows; adding more languages later wraps cleanly.
    maxHeight: 240,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 2,
  },
  option: {
    // Three per row at the modal's 360px max width. Shorter font size
    // keeps "Bahasa Indonesia" / "繁體中文" readable without overflow.
    flexBasis: '31%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    gap: 10,
  },
  linkBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
  },
  linkIcon: {
    fontSize: 26,
  },
  linkLabel: {
    color: colors.fg,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.fg,
    fontSize: 14,
    fontWeight: '700',
  },
});
