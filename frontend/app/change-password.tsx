import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';
import api from '../src/utils/api';

export default function ChangePasswordScreen() {
  const router = useRouter();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!oldPassword) {
      newErrors.oldPassword = 'Current password is required';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (newPassword === oldPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [oldPassword, newPassword, confirmPassword]);

  const handleChangePassword = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword
      });
      
      Alert.alert(
        'Success',
        'Your password has been changed successfully. Please use your new password for future logins.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }, [oldPassword, newPassword, validateForm, router]);

  const PasswordInput = useCallback(({ 
    value, 
    onChangeText, 
    placeholder, 
    show, 
    toggleShow,
    error 
  }: any) => (
    <View style={styles.passwordInputContainer}>
      <TextInput
        style={[styles.passwordInput, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <MaterialCommunityIcons
        name={show ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={Colors.textMuted}
        style={styles.eyeIcon}
        onPress={toggleShow}
      />
    </View>
  ), []);

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
            <MaterialCommunityIcons name="lock-reset" size={48} color={Colors.primary} />
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password to keep your account secure
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Current Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Current Password *</Text>
              <PasswordInput
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter your current password"
                show={showOldPassword}
                toggleShow={() => setShowOldPassword(!showOldPassword)}
                error={errors.oldPassword}
              />
              {errors.oldPassword && (
                <Text style={styles.errorText}>{errors.oldPassword}</Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.field}>
              <Text style={styles.label}>New Password *</Text>
              <PasswordInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter your new password"
                show={showNewPassword}
                toggleShow={() => setShowNewPassword(!showNewPassword)}
                error={errors.newPassword}
              />
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
              <Text style={styles.hint}>
                <MaterialCommunityIcons name="information-outline" size={12} /> 
                {' '}Minimum 8 characters
              </Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Confirm New Password *</Text>
              <PasswordInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your new password"
                show={showConfirmPassword}
                toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                error={errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          </View>

          {/* Security Tips */}
          <View style={styles.tipsBox}>
            <View style={styles.tipHeader}>
              <MaterialCommunityIcons name="shield-check" size={20} color={Colors.success} />
              <Text style={styles.tipTitle}>Password Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
                <Text style={styles.tipText}>Use at least 8 characters</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
                <Text style={styles.tipText}>Mix letters, numbers, and symbols</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
                <Text style={styles.tipText}>Don't reuse passwords from other sites</Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
                <Text style={styles.tipText}>Avoid personal information</Text>
              </View>
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
              title={loading ? "Changing..." : "Change Password"}
              onPress={handleChangePassword}
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
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    paddingRight: 48,
    fontSize: Layout.fontSize.base,
    color: Colors.textMain,
    minHeight: 48,
  },
  inputError: {
    borderColor: Colors.error,
  },
  eyeIcon: {
    position: 'absolute',
    right: Layout.spacing.md,
    top: 14,
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
  tipsBox: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.success + '10',
    borderRadius: Layout.radius.lg,
    marginTop: Layout.spacing.xl,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginBottom: Layout.spacing.sm,
  },
  tipTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  tipsList: {
    gap: Layout.spacing.xs,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  tipText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    flex: 1,
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
});
