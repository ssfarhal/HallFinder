import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck, Lock, CreditCard, Building2, Star, EyeOff } from "lucide-react-native";
import { useTheme, makeStyles } from "@/src/theme";
import { usePro } from "@/src/context/ProContext";

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const { isPro } = usePro();

  const appTitle = isPro ? "Hall Finder Pro" : "Hall Finder";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 14) + 8 },
        ]}
      >
        <Pressable
          testID="privacy-back-btn"
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
        >
          <ArrowLeft size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        testID="privacy-policy-scrollview"
      >
        <View style={styles.badgeBanner}>
          <ShieldCheck size={18} color={colors.brandPrimary} />
          <Text style={styles.badgeText}>Last Updated: June 2026 • Effective Immediately</Text>
        </View>

        <Text style={styles.introText}>
          Welcome to <Text style={styles.boldBrand}>{appTitle}</Text>. Your privacy and the security of your personal data are of paramount importance to us. This Privacy Policy outlines how we collect, use, store, and protect your information when you use our mobile application and services.
        </Text>

        {/* Section 1 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Lock size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.sectionTitle}>1. User Account Data Collection</Text>
          </View>
          <Text style={styles.sectionBody}>
            When you create an account, sign in, or interact with our platform, we may collect the following personal information:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>Basic Identity:</Text> Your full name, email address, and phone number provided during account creation or enquiry submission.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>Authentication Data:</Text> Secure hashed credentials or token-based identifiers returned by authorized authentication providers.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>Enquiry & Booking Details:</Text> Event dates, guest counts, catering preferences, and venue notes sent to convention hall managers.</Text>
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <ShieldCheck size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.sectionTitle}>2. Google OAuth and Apple Login Usage</Text>
          </View>
          <Text style={styles.sectionBody}>
            We support single-tap social authentication via <Text style={styles.boldText}>Google OAuth</Text> and <Text style={styles.boldText}>Apple Sign In</Text>.
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>We only request access to your basic public profile (name, verified email address, and profile picture avatar).</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>We do not access your Google Drive, Gmail, contacts, or iCloud data.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Apple Private Relay email addresses are fully supported to protect your personal inbox identity.</Text>
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <CreditCard size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.sectionTitle}>3. Payment Processing via Cashfree</Text>
          </View>
          <Text style={styles.sectionBody}>
            All financial transactions for digital Pro subscription plans (7 Days ₹100, 3 Months ₹300, 1 Year ₹500) and reservation deposits are processed securely through <Text style={styles.boldText}>Cashfree Payments</Text>, a PCI-DSS certified payment gateway.
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>No Financial Data Stored:</Text> {appTitle} never stores, records, or logs your credit/debit card numbers, CVV, UPI PINs, or net banking passwords on our servers.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Transactions are encrypted using industry-standard 256-bit TLS encryption.</Text>
          </View>
        </View>

        {/* Section 4 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Building2 size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.sectionTitle}>4. Hall Listing Data from Third-Party APIs & Owners</Text>
          </View>
          <Text style={styles.sectionBody}>
            Convention hall listings, photographic galleries, seating/dining capacities, generator specifications, amenities, and pricing breakdowns are aggregated from verified venue owners, registered managers, and authorized partner APIs.
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Location information is linked with Google Maps to assist customers with transit and navigation directions.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Real-time availability calendar statuses reflect live reservations submitted through the platform.</Text>
          </View>
        </View>

        {/* Section 5 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Star size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.sectionTitle}>5. Reviews and Ratings Data</Text>
          </View>
          <Text style={styles.sectionBody}>
            Verified customer reviews and 1-to-5 star ratings submitted by Pro members are stored in our secure database to calculate authentic venue ratings.
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Your review text, rating, event type, and public display name are visible to other users and venue managers.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Hall owners and managers may post public replies to customer reviews via the Owner Desk.</Text>
          </View>
        </View>

        {/* Section 6 - Strict Guarantee */}
        <View style={[styles.sectionCard, styles.guaranteeCard]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.brandPrimary }]}>
              <EyeOff size={16} color={colors.onBrandPrimary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.brandPrimary }]}>
              6. We Do NOT Sell User Data to Third Parties
            </Text>
          </View>
          <Text style={styles.sectionBody}>
            <Text style={styles.boldText}>We make a strict and unequivocal commitment: {appTitle} does NOT sell, rent, trade, lease, or monetize your personal information or contact details to third-party advertisers, data brokers, or marketing telemarketers.</Text>
          </Text>
          <Text style={[styles.sectionBody, { marginTop: 8 }]}>
            Your phone number and booking information are shared solely with the specific convention hall manager you choose to contact or send an enquiry to.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>7. Contact Our Privacy Officer</Text>
          <Text style={styles.sectionBody}>
            If you have questions, data deletion requests, or concerns regarding this Privacy Policy, please contact our support team at:
          </Text>
          <Text style={styles.contactEmail}>privacy@hallfinder.emergent.app</Text>
        </View>

        <Pressable
          testID="privacy-bottom-back-btn"
          style={styles.bottomHomeBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
        >
          <Text style={styles.bottomHomeBtnText}>Back to {appTitle}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.onSurface,
  },
  content: {
    padding: 16,
  },
  badgeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  introText: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  boldBrand: {
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  sectionCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guaranteeCard: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceTertiary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.onSurface,
    flex: 1,
  },
  sectionBody: {
    fontSize: 12.5,
    color: colors.onSurfaceSecondary,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: "700",
    color: colors.onSurface,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
  },
  bulletDot: {
    fontSize: 14,
    color: colors.brandPrimary,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    lineHeight: 17,
    flex: 1,
  },
  contactEmail: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginTop: 8,
  },
  bottomHomeBtn: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  bottomHomeBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
}));
