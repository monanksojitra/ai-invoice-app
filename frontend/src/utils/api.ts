import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const TOKEN_KEY = 'invoiceai_token';

// Use SecureStore on native, AsyncStorage on web
export const tokenStorage = {
  get: async () => {
    try {
      if (Platform.OS === 'web') return AsyncStorage.getItem(TOKEN_KEY);
      return SecureStore.getItemAsync(TOKEN_KEY);
    } catch { return null; }
  },
  set: async (token: string) => {
    try {
      if (Platform.OS === 'web') return AsyncStorage.setItem(TOKEN_KEY, token);
      return SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {}
  },
  remove: async () => {
    try {
      if (Platform.OS === 'web') return AsyncStorage.removeItem(TOKEN_KEY);
      return SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {}
  },
};

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = await tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    await tokenStorage.remove();
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),

  // Invoice processing
  processInvoice: (data: any) => request('/process-invoice', { method: 'POST', body: JSON.stringify(data) }),

  // Invoices
  createInvoice: (data: any) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  listInvoices: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/invoices${qs}`);
  },
  getInvoice: (id: string) => request(`/invoices/${id}`),
  updateInvoice: (id: string, data: any) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) => request(`/invoices/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) => request(`/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Vendors
  listVendors: () => request('/vendors'),

  // Analytics
  getAnalytics: () => request('/analytics/summary'),

  // Export
  exportInvoices: (data: any) => request('/export', { method: 'POST', body: JSON.stringify(data) }),

  // Corrections
  logCorrection: (data: any) => request('/corrections', { method: 'POST', body: JSON.stringify(data) }),

  // Subscription & Credits
  getPlans: () => request('/plans'),
  getSubscription: () => request('/user/subscription'),
  getUsageStats: () => request('/user/usage-stats'),
  upgradeSubscription: (data: any) => request('/subscription/upgrade', { method: 'POST', body: JSON.stringify(data) }),
  purchaseCredits: (data: any) => request('/credits/purchase', { method: 'POST', body: JSON.stringify(data) }),
  getCreditBalance: () => request('/credits/balance'),
  getTransactions: (limit: number = 20) => request(`/transactions?limit=${limit}`),
  getUsageHistory: (params?: { limit?: number; days?: number }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request(`/usage/history${qs}`);
  },

  // Profile & Settings
  updateProfile: (data: any) => request('/user/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data: any) => request('/user/password', { method: 'PATCH', body: JSON.stringify(data) }),
  updateNotifications: (data: any) => request('/user/notifications', { method: 'PATCH', body: JSON.stringify(data) }),

  // Payment
  createPaymentOrder: (data: any) => request('/payment/create-order', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data: any) => request('/payment/verify', { method: 'POST', body: JSON.stringify(data) }),
  getPaymentGateways: () => request('/payment/gateways'),

  // Generic methods for flexibility
  get: (path: string) => request(path),
  post: (path: string, data?: any) => request(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: (path: string, data?: any) => request(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  put: (path: string, data?: any) => request(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};

export const API_BASE_URL = BASE_URL;
export default api;
