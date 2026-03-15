import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotificationStore } from '../src/store/notificationStore';
import { Card } from '../src/components/ui/Card';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';

interface SettingRowProps {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  description,
  value,
  onValueChange,
  testID,
}) => (
  <View style={styles.row}>
    <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '15' }]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={Colors.primary} />
    </View>
    <View style={styles.rowContent}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowDesc}>{description}</Text>
    </View>
    <Switch
      testID={testID}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
      thumbColor={value ? Colors.primary : Colors.textLight}
    />
  </View>
);

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const {
    preferences,
    permissionStatus,
    updatePreferences,
    requestPermissions,
    loadNotifications,
  } = useNotificationStore();

  useEffect(() => {
    loadNotifications();
  }, []);

  const handlePushToggle = async (value: boolean) => {
    if (value && permissionStatus !== 'granted') {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to receive push notifications.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // TODO: Open device settings
              Alert.alert('Info', 'Please enable notifications in Settings > InvoiceAI > Notifications');
            }},
          ]
        );
        return;
      }
    }
    await updatePreferences({ pushEnabled: value });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="back-btn"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Push Notifications */}
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <Card style={styles.card}>
          <SettingRow
            testID="push-enabled-toggle"
            icon="bell-ring"
            title="Enable Push Notifications"
            description="Receive notifications on your device"
            value={preferences.pushEnabled}
            onValueChange={handlePushToggle}
          />
        </Card>

        {permissionStatus === 'denied' && (
          <View style={styles.warningCard}>
            <MaterialCommunityIcons name="alert" size={20} color={Colors.warning} />
            <Text style={styles.warningText}>
              Notifications are blocked. Enable them in your device settings.
            </Text>
          </View>
        )}

        {/* Alert Types */}
        <Text style={styles.sectionTitle}>Alert Types</Text>
        <Card style={styles.card}>
          <SettingRow
            testID="payment-reminders-toggle"
            icon="calendar-clock"
            title="Payment Reminders"
            description="Notify before invoice due dates"
            value={preferences.paymentReminders}
            onValueChange={(val) => updatePreferences({ paymentReminders: val })}
          />
          <View style={styles.divider} />
          <SettingRow
            testID="duplicate-alerts-toggle"
            icon="content-duplicate"
            title="Duplicate Alerts"
            description="Alert when duplicate invoices are detected"
            value={preferences.duplicateAlerts}
            onValueChange={(val) => updatePreferences({ duplicateAlerts: val })}
          />
          <View style={styles.divider} />
          <SettingRow
            testID="anomaly-alerts-toggle"
            icon="alert-octagon"
            title="Anomaly Alerts"
            description="Notify about unusual invoice amounts"
            value={preferences.anomalyAlerts}
            onValueChange={(val) => updatePreferences({ anomalyAlerts: val })}
          />
          <View style={styles.divider} />
          <SettingRow
            testID="weekly-summary-toggle"
            icon="chart-line"
            title="Weekly Summary"
            description="Get weekly spending summary every Monday"
            value={preferences.weeklySummary}
            onValueChange={(val) => updatePreferences({ weeklySummary: val })}
          />
        </Card>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={Colors.info}
          />
          <Text style={styles.infoText}>
            Notifications help you stay on top of your invoices and never miss a payment deadline.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: Layout.spacing.sm,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.textMain,
  },
  scroll: {
    padding: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.lg,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: Layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: Layout.fontSize.base,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 70,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    backgroundColor: Colors.warningLight,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    color: Colors.warning,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.md,
    backgroundColor: Colors.info + '10',
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    marginTop: Layout.spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    color: Colors.info,
    lineHeight: 20,
  },
});
