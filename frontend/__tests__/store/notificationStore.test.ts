/**
 * Notification Store Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useNotificationStore } from '../../src/store/notificationStore';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-notifications');

describe('notificationStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const state = useNotificationStore.getState();
    
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.preferences.paymentReminders).toBe(true);
    expect(state.preferences.pushEnabled).toBe(true);
  });

  it('should add notification', async () => {
    const store = useNotificationStore.getState();
    
    await store.addNotification({
      type: 'payment_due',
      title: 'Test Payment',
      message: 'Invoice due soon',
    });
    
    const newState = useNotificationStore.getState();
    expect(newState.notifications.length).toBe(1);
    expect(newState.unreadCount).toBe(1);
  });

  it('should mark notification as read', async () => {
    const store = useNotificationStore.getState();
    
    await store.addNotification({
      type: 'payment_due',
      title: 'Test',
      message: 'Test message',
    });
    
    const notification = useNotificationStore.getState().notifications[0];
    await store.markAsRead(notification.id);
    
    const newState = useNotificationStore.getState();
    expect(newState.unreadCount).toBe(0);
  });

  it('should mark all as read', async () => {
    const store = useNotificationStore.getState();
    
    await store.addNotification({ type: 'payment_due', title: 'Test 1', message: 'Msg 1' });
    await store.addNotification({ type: 'payment_due', title: 'Test 2', message: 'Msg 2' });
    
    await store.markAllAsRead();
    
    const newState = useNotificationStore.getState();
    expect(newState.unreadCount).toBe(0);
  });

  it('should delete notification', async () => {
    const store = useNotificationStore.getState();
    
    await store.addNotification({
      type: 'payment_due',
      title: 'Test',
      message: 'Test message',
    });
    
    const notification = useNotificationStore.getState().notifications[0];
    await store.deleteNotification(notification.id);
    
    const newState = useNotificationStore.getState();
    expect(newState.notifications.length).toBe(0);
  });

  it('should update preferences', async () => {
    const store = useNotificationStore.getState();
    
    await store.updatePreferences({
      paymentReminders: false,
      duplicateAlerts: false,
    });
    
    const newState = useNotificationStore.getState();
    expect(newState.preferences.paymentReminders).toBe(false);
    expect(newState.preferences.duplicateAlerts).toBe(false);
  });
});
