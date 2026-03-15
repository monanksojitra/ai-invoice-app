import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'hi' | 'gu' | 'ta' | 'te' | 'mr' | 'bn' | 'ml' | 'kn';
export type BusinessType = 'retail' | 'wholesale' | 'contractor' | 'restaurant' | 'manufacturing' | 'services' | 'other';

interface OnboardingData {
  language: Language;
  businessType: BusinessType | null;
  businessName: string;
  userName: string;
  gstin: string;
}

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  data: OnboardingData;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLanguage: (language: Language) => void;
  setBusinessType: (type: BusinessType) => void;
  setBusinessInfo: (name: string, userName: string, gstin?: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setError: (error: string | null) => void;
}

const ONBOARDING_KEY = '@invoiceai_onboarding_completed';

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasCompletedOnboarding: false,
  currentStep: 0,
  data: {
    language: 'en',
    businessType: null,
    businessName: '',
    userName: '',
    gstin: '',
  },
  isLoading: false,
  error: null,

  setLanguage: (language) => {
    set((state) => ({
      data: { ...state.data, language },
      error: null,
    }));
  },

  setBusinessType: (businessType) => {
    set((state) => ({
      data: { ...state.data, businessType },
      error: null,
    }));
  },

  setBusinessInfo: (businessName, userName, gstin = '') => {
    set((state) => ({
      data: { ...state.data, businessName, userName, gstin },
      error: null,
    }));
  },

  nextStep: () => {
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 3),
      error: null,
    }));
  },

  previousStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
      error: null,
    }));
  },

  completeOnboarding: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Validate required fields
      const { data } = get();
      if (!data.businessType || !data.businessName.trim() || !data.userName.trim()) {
        throw new Error('Please fill in all required fields');
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      await AsyncStorage.setItem('@invoiceai_onboarding_data', JSON.stringify(data));

      set({ 
        hasCompletedOnboarding: true, 
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete onboarding';
      set({ 
        isLoading: false, 
        error: errorMessage,
      });
      throw error;
    }
  },

  checkOnboardingStatus: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      const savedData = await AsyncStorage.getItem('@invoiceai_onboarding_data');
      
      if (completed === 'true') {
        let data = get().data;
        try {
          if (savedData) {
            data = JSON.parse(savedData);
          }
        } catch (parseError) {
          console.error('Corrupted onboarding data, using defaults:', parseError);
        }
        set({ 
          hasCompletedOnboarding: true, 
          data,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      set({ 
        hasCompletedOnboarding: false, 
        isLoading: false,
        error: 'Failed to check onboarding status',
      });
    }
  },

  resetOnboarding: async () => {
    try {
      set({ isLoading: true, error: null });
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      await AsyncStorage.removeItem('@invoiceai_onboarding_data');
      set({
        hasCompletedOnboarding: false,
        currentStep: 0,
        data: {
          language: 'en',
          businessType: null,
          businessName: '',
          userName: '',
          gstin: '',
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      set({ 
        isLoading: false,
        error: 'Failed to reset onboarding',
      });
    }
  },

  setError: (error) => {
    set({ error });
  },
}));
