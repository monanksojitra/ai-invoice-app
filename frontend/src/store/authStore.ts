import { create } from 'zustand';
import { tokenStorage } from '../utils/api';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  business_name: string;
  gstin?: string;
  business_type?: string;
  plan: string;
  credits: number;
  monthly_invoice_count: number;
  monthly_invoice_limit: number | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: (user, token) => {
    tokenStorage.set(token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await tokenStorage.remove();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  loadAuth: async () => {
    try {
      const token = await tokenStorage.get();
      if (token) {
        const user = await api.me();
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await tokenStorage.remove();
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  updateUser: (updates) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...updates } });
    }
  },
}));
