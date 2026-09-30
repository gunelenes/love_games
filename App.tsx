import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNav } from '@/navigation/RootNav';
import { AgeGateModal } from '@/components/AgeGate/AgeGateModal';
import { AgeGateProvider } from '@/hooks/useAgeGate';
import { AuthProvider } from '@/hooks/useAuth';
import { ContentProvider } from '@/hooks/useContent';
import { RoomProvider } from '@/hooks/useRoom';
// Side-effect import to initialize Firebase early (if configured).
import '@/services/firebase';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AgeGateProvider>
          <ContentProvider>
            <AuthProvider>
              <RoomProvider>
                <RootNav />
                <AgeGateModal />
                <StatusBar style="light" />
              </RoomProvider>
            </AuthProvider>
          </ContentProvider>
        </AgeGateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
