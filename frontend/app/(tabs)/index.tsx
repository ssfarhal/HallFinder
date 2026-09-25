import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Building,
  Zap,
  Users,
  Car,
  RotateCcw,
  ArrowLeftRight,
} from "lucide-react-native";
import { Header } from "@/src/components/Header";
import { PincodeChipList } from "@/src/components/PincodeChipList";
import { HallCard } from "@/src/components/HallCard";
import { BookingModal } from "@/src/components/BookingModal";
import { InstantBookingModal } from "@/src/components/InstantBookingModal";
import { fetchHalls } from "@/src/api";
import { Hall } from "@/src/types";
import { useTheme, makeStyles } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

const CAPACITY_FILTERS = [
  { label: "All Capacities", value: 0 },
  { label: "500+ Seating", value: 500 },
  { label: "1000+ Seating", value: 1000 },
  { label: "1500+ Seating", value: 1500 },
  { label: "2000+ Seating", value: 2000 },
];

const EVENT_TYPE_FILTERS = ["All", "Wedding", "Reception", "Engagement", "Corporate"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ pincode?: string }>();
  const { colors } = useTheme();
  const styles = useStyles();

  const [pincodeInput, setPincodeInput] = useState<string>(params.pincode || "");
  const [activePincode, setActivePincode] = useState<string>(params.pincode || "");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCapacity, setSelectedCapacity] = useState<number>(0);
  const [selectedEventType, setSelectedEventType] = useState<string>("All");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [generatorOnly, setGeneratorOnly] = useState<boolean>(false);
  const [parkingOnly, setParkingOnly] = useState<boolean>(false);

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [instantBookingModalVisible, setInstantBookingModalVisible] = useState(false);
  const [selectedHallForBooking, setSelectedHallForBooking] = useState<Hall | null>(null);

  React.useEffect(() => {
    if (params.pincode) {
      setPincodeInput(params.pincode);
      setActivePincode(params.pincode);
    }
  }, [params.pincode]);

  const {
    data: halls = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [
      "halls",
      activePincode,
      searchQuery,
      selectedCapacity,
      selectedEventType,
      generatorOnly,
      parkingOnly,
    ],
    queryFn: () =>
      fetchHalls({
        pincode: activePincode || undefined,
        search: searchQuery || undefined,
        min_capacity: selectedCapacity > 0 ? selectedCapacity : undefined,
        event_type: selectedEventType !== "All" ? selectedEventType : undefined,
        generator_only: generatorOnly ? true : undefined,
        parking_only: parkingOnly ? true : undefined,
      }),
  });

  const handleSearchSubmit = () => {
    setActivePincode(pincodeInput.trim());
  };

  const handlePincodeSelect = (pin: string) => {
    setPincodeInput(pin);
    setActivePincode(pin);
  };

  const handleClearPincode = () => {
    setPincodeInput("");
    setActivePincode("");
  };

  const handleResetAllFilters = () => {
    setPincodeInput("");
    setActivePincode("");
    setSearchQuery("");
    setSelectedCapacity(0);
    setSelectedEventType("All");
    setGeneratorOnly(false);
    setParkingOnly(false);
  };

  const handleBookFromCard = (hall: Hall) => {
    setSelectedHallForBooking(hall);
    setBookingModalVisible(true);
  };

  const handleInstantBookFromCard = (hall: Hall) => {
    setSelectedHallForBooking(hall);
    setInstantBookingModalVisible(true);
  };

  const bottomChrome = usesNativeTabs ? insets.bottom : 16;

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <MapPin size={18} color={colors.brandPrimary} />
          <TextInput
            testID="pincode-search-input"
            style={styles.searchInput}
            placeholder="Search by 6-digit Pincode (e.g. 560001, 600001)..."
            placeholderTextColor={colors.muted}
            value={pincodeInput}
            onChangeText={setPincodeInput}
            onSubmitEditing={handleSearchSubmit}
            keyboardType="number-pad"
            maxLength={6}
          />
          {pincodeInput.length > 0 && (
            <Pressable
              testID="clear-pincode-input-btn"
              style={styles.clearBtn}
              onPress={handleClearPincode}
            >
              <X size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>

        <Pressable
          testID="search-pincode-submit-btn"
          style={styles.searchActionBtn}
          onPress={handleSearchSubmit}
        >
          <Search size={18} color={colors.onBrandPrimary} />
        </Pressable>
      </View>

      {/* Popular Pincode Chips Row */}
      <PincodeChipList
        selectedPincode={activePincode}
        onSelectPincode={handlePincodeSelect}
        onClear={handleClearPincode}
      />

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* Compare Venues Button */}
          <Pressable
            testID="explore-compare-venues-btn"
            style={styles.compareBtnPill}
            onPress={() => router.push("/compare")}
          >
            <ArrowLeftRight size={13} color="#FFFFFF" />
            <Text style={styles.compareBtnPillText}>Compare Venues</Text>
          </Pressable>

          <Pressable
            testID="toggle-advanced-filters-btn"
            style={[styles.filterPill, showFilters && styles.filterPillActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal
              size={13}
              color={showFilters ? colors.onBrandPrimary : colors.onSurfaceSecondary}
            />
            <Text
              style={[
                styles.filterPillText,
                showFilters && styles.filterPillTextActive,
              ]}
            >
              Filters
            </Text>
          </Pressable>

          {EVENT_TYPE_FILTERS.map((ev) => (
            <Pressable
              key={ev}
              testID={`filter-event-${ev}`}
              style={[
                styles.filterPill,
                selectedEventType === ev && styles.filterPillActive,
              ]}
              onPress={() => setSelectedEventType(ev)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedEventType === ev && styles.filterPillTextActive,
                ]}
              >
                {ev}
              </Text>
            </Pressable>
          ))}

          {CAPACITY_FILTERS.slice(1).map((cap) => (
            <Pressable
              key={cap.label}
              testID={`filter-capacity-${cap.value}`}
              style={[
                styles.filterPill,
                selectedCapacity === cap.value && styles.filterPillActive,
              ]}
              onPress={() =>
                setSelectedCapacity(
                  selectedCapacity === cap.value ? 0 : cap.value
                )
              }
            >
              <Users
                size={12}
                color={
                  selectedCapacity === cap.value
                    ? colors.onBrandPrimary
                    : colors.onSurfaceSecondary
                }
              />
              <Text
                style={[
                  styles.filterPillText,
                  selectedCapacity === cap.value && styles.filterPillTextActive,
                ]}
              >
                {cap.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Expanded Filters */}
      {showFilters && (
        <View style={styles.expandedFiltersBox} testID="advanced-filters-panel">
          <Text style={styles.filterSectionTitle}>Must-Have Amenities</Text>
          <View style={styles.filterTogglesRow}>
            <Pressable
              testID="filter-generator-toggle"
              style={[
                styles.amenityToggle,
                generatorOnly && styles.amenityToggleActive,
              ]}
              onPress={() => setGeneratorOnly(!generatorOnly)}
            >
              <Zap
                size={14}
                color={generatorOnly ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text
                style={[
                  styles.amenityToggleText,
                  generatorOnly && styles.amenityToggleTextActive,
                ]}
              >
                100% DG Backup
              </Text>
            </Pressable>

            <Pressable
              testID="filter-parking-toggle"
              style={[
                styles.amenityToggle,
                parkingOnly && styles.amenityToggleActive,
              ]}
              onPress={() => setParkingOnly(!parkingOnly)}
            >
              <Car
                size={14}
                color={parkingOnly ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text
                style={[
                  styles.amenityToggleText,
                  parkingOnly && styles.amenityToggleTextActive,
                ]}
              >
                Valet Parking
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Results Count & Reset Filter */}
      <View style={styles.resultsInfoRow}>
        <Text style={styles.resultsCountText}>
          {isLoading
            ? "Searching halls..."
            : `${halls.length} Convention Hall${halls.length === 1 ? "" : "s"} Found`}
          {activePincode ? ` in PIN: ${activePincode}` : " (All Areas)"}
        </Text>

        {(activePincode || selectedCapacity > 0 || selectedEventType !== "All" || generatorOnly || parkingOnly) && (
          <Pressable
            testID="reset-filters-btn"
            style={styles.resetBtn}
            onPress={handleResetAllFilters}
          >
            <RotateCcw size={12} color={colors.brandPrimary} />
            <Text style={styles.resetBtnText}>Reset</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.appFooter} testID="app-footer-section">
      <View style={styles.footerBrandRow}>
        <Building size={16} color={colors.brandPrimary} />
        <Text style={styles.footerBrandText}>HallFinder India</Text>
      </View>
      <Text style={styles.footerTagline}>
        Verified Luxury Convention Halls • Live Calendars
      </Text>
      <View style={styles.footerLinksRow}>
        <Pressable testID="footer-terms-link" onPress={() => router.push("/terms")}>
          <Text style={styles.footerLinkText}>Terms & Conditions</Text>
        </Pressable>
        <Text style={styles.footerDivider}>•</Text>
        <Pressable testID="footer-privacy-link" onPress={() => router.push("/privacy")}>
          <Text style={styles.footerLinkText}>Privacy Policy</Text>
        </Pressable>
      </View>
      <Text style={styles.footerCopyright}>
        © 2026 HallFinder. All rights reserved.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        activePincode={activePincode}
        onPincodePress={() => setPincodeInput(activePincode)}
      />

      <FlatList
        data={halls}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HallCard
            hall={item}
            onBookPress={handleBookFromCard}
            onInstantBookPress={handleInstantBookFromCard}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
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
            <View testID="empty-halls-view" style={styles.emptyView}>
              <View style={styles.emptyIconBox}>
                <Building size={36} color={colors.brandPrimary} />
              </View>
              <Text style={styles.emptyTitle}>No Convention Halls Found</Text>
              <Text style={styles.emptySubtitle}>
                {activePincode
                  ? `No convention halls found under pincode "${activePincode}". Try searching for popular pincodes like 560001, 560034, 600001, 400001, or 500081.`
                  : "No convention halls matched your current filters. Try resetting the filters to explore all luxury venues."}
              </Text>
              <Pressable
                testID="explore-all-halls-btn"
                style={styles.emptyActionBtn}
                onPress={handleResetAllFilters}
              >
                <Text style={styles.emptyActionBtnText}>
                  Explore All Convention Halls
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brandPrimary} />
              <Text style={styles.loadingText}>
                Fetching luxury convention halls...
              </Text>
            </View>
          )
        }
      />

      {/* Booking Enquiry Modal */}
      <BookingModal
        visible={bookingModalVisible}
        hall={selectedHallForBooking}
        onClose={() => setBookingModalVisible(false)}
      />

      {/* Instant Reservation Modal */}
      <InstantBookingModal
        visible={instantBookingModalVisible}
        hall={selectedHallForBooking}
        onClose={() => setInstantBookingModalVisible(false)}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  listContainer: {
    flexGrow: 1,
  },
  headerContent: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 14,
    marginBottom: 14,
  },
  searchBarContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 6,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.onSurface,
    fontWeight: "500",
  },
  clearBtn: {
    padding: 4,
  },
  searchActionBtn: {
    width: 48,
    height: 48,
    backgroundColor: colors.brandPrimary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBar: {
    height: 48,
    justifyContent: "center",
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  compareBtnPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    flexShrink: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compareBtnPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  filterPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    flexShrink: 0,
  },
  filterPillActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.onSurfaceSecondary,
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  expandedFiltersBox: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginBottom: 8,
  },
  filterTogglesRow: {
    flexDirection: "row",
    gap: 8,
  },
  amenityToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amenityToggleActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  amenityToggleText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.onSurfaceSecondary,
  },
  amenityToggleTextActive: {
    color: colors.onBrandPrimary,
    fontWeight: "700",
  },
  resultsInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resetBtnText: {
    fontSize: 12,
    color: colors.brandPrimary,
    fontWeight: "600",
  },
  emptyView: {
    padding: 32,
    alignItems: "center",
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
  },
  emptyActionBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.muted,
  },
  appFooter: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 20,
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  footerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  footerBrandText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  footerTagline: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 12,
    textAlign: "center",
  },
  footerLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  footerLinkText: {
    fontSize: 12,
    color: colors.brandPrimary,
    fontWeight: "700",
  },
  footerDivider: {
    fontSize: 12,
    color: colors.muted,
  },
  footerCopyright: {
    fontSize: 10.5,
    color: colors.muted,
  },
}));
