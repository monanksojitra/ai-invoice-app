import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/utils/api';
import { Card } from '../../src/components/ui/Card';
import Colors from '../../src/constants/Colors';
import Layout from '../../src/constants/Layout';

function formatCurrency(amount: number) {
  return `₹${(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function VendorsScreen() {
  const insets = useSafeAreaInsets();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.listVendors();
      setVendors(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getInitial = (name: string) => (name || '?')[0].toUpperCase();

  const avatarColors = [Colors.primary, Colors.info, Colors.success, Colors.warning, '#8B5CF6', '#EC4899'];

  const renderItem = ({ item, index }: any) => {
    const color = avatarColors[index % avatarColors.length];
    return (
      <Card style={styles.vendorCard} testID={`vendor-card-${index}`}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: color + '15' }]}>
            <Text style={[styles.avatarText, { color }]}>{getInitial(item.name)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.vendorName}>{item.name}</Text>
            {item.gstin && <Text style={styles.gstin}>GSTIN: {item.gstin}</Text>}
            <Text style={styles.meta}>{item.total_invoices} invoices · Last: {item.last_invoice_date || 'N/A'}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.spend}>{formatCurrency(item.total_spend)}</Text>
            <Text style={styles.spendLabel}>Total Spend</Text>
          </View>
        </View>
        {item.phone && (
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="phone-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendors</Text>
        <Text style={styles.subtitle}>{vendors.length} vendors</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          testID="vendor-list"
          data={vendors}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="store-outline" size={56} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No vendors yet</Text>
              <Text style={styles.emptyText}>Vendors will appear as you add invoices</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface, borderBottomWidth: 1,
    borderBottomColor: Colors.border, padding: Layout.spacing.lg,
  },
  title: { fontSize: Layout.fontSize.xxl, fontWeight: '700', color: Colors.textMain },
  subtitle: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, marginTop: 2 },
  list: { padding: Layout.spacing.lg },
  vendorCard: { marginBottom: Layout.spacing.md, padding: Layout.spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: Layout.spacing.lg,
  },
  avatarText: { fontSize: Layout.fontSize.xl, fontWeight: '700' },
  info: { flex: 1 },
  vendorName: { fontSize: Layout.fontSize.base, fontWeight: '700', color: Colors.textMain },
  gstin: { fontSize: Layout.fontSize.xs, color: Colors.info, fontWeight: '500', marginTop: 2 },
  meta: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  spend: { fontSize: Layout.fontSize.lg, fontWeight: '700', color: Colors.primary },
  spendLabel: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Layout.spacing.sm, paddingTop: Layout.spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  phone: { fontSize: Layout.fontSize.sm, color: Colors.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', color: Colors.textMain },
  emptyText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted },
});
