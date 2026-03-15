import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSubscriptionStore } from '../src/store/subscriptionStore';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { useStableCallback } from '../src/hooks/usePerformance';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';

// Animated Credit Package Card
const CreditPackageCard = memo(({ 
  pkg, 
  isSelected, 
  onSelect 
}: { 
  pkg: any; 
  isSelected: boolean; 
  onSelect: () => void;
}) => {
  const isBestValue = pkg.savings_percent === 30;
  
  const scale = useSharedValue(1);
  const elevation = useSharedValue(2);

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withTiming(0.95, { duration: 100 });
      elevation.value = withTiming(8, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15 });
      elevation.value = withTiming(2, { duration: 200 });
    })
    .onEnd(() => {
      runOnJS(onSelect)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    elevation: elevation.value,
    shadowOpacity: elevation.value / 20,
  }));
  
  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          styles.packageCard,
          animatedStyle,
          isSelected && styles.selectedPackage,
          isBestValue && styles.bestValuePackage
        ]}
      >
      {isBestValue && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>BEST VALUE</Text>
        </View>
      )}
      
      <View style={styles.packageHeader}>
        <MaterialCommunityIcons 
          name="wallet" 
          size={32} 
          color={isSelected ? Colors.primary : Colors.textMuted} 
        />
        {pkg.bonus_credits > 0 && (
          <View style={styles.bonusBadge}>
            <Text style={styles.bonusText}>+{pkg.bonus_credits}</Text>
          </View>
        )}
      </View>

      <Text style={styles.packageCredits}>{pkg.total_credits}</Text>
      <Text style={styles.packageLabel}>credits</Text>

      <View style={styles.packagePrice}>
        <Text style={styles.priceSymbol}>₹</Text>
        <Text style={styles.priceAmount}>{pkg.price}</Text>
      </View>

      {pkg.savings_percent > 0 && (
        <View style={styles.savingsBadge}>
          <MaterialCommunityIcons name="tag" size={12} color={Colors.success} />
          <Text style={styles.savingsText}>Save {pkg.savings_percent}%</Text>
        </View>
      )}

      {isSelected && (
        <View style={styles.selectedIndicator}>
          <MaterialCommunityIcons name="check-circle" size={20} color={Colors.primary} />
        </View>
      )}
      </Animated.View>
    </GestureDetector>
  );
});

export default function CreditsPurchaseScreen() {
  const router = useRouter();
  
  // Optimized state subscriptions
  const creditPackages = useSubscriptionStore((state) => state.creditPackages);
  const subscription = useSubscriptionStore((state) => state.subscription);
  const loadPlans = useSubscriptionStore((state) => state.loadPlans);
  const loadSubscription = useSubscriptionStore((state) => state.loadSubscription);
  const purchaseCredits = useSubscriptionStore((state) => state.purchaseCredits);

  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [purchasing, setPurchasing] = useState(false);

  // Stable callback
  const handlePackageSelect = useStableCallback((pkg: any) => {
    setSelectedPackage(pkg);
  });

  useEffect(() => {
    loadPlans();
    loadSubscription();
  }, []);

  // Pre-select the 500 credits package (list-performance-callbacks)
  useEffect(() => {
    if (creditPackages.length > 0 && !selectedPackage) {
      setSelectedPackage(creditPackages[1]); // 500 credits package
    }
  }, [creditPackages]);

  const handlePurchase = useCallback(async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a credit package');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${selectedPackage.total_credits} credits for ₹${selectedPackage.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue to Payment',
          onPress: async () => {
            setPurchasing(true);
            try {
              // Create payment order
              const response = await purchaseCredits(
                selectedPackage.credits,
                'razorpay'
              );

              // Check if payment gateway is configured
              if (response.error && response.error.includes('not configured')) {
                Alert.alert(
                  'Payment Gateway Setup Required',
                  'Payment gateway is not yet configured. This feature will be available soon.',
                  [{ text: 'OK' }]
                );
                setPurchasing(false);
                return;
              }

              // Navigate to payment processing
              // In a real app, you'd open Razorpay checkout here
              // For now, simulate payment success for testing
              Alert.alert(
                'Payment Gateway',
                'In production, Razorpay checkout will open here. For testing, simulate payment?',
                [
                  { text: 'Cancel', style: 'cancel', onPress: () => setPurchasing(false) },
                  {
                    text: 'Simulate Success',
                    onPress: () => {
                      // Simulate successful payment
                      router.push({
                        pathname: '/payment-success',
                        params: {
                          credits: selectedPackage.total_credits.toString(),
                          balance: (subscription?.credits || 0 + selectedPackage.total_credits).toString(),
                          amount: selectedPackage.price.toString(),
                        },
                      });
                      setPurchasing(false);
                    }
                  },
                  {
                    text: 'Simulate Failure',
                    style: 'destructive',
                    onPress: () => {
                      router.push({
                        pathname: '/payment-failure',
                        params: {
                          error: 'Payment failed',
                          transactionId: response.transaction_id || 'TXN123456',
                        },
                      });
                      setPurchasing(false);
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to initiate purchase');
              setPurchasing(false);
            }
          }
        }
      ]
    );
  }, [selectedPackage, purchaseCredits, subscription, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="cash-multiple" size={48} color={Colors.success} />
          <Text style={styles.title}>Buy Credits</Text>
          <Text style={styles.subtitle}>
            Credits never expire and can be used anytime
          </Text>
        </View>

        {/* Current Balance */}
        {subscription && (
          <Card style={styles.balanceCard}>
            <View style={styles.balanceContent}>
              <View>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceValue}>{subscription.credits} credits</Text>
              </View>
              <MaterialCommunityIcons 
                name="wallet-outline" 
                size={40} 
                color={Colors.primary} 
              />
            </View>
          </Card>
        )}

        {/* Packages */}
        <Text style={styles.sectionTitle}>Select Package</Text>
        <View style={styles.packagesGrid}>
          {creditPackages.map((pkg: any) => (
            <CreditPackageCard
              key={pkg.credits}
              pkg={pkg}
              isSelected={selectedPackage?.credits === pkg.credits}
              onSelect={() => handlePackageSelect(pkg)}
            />
          ))}
        </View>

        {/* Purchase Button */}
        {selectedPackage && (
          <View style={styles.purchaseSection}>
            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Credits</Text>
                <Text style={styles.totalValue}>{selectedPackage.total_credits}</Text>
              </View>
              {selectedPackage.bonus_credits > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.bonusLabel}>Bonus</Text>
                  <Text style={styles.bonusValue}>+{selectedPackage.bonus_credits} credits</Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.finalTotal]}>
                <Text style={styles.finalLabel}>Total</Text>
                <Text style={styles.finalValue}>₹{selectedPackage.price}</Text>
              </View>
            </View>

            <Button
              title={purchasing ? 'Processing...' : 'Continue to Payment'}
              onPress={handlePurchase}
              loading={purchasing}
              icon="lock"
            />
          </View>
        )}

        {/* Info Boxes */}
        <View style={styles.infoBoxes}>
          <Card style={styles.infoCard}>
            <MaterialCommunityIcons name="shield-check" size={24} color={Colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Secure Payment</Text>
              <Text style={styles.infoText}>
                All transactions are secured with 256-bit SSL encryption
              </Text>
            </View>
          </Card>

          <Card style={styles.infoCard}>
            <MaterialCommunityIcons name="timer-sand" size={24} color={Colors.info} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Credits Never Expire</Text>
              <Text style={styles.infoText}>
                Use your credits whenever you need them, no time limits
              </Text>
            </View>
          </Card>

          <Card style={styles.infoCard}>
            <MaterialCommunityIcons name="invoice-text" size={24} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Cost Per Invoice</Text>
              <Text style={styles.infoText}>
                Simple invoices: 5-10 credits • Complex invoices: 10-20 credits
              </Text>
            </View>
          </Card>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethods}>
          <Text style={styles.paymentTitle}>Accepted Payment Methods</Text>
          <View style={styles.paymentIcons}>
            <View style={styles.paymentIcon}>
              <MaterialCommunityIcons name="credit-card" size={24} color={Colors.textMuted} />
              <Text style={styles.paymentText}>Cards</Text>
            </View>
            <View style={styles.paymentIcon}>
              <MaterialCommunityIcons name="bank" size={24} color={Colors.textMuted} />
              <Text style={styles.paymentText}>UPI</Text>
            </View>
            <View style={styles.paymentIcon}>
              <MaterialCommunityIcons name="account-balance" size={24} color={Colors.textMuted} />
              <Text style={styles.paymentText}>Net Banking</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: '700',
    color: Colors.textMain,
    marginTop: Layout.spacing.md,
  },
  subtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Layout.spacing.xs,
  },
  balanceCard: {
    marginBottom: Layout.spacing.xl,
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.md,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  packageCard: {
    width: '48%',
    padding: Layout.spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Layout.radius.xl,
    alignItems: 'center',
    position: 'relative',
  },
  selectedPackage: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  bestValuePackage: {
    borderColor: Colors.success,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Layout.radius.full,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  packageHeader: {
    position: 'relative',
    marginBottom: Layout.spacing.sm,
  },
  bonusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.success,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  packageCredits: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textMain,
    lineHeight: 36,
  },
  packageLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Layout.spacing.sm,
  },
  packagePrice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceSymbol: {
    fontSize: Layout.fontSize.base,
    fontWeight: '600',
    color: Colors.textMain,
  },
  priceAmount: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.textMain,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Layout.spacing.xs,
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Layout.radius.full,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  selectedIndicator: {
    position: 'absolute',
    top: Layout.spacing.sm,
    right: Layout.spacing.sm,
  },
  purchaseSection: {
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  totalCard: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
  },
  totalValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.textMain,
  },
  bonusLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.success,
  },
  bonusValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  finalTotal: {
    marginTop: Layout.spacing.xs,
    paddingTop: Layout.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  finalLabel: {
    fontSize: Layout.fontSize.base,
    fontWeight: '600',
    color: Colors.textMain,
  },
  finalValue: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoBoxes: {
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.md,
  },
  infoTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: 4,
  },
  infoText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  paymentMethods: {
    alignItems: 'center',
  },
  paymentTitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Layout.spacing.md,
  },
  paymentIcons: {
    flexDirection: 'row',
    gap: Layout.spacing.xl,
  },
  paymentIcon: {
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  paymentText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
  },
});
