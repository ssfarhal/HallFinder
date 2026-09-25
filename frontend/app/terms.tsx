import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, FileText, Crown, KeyRound, AlertTriangle, Scale, Building2 } from "lucide-react-native";
import { useTheme, makeStyles } from "@/src/theme";
import { usePro } from "@/src/context/ProContext";

export default function TermsConditionsScreen() {
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
          testID="terms-back-btn"
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
        >
          <ArrowLeft size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        testID="terms-conditions-scrollview"
      >
        <View style={styles.badgeBanner}>
          <FileText size={18} color={colors.brandPrimary} />
          <Text style={styles.badgeText}>Terms of Service • Version 2.0 • June 2026</Text>
        </View>

        <Text style={styles.introText}>
          Please read these Terms & Conditions carefully before using the <Text style={styles.boldBrand}>{appTitle}</Text> mobile application. By creating an account, browsing listings, unlocking subscriptions, or making reservations, you agree to be bound by these Terms.
        </Text>

        {/* Section 1 */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Scale size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.sectionTitle}>1. Acceptance & Eligibility</Text>
          </View>
          <Text style={styles.sectionBody}>
            By accessing {appTitle}, you represent that you are at least 18 years of age and legally competent to enter into binding agreements. If you are accessing the platform on behalf of a convention hall entity or business organization, you warrant that you have authority to bind that entity.
          </Text>
        </View>

        {/* Section 2 - Subscription Plans */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Crown size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.sectionTitle}>2. Subscription Plans & Pricing</Text>
          </View>
          <Text style={styles.sectionBody}>
            {appTitle} offers tiered access comprising a Free Tier and paid Pro subscription tiers. The available Pro subscription plans are:
          </Text>
          <View style={styles.planRow}>
            <Text style={styles.planRowTitle}>• Weekly Pro Pass:</Text>
            <Text style={styles.planRowPrice}>₹100 for 7 Days (Short Term)</Text>
          </View>
          <View style={styles.planRow}>
            <Text style={styles.planRowTitle}>• Quarterly Pro Plan:</Text>
            <Text style={styles.planRowPrice}>₹300 for 3 Months (₹100/mo)</Text>
          </View>
          <View style={styles.planRow}>
            <Text style={styles.planRowTitle}>• Annual Pro Plan:</Text>
            <Text style={styles.planRowPrice}>₹500 for 1 Year (₹42/mo - Save 45%)</Text>
          </View>
          <Text style={[styles.sectionBody, { marginTop: 8 }]}>
            All fees are quoted in Indian Rupees (INR) and are inclusive of applicable GST unless explicitly stated otherwise.
          </Text>
        </View>

        {/* Section 3 - Pro Feature Access */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Crown size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.sectionTitle}>3. Pro Feature Access</Text>
          </View>
          <Text style={styles.sectionBody}>
            Active Pro membership grants access to premium platform utilities, including:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>Exact Pricing Breakdown:</Text> Itemized tariffs, base rent, advance deposits, cleaning charges, and tax estimates.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>Real-Time Availability Calendar:</Text> Live date booking status (green = available, red = booked).</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>Direct Owner & Manager Contact:</Text> Unrestricted access to phone numbers and direct WhatsApp chats.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>Customer Reviews & Ratings:</Text> Submitting verified ratings and feedback for visited convention halls.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}><Text style={styles.boldText}>Instant Reservations:</Text> Placing advance deposit reservations directly.</Text>
          </View>
        </View>

        {/* Section 4 - Secret Unlock Code */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <KeyRound size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.sectionTitle}>4. Secret VIP Unlock Code Usage</Text>
          </View>
          <Text style={styles.sectionBody}>
            Users in possession of authorized promotional VIP unlock codes (such as code <Text style={styles.boldBrand}>GT011103</Text>) may redeem them to activate complimentary 1-Year Full Pro access.
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Promotional codes are non-transferable, cannot be redeemed for cash, and are subject to platform revocation if abused.</Text>
          </View>
        </View>

        {/* Section 5 - No Refund Policy */}
        <View style={[styles.sectionCard, styles.alertCard]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: "rgba(211, 47, 47, 0.15)" }]}>
              <AlertTriangle size={16} color={colors.error} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.error }]}>
              5. No Refund Policy for Digital Subscriptions
            </Text>
          </View>
          <Text style={styles.sectionBody}>
            <Text style={styles.boldText}>All purchases of digital Pro subscription plans (7 Days ₹100, 3 Months ₹300, 1 Year ₹500) are final and non-refundable once processed.</Text> Because digital access, pricing breakdowns, manager contacts, and live calendar data are provided immediately upon payment, no partial or full refunds will be issued for unused subscription duration.
          </Text>
          <Text style={[styles.sectionBody, { marginTop: 8 }]}>
            For venue reservation deposits, refund eligibility is governed by the individual convention hall&apos;s cancellation and postponement policy.
          </Text>
        </View>

        {/* Section 6 - App Usage Rules */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconBox}>
              <Building2 size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.sectionTitle}>6. App Usage Rules for Customers & Hall Owners</Text>
          </View>
          <Text style={[styles.sectionBody, { fontWeight: "700", color: colors.onSurface }]}>
            For Customers & Event Planners:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>You agree to provide accurate contact information when submitting booking enquiries.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Customer reviews must reflect genuine personal event experiences and must not contain defamatory, abusive, or fraudulent statements.</Text>
          </View>

          <Text style={[styles.sectionBody, { fontWeight: "700", color: colors.onSurface, marginTop: 12 }]}>
            For Convention Hall Owners & Venue Managers:
          </Text>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Owners warrant that listed hall specifications, capacities, amenities, and tariff breakdowns are truthful and accurate.</Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>Owners agree to maintain updated calendar availability and promptly respond to customer enquiries.</Text>
          </View>
        </View>

        {/* Section 7 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.sectionBody}>
            {appTitle} acts as a discovery, review, and booking facilitation marketplace. While we strive to verify listings, we are not responsible for venue service disputes, on-site catering variances, or third-party force majeure event disruptions.
          </Text>
        </View>

        <Pressable
          testID="terms-bottom-back-btn"
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
  alertCard: {
    borderColor: "rgba(211, 47, 47, 0.35)",
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
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    marginTop: 6,
  },
  planRowTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurface,
  },
  planRowPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandPrimary,
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
