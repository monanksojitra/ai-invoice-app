/**
 * Onboarding Store Tests
 * Testing all onboarding flow logic and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingStore } from '../../src/store/onboardingStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('onboardingStore', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useOnboardingStore.getState();
      
      expect(state.hasCompletedOnboarding).toBe(false);
      expect(state.currentStep).toBe(0);
      expect(state.data.language).toBe('en');
      expect(state.data.businessType).toBe(null);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('setLanguage', () => {
    it('should set language correctly', () => {
      const store = useOnboardingStore.getState();
      store.setLanguage('hi');
      
      const newState = useOnboardingStore.getState();
      expect(newState.data.language).toBe('hi');
      expect(newState.error).toBe(null);
    });
  });

  describe('setBusinessType', () => {
    it('should set business type correctly', () => {
      const store = useOnboardingStore.getState();
      store.setBusinessType('retail');
      
      const newState = useOnboardingStore.getState();
      expect(newState.data.businessType).toBe('retail');
      expect(newState.error).toBe(null);
    });
  });

  describe('setBusinessInfo', () => {
    it('should set business info correctly', () => {
      const store = useOnboardingStore.getState();
      store.setBusinessInfo('Test Business', 'Test User', '22AAAAA0000A1Z5');
      
      const newState = useOnboardingStore.getState();
      expect(newState.data.businessName).toBe('Test Business');
      expect(newState.data.userName).toBe('Test User');
      expect(newState.data.gstin).toBe('22AAAAA0000A1Z5');
    });
  });

  describe('Navigation Steps', () => {
    it('should increment step with nextStep', () => {
      const store = useOnboardingStore.getState();
      store.nextStep();
      
      const newState = useOnboardingStore.getState();
      expect(newState.currentStep).toBe(1);
    });

    it('should not exceed maximum step', () => {
      const store = useOnboardingStore.getState();
      store.nextStep();
      store.nextStep();
      store.nextStep();
      store.nextStep();
      
      const newState = useOnboardingStore.getState();
      expect(newState.currentStep).toBe(3);
    });
  });

  describe('completeOnboarding', () => {
    it('should throw error if required fields are missing', async () => {
      const store = useOnboardingStore.getState();
      
      await expect(store.completeOnboarding()).rejects.toThrow('Please fill in all required fields');
    });

    it('should complete onboarding with valid data', async () => {
      const store = useOnboardingStore.getState();
      store.setLanguage('en');
      store.setBusinessType('retail');
      store.setBusinessInfo('Test Business', 'Test User');
      
      await store.completeOnboarding();
      
      const newState = useOnboardingStore.getState();
      expect(newState.hasCompletedOnboarding).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@invoiceai_onboarding_completed', 'true');
    });
  });
});
