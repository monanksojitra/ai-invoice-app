import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import Colors from '../../src/constants/Colors';
import Layout from '../../src/constants/Layout';

export default function BusinessInfoScreen() {
  const router = useRouter();
  const { data, setBusinessInfo, nextStep, previousStep } = useOnboardingStore();
  
  const [businessName, setBusinessName] = useState(data.businessName);
  const [userName, setUserName] = useState(data.userName);
  const [gstin, setGstin] = useState(data.gstin);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateGSTIN = (value: string): boolean => {
    if (!value.trim()) return true; // Optional field
    // GSTIN format: 2 digits + 10 alphanumeric + 1 letter + 1 digit + 1 letter + 1 alphanumeric
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    return gstinRegex.test(value.toUpperCase());
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    } else if (businessName.trim().length < 2) {
      newErrors.businessName = 'Business name must be at least 2 characters';
    }

    if (!userName.trim()) {
      newErrors.userName = 'Your name is required';
    } else if (userName.trim().length < 2) {
      newErrors.userName = 'Name must be at least 2 characters';
    }

    if (gstin.trim() && !validateGSTIN(gstin)) {
      newErrors.gstin = 'Invalid GSTIN format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fix the errors before continuing.');
      return;
    }

    try {
      setBusinessInfo(businessName.trim(), userName.trim(), gstin.trim().toUpperCase());
      nextStep();
      router.push('/(onboarding)/tutorial');
    } catch (error) {
      Alert.alert('Error', 'Failed to save information. Please try again.');
      console.error('Business info save error:', error);
    }
  };

  const handleBack = () => {
    previousStep();
    router.back();
  };

  const handleSkipGSTIN = () => {
    // Clear GSTIN and validate
    setGstin('');
    setErrors((prev) => ({ ...prev, gstin: '' }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-btn"
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textMain} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Tell us about your business</Text>
            <Text style={styles.subtitle}>
              This information helps us set up your account
            </Text>
          </View>
        </View>

        {/* Form */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            testID="business-name-input"
            label="Business Name *"
            placeholder="e.g., Ram's Grocery Store"
            value={businessName}
            onChangeText={(text) => {
              setBusinessName(text);
              if (errors.businessName) {
                setErrors((prev) => ({ ...prev, businessName: '' }));
              }
            }}
            error={errors.businessName}
            leftIcon="store"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
          />

          <Input
            testID="user-name-input"
            label="Your Name *"
            placeholder="e.g., Ramesh Kumar"
            value={userName}
            onChangeText={(text) => {
              setUserName(text);
              if (errors.userName) {
                setErrors((prev) => ({ ...prev, userName: '' }));
              }
            }}
            error={errors.userName}
            leftIcon="account"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
          />

          <Input
            testID="gstin-input"
            label="GSTIN (Optional)"
            placeholder="e.g., 22AAAAA0000A1Z5"
            value={gstin}
            onChangeText={(text) => {
              setGstin(text.toUpperCase());
              if (errors.gstin) {
                setErrors((prev) => ({ ...prev, gstin: '' }));
              }
            }}
            error={errors.gstin}
            leftIcon="card-account-details"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={15}
          />

          {gstin.trim().length > 0 && (
            <TouchableOpacity onPress={handleSkipGSTIN} style={styles.skipButton}>
              <Text style={styles.skipText}>Clear GSTIN</Text>
            </TouchableOpacity>
          )}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={Colors.info}
            />
            <Text style={styles.infoText}>
              GSTIN is optional. You can add it later from settings if needed for GST compliance.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            testID="continue-btn"
            title="Continue"
            onPress={handleContinue}
            icon={<MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />}
            iconPosition="right"
          />
          <Text style={styles.footerText}>Step 3 of 4</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Layout.spacing.xl,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: Layout.fontSize.base,
    color: Colors.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.xl,
  },
  contentContainer: {
    paddingBottom: Layout.spacing.xl,
  },
  skipButton: {
    alignSelf: 'flex-start',
    marginTop: -Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  skipText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.info + '10',
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    color: Colors.info,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Layout.spacing.md,
  },
});
