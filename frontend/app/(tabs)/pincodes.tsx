import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Building2,
  Users,
  ChevronRight,
  Compass,
} from "lucide-react-native";
import { Header } from "@/src/components/Header";
import { fetchPincodes } from "@/src/api";
import { PincodeInfo } from "@/src/types";
import { useTheme, makeStyles } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

export default function PincodesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const {
    data: pincodes = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["pincodes"],
    queryFn: fetchPincodes,
  });

  const bottomChrome = usesNativeTabs ? insets.bottom : 16;

  const handleSelectPincode = (pincode: string) => {
    router.push({
      pathname: "/(tabs)",
      params: { pincode },
    });
  };

  const renderPincodeCard = ({ item }: { item: PincodeInfo }) => {
    return (
      <Pressable
        testID={`pincode-card-${item.pincode}`}
        style={styles.card}
        onPress={() => handleSelectPincode(item.pincode)}
      >
        <View style={styles.cardMain}>
          <View style={styles.pincodeBadge}>
            <MapPin size={16} color={colors.onBrandPrimary} />
            <Text style={styles.pincodeText}>{item.pincode}</Text>
          </View>

          <View style={styles.locationInfo}>
            <Text style={styles.cityName}>{item.city}</Text>
            <Text style={styles.areaName} numberOfLines={1}>
              {item.area}
            </Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statPill}>
            <Building2 size={12} color={colors.brandPrimary} />
            <Text style={styles.statPillText}>
              {item.hall_count} {item.hall_count === 1 ? "Hall" : "Halls"}
            </Text>
          </View>

          <View style={styles.statPill}>
            <Users size={12} color={colors.brandPrimary} />
            <Text style={styles.statPillText}>Up to {item.max_capacity} Seats</Text>
          </View>

          <View style={styles.arrowIcon}>
            <ChevronRight size={18} color={colors.brandPrimary} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Pincode Directory"
        subtitle="Search Convention Halls by City & Pin"
      />

      <View style={styles.introBanner}>
        <Compass size={20} color={colors.brandPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.introTitle}>Explore by Regional Area</Text>
          <Text style={styles.introText}>
            Tap any pincode below to instantly load matching luxury convention and banquet halls with real-time calendars.
          </Text>
        </View>
      </View>

      <FlatList
        data={pincodes}
        keyExtractor={(item) => `${item.city}-${item.pincode}`}
        renderItem={renderPincodeCard}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: bottomChrome + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brandPrimary}
            colors={[colors.brandPrimary]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyView}>
              <Text style={styles.emptyTitle}>No Pincodes Available</Text>
            </View>
          ) : (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
              <Text style={styles.loadingText}>Syncing pincode directory...</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  introBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginBottom: 2,
  },
  introText: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    lineHeight: 16,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 1,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  pincodeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pincodeText: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  locationInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
  },
  areaName: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    marginTop: 1,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statPillText: {
    fontSize: 11,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
  },
  arrowIcon: {
    marginLeft: "auto",
  },
  emptyView: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    color: colors.muted,
  },
  loadingBox: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 10,
  },
}));
