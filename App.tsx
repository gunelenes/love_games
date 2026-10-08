import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNav } from '@/navigation/RootNav';
import { AgeGateModal } from '@/components/AgeGate/AgeGateModal';
import { AgeGateProvider } from '@/hooks/useAgeGate';
import { AuthProvider } from '@/hooks/useAuth';
import { ContentProvider } from '@/hooks/useContent';
import { LanguageProvider } from '@/hooks/useLanguage';
import { PlayPrefsProvider } from '@/hooks/usePlayPrefs';
import { RoomProvider } from '@/hooks/useRoom';
// Side-effect imports:
import '@/i18n'; // init i18next
import '@/services/firebase'; // init Firebase (if configured)

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AgeGateProvider>
            <ContentProvider>
              <PlayPrefsProvider>
                <AuthProvider>
                  <RoomProvider>
                    <RootNav />
                    <AgeGateModal />
                    <StatusBar style="light" />
                  </RoomProvider>
                </AuthProvider>
              </PlayPrefsProvider>
            </ContentProvider>
          </AgeGateProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
