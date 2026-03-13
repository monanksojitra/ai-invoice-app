import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import api from '../../src/utils/api';
import Colors from '../../src/constants/Colors';
import Layout from '../../src/constants/Layout';

const BUSINESS_TYPES = ['Retail', 'Wholesale', 'Restaurant', 'Contractor', 'Manufacturing', 'Services', 'Other'];

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    business_name: '', gstin: '', business_type: 'Retail'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const update = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.business_name.trim()) e.business_name = 'Business name is required';
    if (form.gstin && form.gstin.length !== 15) e.gstin = 'GSTIN must be 15 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const res = await api.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: form.name.trim(),
        business_name: form.business_name.trim(),
        gstin: form.gstin || undefined,
        business_type: form.business_type.toLowerCase()
      });
      setAuth(res.user, res.token);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back button */}
          <TouchableOpacity testID="back-btn" onPress={() => step === 1 ? router.back() : setStep(1)} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="receipt-text-check" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.tagline}>{step === 1 ? 'Your personal details' : 'Your business details'}</Text>
          </View>

          {/* Step indicator */}
          <View style={styles.steps}>
            {[1, 2].map(s => (
              <View key={s} style={[styles.step, s <= step && styles.stepActive]} />
            ))}
          </View>

          {/* Card */}
          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Text style={styles.sectionTitle}>Personal Details</Text>
                <Input testID="register-name-input" label="Full Name" placeholder="Ramesh Patel" value={form.name} onChangeText={update('name')} leftIcon="account-outline" error={errors.name} />
                <Input testID="register-email-input" label="Email" placeholder="you@business.com" value={form.email} onChangeText={update('email')} keyboardType="email-address" autoCapitalize="none" leftIcon="email-outline" error={errors.email} />
                <Input testID="register-password-input" label="Password" placeholder="Min 6 characters" value={form.password} onChangeText={update('password')} secureTextEntry leftIcon="lock-outline" error={errors.password} />
                <Input testID="register-confirm-input" label="Confirm Password" placeholder="Re-enter password" value={form.confirmPassword} onChangeText={update('confirmPassword')} secureTextEntry leftIcon="lock-check-outline" error={errors.confirmPassword} />
                <Button testID="register-next-btn" title="Next" onPress={handleNext} />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Business Details</Text>
                <Input testID="register-business-input" label="Business Name" placeholder="Patel Grocery Store" value={form.business_name} onChangeText={update('business_name')} leftIcon="store-outline" error={errors.business_name} />
                <Input testID="register-gstin-input" label="GSTIN (Optional)" placeholder="27AAAAA0000A1Z5" value={form.gstin} onChangeText={update('gstin')} autoCapitalize="characters" leftIcon="card-account-details-outline" error={errors.gstin} />
                <Text style={styles.typeLabel}>Business Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
                  {BUSINESS_TYPES.map(type => (
                    <TouchableOpacity
                      key={type}
                      testID={`business-type-${type.toLowerCase()}`}
                      onPress={() => setForm(f => ({ ...f, business_type: type }))}
                      style={[styles.typeChip, form.business_type === type && styles.typeChipActive]}
                    >
                      <Text style={[styles.typeChipText, form.business_type === type && styles.typeChipTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Button testID="register-submit-btn" title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: Layout.spacing.lg }} />
              </>
            )}

            <TouchableOpacity testID="go-to-login-btn" onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, padding: Layout.spacing.xl },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  header: { alignItems: 'center', paddingBottom: Layout.spacing.xl },
  logoBox: {
    width: 60, height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Layout.radius.xl,
    justifyContent: 'center', alignItems: 'center', marginBottom: Layout.spacing.md,
  },
  appName: { fontSize: Layout.fontSize.xxl, fontWeight: '700', color: '#FFFFFF' },
  tagline: { fontSize: Layout.fontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Layout.spacing.lg },
  step: { width: 32, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  stepActive: { backgroundColor: Colors.secondary },
  card: {
    backgroundColor: Colors.surface, borderRadius: 24,
    padding: Layout.spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
  },
  sectionTitle: { fontSize: Layout.fontSize.lg, fontWeight: '700', color: Colors.textMain, marginBottom: Layout.spacing.lg },
  typeLabel: { fontSize: Layout.fontSize.sm, fontWeight: '600', color: Colors.textMain, marginBottom: 10 },
  typeRow: { marginBottom: Layout.spacing.lg },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Layout.radius.full, borderWidth: 1.5,
    borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.surface,
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  typeChipTextActive: { color: '#FFFFFF' },
  loginLink: { alignItems: 'center', marginTop: Layout.spacing.lg, paddingVertical: Layout.spacing.sm },
  loginLinkText: { color: Colors.textMuted, fontSize: Layout.fontSize.sm },
  loginLinkBold: { color: Colors.primary, fontWeight: '700' },
});
