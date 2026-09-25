import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Heart, Building2, Trash2, Crown, Sparkles, ArrowLeftRight, ChevronRight } from "lucide-react-native";
import { Header } from "@/src/components/Header";
import { HallCard } from "@/src/components/HallCard";
import { useFavorites } from "@/src/context/FavoritesContext";
import { usePro } from "@/src/context/ProContext";
import { useTheme, makeStyles } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const { favorites, clearFavorites } = useFavorites();
  const { isPro, openUpgradeModal } = usePro();

  const bottomChrome = usesNativeTabs ? insets.bottom : 16;

  return (
    <View style={styles.container}>
      <Header
        title="Saved Halls"
        subtitle={
          isPro
            ? `${favorites.length} Shortlisted Convention Venues`
            : "Shortlist Favourite Venues (Pro)"
        }
        rightAction={
          isPro && favorites.length > 0 ? (
            <Pressable
              testID="clear-favorites-btn"
              style={styles.clearBtn}
              onPress={clearFavorites}
            >
              <Trash2 size={14} color={colors.onSurface} />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </Pressable>
          ) : null
        }
      />

      {/* Compare Venues Banner */}
      <Pressable
        testID="favorites-compare-banner"
        style={styles.compareBanner}
        onPress={() => router.push("/compare")}
      >
        <View style={styles.compareBannerIcon}>
          <ArrowLeftRight size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.compareBannerTitle}>Compare Venues Side-by-Side</Text>
          <Text style={styles.compareBannerSub}>
            Analyze seating, dining, tariffs per guest & generator specs
          </Text>
        </View>
        <View style={styles.compareBannerAction}>
          <Text style={styles.compareBannerActionText}>Compare</Text>
          <ChevronRight size={13} color="#FFFFFF" />
        </View>
      </Pressable>

      {!isPro ? (
        <View style={styles.proLockedContainer} testID="favorites-pro-locked-view">
          <View style={styles.proLockCrown}>
            <Crown size={36} color={colors.onBrandPrimary} fill={colors.onBrandPrimary} />
          </View>
          <Text style={styles.proLockTitle}>Shortlist & Compare Venues</Text>
          <Text style={styles.proLockSubtitle}>
            Saving favourite convention halls is an exclusive feature for Hall Finder Pro members. Upgrade today or enter VIP code GT011103 to bookmark and compare live calendars!
          </Text>

          <Pressable
            testID="favorites-unlock-pro-btn"
            style={styles.unlockProActionBtn}
            onPress={() => openUpgradeModal("Shortlisting and Saving Favourite Halls")}
          >
            <Sparkles size={16} color={colors.onBrandPrimary} />
            <Text style={styles.unlockProActionText}>Unlock Hall Finder Pro (From ₹42/mo)</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HallCard hall={item} />}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: bottomChrome + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View testID="empty-favorites-view" style={styles.emptyView}>
              <View style={styles.emptyIconBox}>
                <Heart size={36} color={colors.brandPrimary} />
              </View>
              <Text style={styles.emptyTitle}>No Saved Halls Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart icon on any convention hall card or profile page to save your favourite venues here for instant comparison.
              </Text>
              <Pressable
                testID="browse-halls-btn"
                style={styles.browseBtn}
                onPress={() => router.push("/(tabs)")}
              >
                <Building2 size={16} color={colors.onBrandPrimary} />
                <Text style={styles.browseBtnText}>Explore Halls by Pincode</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  compareBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  compareBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  compareBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  compareBannerSub: {
    fontSize: 11,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  compareBannerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  compareBannerActionText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "700",
  },
  listContainer: {
    paddingTop: 16,
    flexGrow: 1,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearBtnText: {
    color: colors.onSurface,
    fontSize: 11,
    fontWeight: "600",
  },
  proLockedContainer: {
    margin: 20,
    marginTop: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  proLockCrown: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  proLockTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginBottom: 8,
  },
  proLockSubtitle: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  unlockProActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  unlockProActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyView: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  browseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
}));
