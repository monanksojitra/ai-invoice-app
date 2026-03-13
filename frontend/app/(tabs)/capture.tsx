import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Colors from '../../src/constants/Colors';
import Layout from '../../src/constants/Layout';

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<string | null>(null);

  const requestPermission = async (type: 'camera' | 'gallery') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const navigateToProcessing = (imageBase64: string, mimeType: string, sourceType: string) => {
    router.push({
      pathname: '/processing',
      params: { imageBase64, mimeType, sourceType }
    });
  };

  const handleCamera = async () => {
    const ok = await requestPermission('camera');
    if (!ok) {
      Alert.alert('Permission Required', 'Camera access is needed to capture invoices.');
      return;
    }
    setLoading('camera');
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0].base64) {
        navigateToProcessing(result.assets[0].base64, 'image/jpeg', 'camera');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to capture image');
    } finally {
      setLoading(null);
    }
  };

  const handleGallery = async () => {
    const ok = await requestPermission('gallery');
    if (!ok) {
      Alert.alert('Permission Required', 'Gallery access is needed to upload invoices.');
      return;
    }
    setLoading('gallery');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
        base64: true,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets[0].base64) {
        const mime = result.assets[0].mimeType || 'image/jpeg';
        navigateToProcessing(result.assets[0].base64, mime, 'gallery');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open gallery');
    } finally {
      setLoading(null);
    }
  };

  const handlePDF = async () => {
    setLoading('pdf');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        navigateToProcessing(base64, 'application/pdf', 'pdf');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open PDF');
    } finally {
      setLoading(null);
    }
  };

  const options = [
    {
      id: 'camera', label: 'Take Photo', sub: 'Capture invoice with camera',
      icon: 'camera', color: Colors.primary, onPress: handleCamera
    },
    {
      id: 'gallery', label: 'Upload Image', sub: 'Select from gallery',
      icon: 'image-multiple', color: Colors.info, onPress: handleGallery
    },
    {
      id: 'pdf', label: 'Upload PDF', sub: 'Import PDF invoice',
      icon: 'file-pdf-box', color: Colors.error, onPress: handlePDF
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Invoice</Text>
          <Text style={styles.subtitle}>Choose how to import your invoice</Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustration}>
          <View style={styles.illustrationIcon}>
            <MaterialCommunityIcons name="receipt-text-plus" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.illustrationText}>AI will extract all invoice data automatically</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {options.map(opt => (
            <TouchableOpacity
              testID={`capture-${opt.id}-btn`}
              key={opt.id}
              onPress={opt.onPress}
              disabled={loading !== null}
              activeOpacity={0.85}
              style={[styles.optionCard, { borderColor: opt.color + '30', opacity: loading && loading !== opt.id ? 0.5 : 1 }]}
            >
              <View style={[styles.optionIcon, { backgroundColor: opt.color + '15' }]}>
                {loading === opt.id ? (
                  <ActivityIndicator color={opt.color} size="large" />
                ) : (
                  <MaterialCommunityIcons name={opt.icon as any} size={32} color={opt.color} />
                )}
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionSub}>{opt.sub}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tip */}
        <View style={styles.tip}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color={Colors.warning} />
          <Text style={styles.tipText}>
            Tip: Ensure good lighting and flat surface for best AI extraction accuracy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Layout.spacing.xl },
  header: { marginBottom: Layout.spacing.xl },
  title: { fontSize: Layout.fontSize.xxl, fontWeight: '700', color: Colors.textMain },
  subtitle: { fontSize: Layout.fontSize.base, color: Colors.textMuted, marginTop: 4 },
  illustration: {
    alignItems: 'center', paddingVertical: Layout.spacing.xl,
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Layout.spacing.xl,
  },
  illustrationIcon: {
    width: 100, height: 100,
    backgroundColor: Colors.primary + '10',
    borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  illustrationText: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, textAlign: 'center', maxWidth: 200 },
  options: { gap: Layout.spacing.md },
  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: Layout.spacing.lg, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  optionIcon: {
    width: 56, height: 56, borderRadius: Layout.radius.xl,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Layout.spacing.lg,
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: Layout.fontSize.base, fontWeight: '700', color: Colors.textMain },
  optionSub: { fontSize: Layout.fontSize.sm, color: Colors.textMuted, marginTop: 2 },
  tip: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.warningLight, borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg, marginTop: Layout.spacing.xl, gap: 8,
  },
  tipText: { flex: 1, fontSize: Layout.fontSize.sm, color: Colors.warning, fontWeight: '500' },
});
