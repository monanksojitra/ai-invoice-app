import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore, BusinessType } from '../../src/store/onboardingStore';
import { Button } from '../../src/components/ui/Button';
import Colors from '../../src/constants/Colors';
import Layout from '../../src/constants/Layout';

interface BusinessTypeOption {
  type: BusinessType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const BUSINESS_TYPES: BusinessTypeOption[] = [
  {
    type: 'retail',
    label: 'Retail Store',
    description: 'Grocery, pharmacy, general store',
    icon: 'store',
    color: Colors.primary,
  },
  {
    type: 'wholesale',
    label: 'Wholesale Business',
    description: 'Distributors, suppliers',
    icon: 'warehouse',
    color: Colors.info,
  },
  {
    type: 'restaurant',
    label: 'Restaurant/Cafe',
    description: 'Food & beverage business',
    icon: 'silverware-fork-knife',
    color: Colors.error,
  },
  {
    type: 'contractor',
    label: 'Contractor',
    description: 'Construction, electrical, plumbing',
    icon: 'hammer-wrench',
    color: Colors.warning,
  },
  {
    type: 'manufacturing',
    label: 'Manufacturing',
    description: 'Production, assembly',
    icon: 'factory',
    color: '#8B5CF6',
  },
  {
    type: 'services',
    label: 'Services',
    description: 'Consulting, maintenance, professional',
    icon: 'account-tie',
    color: Colors.success,
  },
  {
    type: 'other',
    label: 'Other',
    description: 'Other business type',
    icon: 'dots-horizontal-circle',
    color: Colors.textMuted,
  },
];

export default function BusinessTypeScreen() {
  const router = useRouter();
  const { data, setBusinessType, nextStep, previousStep } = useOnboardingStore();
  const [selectedType, setSelectedType] = useState<BusinessType | null>(data.businessType);

  const handleContinue = () => {
    if (!selectedType) {
      Alert.alert('Selection Required', 'Please select your business type to continue.');
      return;
    }

    try {
      setBusinessType(selectedType);
      nextStep();
      router.push('/(onboarding)/business-info');
    } catch (error) {
      Alert.alert('Error', 'Failed to save business type. Please try again.');
      console.error('Business type selection error:', error);
    }
  };

  const handleBack = () => {
    previousStep();
    router.back();
  };

  const handleTypeSelect = (type: BusinessType) => {
    setSelectedType(type);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
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
            <Text style={styles.title}>What's your business type?</Text>
            <Text style={styles.subtitle}>
              This helps us personalize your experience
            </Text>
          </View>
        </View>

        {/* Business Type Grid */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          testID="business-type-list"
        >
          {BUSINESS_TYPES.map((business) => (
            <TouchableOpacity
              key={business.type}
              testID={`business-type-${business.type}`}
              style={[
                styles.typeCard,
                selectedType === business.type && styles.typeCardActive,
              ]}
              onPress={() => handleTypeSelect(business.type)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: business.color + '15' }]}>
                <MaterialCommunityIcons
                  name={business.icon as any}
                  size={32}
                  color={business.color}
                />
              </View>
              <View style={styles.typeInfo}>
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === business.type && styles.typeLabelActive,
                  ]}
                >
                  {business.label}
                </Text>
                <Text
                  style={[
                    styles.typeDescription,
                    selectedType === business.type && styles.typeDescriptionActive,
                  ]}
                >
                  {business.description}
                </Text>
              </View>
              {selectedType === business.type && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={Colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            testID="continue-btn"
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedType}
            icon={<MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />}
            iconPosition="right"
          />
          <Text style={styles.footerText}>Step 2 of 4</Text>
        </View>
      </View>
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
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Layout.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.lg,
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: Layout.fontSize.base,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: 2,
  },
  typeLabelActive: {
    color: Colors.primary,
  },
  typeDescription: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
  },
  typeDescriptionActive: {
    color: Colors.primary + 'AA',
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
