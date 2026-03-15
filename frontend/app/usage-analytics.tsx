import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../src/store/subscriptionStore';
import { Card } from '../src/components/ui/Card';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';
import api from '../src/utils/api';

export default function UsageAnalyticsScreen() {
  const { usageStats, loadUsageStats } = useSubscriptionStore();
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadUsageStats();
      const history = await api.getUsageHistory({ limit: 50, days: 30 });
      setUsageHistory(history.usage_records || []);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Usage & Analytics</Text>
        <Text style={styles.subtitle}>Track your invoice processing and credit usage</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <MaterialCommunityIcons name="file-document" size={32} color={Colors.primary} />
                <Text style={styles.statValue}>{usageStats?.total_invoices_processed || 0}</Text>
                <Text style={styles.statLabel}>Total Invoices</Text>
              </Card>

              <Card style={styles.statCard}>
                <MaterialCommunityIcons name="calendar-month" size={32} color={Colors.success} />
                <Text style={styles.statValue}>{usageStats?.invoices_this_month || 0}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </Card>

              <Card style={styles.statCard}>
                <MaterialCommunityIcons name="wallet" size={32} color={Colors.warning} />
                <Text style={styles.statValue}>{usageStats?.credits_remaining || 0}</Text>
                <Text style={styles.statLabel}>Credits Left</Text>
              </Card>

              <Card style={styles.statCard}>
                <MaterialCommunityIcons name="chart-line" size={32} color={Colors.info} />
                <Text style={styles.statValue}>{usageStats?.total_credits_used || 0}</Text>
                <Text style={styles.statLabel}>Credits Used</Text>
              </Card>
            </View>

            {/* Plan Info */}
            <Card style={styles.planCard}>
              <View style={styles.planHeader}>
                <MaterialCommunityIcons name="crown" size={24} color={Colors.secondary} />
                <Text style={styles.planTitle}>Current Plan</Text>
              </View>
              <View style={styles.planDetails}>
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>Tier</Text>
                  <Text style={styles.planValue}>
                    {(usageStats?.subscription_tier || 'free').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>Monthly Limit</Text>
                  <Text style={styles.planValue}>
                    {usageStats?.monthly_limit ? `${usageStats.monthly_limit} invoices` : 'Unlimited'}
                  </Text>
                </View>
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>API Calls Remaining</Text>
                  <Text style={styles.planValue}>
                    {usageStats?.api_calls_remaining || 0}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Recent Activity */}
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {usageHistory.length === 0 ? (
              <Card style={styles.emptyCard}>
                <MaterialCommunityIcons name="history" size={48} color={Colors.textLight} />
                <Text style={styles.emptyText}>No usage history yet</Text>
                <Text style={styles.emptySubtext}>Start processing invoices to see your activity</Text>
              </Card>
            ) : (
              <View style={styles.historyList}>
                {usageHistory.slice(0, 20).map((record: any, index: number) => (
                  <Card key={record.id || index} style={styles.historyCard}>
                    <View style={styles.historyIcon}>
                      <MaterialCommunityIcons 
                        name={
                          record.action_type === 'invoice_process' ? 'file-document' :
                          record.action_type === 'export' ? 'download' :
                          'api'
                        }
                        size={20}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyAction}>
                        {record.action_type === 'invoice_process' ? 'Invoice Processed' :
                         record.action_type === 'export' ? 'Data Exported' :
                         'API Call'}
                      </Text>
                      <Text style={styles.historyTime}>
                        {new Date(record.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.historyCredits}>
                      <Text style={styles.creditsAmount}>-{record.credits_consumed}</Text>
                      <Text style={styles.creditsLabel}>credits</Text>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
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
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Layout.spacing.xl,
  },
  loadingContainer: {
    padding: Layout.spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: Layout.spacing.md,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textMain,
    marginTop: Layout.spacing.sm,
  },
  statLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  planCard: {
    marginBottom: Layout.spacing.xl,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  planTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
  },
  planDetails: {
    gap: Layout.spacing.sm,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
  },
  planValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textMain,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Layout.spacing.xxl,
  },
  emptyText: {
    fontSize: Layout.fontSize.base,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: Layout.spacing.md,
  },
  emptySubtext: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textLight,
    marginTop: Layout.spacing.xs,
  },
  historyList: {
    gap: Layout.spacing.sm,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  historyIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary + '15',
    borderRadius: Layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.textMain,
  },
  historyTime: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyCredits: {
    alignItems: 'flex-end',
  },
  creditsAmount: {
    fontSize: Layout.fontSize.base,
    fontWeight: '600',
    color: Colors.error,
  },
  creditsLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
  },
});
