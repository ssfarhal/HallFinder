import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import {
  X,
  Crown,
  Sparkles,
  Check,
  Lock,
  CreditCard,
  ShieldCheck,
  Zap,
  Building2,
  Calendar,
  Phone,
  DollarSign,
  Heart,
  KeyRound,
  User,
} from "lucide-react-native";
import { usePro } from "../context/ProContext";
import { useAuth } from "../context/AuthContext";
import { useTheme, makeStyles } from "../theme";

const PRO_FEATURES = [
  {
    icon: DollarSign,
    title: "Exact Per-Day Pricing Breakdown",
    desc: "View base tariffs, advance deposits, taxes, and cost estimates",
  },
  {
    icon: Calendar,
    title: "Real-Time Availability Calendar",
    desc: "Live sync with green available and red booked date status",
  },
  {
    icon: Phone,
    title: "Direct Owner & Manager Contact",
    desc: "Call phone numbers & chat directly on WhatsApp",
  },
  {
    icon: Building2,
    title: "Send Booking Enquiries & Instant Deposit",
    desc: "Submit priority booking requests directly to venue managers",
  },
  {
    icon: Heart,
    title: "Unlimited Saved Favourites",
    desc: "Shortlist and compare your favourite convention halls",
  },
];

export const UpgradeProModal: React.FC = () => {
  const {
    upgradeModalVisible,
    closeUpgradeModal,
    featureHint,
    subscribeToPlan,
    applySecretCode,
    activateProDirect,
  } = usePro();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();

  const [selectedPlan, setSelectedPlan] = useState<"weekly_100" | "quarterly_300" | "yearly_500">("yearly_500");
  const [customerName, setCustomerName] = useState("Arjun Sharma");
  const [customerPhone, setCustomerPhone] = useState("9876543210");
  const [customerEmail, setCustomerEmail] = useState("arjun.sharma@example.com");
  const [secretCode, setSecretCode] = useState("");
  const [secretCodeLoading, setSecretCodeLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const checkLoginGuard = (actionHint: string): boolean => {
    if (!isAuthenticated) {
      openAuthModal(`Log in required before ${actionHint}`);
      return false;
    }
    return true;
  };

  const handleApplySecretCode = async () => {
    setErrorMsg(null);
    if (!checkLoginGuard("applying a secret unlock code")) {
      return;
    }

    if (!secretCode.trim()) {
      setErrorMsg("Please enter a secret unlock code.");
      return;
    }

    try {
      setSecretCodeLoading(true);
      const res = await applySecretCode(secretCode.trim(), customerName);
      if (res.success) {
        setSuccessMsg(res.message || "🎉 Secret Code GT011103 Applied! Full Pro Access Unlocked.");
      } else {
        setErrorMsg(res.message || "Invalid secret unlock code.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid secret code. Please check and try again.");
    } finally {
      setSecretCodeLoading(false);
    }
  };

  const handlePayWithCashfree = async () => {
    setErrorMsg(null);
    if (!checkLoginGuard("purchasing a Pro subscription")) {
      return;
    }

    setLoading(true);
    try {
      const res = await subscribeToPlan(
        selectedPlan,
        customerName,
        customerPhone,
        customerEmail
      );
      if (res.success) {
        setSuccessMsg(res.message || "Upgraded to HallFinder Pro successfully!");
      } else {
        setErrorMsg(res.message || "Payment could not be completed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Payment process error");
    } finally {
      setLoading(false);
    }
  };

  const handleInstantTestUpgrade = async () => {
    if (!checkLoginGuard("upgrading to Pro")) {
      return;
    }
    setLoading(true);
    await activateProDirect(selectedPlan);
    setSuccessMsg("Account upgraded to Pro instantly via Cashfree sandbox!");
    setLoading(false);
  };

  const handleClose = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    closeUpgradeModal();
  };

  const selectedAmount =
    selectedPlan === "yearly_500" ? 500 : selectedPlan === "quarterly_300" ? 300 : 100;

  return (
    <Modal
      visible={upgradeModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <Image
                source={require("@/assets/logo.png")}
                style={styles.proModalLogo}
                contentFit="contain"
              />
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.headerTitle}>Unlock Hall Finder Pro</Text>
                  <Sparkles size={16} color="#F6D365" />
                </View>
                <Text style={styles.headerSubtitle}>
                  Instant access to live calendars, prices & manager contacts
                </Text>
              </View>
            </View>

            <Pressable
              testID="close-upgrade-modal-btn"
              style={styles.closeBtn}
              onPress={handleClose}
            >
              <X size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          {successMsg ? (
            <View style={styles.successBox} testID="pro-upgrade-success-view">
              <View style={styles.successIconBox}>
                <Crown size={48} color={colors.brandPrimary} fill={colors.brandPrimary} />
              </View>
              <Text style={styles.successTitle}>Welcome to HallFinder Pro!</Text>
              <Text style={styles.successText}>{successMsg}</Text>

              <View style={styles.successBadgeCard}>
                <Text style={styles.successBadgeTitle}>ACTIVE MEMBERSHIP</Text>
                <Text style={styles.successBadgePlan}>
                  {selectedPlan === "yearly_500"
                    ? "Annual Pro (1 Year)"
                    : selectedPlan === "quarterly_300"
                    ? "Quarterly Pro (3 Months)"
                    : "Weekly Pro (7 Days)"}
                </Text>
                <Text style={styles.successBadgeNote}>
                  All locked features across all convention halls are now unlocked!
                </Text>
              </View>

              <Pressable
                testID="explore-as-pro-btn"
                style={styles.payBtn}
                onPress={handleClose}
              >
                <Text style={styles.payBtnText}>Start Exploring as Pro Member</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              testID="upgrade-pro-scrollview"
            >
              {featureHint ? (
                <View style={styles.hintBanner} testID="pro-feature-hint-banner">
                  <Lock size={16} color={colors.brandPrimary} />
                  <Text style={styles.hintText}>
                    <Text style={{ fontWeight: "700" }}>{featureHint}</Text> is a Pro feature. Upgrade below or enter VIP code GT011103!
                  </Text>
                </View>
              ) : null}

              {/* Login Status Banner */}
              {isAuthenticated && user ? (
                <View style={styles.loggedInBanner} testID="pro-modal-logged-in-user">
                  <User size={15} color={colors.brandPrimary} />
                  <Text style={styles.loggedInText}>
                    Logged in as: <Text style={{ fontWeight: "700" }}>{user.name}</Text> ({user.email})
                  </Text>
                </View>
              ) : (
                <Pressable
                  testID="pro-modal-login-prompt"
                  style={styles.loginPromptBanner}
                  onPress={() => openAuthModal("Log in to link your Pro membership")}
                >
                  <User size={15} color={colors.brandPrimary} />
                  <Text style={styles.loginPromptText}>
                    Not signed in? <Text style={{ fontWeight: "800", textDecorationLine: "underline" }}>Sign In</Text> to link your Pro account.
                  </Text>
                </Pressable>
              )}

              {/* Secret Unlock Code Section FIRST for instant delight! */}
              <View style={styles.secretCodeSection} testID="secret-code-unlock-section">
                <View style={styles.secretCodeHeader}>
                  <KeyRound size={14} color={colors.brandPrimary} />
                  <Text style={styles.secretCodeLabel}>HAVE A VIP UNLOCK CODE?</Text>
                </View>

                <View style={styles.secretCodeRow}>
                  <View style={styles.secretCodeInputBox}>
                    <TextInput
                      testID="secret-unlock-code-input"
                      style={styles.secretCodeInput}
                      value={secretCode}
                      onChangeText={(t) => {
                        setSecretCode(t);
                        setErrorMsg(null);
                      }}
                      placeholder="Enter code (e.g. GT011103)"
                      placeholderTextColor={colors.muted}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>

                  <Pressable
                    testID="apply-secret-code-btn"
                    style={[
                      styles.applyCodeBtn,
                      secretCodeLoading && styles.btnDisabled,
                    ]}
                    onPress={handleApplySecretCode}
                    disabled={secretCodeLoading}
                  >
                    {secretCodeLoading ? (
                      <ActivityIndicator size="small" color={colors.onBrandPrimary} />
                    ) : (
                      <Text style={styles.applyCodeBtnText}>Apply</Text>
                    )}
                  </Pressable>
                </View>
                <Text style={styles.secretCodeHelp}>
                  Code <Text style={{ color: colors.brandPrimary, fontWeight: "700" }}>GT011103</Text> grants 1-Year Full Pro VIP free.
                </Text>
              </View>

              {/* Subscription Plans Selection (3 Tiers) */}
              <Text style={styles.sectionLabel}>OR CHOOSE CASHFREE PRO PLAN</Text>

              {/* Plan 1: 1 Year Plan (BEST VALUE) */}
              <Pressable
                testID="select-plan-yearly-500"
                style={[
                  styles.planCard,
                  selectedPlan === "yearly_500" && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan("yearly_500")}
              >
                <View style={styles.bestValuePill}>
                  <Text style={styles.bestValueText}>👑 BEST VALUE • SAVE 45%</Text>
                </View>

                <View style={styles.planCardHeader}>
                  <View style={styles.planRadioCircle}>
                    {selectedPlan === "yearly_500" && (
                      <View style={styles.planRadioDot} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>1 Year Pro Access</Text>
                    <Text style={styles.planSub}>Full 12 Months • ₹42 / month</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.planPrice}>₹500</Text>
                    <Text style={styles.planPeriod}>/ year</Text>
                  </View>
                </View>
              </Pressable>

              {/* Plan 2: 3 Months Plan */}
              <Pressable
                testID="select-plan-quarterly-300"
                style={[
                  styles.planCard,
                  selectedPlan === "quarterly_300" && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan("quarterly_300")}
              >
                <View style={styles.planCardHeader}>
                  <View style={styles.planRadioCircle}>
                    {selectedPlan === "quarterly_300" && (
                      <View style={styles.planRadioDot} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>3 Months Pro Access</Text>
                    <Text style={styles.planSub}>Quarterly • ₹100 / month</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.planPrice}>₹300</Text>
                    <Text style={styles.planPeriod}>/ 3 months</Text>
                  </View>
                </View>
              </Pressable>

              {/* Plan 3: 7 Days Plan */}
              <Pressable
                testID="select-plan-weekly-100"
                style={[
                  styles.planCard,
                  selectedPlan === "weekly_100" && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan("weekly_100")}
              >
                <View style={styles.weeklyPill}>
                  <Text style={styles.weeklyPillText}>⚡ 7 DAYS PASS</Text>
                </View>
                <View style={styles.planCardHeader}>
                  <View style={styles.planRadioCircle}>
                    {selectedPlan === "weekly_100" && (
                      <View style={styles.planRadioDot} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>7 Days Pro Pass</Text>
                    <Text style={styles.planSub}>Short Term • ₹14 / day</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.planPrice}>₹100</Text>
                    <Text style={styles.planPeriod}>/ 7 days</Text>
                  </View>
                </View>
              </Pressable>

              {/* Features List */}
              <View style={styles.featuresListBlock}>
                <Text style={styles.sectionLabel}>WHAT IS UNLOCKED WITH PRO</Text>
                {PRO_FEATURES.map((feat, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      <Check size={14} color={colors.onBrandPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>{feat.title}</Text>
                      <Text style={styles.featureDesc}>{feat.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {errorMsg && (
                <View style={styles.errorBox} testID="pro-upgrade-error-banner">
                  <Text style={styles.errorText} testID="pro-upgrade-error-text">{errorMsg}</Text>
                </View>
              )}

              {/* Billing Inputs */}
              <View style={styles.inputsSection}>
                <Text style={styles.sectionLabel}>YOUR BILLING DETAILS</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    testID="pro-customer-name-input"
                    style={styles.input}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Full Name"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                <View style={styles.inputBox}>
                  <TextInput
                    testID="pro-customer-phone-input"
                    style={styles.input}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    placeholder="Mobile Number (10 Digits)"
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                <View style={styles.inputBox}>
                  <TextInput
                    testID="pro-customer-email-input"
                    style={styles.input}
                    value={customerEmail}
                    onChangeText={setCustomerEmail}
                    placeholder="Email Address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              {/* Cashfree Payment Button */}
              <Pressable
                testID="cashfree-pay-btn"
                style={[styles.payBtn, loading && styles.btnDisabled]}
                onPress={handlePayWithCashfree}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onBrandPrimary} size="small" />
                ) : (
                  <>
                    <CreditCard size={18} color={colors.onBrandPrimary} />
                    <Text style={styles.payBtnText}>
                      Pay ₹{selectedAmount} via Cashfree
                    </Text>
                  </>
                )}
              </Pressable>

              {/* 1-Tap Sandbox Upgrade */}
              <Pressable
                testID="pro-instant-upgrade-test-btn"
                style={styles.testUpgradeBtn}
                onPress={handleInstantTestUpgrade}
                disabled={loading}
              >
                <Zap size={14} color={colors.brandPrimary} />
                <Text style={styles.testUpgradeBtnText}>
                  Instant 1-Tap Upgrade (Cashfree Sandbox)
                </Text>
              </Pressable>

              <View style={styles.securityRow}>
                <ShieldCheck size={14} color={colors.success} />
                <Text style={styles.securityText}>
                  Secured by Cashfree Payments Gateway • 256-bit Encryption
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const useStyles = makeStyles((colors) => ({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "94%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  proModalLogo: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  hintBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brandTertiary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  hintText: {
    fontSize: 12,
    color: colors.brandPrimary,
    flex: 1,
    lineHeight: 17,
  },
  loggedInBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(46, 125, 50, 0.15)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.3)",
  },
  loggedInText: {
    fontSize: 12,
    color: colors.success,
    flex: 1,
  },
  loginPromptBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brandTertiary,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  loginPromptText: {
    fontSize: 12,
    color: colors.brandPrimary,
    flex: 1,
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
  },
  planCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
    position: "relative",
  },
  planCardSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.surfaceTertiary,
  },
  bestValuePill: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  bestValueText: {
    color: colors.onBrandPrimary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  weeklyPill: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  weeklyPillText: {
    color: colors.brandPrimary,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  planCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  planRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brandPrimary,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
  },
  planSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  planPeriod: {
    fontSize: 10,
    color: colors.muted,
  },
  featuresListBlock: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  featureIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurface,
  },
  featureDesc: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  inputsSection: {
    marginBottom: 12,
  },
  secretCodeSection: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  secretCodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  secretCodeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.5,
  },
  secretCodeRow: {
    flexDirection: "row",
    gap: 8,
  },
  secretCodeInputBox: {
    flex: 1,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
    justifyContent: "center",
  },
  secretCodeInput: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurface,
    letterSpacing: 1,
  },
  applyCodeBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  applyCodeBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  secretCodeHelp: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
  },
  inputBox: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
    marginBottom: 8,
  },
  input: {
    fontSize: 13,
    color: colors.onSurface,
  },
  errorBox: {
    backgroundColor: "rgba(211, 47, 47, 0.15)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)",
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "600",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    height: 50,
    borderRadius: 12,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  payBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  testUpgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surfaceTertiary,
    height: 42,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  testUpgradeBtnText: {
    color: colors.brandPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  securityText: {
    fontSize: 11,
    color: colors.muted,
  },
  successBox: {
    padding: 24,
    alignItems: "center",
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginBottom: 8,
  },
  successText: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  successBadgeCard: {
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  successBadgeTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 1,
  },
  successBadgePlan: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginVertical: 4,
  },
  successBadgeNote: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
    textAlign: "center",
  },
}));
