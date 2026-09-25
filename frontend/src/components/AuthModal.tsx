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
  Lock,
  Mail,
  User,
  Zap,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Building2,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { usePro } from "../context/ProContext";
import { useRouter } from "expo-router";
import { useTheme, makeStyles } from "../theme";

export const AuthModal: React.FC = () => {
  const {
    authModalVisible,
    closeAuthModal,
    authReasonHint,
    loginWithGoogle,
    loginWithApple,
    loginWithDemo,
    loginWithPassword,
    registerWithPassword,
  } = useAuth();
  const { isPro } = usePro();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const appTitle = isPro ? "Hall Finder Pro" : "Hall Finder";

  const [authMode, setAuthMode] = useState<"demo" | "password_login" | "register">("demo");
  const [email, setEmail] = useState("arjun.sharma@example.com");
  const [password, setPassword] = useState("Password@123");
  const [name, setName] = useState("Arjun Sharma");
  const [role, setRole] = useState<"customer" | "owner" | "admin">("customer");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setErrorMsg(null);
    try {
      setLoading(true);
      await loginWithApple(name || "Apple Customer");
    } catch (err: any) {
      setErrorMsg(err.message || "Apple sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleLogin = async (selectedRole: "customer" | "owner" | "admin") => {
    setErrorMsg(null);
    try {
      setLoading(true);
      if (selectedRole === "customer") {
        await loginWithDemo("arjun.sharma@example.com", "Arjun Sharma", "customer");
      } else if (selectedRole === "owner") {
        await loginWithDemo("owner.srikrishna@example.com", "Sri Krishna Owner", "owner");
      } else {
        await loginWithDemo("admin@hallfinder.com", "HallFinder Admin", "admin");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Quick sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setErrorMsg(null);
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      if (authMode === "register") {
        await registerWithPassword(email.trim(), password, name.trim() || "Member", role);
      } else {
        await loginWithPassword(email.trim(), password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={authModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeAuthModal}
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
                style={styles.authLogoImage}
                contentFit="contain"
              />
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.headerTitle}>Sign in to {appTitle}</Text>
                  {isPro && <Sparkles size={14} color="#F6D365" />}
                </View>
                <Text style={styles.headerSubtitle}>
                  Access saved halls, live calendars & booking tools
                </Text>
              </View>
            </View>

            <Pressable
              testID="close-auth-modal-btn"
              style={styles.closeBtn}
              onPress={closeAuthModal}
            >
              <X size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            testID="auth-modal-scrollview"
          >
            {authReasonHint && (
              <View style={styles.hintBanner} testID="auth-reason-hint-banner">
                <Lock size={15} color={colors.brandPrimary} />
                <Text style={styles.hintText}>
                  Please sign in to access <Text style={{ fontWeight: "700" }}>{authReasonHint}</Text>.
                </Text>
              </View>
            )}

            {errorMsg && (
              <View style={styles.errorBox} testID="auth-error-banner">
                <Text style={styles.errorText} testID="auth-error-text">{errorMsg}</Text>
              </View>
            )}

            {/* Auth Mode Tabs */}
            <View style={styles.authTabs}>
              <Pressable
                testID="auth-tab-demo"
                style={[styles.authTab, authMode === "demo" && styles.authTabActive]}
                onPress={() => setAuthMode("demo")}
              >
                <Text style={[styles.authTabText, authMode === "demo" && styles.authTabTextActive]}>
                  ⚡ 1-Tap Demo
                </Text>
              </Pressable>
              <Pressable
                testID="auth-tab-login"
                style={[styles.authTab, authMode === "password_login" && styles.authTabActive]}
                onPress={() => setAuthMode("password_login")}
              >
                <Text style={[styles.authTabText, authMode === "password_login" && styles.authTabTextActive]}>
                  Email Login
                </Text>
              </Pressable>
              <Pressable
                testID="auth-tab-register"
                style={[styles.authTab, authMode === "register" && styles.authTabActive]}
                onPress={() => setAuthMode("register")}
              >
                <Text style={[styles.authTabText, authMode === "register" && styles.authTabTextActive]}>
                  Register
                </Text>
              </Pressable>
            </View>

            {authMode === "demo" ? (
              /* 1-Tap Demo Roles Selection */
              <View style={styles.demoSection}>
                <Text style={styles.sectionLabel}>CHOOSE DEMO TEST ROLE</Text>

                {/* Role 1: Customer / Pro */}
                <Pressable
                  testID="demo-login-customer-btn"
                  style={styles.demoCard}
                  onPress={() => handleQuickRoleLogin("customer")}
                  disabled={loading}
                >
                  <View style={styles.demoCardIcon}>
                    <User size={18} color={colors.brandPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoCardTitle}>Arjun Sharma (Pro Customer / Planner)</Text>
                    <Text style={styles.demoCardSub}>Annual Pro VIP Active • Write reviews & book</Text>
                  </View>
                  <Zap size={16} color={colors.brandPrimary} />
                </Pressable>

                {/* Role 2: Hall Owner */}
                <Pressable
                  testID="demo-login-owner-btn"
                  style={styles.demoCard}
                  onPress={() => handleQuickRoleLogin("owner")}
                  disabled={loading}
                >
                  <View style={styles.demoCardIcon}>
                    <Building2 size={18} color={colors.brandPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoCardTitle}>Sri Krishna Owner (Venue Manager)</Text>
                    <Text style={styles.demoCardSub}>Owner Desk • Manage halls & reply to reviews</Text>
                  </View>
                  <Zap size={16} color={colors.brandPrimary} />
                </Pressable>

                {/* Role 3: Platform Admin */}
                <Pressable
                  testID="demo-login-admin-btn"
                  style={styles.demoCard}
                  onPress={() => handleQuickRoleLogin("admin")}
                  disabled={loading}
                >
                  <View style={styles.demoCardIcon}>
                    <ShieldCheck size={18} color={colors.brandPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoCardTitle}>Platform Admin (Moderator)</Text>
                    <Text style={styles.demoCardSub}>Admin Desk • Platform metrics & oversight</Text>
                  </View>
                  <Zap size={16} color={colors.brandPrimary} />
                </Pressable>

                {/* Social Login Options */}
                <View style={styles.socialButtonsGroup}>
                  <Pressable
                    testID="google-login-btn"
                    style={[styles.socialBtn, styles.googleBtn, loading && styles.btnDisabled]}
                    onPress={handleGoogleLogin}
                    disabled={loading}
                  >
                    <View style={styles.googleIconCircle}>
                      <Text style={styles.googleGText}>G</Text>
                    </View>
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </Pressable>

                  {Platform.OS !== "android" && (
                    <Pressable
                      testID="apple-login-btn"
                      style={[styles.socialBtn, styles.appleBtn, loading && styles.btnDisabled]}
                      onPress={handleAppleLogin}
                      disabled={loading}
                    >
                      <Text style={styles.appleLogoText}></Text>
                      <Text style={styles.appleBtnText}>Continue with Apple</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : (
              /* Email/Password Form (Login or Register) */
              <View style={styles.passwordFormSection}>
                {authMode === "register" && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={styles.inputBox}>
                      <User size={16} color={colors.muted} />
                      <TextInput
                        testID="auth-register-name-input"
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Arjun Sharma"
                        placeholderTextColor={colors.muted}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address *</Text>
                  <View style={styles.inputBox}>
                    <Mail size={16} color={colors.muted} />
                    <TextInput
                      testID="auth-email-input"
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="e.g. arjun.sharma@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password *</Text>
                  <View style={styles.inputBox}>
                    <KeyRound size={16} color={colors.muted} />
                    <TextInput
                      testID="auth-password-input"
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password@123"
                      secureTextEntry
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                <Pressable
                  testID="auth-password-submit-btn"
                  style={[styles.submitBtn, loading && styles.btnDisabled]}
                  onPress={handlePasswordSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onBrandPrimary} size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {authMode === "register" ? "Create Account" : "Sign In with Password"}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Terms and Privacy policy notice & links */}
            <View style={styles.authLegalRow}>
              <Text style={styles.authLegalNotice}>By signing in, you agree to our </Text>
              <Pressable
                testID="auth-terms-link"
                onPress={() => {
                  closeAuthModal();
                  router.push("/terms");
                }}
              >
                <Text style={styles.authLegalLink}>Terms & Conditions</Text>
              </Pressable>
              <Text style={styles.authLegalNotice}> and </Text>
              <Pressable
                testID="auth-privacy-link"
                onPress={() => {
                  closeAuthModal();
                  router.push("/privacy");
                }}
              >
                <Text style={styles.authLegalLink}>Privacy Policy</Text>
              </Pressable>
            </View>

            <View style={styles.securityRow}>
              <ShieldCheck size={14} color={colors.success} />
              <Text style={styles.securityText}>
                Secure Token Authentication • MongoDB Session Store
              </Text>
            </View>
          </ScrollView>
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
    maxHeight: "96%",
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  authLogoImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  hintBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brandTertiary,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  hintText: {
    fontSize: 11.5,
    color: colors.brandPrimary,
    flex: 1,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: "rgba(211, 47, 47, 0.15)",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)",
  },
  errorText: {
    color: colors.error,
    fontSize: 11.5,
    fontWeight: "600",
  },
  authTabs: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  authTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  authTabActive: {
    backgroundColor: colors.brandPrimary,
  },
  authTabText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  authTabTextActive: {
    color: colors.onBrandPrimary,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  demoSection: {
    gap: 8,
    marginBottom: 12,
  },
  demoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  demoCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurface,
  },
  demoCardSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  socialButtonsGroup: {
    gap: 8,
    marginTop: 10,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 10,
    gap: 8,
  },
  googleBtn: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EA4335",
    alignItems: "center",
    justifyContent: "center",
  },
  googleGText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  googleBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurface,
  },
  appleBtn: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: colors.border,
  },
  appleLogoText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  appleBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  passwordFormSection: {
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.onSurface,
    marginBottom: 4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.onSurface,
  },
  submitBtn: {
    backgroundColor: colors.brandPrimary,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
  },
  securityText: {
    fontSize: 11,
    color: colors.muted,
  },
  authLegalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  authLegalNotice: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
  },
  authLegalLink: {
    fontSize: 11,
    color: colors.brandPrimary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
}));
