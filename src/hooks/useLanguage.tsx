import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Alert, I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, {
  DEFAULT_LANGUAGE,
  RTL_LANGUAGES,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/i18n';

const STORAGE_KEY = 'app:language:v1';

type LanguageContextValue = {
  language: SupportedLanguage;
  ready: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isRtlLang(lang: SupportedLanguage): boolean {
  return (RTL_LANGUAGES as readonly string[]).includes(lang);
}

/**
 * React Native caches text direction at mount time. Flipping `forceRTL`
 * only takes full visual effect after a full JS reload — in Expo Go the
 * user shakes to reload; in a production build they relaunch the app.
 * We flip the flag eagerly so the next launch is correct, and prompt
 * the user to restart.
 */
function syncRtl(lang: SupportedLanguage, t: (k: string) => string) {
  const want = isRtlLang(lang);
  if (I18nManager.isRTL === want) return; // already correct
  try {
    I18nManager.allowRTL(want);
    I18nManager.forceRTL(want);
  } catch {
    // Older RN / web shim — ignore.
  }
  // One-shot alert; user restarts manually. Reload automation would need
  // expo-updates (not currently a dep). Fine to add later.
  Alert.alert(
    t('settings.rtlReloadTitle'),
    t('settings.rtlReloadBody'),
    [{ text: t('settings.rtlReloadButton'), style: 'default' }],
    { cancelable: false }
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        if (cancelled) return;
        if (raw) {
          if ((SUPPORTED_LANGUAGES as readonly string[]).includes(raw)) {
            const lang = raw as SupportedLanguage;
            setLangState(lang);
            void i18n.changeLanguage(lang);
          } else {
            // Bilinmeyen bir dil kodu cache'de — temizle ki bir sonraki
            // açılış DEFAULT_LANGUAGE ('en') ile başlasın. Apple reviewer
            // için ilk açılış İngilizce olmalı.
            // eslint-disable-next-line no-console
            console.warn(
              `[useLanguage] unknown cached language "${raw}", resetting to default`
            );
            await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
          }
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    setLangState(lang);
    await i18n.changeLanguage(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    // Platform.OS === 'web' doesn't have I18nManager — skip the flip there.
    if (Platform.OS !== 'web') {
      syncRtl(lang, (k) => i18n.t(k) as string);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, ready, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
