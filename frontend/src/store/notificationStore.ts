import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export type NotificationType = 
  | 'payment_due' 
  | 'payment_overdue' 
  | 'duplicate_invoice' 
  | 'anomaly' 
  | 'weekly_summary'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  invoiceId?: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

interface NotificationPreferences {
  paymentReminders: boolean;
  duplicateAlerts: boolean;
  anomalyAlerts: boolean;
  weeklySummary: boolean;
  pushEnabled: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';

  // Actions
  initialize: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  schedulePaymentReminder: (invoiceId: string, dueDate: Date, vendorName: string) => Promise<void>;
}

const STORAGE_KEY = '@invoiceai_notifications';
const PREFS_KEY = '@invoiceai_notification_prefs';

const defaultPreferences: NotificationPreferences = {
  paymentReminders: true,
  duplicateAlerts: true,
  anomalyAlerts: true,
  weeklySummary: true,
  pushEnabled: true,
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: defaultPreferences,
  isLoading: false,
  error: null,
  permissionStatus: 'undetermined',

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Load stored notifications and preferences
      await get().loadNotifications();
      
      // Request notification permissions
      await get().requestPermissions();
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Initialize notifications error:', error);
      set({ isLoading: false, error: 'Failed to initialize notifications' });
    }
  },

  loadNotifications: async () => {
    try {
      set({ isLoading: true, error: null });

      const [storedNotifs, storedPrefs] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(PREFS_KEY),
      ]);

      const notifications = storedNotifs ? JSON.parse(storedNotifs) : [];
      const preferences = storedPrefs ? JSON.parse(storedPrefs) : defaultPreferences;
      const unreadCount = notifications.filter((n: Notification) => !n.read).length;

      set({ 
        notifications, 
        preferences,
        unreadCount, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Load notifications error:', error);
      set({ 
        error: 'Failed to load notifications',
        isLoading: false 
      });
    }
  },

  addNotification: async (notification) => {
    try {
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        read: false,
      };

      const { notifications } = get();
      const updated = [newNotification, ...notifications];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      set({ 
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length,
      });

      // Show local notification if enabled
      const { preferences, permissionStatus } = get();
      if (preferences.pushEnabled && permissionStatus === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: newNotification.title,
            body: newNotification.message,
            data: { id: newNotification.id },
          },
          trigger: null, // Immediate
        });
      }
    } catch (error) {
      console.error('Add notification error:', error);
      set({ error: 'Failed to add notification' });
    }
  },

  markAsRead: async (id) => {
    try {
      const { notifications } = get();
      const updated = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      set({ 
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length,
      });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const { notifications } = get();
      const updated = notifications.map(n => ({ ...n, read: true }));

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      set({ 
        notifications: updated,
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      const { notifications } = get();
      const updated = notifications.filter(n => n.id !== id);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      set({ 
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length,
      });
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  },

  clearAll: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Clear all error:', error);
    }
  },

  updatePreferences: async (prefs) => {
    try {
      const { preferences } = get();
      const updated = { ...preferences, ...prefs };

      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));

      set({ preferences: updated });

      // If push was enabled, request permissions
      if (prefs.pushEnabled && updated.pushEnabled) {
        await get().requestPermissions();
      }
    } catch (error) {
      console.error('Update preferences error:', error);
      set({ error: 'Failed to update preferences' });
    }
  },

  requestPermissions: async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const permissionStatus = finalStatus === 'granted' ? 'granted' : 'denied';
      set({ permissionStatus });

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Request permissions error:', error);
      set({ permissionStatus: 'denied' });
      return false;
    }
  },

  schedulePaymentReminder: async (invoiceId, dueDate, vendorName) => {
    try {
      const { preferences, permissionStatus } = get();
      
      if (!preferences.paymentReminders || permissionStatus !== 'granted') {
        return;
      }

      const now = new Date();
      const threeDaysBefore = new Date(dueDate);
      threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

      // Schedule notification 3 days before due date
      if (threeDaysBefore > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💰 Payment Reminder',
            body: `Invoice from ${vendorName} is due in 3 days`,
            data: { invoiceId, type: 'payment_due' },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: threeDaysBefore },
        });
      }

      // Schedule on due date
      if (dueDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⚠️ Payment Due Today',
            body: `Invoice from ${vendorName} is due today`,
            data: { invoiceId, type: 'payment_due' },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dueDate },
        });
      }
    } catch (error) {
      console.error('Schedule payment reminder error:', error);
    }
  },
}));
