import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useInvoiceStore } from '../../src/store/invoiceStore';
import { Card } from '../../src/components/ui/Card';
import api from '../../src/utils/api';
import Colors from '../../src/constants/Colors';
import Layout from '../../src/constants/Layout';

const STATUS_FILTERS = ['All', 'Pending', 'Paid', 'Overdue'];

function formatCurrency(amount: number) {
  return `₹${(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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
      <Text style={[styles.badgeText, { color: c.text }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

export default function LedgerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { invoices, total, isLoading, fetchInvoices } = useInvoiceStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (s?: string, sf?: string) => {
    const params: Record<string, string> = { limit: '50' };
    if (s) params.search = s;
    if (sf && sf !== 'All') params.status_filter = sf.toLowerCase();
    await fetchInvoices(params);
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(search, statusFilter);
    setRefreshing(false);
  };

  const onSearch = (text: string) => {
    setSearch(text);
    load(text, statusFilter);
  };

  const onStatusFilter = (sf: string) => {
    setStatusFilter(sf);
    load(search, sf);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Invoice', 'Are you sure you want to delete this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteInvoice(id);
            load(search, statusFilter);
          } catch {
            Alert.alert('Error', 'Failed to delete invoice');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      testID={`ledger-invoice-${item.id}`}
      onPress={() => router.push({ pathname: '/invoice-detail', params: { id: item.id } })}
      onLongPress={() => handleDelete(item.id)}
      activeOpacity={0.8}
    >
      <Card style={styles.invoiceCard}>
        <View style={styles.row}>
          <View style={[styles.sourceIcon, { backgroundColor: item.source_type === 'pdf' ? Colors.errorLight : Colors.primary + '15' }]}>
            <MaterialCommunityIcons
              name={item.source_type === 'pdf' ? 'file-pdf-box' : item.source_type === 'camera' ? 'camera' : 'image'}
              size={18}
              color={item.source_type === 'pdf' ? Colors.error : Colors.primary}
            />
          </View>
          <View style={styles.info}>
            <Text style={styles.vendorName} numberOfLines={1}>{item.vendor_name || 'Unknown Vendor'}</Text>
            <Text style={styles.meta}>
              {item.invoice_number ? `#${item.invoice_number}` : 'No number'}
              {item.invoice_date ? ` · ${item.invoice_date}` : ''}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.amount}>{formatCurrency(item.grand_total)}</Text>
            <StatusBadge status={item.status} />
          </View>
        </View>
        {item.due_date && item.status === 'pending' && (
          <Text style={styles.dueDate}>Due: {item.due_date}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Invoice Ledger</Text>
          <TouchableOpacity
            testID="export-btn"
            onPress={() => router.push('/export')}
            style={styles.exportBtn}
          >
            <MaterialCommunityIcons name="export" size={20} color={Colors.primary} />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{total} invoices total</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
          <TextInput
            testID="ledger-search-input"
            style={styles.searchInput}
            placeholder="Search vendor, invoice #..."
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={onSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => onSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status filter */}
        <View style={styles.filters}>
          {STATUS_FILTERS.map(sf => (
            <TouchableOpacity
              testID={`filter-${sf.toLowerCase()}`}
              key={sf}
              onPress={() => onStatusFilter(sf)}
              style={[styles.filterChip, statusFilter === sf && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, statusFilter === sf && styles.filterTextActive]}>{sf}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      {isLoading && invoices.length === 0 ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          testID="invoice-list"
          data={invoices}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="receipt-text-outline" size={56} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No invoices found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Layout.spacing.lg, paddingTop: Layout.spacing.lg, paddingBottom: Layout.spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: Layout.fontSize.xxl, fontWeight: '700', color: Colors.textMain },
  subtitle: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, marginBottom: Layout.spacing.md },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Layout.radius.full },
  exportText: { fontSize: Layout.fontSize.sm, color: Colors.primary, fontWeight: '600' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight, borderRadius: Layout.radius.lg,
    paddingHorizontal: Layout.spacing.lg, height: 46, gap: 8, marginBottom: Layout.spacing.md,
  },
  searchInput: { flex: 1, fontSize: Layout.fontSize.base, color: Colors.textMain },
  filters: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: Layout.radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  list: { padding: Layout.spacing.lg },
  invoiceCard: { marginBottom: Layout.spacing.sm, padding: Layout.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  sourceIcon: { width: 40, height: 40, borderRadius: Layout.radius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Layout.spacing.md },
  info: { flex: 1 },
  vendorName: { fontSize: Layout.fontSize.base, fontWeight: '600', color: Colors.textMain },
  meta: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: Layout.fontSize.base, fontWeight: '700', color: Colors.textMain },
  dueDate: { fontSize: Layout.fontSize.xs, color: Colors.warning, marginTop: 6, fontWeight: '500' },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: Layout.radius.full },
  badgeText: { fontSize: 10, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', color: Colors.textMain },
  emptyText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted },
});
