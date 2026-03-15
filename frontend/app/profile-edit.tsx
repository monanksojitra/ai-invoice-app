import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/ui/Button';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';
import api from '../src/utils/api';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [gstin, setGstin] = useState(user?.gstin || '');
  const [businessType, setBusinessType] = useState(user?.business_type || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate GSTIN format (Indian tax ID)
  const validateGSTIN = useCallback((value: string): boolean => {
    if (!value) return true; // Optional field
    const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return pattern.test(value.toUpperCase());
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (gstin && !validateGSTIN(gstin)) {
      newErrors.gstin = 'Invalid GSTIN format (e.g., 22AAAAA0000A1Z5)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, businessName, gstin, validateGSTIN]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updates: any = {};
      if (name !== user?.name) updates.name = name.trim();
      if (businessName !== user?.business_name) updates.business_name = businessName.trim();
      if (gstin !== user?.gstin) updates.gstin = gstin.trim().toUpperCase() || null;
      if (businessType !== user?.business_type) updates.business_type = businessType || null;

      if (Object.keys(updates).length === 0) {
        Alert.alert('No Changes', 'No changes were made to your profile.');
        setLoading(false);
        return;
      }

      await api.updateProfile(updates);
      
      // Update local state
      updateUser(updates);
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [name, businessName, gstin, businessType, user, validateForm, updateUser, router]);

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
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Update your personal and business information</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Business Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={[styles.input, errors.businessName && styles.inputError]}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter your business name"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.businessName && (
                <Text style={styles.errorText}>{errors.businessName}</Text>
              )}
            </View>

            {/* GSTIN */}
            <View style={styles.field}>
              <Text style={styles.label}>GSTIN (Optional)</Text>
              <TextInput
                style={[styles.input, errors.gstin && styles.inputError]}
                value={gstin}
                onChangeText={(text) => setGstin(text.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={15}
              />
              {errors.gstin && (
                <Text style={styles.errorText}>{errors.gstin}</Text>
              )}
              <Text style={styles.hint}>
                <MaterialCommunityIcons name="information-outline" size={12} /> 
                {' '}Indian Goods and Services Tax Identification Number
              </Text>
            </View>

            {/* Business Type */}
            <View style={styles.field}>
              <Text style={styles.label}>Business Type (Optional)</Text>
              <TextInput
                style={styles.input}
                value={businessType}
                onChangeText={setBusinessType}
                placeholder="e.g., Retail, Wholesale, Restaurant"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

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

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="shield-check" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              Your information is securely stored and encrypted. We never share your data with third parties.
            </Text>
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
    marginBottom: Layout.spacing.xl,
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
  },
  form: {
    gap: Layout.spacing.lg,
  },
  field: {
    gap: Layout.spacing.xs,
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.textMain,
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
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.error,
    marginTop: 4,
  },
  hint: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textLight,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginTop: Layout.spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.md,
    backgroundColor: Colors.info + '10',
    borderRadius: Layout.radius.lg,
    marginTop: Layout.spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: Layout.fontSize.xs,
    color: Colors.info,
    lineHeight: 18,
  },
});
