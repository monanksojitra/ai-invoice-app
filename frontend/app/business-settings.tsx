import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';
import api from '../src/utils/api';

const BUSINESS_TYPES = [
  { value: 'retail', label: 'Retail Store', icon: 'store' },
  { value: 'wholesale', label: 'Wholesale', icon: 'warehouse' },
  { value: 'restaurant', label: 'Restaurant/Cafe', icon: 'silverware-fork-knife' },
  { value: 'manufacturing', label: 'Manufacturing', icon: 'factory' },
  { value: 'services', label: 'Services', icon: 'briefcase' },
  { value: 'construction', label: 'Construction', icon: 'hammer-wrench' },
  { value: 'ecommerce', label: 'E-commerce', icon: 'cart' },
  { value: 'other', label: 'Other', icon: 'dots-horizontal' },
];

export default function BusinessSettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  
  const [businessType, setBusinessType] = useState(user?.business_type || 'retail');
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [loading, setLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!businessName.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }

    setLoading(true);
    try {
      const updates: any = {};
      if (businessType !== user?.business_type) updates.business_type = businessType;
      if (businessName !== user?.business_name) updates.business_name = businessName.trim();
      if (gstin !== user?.gstin) updates.gstin = gstin.trim().toUpperCase() || null;

      if (Object.keys(updates).length === 0) {
        Alert.alert('No Changes', 'No changes were made to your business settings.');
        setLoading(false);
        return;
      }

      await api.updateProfile(updates);
      updateUser(updates);
      
      Alert.alert('Success', 'Business settings updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update business settings');
    } finally {
      setLoading(false);
    }
  }, [businessType, businessName, gstin, user, updateUser, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons name="store-settings" size={48} color={Colors.primary} />
            <Text style={styles.title}>Business Settings</Text>
            <Text style={styles.subtitle}>
              Configure your business information and preferences
            </Text>
          </View>

          {/* Business Type Selection */}
          <Text style={styles.label}>Business Type *</Text>
          <View style={styles.typeGrid}>
            {BUSINESS_TYPES.map((type) => (
              <Pressable
                key={type.value}
                style={[
                  styles.typeCard,
                  businessType === type.value && styles.typeCardSelected
                ]}
                onPress={() => setBusinessType(type.value)}
              >
                <MaterialCommunityIcons 
                  name={type.icon as any} 
                  size={28} 
                  color={businessType === type.value ? Colors.primary : Colors.textMuted} 
                />
                <Text style={[
                  styles.typeLabel,
                  businessType === type.value && styles.typeLabelSelected
                ]}>
                  {type.label}
                </Text>
                {businessType === type.value && (
                  <View style={styles.checkMark}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={Colors.primary} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* Business Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Enter your business name"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
          </View>

          {/* GSTIN */}
          <View style={styles.field}>
            <Text style={styles.label}>GSTIN (Optional)</Text>
            <TextInput
              style={styles.input}
              value={gstin}
              onChangeText={(text) => setGstin(text.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="characters"
              maxLength={15}
            />
            <Text style={styles.hint}>
              <MaterialCommunityIcons name="information-outline" size={12} /> 
              {' '}Your Goods and Services Tax Identification Number
            </Text>
          </View>

          {/* Info Card */}
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={20} color={Colors.warning} />
              <Text style={styles.infoTitle}>Why this matters?</Text>
            </View>
            <Text style={styles.infoText}>
              Setting your business type helps us provide better insights and recommendations 
              tailored to your industry. Your GSTIN will be automatically recognized in invoices.
            </Text>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelButton}
              disabled={loading}
            />
            <Button
              title={loading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              loading={loading}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.xl,
  },
  typeCard: {
    width: '48%',
    padding: Layout.spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Layout.radius.lg,
    alignItems: 'center',
    gap: Layout.spacing.xs,
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  typeLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkMark: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  field: {
    marginBottom: Layout.spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    fontSize: Layout.fontSize.base,
    color: Colors.textMain,
    minHeight: 48,
  },
  hint: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textLight,
    marginTop: 4,
  },
  infoCard: {
    marginBottom: Layout.spacing.xl,
    backgroundColor: Colors.warning + '10',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
  },
  infoTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.warning,
  },
  infoText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});
