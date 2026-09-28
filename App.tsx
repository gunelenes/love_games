import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNav } from '@/navigation/RootNav';
import { BoxesProvider } from '@/hooks/useBoxes';
import { ContentProvider } from '@/hooks/useContent';
// Side-effect import to initialize Firebase early (if configured).
import '@/services/firebase';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ContentProvider>
          <BoxesProvider>
            <RootNav />
            <StatusBar style="light" />
          </BoxesProvider>
        </ContentProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
