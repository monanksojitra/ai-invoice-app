import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../src/utils/api';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';
import { useInvoiceStore } from '../src/store/invoiceStore';

const CATEGORIES = ['Food & Beverage', 'Raw Materials', 'Utilities', 'Equipment', 'Services', 'Transport', 'Other'];
const STATUSES = ['pending', 'paid', 'overdue'];

function ConfidenceDot({ score }: { score?: number }) {
  if (!score) return null;
  const color = score >= 70 ? Colors.success : score >= 40 ? Colors.warning : Colors.error;
  return <View style={[styles.confDot, { backgroundColor: color }]} />;
}

function EditableField({
  label, value, onChange, multiline, keyboardType, confidence, testID
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; keyboardType?: any; confidence?: number; testID?: string;
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLabel}>
        <Text style={styles.labelText}>{label}</Text>
        <ConfidenceDot score={confidence} />
      </View>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChange}
        style={[styles.fieldInput, multiline && styles.multilineInput]}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLowerCase()}...`}
        placeholderTextColor={Colors.textLight}
      />
    </View>
  );
}

export default function ReviewInvoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshAll } = useInvoiceStore();
  const params = useLocalSearchParams<any>();

  const extractedRaw = params.extractedData ? JSON.parse(params.extractedData) : {};
  const confidence = params.confidenceScores ? JSON.parse(params.confidenceScores) : {};
  const validationIssues = params.validationIssues ? JSON.parse(params.validationIssues) : [];
  const duplicateCandidates = params.duplicateCandidates ? JSON.parse(params.duplicateCandidates) : [];
  const overallConf = parseInt(params.overallConfidence || '80');
  const sourceType = params.sourceType || 'camera';
  const imageBase64 = params.imageBase64 || '';
  const mimeType = params.mimeType || 'image/jpeg';

  const [form, setForm] = useState({
    invoice_number: extractedRaw.invoice_number || '',
    invoice_date: extractedRaw.invoice_date || '',
    due_date: extractedRaw.due_date || '',
    vendor_name: extractedRaw.vendor_name || '',
    vendor_gstin: extractedRaw.vendor_gstin || '',
    vendor_phone: extractedRaw.vendor_phone || '',
    vendor_address: extractedRaw.vendor_address || '',
    buyer_name: extractedRaw.buyer_name || '',
    buyer_gstin: extractedRaw.buyer_gstin || '',
    subtotal: String(extractedRaw.subtotal || ''),
    discount: String(extractedRaw.discount || '0'),
    cgst: String(extractedRaw.cgst || '0'),
    sgst: String(extractedRaw.sgst || '0'),
    igst: String(extractedRaw.igst || '0'),
    total_tax: String(extractedRaw.total_tax || '0'),
    grand_total: String(extractedRaw.grand_total || ''),
    currency: extractedRaw.currency || 'INR',
    payment_terms: extractedRaw.payment_terms || '',
    notes: extractedRaw.notes || '',
    category: '',
    status: 'pending',
  });

  const [saving, setSaving] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const update = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.vendor_name.trim() && !form.grand_total.trim()) {
      Alert.alert('Validation Error', 'Please enter at least vendor name and grand total.');
      return;
    }
    setSaving(true);
    try {
      const lineItems = (extractedRaw.line_items || []).map((item: any) => ({
        description: item.description || '',
        hsn_code: item.hsn_code || null,
        quantity: parseFloat(item.quantity) || null,
        unit: item.unit || null,
        unit_price: parseFloat(item.unit_price) || null,
        line_total: parseFloat(item.line_total) || 0,
        gst_rate: parseFloat(item.gst_rate) || null,
      }));

      await api.createInvoice({
        ...form,
        subtotal: parseFloat(form.subtotal) || null,
        discount: parseFloat(form.discount) || 0,
        cgst: parseFloat(form.cgst) || 0,
        sgst: parseFloat(form.sgst) || 0,
        igst: parseFloat(form.igst) || 0,
        total_tax: parseFloat(form.total_tax) || 0,
        grand_total: parseFloat(form.grand_total) || 0,
        line_items: lineItems,
        source_type: sourceType,
        confidence_score: overallConf,
        is_duplicate: duplicateCandidates.length > 0,
      });

      await refreshAll();
      Alert.alert('Success!', 'Invoice saved to your ledger.', [
        { text: 'View Ledger', onPress: () => router.replace('/(tabs)/ledger') },
        { text: 'Go Home', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const confColor = overallConf >= 80 ? Colors.success : overallConf >= 60 ? Colors.warning : Colors.error;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="review-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textMain} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Review Invoice</Text>
            <Text style={styles.headerSub}>Edit and confirm extracted data</Text>
          </View>
          <View style={[styles.confBadge, { backgroundColor: confColor + '20' }]}>
            <Text style={[styles.confText, { color: confColor }]}>{overallConf}% conf</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
          {/* Alerts */}
          {duplicateCandidates.length > 0 && (
            <View style={styles.alertBox}>
              <MaterialCommunityIcons name="content-duplicate" size={18} color={Colors.warning} />
              <Text style={styles.alertText}>Potential duplicate detected! Review carefully before saving.</Text>
            </View>
          )}
          {validationIssues.length > 0 && (
            <View style={[styles.alertBox, styles.errorAlert]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.error} />
              <Text style={[styles.alertText, { color: Colors.error }]}>{validationIssues.length} validation issue(s) found</Text>
            </View>
          )}

          {/* Image Preview Toggle */}
          <TouchableOpacity
            testID="toggle-image-btn"
            onPress={() => setShowImage(!showImage)}
            style={styles.imageToggle}
          >
            <MaterialCommunityIcons name={showImage ? 'image-off' : 'image-eye'} size={18} color={Colors.primary} />
            <Text style={styles.imageToggleText}>{showImage ? 'Hide' : 'Show'} original invoice</Text>
          </TouchableOpacity>

          {showImage && imageBase64 && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: `data:${mimeType};base64,${imageBase64}` }}
                style={styles.invoiceImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Vendor Details */}
          <Text style={styles.sectionTitle}>Vendor Information</Text>
          <Card style={styles.card}>
            <EditableField testID="vendor-name-input" label="Vendor Name *" value={form.vendor_name} onChange={update('vendor_name')} confidence={confidence.vendor_name} />
            <EditableField label="Vendor GSTIN" value={form.vendor_gstin} onChange={update('vendor_gstin')} />
            <EditableField label="Vendor Phone" value={form.vendor_phone} onChange={update('vendor_phone')} keyboardType="phone-pad" />
            <EditableField label="Vendor Address" value={form.vendor_address} onChange={update('vendor_address')} multiline />
          </Card>

          {/* Invoice Details */}
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <Card style={styles.card}>
            <EditableField testID="invoice-number-input" label="Invoice Number" value={form.invoice_number} onChange={update('invoice_number')} confidence={confidence.invoice_number} />
            <EditableField label="Invoice Date (YYYY-MM-DD)" value={form.invoice_date} onChange={update('invoice_date')} confidence={confidence.invoice_date} />
            <EditableField label="Due Date (YYYY-MM-DD)" value={form.due_date} onChange={update('due_date')} />
            <EditableField label="Payment Terms" value={form.payment_terms} onChange={update('payment_terms')} />
          </Card>

          {/* Amounts */}
          <Text style={styles.sectionTitle}>Amounts (₹)</Text>
          <Card style={styles.card}>
            <EditableField label="Subtotal" value={form.subtotal} onChange={update('subtotal')} keyboardType="numeric" />
            <EditableField label="Discount" value={form.discount} onChange={update('discount')} keyboardType="numeric" />
            <EditableField label="CGST" value={form.cgst} onChange={update('cgst')} keyboardType="numeric" />
            <EditableField label="SGST" value={form.sgst} onChange={update('sgst')} keyboardType="numeric" />
            <EditableField label="IGST" value={form.igst} onChange={update('igst')} keyboardType="numeric" />
            <EditableField label="Total Tax" value={form.total_tax} onChange={update('total_tax')} keyboardType="numeric" />
            <EditableField testID="grand-total-input" label="Grand Total *" value={form.grand_total} onChange={update('grand_total')} keyboardType="numeric" confidence={confidence.grand_total} />
          </Card>

          {/* Category & Status */}
          <Text style={styles.sectionTitle}>Classification</Text>
          <Card style={styles.card}>
            <Text style={styles.labelText}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 12 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  testID={`cat-${cat.replace(/ /g, '-').toLowerCase()}`}
                  onPress={() => setForm(f => ({ ...f, category: cat }))}
                  style={[styles.chip, form.category === cat && styles.chipActive]}
                >
                  <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.labelText}>Status</Text>
            <View style={styles.statusRow}>
              {STATUSES.map(s => (
                <TouchableOpacity
                  key={s}
                  testID={`status-${s}`}
                  onPress={() => setForm(f => ({ ...f, status: s }))}
                  style={[styles.statusChip, form.status === s && styles.statusChipActive]}
                >
                  <Text style={[styles.statusText, form.status === s && styles.statusTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Notes */}
          <Card style={styles.card}>
            <EditableField label="Notes" value={form.notes} onChange={update('notes')} multiline />
          </Card>

          {/* Line Items */}
          {extractedRaw.line_items?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Line Items ({extractedRaw.line_items.length})</Text>
              <Card style={styles.card}>
                {extractedRaw.line_items.map((item: any, i: number) => (
                  <View key={i} style={[styles.lineItem, i > 0 && styles.lineItemBorder]}>
                    <Text style={styles.lineItemDesc}>{item.description}</Text>
                    <View style={styles.lineItemRow}>
                      {item.quantity && <Text style={styles.lineItemMeta}>Qty: {item.quantity} {item.unit || ''}</Text>}
                      {item.unit_price && <Text style={styles.lineItemMeta}>₹{item.unit_price} each</Text>}
                      <Text style={styles.lineItemTotal}>₹{item.line_total}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Button
            testID="save-invoice-btn"
            title="Save Invoice"
            onPress={handleSave}
            loading={saving}
            icon={<MaterialCommunityIcons name="content-save-check" size={20} color="#FFFFFF" />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: Layout.spacing.lg,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginRight: Layout.spacing.md },
  headerTitle: { fontSize: Layout.fontSize.lg, fontWeight: '700', color: Colors.textMain },
  headerSub: { fontSize: Layout.fontSize.xs, color: Colors.textMuted },
  confBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Layout.radius.full },
  confText: { fontSize: Layout.fontSize.xs, fontWeight: '700' },
  scroll: { padding: Layout.spacing.lg },
  alertBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.warningLight, borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg, marginBottom: Layout.spacing.md,
  },
  errorAlert: { backgroundColor: Colors.errorLight },
  alertText: { flex: 1, fontSize: Layout.fontSize.sm, color: Colors.warning, fontWeight: '500' },
  imageToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: Layout.spacing.md,
  },
  imageToggleText: { fontSize: Layout.fontSize.sm, color: Colors.primary, fontWeight: '600' },
  imageContainer: { borderRadius: Layout.radius.lg, overflow: 'hidden', marginBottom: Layout.spacing.xl, borderWidth: 1, borderColor: Colors.border },
  invoiceImage: { width: '100%', height: 300 },
  sectionTitle: { fontSize: Layout.fontSize.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: Layout.spacing.lg },
  card: { padding: Layout.spacing.lg, marginBottom: 4 },
  fieldRow: { marginBottom: Layout.spacing.md },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  labelText: { fontSize: Layout.fontSize.sm, fontWeight: '600', color: Colors.textMain },
  confDot: { width: 8, height: 8, borderRadius: 4 },
  fieldInput: {
    backgroundColor: Colors.surfaceHighlight, borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.md, paddingVertical: 10,
    fontSize: Layout.fontSize.base, color: Colors.textMain, borderWidth: 1, borderColor: Colors.border,
  },
  multilineInput: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Layout.radius.full,
    borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF' },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statusChip: {
    flex: 1, paddingVertical: 8, borderRadius: Layout.radius.lg,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  statusChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  statusTextActive: { color: '#FFFFFF', fontWeight: '600' },
  lineItem: { paddingVertical: 10 },
  lineItemBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  lineItemDesc: { fontSize: Layout.fontSize.base, fontWeight: '500', color: Colors.textMain, marginBottom: 4 },
  lineItemRow: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  lineItemMeta: { fontSize: Layout.fontSize.xs, color: Colors.textMuted },
  lineItemTotal: { fontSize: Layout.fontSize.sm, fontWeight: '700', color: Colors.primary, marginLeft: 'auto' },
  footer: {
    backgroundColor: Colors.surface, padding: Layout.spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
});
