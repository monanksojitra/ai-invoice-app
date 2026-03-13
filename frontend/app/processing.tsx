import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../src/utils/api';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';

const STEPS = [
  { label: 'Preprocessing image...', icon: 'image-filter' },
  { label: 'Running AI OCR analysis...', icon: 'eye-scan' },
  { label: 'Extracting invoice fields...', icon: 'form-textbox' },
  { label: 'Validating data & checking duplicates...', icon: 'check-circle-outline' },
  { label: 'Almost done!', icon: 'check-decagram' },
];

export default function ProcessingScreen() {
  const router = useRouter();
  const { imageBase64, mimeType, sourceType } = useLocalSearchParams<{
    imageBase64: string; mimeType: string; sourceType: string;
  }>();

  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Rotate animation
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true
      })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    spin.start();
    pulse.start();
    return () => { spin.stop(); pulse.stop(); };
  }, []);

  // Step progression simulation
  useEffect(() => {
    const intervals: ReturnType<typeof setTimeout>[] = [];
    [2000, 5000, 8000, 11000].forEach((delay, i) => {
      intervals.push(setTimeout(() => setCurrentStep(i + 1), delay));
    });
    return () => intervals.forEach(clearTimeout);
  }, []);

  // Actual API call
  useEffect(() => {
    if (!imageBase64) {
      Alert.alert('Error', 'No image data provided');
      router.back();
      return;
    }
    const process = async () => {
      try {
        const result = await api.processInvoice({
          image_base64: imageBase64,
          source_type: sourceType || 'camera',
          mime_type: mimeType || 'image/jpeg',
        });
        setCurrentStep(4);
        setTimeout(() => {
          router.replace({
            pathname: '/review-invoice',
            params: {
              extractedData: JSON.stringify(result.extracted_data),
              confidenceScores: JSON.stringify(result.confidence_scores),
              overallConfidence: String(result.overall_confidence),
              validationIssues: JSON.stringify(result.validation_issues),
              duplicateCandidates: JSON.stringify(result.duplicate_candidates),
              sourceType: sourceType || 'camera',
              imageBase64: imageBase64,
              mimeType: mimeType || 'image/jpeg',
            }
          });
        }, 800);
      } catch (err: any) {
        setError(err.message || 'Processing failed');
      }
    };
    process();
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Processing Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            <Text style={styles.retryBtn} onPress={() => router.back()}>Try Again</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Animated Icon */}
        <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseAnim }] }]}>
          <Animated.View style={[styles.innerRing, { transform: [{ rotate }] }]}>
            <View style={styles.rotatingBorder} />
          </Animated.View>
          <View style={styles.iconCenter}>
            <MaterialCommunityIcons name="robot-happy-outline" size={48} color={Colors.primary} />
          </View>
        </Animated.View>

        <Text style={styles.title}>AI Processing Invoice</Text>
        <Text style={styles.subtitle}>Please wait while our AI agent extracts all invoice data</Text>

        {/* Steps */}
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[
                styles.stepDot,
                i < currentStep && styles.stepDone,
                i === currentStep && styles.stepActive,
              ]}>
                {i < currentStep ? (
                  <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                ) : i === currentStep ? (
                  <View style={styles.stepPulse} />
                ) : null}
              </View>
              <Text style={[
                styles.stepText,
                i < currentStep && styles.stepTextDone,
                i === currentStep && styles.stepTextActive,
              ]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Confidence hint */}
        <View style={styles.hint}>
          <MaterialCommunityIcons name="shield-check-outline" size={16} color={Colors.success} />
          <Text style={styles.hintText}>Powered by Claude Sonnet 4.5 Vision · 95%+ accuracy</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Layout.spacing.xl },
  outerRing: {
    width: 140, height: 140,
    justifyContent: 'center', alignItems: 'center', marginBottom: Layout.spacing.xxxl,
  },
  innerRing: { position: 'absolute', width: 140, height: 140 },
  rotatingBorder: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 3, borderColor: 'transparent',
    borderTopColor: Colors.primary, borderRightColor: Colors.secondary,
  },
  iconCenter: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: Layout.fontSize.xxl, fontWeight: '700', color: Colors.textMain, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: Layout.fontSize.base, color: Colors.textMuted, textAlign: 'center', marginBottom: Layout.spacing.xxl },
  steps: { width: '100%', gap: 14, marginBottom: Layout.spacing.xxl },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  stepDone: { backgroundColor: Colors.success },
  stepActive: { backgroundColor: Colors.primary },
  stepPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  stepText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted },
  stepTextDone: { color: Colors.success, fontWeight: '500' },
  stepTextActive: { color: Colors.primary, fontWeight: '600' },
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.successLight, borderRadius: Layout.radius.full,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  hintText: { fontSize: Layout.fontSize.xs, color: Colors.success, fontWeight: '500' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Layout.spacing.xl, gap: 12 },
  errorTitle: { fontSize: Layout.fontSize.xl, fontWeight: '700', color: Colors.textMain },
  errorText: { fontSize: Layout.fontSize.base, color: Colors.textMuted, textAlign: 'center' },
  errorActions: { marginTop: Layout.spacing.xl },
  retryBtn: { fontSize: Layout.fontSize.base, color: Colors.primary, fontWeight: '700' },
});
