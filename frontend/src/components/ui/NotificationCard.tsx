import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Notification, NotificationType } from '../../store/notificationStore';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
  onDelete?: () => void;
  testID?: string;
}

const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'payment_due': return 'calendar-clock';
    case 'payment_overdue': return 'alert-circle';
    case 'duplicate_invoice': return 'content-duplicate';
    case 'anomaly': return 'alert-octagon';
    case 'weekly_summary': return 'chart-line';
    case 'system': return 'information';
    default: return 'bell';
  }
};

const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'payment_due': return Colors.warning;
    case 'payment_overdue': return Colors.error;
    case 'duplicate_invoice': return Colors.warning;
    case 'anomaly': return Colors.error;
    case 'weekly_summary': return Colors.info;
    case 'system': return Colors.primary;
    default: return Colors.textMuted;
  }
};

const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onDelete,
  testID,
}) => {
  const iconColor = getNotificationColor(notification.type);
  const isUnread = !notification.read;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, isUnread && styles.containerUnread]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
        <MaterialCommunityIcons
          name={getNotificationIcon(notification.type) as any}
          size={24}
          color={iconColor}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, isUnread && styles.titleUnread]}>
            {notification.title}
          </Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.timestamp}>
          {formatTimestamp(notification.timestamp)}
        </Text>
      </View>

      {onDelete && (
        <TouchableOpacity
          testID={`${testID}-delete`}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerUnread: {
    backgroundColor: Colors.primary + '05',
    borderColor: Colors.primary + '20',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: Layout.fontSize.base,
    fontWeight: '600',
    color: Colors.textMain,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 6,
  },
  message: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textLight,
  },
  deleteButton: {
    padding: 4,
    marginLeft: Layout.spacing.sm,
  },
});
