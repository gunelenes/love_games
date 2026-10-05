import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@/screens/HomeScreen';
import { WheelScreen } from '@/screens/WheelScreen';
import { DiceScreen } from '@/screens/DiceScreen';
import { BoxListScreen } from '@/screens/BoxListScreen';
import { BoxScreen } from '@/screens/BoxScreen';
import { CardsScreen } from '@/screens/CardsScreen';
import { PosesScreen } from '@/screens/PosesScreen';
import { RoomLobbyScreen } from '@/screens/RoomLobbyScreen';
import { SubmissionScreen } from '@/screens/SubmissionScreen';
import { colors } from '@/theme/colors';

export type RootStackParamList = {
  Home: undefined;
  Wheel: undefined;
  Dice: undefined;
  RoomLobby: undefined;
  BoxList: undefined;
  Box: { boxId: string };
  Cards: undefined;
  Poses: undefined;
  Suggestions: undefined;
  Fantasies: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNav() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Wheel" component={WheelScreen} />
        <Stack.Screen name="Dice" component={DiceScreen} />
        <Stack.Screen name="RoomLobby" component={RoomLobbyScreen} />
        <Stack.Screen name="BoxList" component={BoxListScreen} />
        <Stack.Screen name="Box" component={BoxScreen} />
        <Stack.Screen name="Cards" component={CardsScreen} />
        <Stack.Screen name="Poses" component={PosesScreen} />
        <Stack.Screen name="Suggestions" component={SubmissionScreen} />
        <Stack.Screen name="Fantasies" component={SubmissionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
