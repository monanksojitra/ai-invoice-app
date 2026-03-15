import { create } from 'zustand';
import api from '../utils/api';

interface PlanConfig {
  tier: string;
  name: string;
  price_monthly: number;
  currency: string;
  monthly_invoice_limit: number | null;
  api_calls_per_hour: number;
  initial_credits: number;
  features: string[];
}

interface CreditPackage {
  credits: number;
  price: number;
  bonus_credits: number;
  total_credits: number;
  savings_percent: number;
}

interface Subscription {
  subscription_tier: string;
  plan_name: string;
  credits: number;
  monthly_invoice_count: number;
  monthly_invoice_limit: number | null;
  api_calls_per_hour: number;
  api_calls_this_hour: number;
  subscription_start_date: string;
  subscription_end_date: string | null;
  monthly_reset_date: string;
  auto_recharge_enabled: boolean;
  is_active: boolean;
  features: string[];
}

interface UsageStats {
  total_invoices_processed: number;
  invoices_this_month: number;
  total_credits_used: number;
  credits_remaining: number;
  subscription_tier: string;
  monthly_limit: number | null;
  api_calls_remaining: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  credits_added?: number;
  plan_upgraded_to?: string;
  payment_method: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

interface SubscriptionState {
  plans: PlanConfig[];
  creditPackages: CreditPackage[];
  subscription: Subscription | null;
  usageStats: UsageStats | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPlans: () => Promise<void>;
  loadSubscription: () => Promise<void>;
  loadUsageStats: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  upgradeSubscription: (plan: string, paymentMethod: string) => Promise<any>;
  purchaseCredits: (credits: number, paymentMethod: string) => Promise<any>;
  refreshAfterPurchase: () => Promise<void>;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plans: [],
  creditPackages: [],
  subscription: null,
  usageStats: null,
  transactions: [],
  isLoading: false,
  error: null,

  loadPlans: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/plans`);
      if (!response.ok) throw new Error('Failed to load plans');
      const data = await response.json();
      set({ 
        plans: data.plans,
        creditPackages: data.credit_packages,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadSubscription: async () => {
    try {
      set({ isLoading: true, error: null });
      const subscription = await api.get('/user/subscription');
      set({ subscription, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadUsageStats: async () => {
    try {
      const usageStats = await api.get('/user/usage-stats');
      set({ usageStats });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  loadTransactions: async () => {
    try {
      const response = await api.get('/transactions?limit=50');
      set({ transactions: response.transactions });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  upgradeSubscription: async (plan: string, paymentMethod: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post('/subscription/upgrade', {
        target_plan: plan,
        payment_method: paymentMethod
      });
      set({ isLoading: false });
      return response;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  purchaseCredits: async (credits: number, paymentMethod: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post('/credits/purchase', {
        credits,
        payment_method: paymentMethod
      });
      set({ isLoading: false });
      return response;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  refreshAfterPurchase: async () => {
    // Refresh subscription and usage stats after successful purchase
    await Promise.all([
      get().loadSubscription(),
      get().loadUsageStats(),
      get().loadTransactions()
    ]);
  },

  clearError: () => set({ error: null }),
}));
