import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../src/utils/api';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';
import { useInvoiceStore } from '../src/store/invoiceStore';

function formatCurrency(v: any) {
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function DetailRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.monoValue]}>{String(value)}</Text>
    </View>
  );
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

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshAll } = useInvoiceStore();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (id) {
      api.getInvoice(id).then(data => {
        setInvoice(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    setStatusLoading(true);
    try {
      await api.updateStatus(id, newStatus);
      setInvoice((prev: any) => ({ ...prev, status: newStatus }));
      await refreshAll();
    } catch {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Invoice', 'This cannot be undone. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteInvoice(id!);
            await refreshAll();
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  if (!invoice) return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.notFound}>Invoice not found</Text>
    </SafeAreaView>
  );

  const statusOptions = ['pending', 'paid', 'overdue', 'cancelled'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="detail-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Detail</Text>
        <TouchableOpacity testID="delete-invoice-btn" onPress={handleDelete} style={styles.deleteBtn}>
          <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
        {/* Top Card */}
        <Card style={styles.topCard} testID="invoice-detail-header">
          <View style={styles.topRow}>
            <View style={styles.vendorAvatar}>
              <Text style={styles.vendorAvatarText}>{(invoice.vendor_name || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{invoice.vendor_name || 'Unknown Vendor'}</Text>
              {invoice.vendor_gstin && <Text style={styles.gstin}>GSTIN: {invoice.vendor_gstin}</Text>}
            </View>
            <StatusBadge status={invoice.status} />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{formatCurrency(invoice.grand_total)}</Text>
            <Text style={styles.currency}>{invoice.currency || 'INR'}</Text>
          </View>
          {invoice.invoice_number && <Text style={styles.invoiceNo}>Invoice #{invoice.invoice_number}</Text>}
          {invoice.confidence_score && (
            <View style={styles.confRow}>
              <View style={[styles.confDot, { backgroundColor: invoice.confidence_score >= 80 ? Colors.success : Colors.warning }]} />
              <Text style={styles.confText}>AI Confidence: {invoice.confidence_score}%</Text>
            </View>
          )}
        </Card>

        {/* Update Status */}
        <Text style={styles.sectionTitle}>Update Status</Text>
        <View style={styles.statusRow}>
          {statusOptions.map(s => (
            <TouchableOpacity
              testID={`status-update-${s}`}
              key={s}
              onPress={() => handleStatusChange(s)}
              disabled={statusLoading}
              style={[styles.statusBtn, invoice.status === s && styles.statusBtnActive]}
            >
              <Text style={[styles.statusBtnText, invoice.status === s && styles.statusBtnTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Invoice Details */}
        <Text style={styles.sectionTitle}>Invoice Details</Text>
        <Card style={styles.card}>
          <DetailRow label="Invoice Date" value={invoice.invoice_date} />
          <DetailRow label="Due Date" value={invoice.due_date} />
          <DetailRow label="Payment Terms" value={invoice.payment_terms} />
          <DetailRow label="Source" value={invoice.source_type?.toUpperCase()} />
          <DetailRow label="Category" value={invoice.category} />
          <DetailRow label="Added On" value={invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : null} />
        </Card>

        {/* Vendor Details */}
        <Text style={styles.sectionTitle}>Vendor Details</Text>
        <Card style={styles.card}>
          <DetailRow label="Vendor Name" value={invoice.vendor_name} />
          <DetailRow label="GSTIN" value={invoice.vendor_gstin} mono />
          <DetailRow label="Phone" value={invoice.vendor_phone} />
          <DetailRow label="Address" value={invoice.vendor_address} />
        </Card>

        {/* Buyer Details */}
        {(invoice.buyer_name || invoice.buyer_gstin) && (
          <>
            <Text style={styles.sectionTitle}>Buyer Details</Text>
            <Card style={styles.card}>
              <DetailRow label="Buyer Name" value={invoice.buyer_name} />
              <DetailRow label="Buyer GSTIN" value={invoice.buyer_gstin} mono />
            </Card>
          </>
        )}

        {/* Tax Breakdown */}
        <Text style={styles.sectionTitle}>Tax Breakdown</Text>
        <Card style={styles.card}>
          <DetailRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
          {invoice.discount > 0 && <DetailRow label="Discount" value={formatCurrency(invoice.discount)} />}
          {invoice.cgst > 0 && <DetailRow label="CGST" value={formatCurrency(invoice.cgst)} />}
          {invoice.sgst > 0 && <DetailRow label="SGST" value={formatCurrency(invoice.sgst)} />}
          {invoice.igst > 0 && <DetailRow label="IGST" value={formatCurrency(invoice.igst)} />}
          {invoice.total_tax > 0 && <DetailRow label="Total Tax" value={formatCurrency(invoice.total_tax)} />}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.grand_total)}</Text>
          </View>
        </Card>

        {/* Line Items */}
        {invoice.line_items?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Line Items ({invoice.line_items.length})</Text>
            <Card style={styles.card}>
              {invoice.line_items.map((item: any, i: number) => (
                <View key={i} style={[styles.lineItem, i > 0 && styles.lineItemBorder]}>
                  <View style={styles.lineItemRow}>
                    <Text style={styles.lineDesc} numberOfLines={2}>{item.description}</Text>
                    <Text style={styles.lineTotal}>{formatCurrency(item.line_total)}</Text>
                  </View>
                  <Text style={styles.lineMeta}>
                    {item.quantity ? `${item.quantity} ${item.unit || 'pcs'}` : ''}
                    {item.unit_price ? ` @ ₹${item.unit_price}` : ''}
                    {item.hsn_code ? ` · HSN: ${item.hsn_code}` : ''}
                    {item.gst_rate ? ` · GST: ${item.gst_rate}%` : ''}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Notes */}
        {invoice.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Card style={styles.card}>
              <Text style={styles.notes}>{invoice.notes}</Text>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: Layout.spacing.lg,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginRight: Layout.spacing.sm },
  headerTitle: { flex: 1, fontSize: Layout.fontSize.lg, fontWeight: '700', color: Colors.textMain },
  deleteBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  scroll: { padding: Layout.spacing.lg },
  topCard: { padding: Layout.spacing.xl, marginBottom: Layout.spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Layout.spacing.lg },
  vendorAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: Layout.spacing.md,
  },
  vendorAvatarText: { fontSize: Layout.fontSize.xl, fontWeight: '700', color: Colors.primary },
  vendorName: { fontSize: Layout.fontSize.base, fontWeight: '700', color: Colors.textMain },
  gstin: { fontSize: Layout.fontSize.xs, color: Colors.info, marginTop: 2 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  amount: { fontSize: Layout.fontSize.xxxl, fontWeight: '700', color: Colors.textMain },
  currency: { fontSize: Layout.fontSize.base, color: Colors.textMuted, fontWeight: '500' },
  invoiceNo: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, marginTop: 4 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  confDot: { width: 8, height: 8, borderRadius: 4 },
  confText: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Layout.radius.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: Layout.fontSize.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: Layout.spacing.lg },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: Layout.spacing.md, flexWrap: 'wrap' },
  statusBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Layout.radius.full, borderWidth: 1.5, borderColor: Colors.border,
  },
  statusBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusBtnText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  statusBtnTextActive: { color: '#FFFFFF', fontWeight: '600' },
  card: { padding: Layout.spacing.lg, marginBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLabel: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, flex: 1 },
  detailValue: { fontSize: Layout.fontSize.sm, color: Colors.textMain, fontWeight: '500', flex: 1.5, textAlign: 'right' },
  monoValue: { fontVariant: ['tabular-nums'] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  totalLabel: { fontSize: Layout.fontSize.base, fontWeight: '700', color: Colors.textMain },
  totalValue: { fontSize: Layout.fontSize.lg, fontWeight: '700', color: Colors.primary },
  lineItem: { paddingVertical: 10 },
  lineItemBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  lineItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  lineDesc: { flex: 1, fontSize: Layout.fontSize.base, fontWeight: '500', color: Colors.textMain, marginRight: 8 },
  lineTotal: { fontSize: Layout.fontSize.base, fontWeight: '700', color: Colors.primary },
  lineMeta: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, marginTop: 3 },
  notes: { fontSize: Layout.fontSize.base, color: Colors.textMain, lineHeight: 22 },
  notFound: { textAlign: 'center', marginTop: 60, color: Colors.textMuted, fontSize: Layout.fontSize.lg },
});
