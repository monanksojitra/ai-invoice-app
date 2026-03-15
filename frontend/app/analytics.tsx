import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useInvoiceStore } from '../src/store/invoiceStore';
import { Card } from '../src/components/ui/Card';
import { BarChart, LineChart, PieChart } from '../src/components/charts';
import Colors from '../src/constants/Colors';

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { analytics, isLoading, fetchAnalytics } = useInvoiceStore();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const topVendorsData = useMemo(() => {
    if (!analytics?.top_vendors) return { labels: [], data: [] };
    
    const topVendors = analytics.top_vendors.slice(0, 5);
    return {
      labels: topVendors.map((v: any) => 
        v.vendor_name?.slice(0, 10) || 'Unknown'
      ),
      data: topVendors.map((v: any) => v.total_amount || 0),
    };
  }, [analytics]);

  const monthlyTrendData = useMemo(() => {
    if (!analytics?.monthly_trend) return { labels: [], data: [] };
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = analytics.monthly_trend.slice(-6);
    
    return {
      labels: last6Months.map((m: any) => {
        const date = new Date(m.month);
        return months[date.getMonth()];
      }),
      data: last6Months.map((m: any) => m.total_amount || 0),
    };
  }, [analytics]);

  const categoryData = useMemo(() => {
    if (!analytics?.by_category) return [];
    
    return analytics.by_category
      .slice(0, 6)
      .map((c: any) => ({
        name: c.category || 'Uncategorized',
        amount: c.total_amount || 0,
      }));
  }, [analytics]);

  const overall = analytics?.overall || {};
  const thisMonth = analytics?.this_month || {};

  const stats = [
    {
      label: 'Total Invoices',
      value: String(overall.total_invoices || 0),
      icon: 'receipt-text',
      color: Colors.primary,
    },
    {
      label: 'Total Amount',
      value: formatCurrency(overall.total_amount || 0),
      icon: 'currency-inr',
      color: Colors.info,
    },
    {
      label: 'This Month',
      value: formatCurrency(thisMonth.amount || 0),
      icon: 'calendar-month',
      color: Colors.success,
    },
    {
      label: 'Avg Invoice',
      value: formatCurrency(overall.average_invoice || 0),
      icon: 'chart-line',
      color: Colors.warning,
    },
  ];

  if (isLoading && !analytics) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-btn"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="back-btn"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        testID="analytics-screen"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <MaterialCommunityIcons
                name={stat.icon as any}
                size={28}
                color={stat.color}
              />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {topVendorsData.data.length > 0 && (
          <Card style={styles.chartCard}>
            <BarChart
              testID="top-vendors-chart"
              title="Top 5 Vendors by Spend"
              labels={topVendorsData.labels}
              data={topVendorsData.data}
              yAxisSuffix="k"
            />
          </Card>
        )}

        {monthlyTrendData.data.length > 0 && (
          <Card style={styles.chartCard}>
            <LineChart
              testID="monthly-trend-chart"
              title="Monthly Spending Trend"
              labels={monthlyTrendData.labels}
              data={monthlyTrendData.data}
              yAxisSuffix="k"
            />
          </Card>
        )}

        {categoryData.length > 0 && (
          <Card style={styles.chartCard}>
            <PieChart
              testID="category-chart"
              title="Spending by Category"
              data={categoryData}
            />
          </Card>
        )}

        {!topVendorsData.data.length && !monthlyTrendData.data.length && !categoryData.length && (
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={64}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyText}>No analytics data available</Text>
            <Text style={styles.emptySubtext}>
              Start adding invoices to see insights
            </Text>
          </Card>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMain,
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textMain,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  chartCard: {
    padding: 16,
    marginBottom: 20,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMain,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },
});
