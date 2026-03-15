import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useInvoiceStore } from '../../src/store/invoiceStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import Colors from '../../src/constants/Colors';
import Layout from '../../src/constants/Layout';

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    paid: { bg: Colors.successLight, text: Colors.success },
    pending: { bg: Colors.warningLight, text: Colors.warning },
    overdue: { bg: Colors.errorLight, text: Colors.error },
    cancelled: { bg: Colors.surfaceHighlight, text: Colors.textMuted },
  };
  const c = colorMap[status] || colorMap.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { invoices, analytics, isLoading, fetchInvoices, fetchAnalytics } = useInvoiceStore();
  const { unreadCount, loadNotifications } = useNotificationStore();

  const load = useCallback(async () => {
    await Promise.all([
      fetchInvoices({ limit: '8' }), 
      fetchAnalytics(),
      loadNotifications()
    ]);
  }, []);

  useEffect(() => { load(); }, []);

  const overall = analytics?.overall || {};
  const thisMonth = analytics?.this_month || {};
  const topVendors = analytics?.top_vendors || [];

  const stats = [
    { label: 'Total Invoices', value: String(overall.total_invoices || 0), icon: 'receipt-text', color: Colors.primary },
    { label: 'This Month', value: formatCurrency(thisMonth.amount || 0), icon: 'calendar-month', color: Colors.info },
    { label: 'Pending', value: formatCurrency(overall.pending_amount || 0), icon: 'clock-outline', color: Colors.warning },
    { label: 'Overdue', value: formatCurrency(overall.overdue_amount || 0), icon: 'alert-circle-outline', color: Colors.error },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        testID="home-screen"
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.businessName}>{user?.business_name || user?.name}</Text>
          </View>
          <TouchableOpacity 
            testID="notification-btn" 
            style={styles.notifBtn}
            onPress={() => router.push('/notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={Colors.primary} />
            {unreadCount > 0 && (
              <Badge 
                count={unreadCount} 
                size="sm"
                style={styles.notifBadge}
                testID="notification-badge"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Action */}
        <TouchableOpacity
          testID="scan-invoice-btn"
          onPress={() => router.push('/(tabs)/capture')}
          style={styles.scanCard}
          activeOpacity={0.9}
        >
          <View>
            <Text style={styles.scanTitle}>Scan New Invoice</Text>
            <Text style={styles.scanSub}>Camera • Gallery • PDF</Text>
          </View>
          <View style={styles.scanIcon}>
            <MaterialCommunityIcons name="scan-helper" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity
            testID="calendar-btn"
            onPress={() => router.push('/calendar')}
            style={styles.quickLink}
          >
            <MaterialCommunityIcons name="calendar-month" size={24} color={Colors.primary} />
            <Text style={styles.quickLinkText}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="analytics-btn"
            onPress={() => router.push('/analytics')}
            style={styles.quickLink}
          >
            <MaterialCommunityIcons name="chart-box" size={24} color={Colors.info} />
            <Text style={styles.quickLinkText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="export-btn"
            onPress={() => router.push('/export')}
            style={styles.quickLink}
          >
            <MaterialCommunityIcons name="file-export" size={24} color={Colors.success} />
            <Text style={styles.quickLinkText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map(stat => (
            <Card key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <MaterialCommunityIcons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* Top Vendors */}
        {topVendors.length > 0 && (
          <>
            <View style={styles.rowHeader}>
              <Text style={styles.sectionTitle}>Top Vendors</Text>
              <TouchableOpacity testID="view-vendors-btn" onPress={() => router.push('/(tabs)/vendors')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topVendors.slice(0, 5).map((v: any, i: number) => (
                <Card key={i} style={styles.vendorCard}>
                  <View style={styles.vendorAvatar}>
                    <Text style={styles.vendorAvatarText}>{(v.name || '?')[0].toUpperCase()}</Text>
                  </View>
                  <Text style={styles.vendorName} numberOfLines={1}>{v.name}</Text>
                  <Text style={styles.vendorAmount}>{formatCurrency(v.total_spend)}</Text>
                  <Text style={styles.vendorCount}>{v.count} invoices</Text>
                </Card>
              ))}
            </ScrollView>
          </>
        )}

        {/* Recent Invoices */}
        <View style={styles.rowHeader}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          <TouchableOpacity testID="view-all-invoices-btn" onPress={() => router.push('/(tabs)/ledger')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {isLoading && invoices.length === 0 ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : invoices.length === 0 ? (
          <Card style={styles.emptyCard}>
            <MaterialCommunityIcons name="receipt-text-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No invoices yet</Text>
            <Text style={styles.emptyText}>Tap the + button to scan your first invoice</Text>
          </Card>
        ) : (
          invoices.slice(0, 5).map(inv => (
            <TouchableOpacity
              testID={`invoice-card-${inv.id}`}
              key={inv.id}
              onPress={() => router.push({ pathname: '/invoice-detail', params: { id: inv.id } })}
              activeOpacity={0.8}
            >
              <Card style={styles.invoiceCard}>
                <View style={styles.invoiceRow}>
                  <View style={styles.invoiceLeft}>
                    <View style={styles.invoiceIcon}>
                      <MaterialCommunityIcons
                        name={inv.source_type === 'pdf' ? 'file-pdf-box' : 'receipt-text'}
                        size={22} color={Colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vendorNameText} numberOfLines={1}>{inv.vendor_name || 'Unknown Vendor'}</Text>
                      <Text style={styles.invoiceMeta}>
                        {inv.invoice_number ? `#${inv.invoice_number} · ` : ''}
                        {inv.invoice_date || 'No date'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceAmount}>{formatCurrency(inv.grand_total || 0)}</Text>
                    <StatusBadge status={inv.status} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Layout.spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.spacing.lg },
  greeting: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, fontWeight: '400' },
  businessName: { fontSize: Layout.fontSize.xl, fontWeight: '700', color: Colors.textMain },
  notifBtn: {
    width: 42, height: 42,
    backgroundColor: Colors.surface, borderRadius: Layout.radius.lg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  scanCard: {
    backgroundColor: Colors.primary, borderRadius: 20,
    padding: Layout.spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  scanTitle: { fontSize: Layout.fontSize.lg, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  scanSub: { fontSize: Layout.fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  scanIcon: {
    width: 56, height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Layout.radius.xl,
    justifyContent: 'center', alignItems: 'center',
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.xl,
    gap: 12,
  },
  quickLink: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  quickLinkText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMain,
    fontWeight: '600',
  },
  sectionTitle: { fontSize: Layout.fontSize.lg, fontWeight: '700', color: Colors.textMain, marginBottom: Layout.spacing.md },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Layout.spacing.md },
  seeAll: { fontSize: Layout.fontSize.sm, color: Colors.primary, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Layout.spacing.xl },
  statCard: { width: '47%', padding: Layout.spacing.md },
  statIcon: { width: 40, height: 40, borderRadius: Layout.radius.lg, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: Layout.fontSize.lg, fontWeight: '700', color: Colors.textMain },
  statLabel: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  vendorCard: { width: 120, marginRight: Layout.spacing.md, alignItems: 'center', padding: Layout.spacing.md },
  vendorAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  vendorAvatarText: { fontSize: Layout.fontSize.lg, fontWeight: '700', color: Colors.primary },
  vendorName: { fontSize: Layout.fontSize.sm, fontWeight: '600', color: Colors.textMain, textAlign: 'center' },
  vendorAmount: { fontSize: Layout.fontSize.sm, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  vendorCount: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  emptyCard: { alignItems: 'center', padding: Layout.spacing.xxl, gap: 8 },
  emptyTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', color: Colors.textMain },
  emptyText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  invoiceCard: { marginBottom: Layout.spacing.sm, padding: Layout.spacing.md },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  invoiceLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  invoiceIcon: {
    width: 44, height: 44, backgroundColor: Colors.primary + '15',
    borderRadius: Layout.radius.lg, justifyContent: 'center', alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  vendorNameText: { fontSize: Layout.fontSize.base, fontWeight: '600', color: Colors.textMain },
  invoiceMeta: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  invoiceAmount: { fontSize: Layout.fontSize.base, fontWeight: '700', color: Colors.textMain },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Layout.radius.full },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
