import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../src/constants/Colors';
import Layout from '../src/constants/Layout';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="shield-account" size={48} color={Colors.primary} />
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: March 15, 2026</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Section title="1. Information We Collect">
            <Text style={styles.text}>
              We collect information you provide directly to us, including:
            </Text>
            <BulletPoint>Account information (name, email, business details)</BulletPoint>
            <BulletPoint>Invoice data (vendor names, amounts, dates)</BulletPoint>
            <BulletPoint>GSTIN and tax identification numbers</BulletPoint>
            <BulletPoint>Usage data and analytics</BulletPoint>
            <BulletPoint>Payment information (processed securely through Razorpay)</BulletPoint>
          </Section>

          <Section title="2. How We Use Your Information">
            <Text style={styles.text}>
              We use the information we collect to:
            </Text>
            <BulletPoint>Process and extract data from your invoices</BulletPoint>
            <BulletPoint>Provide, maintain, and improve our services</BulletPoint>
            <BulletPoint>Send you technical notices and support messages</BulletPoint>
            <BulletPoint>Respond to your requests and questions</BulletPoint>
            <BulletPoint>Monitor and analyze usage patterns</BulletPoint>
          </Section>

          <Section title="3. Data Security">
            <Text style={styles.text}>
              We take data security seriously and implement industry-standard measures:
            </Text>
            <BulletPoint>End-to-end encryption for data transmission</BulletPoint>
            <BulletPoint>Secure cloud storage with regular backups</BulletPoint>
            <BulletPoint>Password encryption using bcrypt hashing</BulletPoint>
            <BulletPoint>Two-factor authentication (coming soon)</BulletPoint>
            <BulletPoint>Regular security audits and updates</BulletPoint>
          </Section>

          <Section title="4. Data Sharing">
            <Text style={styles.text}>
              We do not sell, trade, or rent your personal information to third parties. 
              We may share your information only in the following circumstances:
            </Text>
            <BulletPoint>With your explicit consent</BulletPoint>
            <BulletPoint>To comply with legal obligations</BulletPoint>
            <BulletPoint>With service providers who help us operate (e.g., cloud hosting)</BulletPoint>
            <BulletPoint>To protect our rights and prevent fraud</BulletPoint>
          </Section>

          <Section title="5. Your Rights">
            <Text style={styles.text}>
              You have the right to:
            </Text>
            <BulletPoint>Access your personal data</BulletPoint>
            <BulletPoint>Correct inaccurate data</BulletPoint>
            <BulletPoint>Request deletion of your data</BulletPoint>
            <BulletPoint>Export your data in a portable format</BulletPoint>
            <BulletPoint>Opt-out of marketing communications</BulletPoint>
          </Section>

          <Section title="6. Data Retention">
            <Text style={styles.text}>
              We retain your information for as long as your account is active or as needed 
              to provide you services. We will delete or anonymize your data upon request, 
              except where we are required to retain it for legal or regulatory purposes.
            </Text>
          </Section>

          <Section title="7. AI and Machine Learning">
            <Text style={styles.text}>
              We use AI technology (Claude Vision) to process your invoices. Your data is:
            </Text>
            <BulletPoint>Processed in real-time and not stored by the AI provider</BulletPoint>
            <BulletPoint>Not used to train third-party AI models</BulletPoint>
            <BulletPoint>Kept confidential and secure</BulletPoint>
          </Section>

          <Section title="8. Children's Privacy">
            <Text style={styles.text}>
              Our service is not intended for users under 18 years of age. We do not 
              knowingly collect personal information from children.
            </Text>
          </Section>

          <Section title="9. Changes to This Policy">
            <Text style={styles.text}>
              We may update this privacy policy from time to time. We will notify you 
              of any changes by posting the new policy on this page and updating the 
              "Last updated" date.
            </Text>
          </Section>

          <Section title="10. Contact Us">
            <Text style={styles.text}>
              If you have any questions about this Privacy Policy, please contact us:
            </Text>
            <ContactItem icon="email" text="support@invoiceai.com" />
            <ContactItem icon="web" text="https://invoiceai.com/privacy" />
            <ContactItem icon="map-marker" text="Mumbai, Maharashtra, India" />
          </Section>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <MaterialCommunityIcons name="shield-check" size={20} color={Colors.success} />
          <Text style={styles.footerText}>
            Your privacy is important to us. We are committed to protecting your data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const BulletPoint = ({ children }: { children: string }) => (
  <View style={styles.bulletPoint}>
    <MaterialCommunityIcons name="circle-small" size={16} color={Colors.textMuted} />
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const ContactItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.contactItem}>
    <MaterialCommunityIcons name={icon as any} size={16} color={Colors.primary} />
    <Text style={styles.contactText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    paddingVertical: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: '700',
    color: Colors.textMain,
    marginTop: Layout.spacing.md,
  },
  lastUpdated: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Layout.spacing.xs,
  },
  content: {
    gap: Layout.spacing.xl,
  },
  section: {
    gap: Layout.spacing.sm,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.xs,
  },
  text: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: Layout.spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.xs,
  },
  contactText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMain,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    padding: Layout.spacing.md,
    backgroundColor: Colors.success + '10',
    borderRadius: Layout.radius.lg,
    marginTop: Layout.spacing.xl,
  },
  footerText: {
    flex: 1,
    fontSize: Layout.fontSize.xs,
    color: Colors.success,
    lineHeight: 18,
  },
});
