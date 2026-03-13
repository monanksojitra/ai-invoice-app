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

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.login({ email: email.trim().toLowerCase(), password });
      setAuth(res.user, res.token);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="receipt-text-check" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>InvoiceAI</Text>
            <Text style={styles.tagline}>Smart invoice management for your business</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <Input
              testID="login-email-input"
              label="Email Address"
              placeholder="you@business.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="email-outline"
              error={errors.email}
            />
            <Input
              testID="login-password-input"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-outline"
              error={errors.password}
            />

            <Button
              testID="login-submit-btn"
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: Layout.spacing.sm }}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              testID="go-to-register-btn"
              title="Create New Account"
              onPress={() => router.push('/(auth)/register')}
              variant="outline"
            />
          </View>

          <Text style={styles.footer}>
            InvoiceAI — Powered by Claude Vision AI
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, padding: Layout.spacing.xl },
  header: { alignItems: 'center', paddingVertical: Layout.spacing.xxl },
  logoBox: {
    width: 72, height: 72,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Layout.radius.xl,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  appName: { fontSize: Layout.fontSize.xxxl, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  tagline: { fontSize: Layout.fontSize.base, color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Layout.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  title: { fontSize: Layout.fontSize.xxl, fontWeight: '700', color: Colors.textMain, marginBottom: 6 },
  subtitle: { fontSize: Layout.fontSize.base, color: Colors.textMuted, marginBottom: Layout.spacing.xl },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Layout.spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: Layout.spacing.lg, color: Colors.textMuted, fontSize: Layout.fontSize.sm },
  footer: {
    textAlign: 'center', color: 'rgba(255,255,255,0.5)',
    fontSize: Layout.fontSize.xs, marginTop: Layout.spacing.xl,
  },
});
