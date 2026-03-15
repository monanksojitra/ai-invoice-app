import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSubscriptionStore } from '../src/store/subscriptionStore';
import { useIsMounted } from '../src/hooks/usePerformance';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useIsMounted();
  
  const loadSubscription = useSubscriptionStore((state) => state.loadSubscription);
  const loadUsageStats = useSubscriptionStore((state) => state.loadUsageStats);

  // Animation values
  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const contentOpacity = useSharedValue(0);

  // Extract params
  const creditsAdded = params.credits ? parseInt(params.credits as string) : null;
  const newBalance = params.balance ? parseInt(params.balance as string) : null;
  const planUpgraded = params.plan as string | null;
  const amount = params.amount ? parseFloat(params.amount as string) : null;

  useEffect(() => {
    const refreshData = async () => {
      try {
        await Promise.all([loadSubscription(), loadUsageStats()]);
      } catch (error) {
        if (isMounted.current) {
          console.error('Error refreshing subscription:', error);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    refreshData();
  }, [loadSubscription, loadUsageStats, isMounted]);

  // Trigger animations when loading completes
  useEffect(() => {
    if (!isLoading) {
      // Success icon animation
      iconScale.value = withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );
      iconOpacity.value = withTiming(1, { duration: 300 });

      // Content fade-in with delay
      setTimeout(() => {
        contentTranslateY.value = withTiming(0, { duration: 400 });
        contentOpacity.value = withTiming(1, { duration: 400 });
      }, 200);
    }
  }, [isLoading]);

  const handleContinue = () => {
    if (planUpgraded) {
      router.replace('/(tabs)/settings');
    } else {
      router.replace('/(tabs)/home');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
    opacity: contentOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Animated Success Icon */}
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          <Ionicons name="checkmark-circle" size={100} color="#10b981" />
        </Animated.View>

        {/* Animated Content */}
        <Animated.View style={animatedContentStyle}>
          <Text style={styles.title}>Payment Successful!</Text>
          <Text style={styles.subtitle}>
            Your payment has been processed successfully
          </Text>

        {/* Payment Details */}
        <View style={styles.detailsCard}>
          {amount && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Paid</Text>
              <Text style={styles.detailValue}>₹{amount.toFixed(2)}</Text>
            </View>
          )}

          {creditsAdded && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Credits Added</Text>
              <Text style={styles.detailValueHighlight}>+{creditsAdded}</Text>
            </View>
          )}

          {newBalance && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>New Balance</Text>
              <Text style={styles.detailValue}>{newBalance} credits</Text>
            </View>
          )}

          {planUpgraded && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plan Upgraded To</Text>
              <Text style={styles.detailValueHighlight}>
                {planUpgraded.charAt(0).toUpperCase() + planUpgraded.slice(1)}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Info Message */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            A confirmation email has been sent to your registered email address.
          </Text>
        </View>

        {/* Action Buttons */}
        <Pressable style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/usage-analytics')}
        >
          <Text style={styles.secondaryButtonText}>View Usage</Text>
        </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  detailValueHighlight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
