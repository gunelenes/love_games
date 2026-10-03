import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '@/hooks/useLanguage';
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
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const pick = async (lang: SupportedLanguage) => {
    if (lang === language) return;
    void Haptics.selectionAsync();
    await setLanguage(lang);
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

          <View style={styles.row}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <LanguageOption
                key={lang}
                value={lang}
                label={t(LANG_LABEL_KEY[lang])}
                active={language === lang}
                onPress={() => pick(lang)}
              />
            ))}
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    // Three per row at the modal's 360px max width — labels like
    // "Deutsch" or "Español" need more than the ~55px two-per-row would
    // force, and six buttons single-row would truncate.
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '800',
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
