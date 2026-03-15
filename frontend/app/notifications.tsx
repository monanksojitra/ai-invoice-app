import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotificationStore } from '../src/store/notificationStore';
import { NotificationCard } from '../src/components/ui/NotificationCard';
import { Button } from '../src/components/ui/Button';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';

const FILTER_OPTIONS = ['All', 'Unread', 'Payment', 'Alerts'];

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: any) => {
    await markAsRead(notification.id);
    
    // Navigate to invoice detail if invoiceId exists
    if (notification.invoiceId) {
      router.push({
        pathname: '/invoice-detail',
        params: { id: notification.invoiceId },
      });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotification(id),
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      'Clear All Notifications',
      'This will delete all notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAll,
        },
      ]
    );
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    markAllAsRead();
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'Unread') return !notif.read;
    if (filter === 'Payment') {
      return notif.type === 'payment_due' || notif.type === 'payment_overdue';
    }
    if (filter === 'Alerts') {
      return notif.type === 'duplicate_invoice' || notif.type === 'anomaly';
    }
    return true;
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              testID="mark-all-read-btn"
              onPress={handleMarkAllRead}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="check-all" size={22} color={Colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="settings-btn"
            onPress={() => router.push('/notification-settings')}
            style={styles.headerButton}
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color={Colors.textMain} />
          </TouchableOpacity>
        </View>
      </View>

      {unreadCount > 0 && (
        <Text style={styles.subtitle}>{unreadCount} unread</Text>
      )}

      {/* Filters */}
      <View style={styles.filters}>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            testID={`filter-${option.toLowerCase()}`}
            onPress={() => setFilter(option)}
            style={[
              styles.filterChip,
              filter === option && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === option && styles.filterTextActive,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <MaterialCommunityIcons
        name="bell-outline"
        size={64}
        color={Colors.textLight}
      />
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptyText}>
        {filter !== 'All'
          ? `No ${filter.toLowerCase()} notifications`
          : "You're all caught up!"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {renderHeader()}

      <FlatList
        testID="notification-list"
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            testID={`notification-${item.id}`}
            notification={item}
            onPress={() => handleNotificationPress(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      />

      {notifications.length > 0 && (
        <View style={styles.footer}>
          <Button
            testID="clear-all-btn"
            title="Clear All"
            onPress={handleClearAll}
            variant="outline"
            size="sm"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: '700',
    color: Colors.textMain,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    marginTop: 4,
    marginBottom: Layout.spacing.md,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: Layout.spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: Layout.spacing.md,
  },
  emptyTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
  },
  emptyText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    padding: Layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
