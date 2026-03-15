import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../src/components/ui/Card';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';

export default function AboutScreen() {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="invoice-text" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>InvoiceAI</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>Intelligent Invoice Management</Text>
        </View>

        {/* Description */}
        <Card style={styles.descCard}>
          <Text style={styles.descText}>
            InvoiceAI uses advanced AI technology to automatically extract and manage invoice data, 
            helping small businesses save time and reduce errors in their accounting workflow.
          </Text>
        </Card>

        {/* Features */}
        <Card style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="camera-iris" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>AI-powered OCR with Claude Vision</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="translate" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Multi-language support (Hindi, Gujarati, Tamil)</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="chart-line" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Real-time analytics and insights</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="cloud-sync" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Cloud sync across devices</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="shield-check" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>Secure & encrypted data storage</Text>
            </View>
          </View>
        </Card>

        {/* Links */}
        <View style={styles.linksSection}>
          <Pressable 
            style={styles.linkButton}
            onPress={() => handleOpenLink('https://invoiceai.com')}
          >
            <MaterialCommunityIcons name="web" size={20} color={Colors.primary} />
            <Text style={styles.linkText}>Visit Website</Text>
            <MaterialCommunityIcons name="open-in-new" size={16} color={Colors.textLight} />
          </Pressable>

          <Pressable 
            style={styles.linkButton}
            onPress={() => handleOpenLink('mailto:support@invoiceai.com')}
          >
            <MaterialCommunityIcons name="email" size={20} color={Colors.primary} />
            <Text style={styles.linkText}>Contact Support</Text>
            <MaterialCommunityIcons name="open-in-new" size={16} color={Colors.textLight} />
          </Pressable>

          <Pressable 
            style={styles.linkButton}
            onPress={() => handleOpenLink('https://twitter.com/invoiceai')}
          >
            <MaterialCommunityIcons name="twitter" size={20} color={Colors.primary} />
            <Text style={styles.linkText}>Follow on Twitter</Text>
            <MaterialCommunityIcons name="open-in-new" size={16} color={Colors.textLight} />
          </Pressable>
        </View>

        {/* Tech Stack */}
        <Card style={styles.techCard}>
          <Text style={styles.sectionTitle}>Built With</Text>
          <View style={styles.techGrid}>
            <View style={styles.techItem}>
              <MaterialCommunityIcons name="react" size={24} color="#61DAFB" />
              <Text style={styles.techText}>React Native</Text>
            </View>
            <View style={styles.techItem}>
              <MaterialCommunityIcons name="language-typescript" size={24} color="#3178C6" />
              <Text style={styles.techText}>TypeScript</Text>
            </View>
            <View style={styles.techItem}>
              <MaterialCommunityIcons name="brain" size={24} color="#FF6B6B" />
              <Text style={styles.techText}>Claude AI</Text>
            </View>
            <View style={styles.techItem}>
              <MaterialCommunityIcons name="database" size={24} color="#47A248" />
              <Text style={styles.techText}>MongoDB</Text>
            </View>
          </View>
        </Card>

        {/* Legal */}
        <View style={styles.legalSection}>
          <Text style={styles.legalText}>© 2026 InvoiceAI. All rights reserved.</Text>
          <View style={styles.legalLinks}>
            <Text style={styles.legalLink}>Terms of Service</Text>
            <Text style={styles.legalSeparator}>·</Text>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl * 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    paddingVertical: Layout.spacing.xl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  appName: {
    fontSize: Layout.fontSize.xxl + 4,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: Layout.spacing.xs,
  },
  version: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Layout.spacing.xs,
  },
  tagline: {
    fontSize: Layout.fontSize.base,
    color: Colors.primary,
    fontWeight: '500',
  },
  descCard: {
    marginBottom: Layout.spacing.lg,
  },
  descText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
  },
  featuresCard: {
    marginBottom: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.md,
  },
  featuresList: {
    gap: Layout.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  featureText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMain,
    flex: 1,
  },
  linksSection: {
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkText: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.textMain,
  },
  techCard: {
    marginBottom: Layout.spacing.lg,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
  },
  techItem: {
    width: '47%',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  techText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
  },
  legalSection: {
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
  },
  legalText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textLight,
    marginBottom: Layout.spacing.xs,
  },
  legalLinks: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
  },
  legalLink: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textLight,
  },
  legalSeparator: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textLight,
  },
});
