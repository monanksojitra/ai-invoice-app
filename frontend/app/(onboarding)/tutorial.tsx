import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui/Button';
import Colors from '../../src/constants/Colors';
import Layout from '../../src/constants/Layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialSlide {
  id: number;
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}

const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    id: 1,
    icon: 'scan-helper',
    iconColor: Colors.primary,
    title: 'Capture Invoices Instantly',
    description: 'Take a photo, upload from gallery, or select a PDF. Our AI extracts all invoice data automatically.',
  },
  {
    id: 2,
    icon: 'pencil-circle',
    iconColor: Colors.info,
    title: 'Review & Edit',
    description: 'Verify AI-extracted data, make corrections if needed, and categorize your invoices easily.',
  },
  {
    id: 3,
    icon: 'chart-line',
    iconColor: Colors.success,
    title: 'Track & Analyze',
    description: 'View all your invoices in one place, track payments, and get insights on your spending.',
  },
  {
    id: 4,
    icon: 'export',
    iconColor: Colors.warning,
    title: 'Export Anywhere',
    description: 'Export to Excel, CSV, or Google Sheets. Integrate with Tally and other accounting software.',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { completeOnboarding, isLoading, error } = useOnboardingStore();
  const { updateUser } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(slideIndex);
  };

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  const handleNext = () => {
    if (currentSlide < TUTORIAL_SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      await completeOnboarding();
      // Update auth user with onboarding data
      const onboardingData = useOnboardingStore.getState().data;
      updateUser({
        business_name: onboardingData.businessName,
        business_type: onboardingData.businessType || undefined,
        gstin: onboardingData.gstin || undefined,
      });
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert(
        'Error',
        error || 'Failed to complete onboarding. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Onboarding completion error:', err);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            testID="back-btn"
            onPress={handleBack}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textMain} />
          </TouchableOpacity>
          {currentSlide < TUTORIAL_SLIDES.length - 1 && (
            <TouchableOpacity
              testID="skip-btn"
              onPress={handleSkip}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Carousel */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          testID="tutorial-carousel"
          style={styles.carousel}
        >
          {TUTORIAL_SLIDES.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <View style={[styles.iconContainer, { backgroundColor: slide.iconColor + '15' }]}>
                <MaterialCommunityIcons
                  name={slide.icon as any}
                  size={80}
                  color={slide.iconColor}
                />
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {TUTORIAL_SLIDES.map((_, index) => (
            <TouchableOpacity
              key={index}
              testID={`pagination-dot-${index}`}
              onPress={() => goToSlide(index)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dot,
                  currentSlide === index && styles.dotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            testID={currentSlide === TUTORIAL_SLIDES.length - 1 ? "get-started-btn" : "next-btn"}
            title={currentSlide === TUTORIAL_SLIDES.length - 1 ? "Get Started" : "Next"}
            onPress={handleNext}
            loading={isLoading}
            disabled={isLoading}
            icon={
              <MaterialCommunityIcons
                name={currentSlide === TUTORIAL_SLIDES.length - 1 ? "check" : "arrow-right"}
                size={20}
                color="#FFFFFF"
              />
            }
            iconPosition="right"
          />
          <Text style={styles.footerText}>
            Step 4 of 4 • {currentSlide + 1}/{TUTORIAL_SLIDES.length}
          </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.lg,
  },
  headerButton: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
  },
  skipText: {
    fontSize: Layout.fontSize.base,
    color: Colors.primary,
    fontWeight: '600',
  },
  carousel: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xxl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.xxl,
  },
  slideTitle: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: '700',
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  slideDescription: {
    fontSize: Layout.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
    gap: Layout.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
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
