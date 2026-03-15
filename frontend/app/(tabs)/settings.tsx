import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import Colors from '../../src/constants/Colors';
import Layout from '../../src/constants/Layout';

interface SettingRowProps {
  icon: string; iconColor?: string;
  title: string; subtitle?: string;
  onPress?: () => void; rightText?: string;
  testID?: string;
}

function SettingRow({ icon, iconColor, title, subtitle, onPress, rightText, testID }: SettingRowProps) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={styles.row} activeOpacity={0.7} disabled={!onPress}>
      <View style={[styles.rowIcon, { backgroundColor: (iconColor || Colors.primary) + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor || Colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      {rightText && <Text style={styles.rightText}>{rightText}</Text>}
      {onPress && <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  const planColor = user?.plan === 'pro' ? Colors.secondary : user?.plan === 'starter' ? Colors.info : Colors.textMuted;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile Card */}
        <Card style={styles.profileCard} testID="profile-card">
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profileBiz}>{user?.business_name}</Text>
            </View>
            <View style={[styles.planBadge, { backgroundColor: planColor + '20' }]}>
              <Text style={[styles.planText, { color: planColor }]}>{(user?.plan || 'free').toUpperCase()}</Text>
            </View>
          </View>
          {user?.gstin && (
            <View style={styles.gstinRow}>
              <MaterialCommunityIcons name="card-account-details-outline" size={14} color={Colors.info} />
              <Text style={styles.gstinText}>GSTIN: {user.gstin}</Text>
            </View>
          )}
        </Card>

        {/* Account Section */}
        <Text style={styles.sectionLabel}>Account</Text>
        <Card style={styles.sectionCard}>
          <SettingRow 
            testID="edit-profile-btn" 
            icon="account-edit-outline" 
            title="Edit Profile" 
            subtitle="Name, email, GSTIN"
            onPress={() => router.push('/profile-edit')}
          />
          <View style={styles.divider} />
          <SettingRow 
            testID="change-password-btn" 
            icon="lock-reset" 
            title="Change Password"
            onPress={() => router.push('/change-password')}
          />
          <View style={styles.divider} />
          <SettingRow 
            testID="business-settings-btn" 
            icon="store-settings-outline" 
            title="Business Settings" 
            subtitle={user?.business_type || 'Not set'}
            onPress={() => router.push('/business-settings')}
          />
        </Card>

        {/* Plan Section */}
        <Text style={styles.sectionLabel}>Plan & Billing</Text>
        <Card style={styles.sectionCard}>
          <SettingRow
            testID="current-plan-btn" 
            icon="crown-outline" 
            iconColor={Colors.secondary}
            title="Current Plan" 
            rightText={(user?.plan || 'free').charAt(0).toUpperCase() + (user?.plan || 'free').slice(1)}
            onPress={() => router.push('/plan-billing')}
          />
          <View style={styles.divider} />
          <SettingRow 
            testID="upgrade-plan-btn" 
            icon="arrow-up-circle-outline" 
            iconColor={Colors.success} 
            title="Upgrade Plan" 
            subtitle="Unlock more features"
            onPress={() => router.push('/plan-billing')}
          />
        </Card>

        {/* App Section */}
        <Text style={styles.sectionLabel}>App</Text>
        <Card style={styles.sectionCard}>
          <SettingRow 
            testID="notifications-btn" 
            icon="bell-outline" 
            title="Notifications" 
            subtitle="Payment reminders & alerts"
            onPress={() => router.push('/notification-settings')}
          />
          <View style={styles.divider} />
          <SettingRow 
            testID="about-btn" 
            icon="information-outline" 
            title="About InvoiceAI" 
            rightText="v1.0.0"
            onPress={() => router.push('/about')}
          />
          <View style={styles.divider} />
          <SettingRow 
            testID="privacy-btn" 
            icon="shield-account-outline" 
            title="Privacy Policy"
            onPress={() => router.push('/privacy-policy')}
          />
        </Card>

        {/* AI Section */}
        <Text style={styles.sectionLabel}>AI & Processing</Text>
        <Card style={styles.sectionCard}>
          <SettingRow icon="robot-outline" iconColor={Colors.primary} title="AI Model" subtitle="Claude Sonnet 4.5 Vision" rightText="Active" />
          <View style={styles.divider} />
          <SettingRow icon="translate" title="OCR Language" subtitle="Auto-detect (Hindi, Gujarati, Tamil...)" />
        </Card>

        {/* Logout */}
        <Button
          testID="logout-btn"
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          style={{ marginTop: Layout.spacing.xl }}
        />
        <Text style={styles.footer}>InvoiceAI v1.0 · Powered by Claude Vision AI</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Layout.spacing.lg },
  title: { fontSize: Layout.fontSize.xxl, fontWeight: '700', color: Colors.textMain, marginBottom: Layout.spacing.lg },
  profileCard: { marginBottom: Layout.spacing.xl },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.md },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: Layout.fontSize.xl, fontWeight: '700', color: '#FFFFFF' },
  profileName: { fontSize: Layout.fontSize.base, fontWeight: '700', color: Colors.textMain },
  profileEmail: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, marginTop: 2 },
  profileBiz: { fontSize: Layout.fontSize.sm, color: Colors.primary, fontWeight: '500', marginTop: 2 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Layout.radius.full },
  planText: { fontSize: 11, fontWeight: '700' },
  gstinRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Layout.spacing.md, paddingTop: Layout.spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  gstinText: { fontSize: Layout.fontSize.sm, color: Colors.info, fontWeight: '500' },
  sectionLabel: { fontSize: Layout.fontSize.sm, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, marginTop: Layout.spacing.lg, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCard: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: Layout.spacing.lg, minHeight: 60 },
  rowIcon: { width: 38, height: 38, borderRadius: Layout.radius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Layout.spacing.md },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: Layout.fontSize.base, fontWeight: '500', color: Colors.textMain },
  rowSub: { fontSize: Layout.fontSize.xs, color: Colors.textMuted, marginTop: 2 },
  rightText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, marginRight: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 70 },
  footer: { textAlign: 'center', fontSize: Layout.fontSize.xs, color: Colors.textLight, marginTop: Layout.spacing.xl },
});
