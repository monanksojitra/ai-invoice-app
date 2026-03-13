import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../src/utils/api';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Input } from '../src/components/ui/Input';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';

const FORMATS = [
  { id: 'excel', label: 'Excel (.xlsx)', icon: 'microsoft-excel', desc: 'Full spreadsheet with formatting', color: '#217346' },
  { id: 'csv', label: 'CSV', icon: 'file-delimited', desc: 'Compatible with Tally, Zoho Books', color: Colors.info },
];

const STATUS_OPTIONS = ['All', 'Pending', 'Paid', 'Overdue'];

export default function ExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [format, setFormat] = useState('excel');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState<{ count: number; filename: string } | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setExported(null);
    try {
      const res = await api.exportInvoices({
        format,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status_filter: statusFilter !== 'All' ? statusFilter.toLowerCase() : undefined,
      });

      if (res.count === 0) {
        Alert.alert('No Data', 'No invoices match your filter criteria.');
        setLoading(false);
        return;
      }

      // Decode base64 and save file
      const fileUri = `${FileSystem.documentDirectory}${res.filename}`;
      await FileSystem.writeAsStringAsync(fileUri, res.data_base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: format === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
          dialogTitle: `Export ${res.count} Invoices`,
          UTI: format === 'excel' ? 'com.microsoft.excel.xlsx' : 'public.comma-separated-values-text',
        });
      }

      setExported({ count: res.count, filename: res.filename });
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="export-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="close" size={22} color={Colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.title}>Export Invoices</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
        {/* Success state */}
        {exported && (
          <Card style={styles.successCard}>
            <MaterialCommunityIcons name="check-circle" size={40} color={Colors.success} />
            <Text style={styles.successTitle}>Export Complete!</Text>
            <Text style={styles.successText}>{exported.count} invoices exported as {exported.filename}</Text>
          </Card>
        )}

        {/* Format Selection */}
        <Text style={styles.sectionTitle}>Export Format</Text>
        <View style={styles.formatRow}>
          {FORMATS.map(f => (
            <TouchableOpacity
              testID={`format-${f.id}`}
              key={f.id}
              onPress={() => setFormat(f.id)}
              style={[styles.formatCard, format === f.id && styles.formatCardActive]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={f.icon as any} size={32} color={format === f.id ? '#FFFFFF' : f.color} />
              <Text style={[styles.formatLabel, format === f.id && styles.formatLabelActive]}>{f.label}</Text>
              <Text style={[styles.formatDesc, format === f.id && styles.formatDescActive]}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Range */}
        <Text style={styles.sectionTitle}>Date Range (Optional)</Text>
        <Card style={styles.card}>
          <Input
            testID="export-date-from"
            label="From Date"
            placeholder="YYYY-MM-DD"
            value={dateFrom}
            onChangeText={setDateFrom}
            containerStyle={{ marginBottom: 0 }}
            leftIcon="calendar-start"
          />
          <Input
            testID="export-date-to"
            label="To Date"
            placeholder="YYYY-MM-DD"
            value={dateTo}
            onChangeText={setDateTo}
            containerStyle={{ marginBottom: 0 }}
            leftIcon="calendar-end"
          />
        </Card>

        {/* Status Filter */}
        <Text style={styles.sectionTitle}>Filter by Status</Text>
        <View style={styles.filters}>
          {STATUS_OPTIONS.map(s => (
            <TouchableOpacity
              testID={`export-status-${s.toLowerCase()}`}
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[styles.chip, statusFilter === s && styles.chipActive]}
            >
              <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Export Tips */}
        <Card style={styles.tipCard} variant="flat">
          <Text style={styles.tipTitle}>Export includes:</Text>
          {['All invoice fields', 'GST breakdown (CGST/SGST/IGST)', 'Line items on separate sheet (Excel)', 'Vendor information'].map(t => (
            <View key={t} style={styles.tipRow}>
              <MaterialCommunityIcons name="check" size={14} color={Colors.success} />
              <Text style={styles.tipText}>{t}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Export Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          testID="export-submit-btn"
          title={loading ? 'Exporting...' : `Export as ${format === 'excel' ? 'Excel' : 'CSV'}`}
          onPress={handleExport}
          loading={loading}
          icon={<MaterialCommunityIcons name="export" size={20} color="#FFFFFF" />}
        />
      </View>
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
  title: { fontSize: Layout.fontSize.xl, fontWeight: '700', color: Colors.textMain },
  scroll: { padding: Layout.spacing.lg },
  successCard: {
    alignItems: 'center', gap: 8, marginBottom: Layout.spacing.xl,
    borderColor: Colors.success, borderWidth: 1.5,
  },
  successTitle: { fontSize: Layout.fontSize.lg, fontWeight: '700', color: Colors.success },
  successText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  sectionTitle: { fontSize: Layout.fontSize.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: Layout.spacing.lg },
  formatRow: { flexDirection: 'row', gap: Layout.spacing.md, marginBottom: Layout.spacing.sm },
  formatCard: {
    flex: 1, alignItems: 'center', padding: Layout.spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Layout.radius.xl,
    borderWidth: 1.5, borderColor: Colors.border, gap: 6,
  },
  formatCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  formatLabel: { fontSize: Layout.fontSize.sm, fontWeight: '700', color: Colors.textMain, textAlign: 'center' },
  formatLabelActive: { color: '#FFFFFF' },
  formatDesc: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  formatDescActive: { color: 'rgba(255,255,255,0.7)' },
  card: { marginBottom: 4 },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: Layout.spacing.sm },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Layout.radius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF' },
  tipCard: { marginTop: Layout.spacing.lg, padding: Layout.spacing.lg },
  tipTitle: { fontSize: Layout.fontSize.sm, fontWeight: '700', color: Colors.textMain, marginBottom: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tipText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted },
  footer: {
    backgroundColor: Colors.surface, padding: Layout.spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
});
