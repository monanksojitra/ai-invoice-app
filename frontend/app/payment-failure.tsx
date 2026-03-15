import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { getPaymentErrorMessage } from '../src/utils/payment';

export default function PaymentFailureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Animation values
  const iconScale = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const errorMessage = params.error
    ? getPaymentErrorMessage(params.error)
    : 'Payment could not be completed. Please try again.';

  const transactionId = params.transactionId as string | null;

  // Shake animation on mount
  useEffect(() => {
    iconRotate.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    iconScale.value = withSpring(1, { damping: 12 });
    iconOpacity.value = withTiming(1, { duration: 300 });
    
    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 400 });
    }, 200);
  }, []);

  const handleRetry = () => {
    router.back();
  };

  const handleContactSupport = () => {
    router.push('/(tabs)/settings');
  };

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` }
    ],
    opacity: iconOpacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Animated Error Icon */}
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          <Ionicons name="close-circle" size={100} color="#ef4444" />
        </Animated.View>

        {/* Animated Content */}
        <Animated.View style={animatedContentStyle}>
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.subtitle}>{errorMessage}</Text>

        {/* Transaction ID if available */}
        {transactionId && (
          <View style={styles.transactionCard}>
            <Text style={styles.transactionLabel}>Transaction ID</Text>
            <Text style={styles.transactionId}>{transactionId}</Text>
            <Text style={styles.transactionNote}>
              Save this ID for support inquiries
            </Text>
          </View>
        )}

        {/* Common Reasons */}
        <View style={styles.reasonsCard}>
          <Text style={styles.reasonsTitle}>Common reasons for failure:</Text>
          <View style={styles.reasonItem}>
            <Ionicons name="ellipse" size={6} color="#6b7280" style={styles.bullet} />
            <Text style={styles.reasonText}>Insufficient balance in account</Text>
          </View>
          <View style={styles.reasonItem}>
            <Ionicons name="ellipse" size={6} color="#6b7280" style={styles.bullet} />
            <Text style={styles.reasonText}>Card declined by bank</Text>
          </View>
          <View style={styles.reasonItem}>
            <Ionicons name="ellipse" size={6} color="#6b7280" style={styles.bullet} />
            <Text style={styles.reasonText}>Incorrect card details</Text>
          </View>
          <View style={styles.reasonItem}>
            <Ionicons name="ellipse" size={6} color="#6b7280" style={styles.bullet} />
            <Text style={styles.reasonText}>Network connection issues</Text>
          </View>
        </View>

        {/* Info Message */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#f59e0b" />
          <Text style={styles.infoText}>
            No amount has been deducted from your account. You can safely retry the payment.
          </Text>
        </View>

        {/* Action Buttons */}
        <Pressable style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>

        <Pressable style={styles.supportButton} onPress={handleContactSupport}>
          <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
    marginBottom: 24,
    lineHeight: 24,
  },
  transactionCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  transactionLabel: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 4,
    fontWeight: '600',
  },
  transactionId: {
    fontSize: 14,
    color: '#78350f',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  transactionNote: {
    fontSize: 12,
    color: '#92400e',
    fontStyle: 'italic',
  },
  reasonsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bullet: {
    marginRight: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    gap: 8,
  },
  supportButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
});
