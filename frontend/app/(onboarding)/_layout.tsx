import { Stack } from 'expo-router';
import Colors from '../../src/constants/Colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="business-type" />
      <Stack.Screen name="business-info" />
      <Stack.Screen name="tutorial" />
    </Stack>
  );
}
