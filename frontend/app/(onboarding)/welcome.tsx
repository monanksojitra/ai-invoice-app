import React, { useState, useEffect, useRef } from 'react';
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
import { useOnboardingStore, Language } from '../../src/store/onboardingStore';
import { Button } from '../../src/components/ui/Button';
import Colors from '../../src/constants/Colors';
import Layout from '../../src/constants/Layout';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  icon: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', icon: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', icon: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', icon: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', icon: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', icon: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', icon: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', icon: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', icon: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', icon: '🇮🇳' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { data, setLanguage, nextStep } = useOnboardingStore();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(data.language);
  const hasUserSelected = useRef(false);

  // Sync with store on mount (e.g., after reset)
  useEffect(() => {
    if (!hasUserSelected.current) {
      setSelectedLanguage(data.language);
    }
  }, [data.language]);

  const handleContinue = () => {
    try {
      setLanguage(selectedLanguage);
      nextStep();
      router.push('/(onboarding)/business-type');
    } catch (error) {
      Alert.alert('Error', 'Failed to save language selection. Please try again.');
      console.error('Language selection error:', error);
    }
  };

  const handleLanguageSelect = (code: Language) => {
    hasUserSelected.current = true;
    setSelectedLanguage(code);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons 
              name="receipt-text-check" 
              size={64} 
              color={Colors.primary} 
            />
          </View>
          <Text style={styles.title}>Welcome to InvoiceAI</Text>
          <Text style={styles.subtitle}>
            Manage your invoices with AI-powered automation
          </Text>
        </View>

        {/* Language Selection */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Choose Your Language</Text>
          <Text style={styles.sectionSubtitle}>
            Select your preferred language for the app
          </Text>

          <ScrollView 
            style={styles.languageList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.languageListContent}
            testID="language-list"
          >
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                testID={`language-${lang.code}`}
                style={[
                  styles.languageCard,
                  selectedLanguage === lang.code && styles.languageCardActive,
                ]}
                onPress={() => handleLanguageSelect(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.languageIcon}>{lang.icon}</Text>
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    selectedLanguage === lang.code && styles.languageNameActive,
                  ]}>
                    {lang.name}
                  </Text>
                  <Text style={[
                    styles.languageNative,
                    selectedLanguage === lang.code && styles.languageNativeActive,
                  ]}>
                    {lang.nativeName}
                  </Text>
                </View>
                {selectedLanguage === lang.code && (
                  <MaterialCommunityIcons 
                    name="check-circle" 
                    size={24} 
                    color={Colors.primary} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <Button
            testID="continue-btn"
            title="Continue"
            onPress={handleContinue}
            icon={<MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />}
            iconPosition="right"
          />
          <Text style={styles.footerText}>
            Step 1 of 4
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
    alignItems: 'center',
    paddingTop: Layout.spacing.xxl,
    paddingHorizontal: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Layout.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: Layout.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Layout.spacing.lg,
  },
  languageList: {
    flex: 1,
  },
  languageListContent: {
    paddingBottom: Layout.spacing.xl,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  languageCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  languageIcon: {
    fontSize: 32,
    marginRight: Layout.spacing.md,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: Layout.fontSize.base,
    fontWeight: '600',
    color: Colors.textMain,
  },
  languageNameActive: {
    color: Colors.primary,
  },
  languageNative: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  languageNativeActive: {
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
