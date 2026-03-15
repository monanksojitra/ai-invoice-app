import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useSubscriptionStore } from '../src/store/subscriptionStore';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';

// Memoized Plan Card Component (list-performance-item-memo)
const PlanCard = memo(({ 
  plan, 
  isCurrentPlan, 
  onUpgrade 
}: { 
  plan: any; 
  isCurrentPlan: boolean; 
  onUpgrade: () => void;
}) => {
  const isPopular = plan.tier === 'starter';
  const isPro = plan.tier === 'pro';
  
  return (
    <Card 
      style={[
        styles.planCard, 
        isCurrentPlan && styles.currentPlanCard,
        isPro && styles.proPlanCard
      ]}
    >
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
      )}
      
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>Current</Text>
          </View>
        )}
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={styles.currency}>₹</Text>
        <Text style={styles.price}>{plan.price_monthly}</Text>
        <Text style={styles.period}>/month</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        {plan.features.map((feature: string, index: number) => (
          <View key={index} style={styles.featureRow}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={16} 
              color={isPro ? Colors.secondary : Colors.success} 
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      {!isCurrentPlan && (
        <Button
          title={plan.tier === 'free' ? 'Current Plan' : 'Upgrade Now'}
          onPress={onUpgrade}
          variant={isPro ? 'primary' : 'outline'}
          style={styles.upgradeButton}
        />
      )}
      
      {isCurrentPlan && plan.tier !== 'free' && (
        <Text style={styles.manageText}>
          Active • Renews monthly
        </Text>
      )}
    </Card>
  );
});

export default function PlanBillingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    plans, 
    subscription, 
    usageStats,
    loadPlans, 
    loadSubscription,
    loadUsageStats,
    upgradeSubscription,
    isLoading 
  } = useSubscriptionStore();

  const [upgrading, setUpgrading] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadPlans();
    loadSubscription();
    loadUsageStats();
  }, []);

  // Memoized upgrade handler (list-performance-callbacks)
  const handleUpgrade = useCallback((planTier: string) => {
    if (planTier === 'free') return;
    
    const plan = plans.find(p => p.tier === planTier);
    if (!plan) return;

    Alert.alert(
      'Upgrade Plan',
      `Upgrade to ${plan.name} plan for ₹${plan.price}/month?\n\nYou'll get:\n• ${plan.initial_credits} credits\n• ${plan.monthly_invoice_limit === -1 ? 'Unlimited' : plan.monthly_invoice_limit} invoices/month\n• ${plan.features[0]}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue to Payment',
          onPress: async () => {
            setUpgrading(true);
            try {
              const response = await upgradeSubscription(planTier, 'razorpay');
              
              // Check if payment gateway is configured
              if (response.error && response.error.includes('not configured')) {
                Alert.alert(
                  'Payment Gateway Setup Required',
                  'Payment gateway is not yet configured. This feature will be available soon.',
                  [{ text: 'OK' }]
                );
                setUpgrading(false);
                return;
              }

              // Navigate to payment processing
              // In production, open Razorpay checkout
              Alert.alert(
                'Payment Gateway',
                'In production, Razorpay checkout will open here. For testing, simulate payment?',
                [
                  { text: 'Cancel', style: 'cancel', onPress: () => setUpgrading(false) },
                  {
                    text: 'Simulate Success',
                    onPress: () => {
                      router.push({
                        pathname: '/payment-success',
                        params: {
                          plan: planTier,
                          amount: plan.price.toString(),
                          credits: plan.initial_credits.toString(),
                        },
                      });
                      setUpgrading(false);
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
                      setUpgrading(false);
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to initiate upgrade');
              setUpgrading(false);
            }
          }
        }
      ]
    );
  }, [plans, upgradeSubscription, router]);

  const creditsPercentage = subscription 
    ? (subscription.credits / (subscription.credits + (usageStats?.total_credits_used || 0))) * 100 
    : 0;

  const invoicesPercentage = subscription && subscription.monthly_invoice_limit
    ? (subscription.monthly_invoice_count / subscription.monthly_invoice_limit) * 100
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Plans & Billing</Text>

        {/* Current Usage Card */}
        {subscription && (
          <Card style={styles.usageCard}>
            <View style={styles.usageHeader}>
              <MaterialCommunityIcons name="chart-box" size={24} color={Colors.primary} />
              <Text style={styles.usageTitle}>Your Usage</Text>
            </View>

            {/* Credits */}
            <View style={styles.usageItem}>
              <View style={styles.usageLabel}>
                <Text style={styles.usageText}>Credits Remaining</Text>
                <Text style={styles.usageValue}>
                  {subscription.credits} credits
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(creditsPercentage, 100)}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Invoices */}
            {subscription.monthly_invoice_limit && (
              <View style={styles.usageItem}>
                <View style={styles.usageLabel}>
                  <Text style={styles.usageText}>Invoices This Month</Text>
                  <Text style={styles.usageValue}>
                    {subscription.monthly_invoice_count} / {subscription.monthly_invoice_limit}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(invoicesPercentage, 100)}%`,
                        backgroundColor: invoicesPercentage > 80 ? Colors.warning : Colors.primary
                      }
                    ]} 
                  />
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Pressable 
                style={styles.quickAction}
                onPress={() => router.push('/credits-purchase')}
              >
                <MaterialCommunityIcons name="cash-plus" size={20} color={Colors.success} />
                <Text style={styles.quickActionText}>Buy Credits</Text>
              </Pressable>
              
              <Pressable 
                style={styles.quickAction}
                onPress={() => router.push('/usage-analytics')}
              >
                <MaterialCommunityIcons name="chart-line" size={20} color={Colors.info} />
                <Text style={styles.quickActionText}>View Analytics</Text>
              </Pressable>
            </View>
          </Card>
        )}

        {/* Plans Section */}
        <Text style={styles.sectionTitle}>Available Plans</Text>
        <Text style={styles.sectionSubtitle}>
          Choose the plan that best fits your business needs
        </Text>

        {isLoading && plans.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {plans.map((plan: any) => (
              <PlanCard
                key={plan.tier}
                plan={plan}
                isCurrentPlan={plan.tier === user?.plan}
                onUpgrade={() => handleUpgrade(plan.tier)}
              />
            ))}
          </View>
        )}

        {/* FAQ Section */}
        <Card style={styles.faqCard}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do credits work?</Text>
            <Text style={styles.faqAnswer}>
              Each invoice processing consumes 5-15 credits depending on complexity. 
              Credits never expire and roll over month to month.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I change plans anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can upgrade or downgrade your plan at any time. 
              Billing adjustments are prorated.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What payment methods do you accept?</Text>
            <Text style={styles.faqAnswer}>
              We accept all major credit/debit cards, UPI, and net banking via Razorpay.
            </Text>
          </View>
        </Card>

        {/* Support */}
        <Pressable 
          style={styles.supportButton}
          onPress={() => Alert.alert('Support', 'Contact support@invoiceai.com')}
        >
          <MaterialCommunityIcons name="help-circle" size={20} color={Colors.info} />
          <Text style={styles.supportText}>Need help choosing a plan?</Text>
        </Pressable>
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
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: Layout.spacing.lg,
  },
  usageCard: {
    marginBottom: Layout.spacing.xl,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  usageTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
  },
  usageItem: {
    marginBottom: Layout.spacing.md,
  },
  usageLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  usageText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
  },
  usageValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textMain,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Layout.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Layout.radius.full,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.xs,
    padding: Layout.spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
  },
  quickActionText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.textMain,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Layout.spacing.lg,
  },
  loadingContainer: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
  },
  plansContainer: {
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  planCard: {
    position: 'relative',
    overflow: 'visible',
  },
  currentPlanCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  proPlanCard: {
    borderColor: Colors.secondary,
    borderWidth: 2,
    backgroundColor: Colors.secondary + '05',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: Layout.spacing.md,
    backgroundColor: Colors.success,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.radius.full,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  planName: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.textMain,
  },
  currentBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.radius.lg,
  },
  currentText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.md,
  },
  currency: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginTop: 4,
  },
  price: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.textMain,
    lineHeight: 48,
  },
  period: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginTop: 8,
  },
  featuresContainer: {
    gap: Layout.spacing.xs,
    marginBottom: Layout.spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  featureText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMain,
    flex: 1,
  },
  upgradeButton: {
    marginTop: Layout.spacing.sm,
  },
  manageText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Layout.spacing.sm,
  },
  faqCard: {
    marginBottom: Layout.spacing.xl,
  },
  faqTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.md,
  },
  faqItem: {
    marginBottom: Layout.spacing.md,
  },
  faqQuestion: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.xs,
  },
  faqAnswer: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.xs,
    padding: Layout.spacing.md,
    backgroundColor: Colors.info + '10',
    borderRadius: Layout.radius.lg,
  },
  supportText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.info,
    fontWeight: '500',
  },
});
