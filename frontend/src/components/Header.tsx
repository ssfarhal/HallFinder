import React, { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Building2, Sparkles, Crown, User, LogOut, X, KeyRound, Shield } from "lucide-react-native";
import { useTheme, makeStyles } from "../theme";
import { usePro } from "../context/ProContext";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  activePincode?: string;
  onPincodePress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = "HallFinder Pro",
  subtitle = "Discover & Book Luxury Convention Halls",
  rightAction,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const { isPro, openUpgradeModal, membership } = usePro();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();

  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const handleLogout = async () => {
    setProfileModalVisible(false);
    await logout();
  };

  return (
    <View
      testID="app-header"
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12) + 8,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <View style={styles.logoBadge}>
            <Building2 size={20} color={colors.brandPrimary} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              <Sparkles size={14} color={colors.brandPrimary} style={styles.sparkle} />
            </View>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        {rightAction ? (
          rightAction
        ) : (
          <View style={styles.actionsRow}>
            {/* VIP Secret Code / Pro Button */}
            {isPro ? (
              <View testID="header-pro-member-badge" style={styles.proActiveBadge}>
                <Crown size={12} color="#0C0E12" fill="#0C0E12" />
                <Text style={styles.proActiveText}>PRO VIP</Text>
              </View>
            ) : (
              <Pressable
                testID="header-unlock-pro-btn"
                style={styles.unlockProBtn}
                onPress={() => openUpgradeModal("HallFinder Pro Membership & Secret Code GT011103")}
              >
                <Crown size={12} color={colors.brandPrimary} />
                <Text style={styles.unlockProText}>Unlock Pro</Text>
              </Pressable>
            )}

            {/* User / Sign In Button */}
            {isAuthenticated && user ? (
              <Pressable
                testID="header-user-avatar-btn"
                style={styles.userAvatarBtn}
                onPress={() => setProfileModalVisible(true)}
              >
                <User size={14} color={colors.onSurface} />
                <Text style={styles.userAvatarText} numberOfLines={1}>
                  {user.name.split(" ")[0]}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                testID="header-sign-in-btn"
                style={styles.signInBtn}
                onPress={() => openAuthModal()}
              >
                <User size={12} color={colors.onSurface} />
                <Text style={styles.signInText}>Sign In</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* User Profile / Status Modal */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileCard}>
            <View style={styles.profileCardHeader}>
              <View style={styles.avatarLarge}>
                <User size={24} color={colors.onBrandPrimary} />
              </View>
              <Pressable
                testID="close-profile-modal-btn"
                style={styles.closeCardBtn}
                onPress={() => setProfileModalVisible(false)}
              >
                <X size={18} color={colors.onSurface} />
              </Pressable>
            </View>

            <Text style={styles.profileName}>{user?.name || "Member"}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleTag}>
              <Shield size={12} color={colors.brandPrimary} />
              <Text style={styles.roleTagText}>Role: {(user?.role || "Customer").toUpperCase()}</Text>
            </View>

            <View style={styles.profileMembershipStatus}>
              {isPro ? (
                <View style={styles.proStatusPill}>
                  <Crown size={14} color="#0C0E12" fill="#0C0E12" />
                  <Text style={styles.proStatusPillText}>
                    {membership?.plan_name || "HallFinder Pro VIP"}
                  </Text>
                </View>
              ) : (
                <Pressable
                  testID="profile-unlock-pro-cta"
                  style={styles.freeStatusPill}
                  onPress={() => {
                    setProfileModalVisible(false);
                    openUpgradeModal();
                  }}
                >
                  <KeyRound size={13} color={colors.brandPrimary} />
                  <Text style={styles.freeStatusPillText}>Free Tier • Unlock Pro / Code</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              testID="header-logout-action-btn"
              style={styles.logoutBtn}
              onPress={handleLogout}
            >
              <LogOut size={16} color={colors.error} />
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  sparkle: {
    marginLeft: 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  proActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  proActiveText: {
    color: colors.onBrandPrimary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  unlockProBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  unlockProText: {
    color: colors.brandPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  userAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 90,
  },
  userAvatarText: {
    color: colors.onSurface,
    fontSize: 11,
    fontWeight: "600",
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signInText: {
    color: colors.onSurface,
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  profileCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileCardHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  closeCardBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: 6,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  roleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  profileMembershipStatus: {
    marginVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  proStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  proStatusPillText: {
    color: colors.onBrandPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  freeStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  freeStatusPillText: {
    color: colors.brandPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "rgba(211, 47, 47, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)",
    marginTop: 8,
  },
  logoutBtnText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "700",
  },
}));
