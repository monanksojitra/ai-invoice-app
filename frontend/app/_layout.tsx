import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '../src/constants/Colors';

function RootLayoutNav() {
  const { isAuthenticated, isLoading: authLoading, loadAuth } = useAuthStore();
  const { hasCompletedOnboarding, isLoading: onboardingLoading, checkOnboardingStatus } = useOnboardingStore();
  const { initialize: initNotifications } = useNotificationStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadAuth();
    checkOnboardingStatus();
    initNotifications();
  }, [loadAuth, checkOnboardingStatus, initNotifications]);

  useEffect(() => {
    if (authLoading || onboardingLoading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    
    // Not authenticated -> go to login
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } 
    // Authenticated but onboarding not complete -> go to onboarding
    else if (isAuthenticated && !hasCompletedOnboarding && !inOnboardingGroup) {
      router.replace('/(onboarding)/welcome');
    }
    // Authenticated and onboarding complete but in auth/onboarding -> go to main app
    else if (isAuthenticated && hasCompletedOnboarding && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, hasCompletedOnboarding, authLoading, onboardingLoading, segments, router]);

  if (authLoading || onboardingLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="processing" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="review-invoice" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="invoice-detail" options={{ presentation: 'card' }} />
      <Stack.Screen name="export" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
      <Stack.Screen name="notification-settings" options={{ presentation: 'card' }} />
      <Stack.Screen name="calendar" options={{ presentation: 'card' }} />
      <Stack.Screen name="analytics" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
