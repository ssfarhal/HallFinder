import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  ArrowLeft,
  ArrowLeftRight,
  ChevronDown,
  Star,
  Users,
  Utensils,
  Car,
  Zap,
  Building2,
  Search,
  X,
  Trophy,
  Sparkles,
} from "lucide-react-native";
import { fetchHalls } from "@/src/api";
import { Hall } from "@/src/types";
import { useTheme, makeStyles } from "@/src/theme";

export default function CompareScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ hall1?: string; hall2?: string }>();
  const { colors } = useTheme();
  const styles = useStyles();

  const { data: halls = [], isLoading } = useQuery({
    queryKey: ["halls"],
    queryFn: () => fetchHalls(),
  });

  // Selected venues state
  const [selectedHall1Id, setSelectedHall1Id] = useState<string | null>(params.hall1 || null);
  const [selectedHall2Id, setSelectedHall2Id] = useState<string | null>(params.hall2 || null);

  // Picker modal state
  const [pickerTarget, setPickerTarget] = useState<"left" | "right" | null>(null);
  const [pickerSearch, setPickerSearch] = useState<string>("");

  // Initialize venues once halls load
  React.useEffect(() => {
    if (halls.length >= 2) {
      if (!selectedHall1Id) {
        setSelectedHall1Id(halls[0].id);
      }
      if (!selectedHall2Id) {
        setSelectedHall2Id(halls[1].id);
      }
    } else if (halls.length === 1 && !selectedHall1Id) {
      setSelectedHall1Id(halls[0].id);
    }
  }, [halls, selectedHall1Id, selectedHall2Id]);

  const venue1: Hall | undefined = halls.find((h) => h.id === selectedHall1Id) || halls[0];
  const venue2: Hall | undefined = halls.find((h) => h.id === selectedHall2Id) || halls[1] || halls[0];

  // Swap handler
  const handleSwapVenues = () => {
    const temp = selectedHall1Id;
    setSelectedHall1Id(selectedHall2Id);
    setSelectedHall2Id(temp);
  };

  // Open venue picker
  const handleOpenPicker = (target: "left" | "right") => {
    setPickerTarget(target);
    setPickerSearch("");
  };

  const handleSelectVenueFromPicker = (hall: Hall) => {
    if (pickerTarget === "left") {
      setSelectedHall1Id(hall.id);
    } else if (pickerTarget === "right") {
      setSelectedHall2Id(hall.id);
    }
    setPickerTarget(null);
  };

  // Filtered list in picker
  const filteredPickerHalls = halls.filter((h) => {
    if (!pickerSearch.trim()) return true;
    const query = pickerSearch.toLowerCase().trim();
    return (
      h.name.toLowerCase().includes(query) ||
      h.city.toLowerCase().includes(query) ||
      h.area.toLowerCase().includes(query) ||
      h.pincode.includes(query)
    );
  });

  if (!isLoading && halls.length < 2) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 8 }]}>
          <Pressable
            testID="compare-back-btn"
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Venue Comparison</Text>
            <Text style={styles.headerSubtitle}>Side-by-side analysis</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.emptyCompareBox} testID="compare-empty-state-view">
          <Building2 size={48} color={colors.brandPrimary} />
          <Text style={styles.emptyCompareTitle}>At Least 2 Venues Needed</Text>
          <Text style={styles.emptyCompareSub}>
            {halls.length === 1
              ? "You currently have 1 convention hall listed. Add one more venue to compare them side-by-side!"
              : "No convention halls have been listed yet. Be the first to list a hall or check back once venues are live."}
          </Text>
          <Pressable
            testID="compare-empty-back-btn"
            style={styles.emptyActionBtn}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.emptyActionBtnText}>Back to Hall Finder</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isLoading || !venue1 || !venue2) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading venues for side-by-side comparison...</Text>
      </View>
    );
  }

  // Derived metrics
  const costPerGuest1 = Math.round(venue1.price_per_day / (venue1.seating_capacity || 1));
  const costPerGuest2 = Math.round(venue2.price_per_day / (venue2.seating_capacity || 1));

  const isVenue1Cheaper = venue1.price_per_day < venue2.price_per_day;
  const isVenue2Cheaper = venue2.price_per_day < venue1.price_per_day;

  const isVenue1Bigger = venue1.seating_capacity > venue2.seating_capacity;
  const isVenue2Bigger = venue2.seating_capacity > venue1.seating_capacity;

  const isVenue1BetterCostPerGuest = costPerGuest1 < costPerGuest2;
  const isVenue2BetterCostPerGuest = costPerGuest2 < costPerGuest1;

  const isVenue1HigherRating = venue1.rating > venue2.rating;
  const isVenue2HigherRating = venue2.rating > venue1.rating;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 8 }]}>
        <Pressable
          testID="compare-back-btn"
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Venue Comparison</Text>
          <Text style={styles.headerSubtitle}>Side-by-side capacity, tariff & feature analysis</Text>
        </View>
        <Pressable
          testID="compare-swap-header-btn"
          style={styles.swapHeaderBtn}
          onPress={handleSwapVenues}
        >
          <ArrowLeftRight size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentScroll, { paddingBottom: insets.bottom + 40 }]}
        testID="compare-screen-scrollview"
      >
        {/* Sticky-style 50/50 Split Cards Header */}
        <View style={styles.splitVenueHeaderCard} testID="split-venues-header">
          {/* Venue 1 Column (Left) */}
          <View style={styles.venueColumnLeft}>
            <Image
              source={{ uri: venue1.photos[0] }}
              style={styles.venueThumb}
              contentFit="cover"
            />
            <Text style={styles.venueName} numberOfLines={2}>
              {venue1.name}
            </Text>
            <Text style={styles.venueArea} numberOfLines={1}>
              {venue1.area}, {venue1.city}
            </Text>

            <Pressable
              testID="change-venue-1-btn"
              style={styles.changeVenueBtn}
              onPress={() => handleOpenPicker("left")}
            >
              <Text style={styles.changeVenueBtnText} numberOfLines={1}>
                Change Venue
              </Text>
              <ChevronDown size={12} color={colors.brandPrimary} />
            </Pressable>
          </View>

          {/* Center Swap Button Floating Badge */}
          <Pressable
            testID="swap-venues-center-btn"
            style={styles.centerSwapFloatingBtn}
            onPress={handleSwapVenues}
          >
            <ArrowLeftRight size={16} color="#FFFFFF" />
          </Pressable>

          {/* Venue 2 Column (Right) */}
          <View style={styles.venueColumnRight}>
            <Image
              source={{ uri: venue2.photos[0] }}
              style={styles.venueThumb}
              contentFit="cover"
            />
            <Text style={styles.venueName} numberOfLines={2}>
              {venue2.name}
            </Text>
            <Text style={styles.venueArea} numberOfLines={1}>
              {venue2.area}, {venue2.city}
            </Text>

            <Pressable
              testID="change-venue-2-btn"
              style={styles.changeVenueBtn}
              onPress={() => handleOpenPicker("right")}
            >
              <Text style={styles.changeVenueBtnText} numberOfLines={1}>
                Change Venue
              </Text>
              <ChevronDown size={12} color={colors.brandPrimary} />
            </Pressable>
          </View>
        </View>

        {/* COMPARISON METRICS SECTION */}
        <View style={styles.metricsContainer}>
          {/* 1. TARIFF PER DAY */}
          <View style={styles.metricCard} testID="metric-row-tariff">
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Tariff per Day</Text>
              {isVenue1Cheaper ? (
                <View style={styles.badgeLeftHighlight}>
                  <Text style={styles.badgeText}>👑 Best Tariff (Left ₹{((venue2.price_per_day - venue1.price_per_day) / 1000).toFixed(0)}k less)</Text>
                </View>
              ) : isVenue2Cheaper ? (
                <View style={styles.badgeRightHighlight}>
                  <Text style={styles.badgeText}>👑 Best Tariff (Right ₹{((venue1.price_per_day - venue2.price_per_day) / 1000).toFixed(0)}k less)</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.splitRow}>
              <View style={[styles.valBox, isVenue1Cheaper && styles.winnerValBox]}>
                <Text style={[styles.valBigText, isVenue1Cheaper && styles.winnerText]}>
                  ₹{(venue1.price_per_day / 100000).toFixed(2)} Lakh
                </Text>
                <Text style={styles.valSubText}>base rent/day</Text>
                {isVenue1Cheaper && (
                  <View style={styles.winnerPill}>
                    <Trophy size={10} color="#FFFFFF" />
                    <Text style={styles.winnerPillText}>Best Tariff</Text>
                  </View>
                )}
              </View>

              <View style={[styles.valBox, isVenue2Cheaper && styles.winnerValBox]}>
                <Text style={[styles.valBigText, isVenue2Cheaper && styles.winnerText]}>
                  ₹{(venue2.price_per_day / 100000).toFixed(2)} Lakh
                </Text>
                <Text style={styles.valSubText}>base rent/day</Text>
                {isVenue2Cheaper && (
                  <View style={styles.winnerPill}>
                    <Trophy size={10} color="#FFFFFF" />
                    <Text style={styles.winnerPillText}>Best Tariff</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 2. COST PER GUEST */}
          <View style={styles.metricCard} testID="metric-row-cost-per-guest">
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Cost per Guest</Text>
              <Text style={styles.metricFormula}>(Tariff ÷ Seating Capacity)</Text>
            </View>

            <View style={styles.splitRow}>
              <View style={[styles.valBox, isVenue1BetterCostPerGuest && styles.winnerValBox]}>
                <Text style={[styles.valBigText, isVenue1BetterCostPerGuest && styles.winnerText]}>
                  ₹{costPerGuest1}
                </Text>
                <Text style={styles.valSubText}>per invited guest</Text>
                {isVenue1BetterCostPerGuest && (
                  <View style={styles.winnerPill}>
                    <Sparkles size={10} color="#FFFFFF" />
                    <Text style={styles.winnerPillText}>Better Value</Text>
                  </View>
                )}
              </View>

              <View style={[styles.valBox, isVenue2BetterCostPerGuest && styles.winnerValBox]}>
                <Text style={[styles.valBigText, isVenue2BetterCostPerGuest && styles.winnerText]}>
                  ₹{costPerGuest2}
                </Text>
                <Text style={styles.valSubText}>per invited guest</Text>
                {isVenue2BetterCostPerGuest && (
                  <View style={styles.winnerPill}>
                    <Sparkles size={10} color="#FFFFFF" />
                    <Text style={styles.winnerPillText}>Better Value</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 3. SEATING CAPACITY */}
          <View style={styles.metricCard} testID="metric-row-seating">
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Seating Capacity</Text>
              {isVenue1Bigger ? (
                <View style={styles.badgeLeftHighlight}>
                  <Text style={styles.badgeText}>🏆 Max Capacity (+{venue1.seating_capacity - venue2.seating_capacity} seats)</Text>
                </View>
              ) : isVenue2Bigger ? (
                <View style={styles.badgeRightHighlight}>
                  <Text style={styles.badgeText}>🏆 Max Capacity (+{venue2.seating_capacity - venue1.seating_capacity} seats)</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.splitRow}>
              <View style={[styles.valBox, isVenue1Bigger && styles.winnerValBox]}>
                <View style={styles.iconValRow}>
                  <Users size={16} color={colors.brandPrimary} />
                  <Text style={[styles.valBigText, isVenue1Bigger && styles.winnerText]}>
                    {venue1.seating_capacity.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.valSubText}>guests seated</Text>
                {isVenue1Bigger && (
                  <View style={styles.winnerPill}>
                    <Text style={styles.winnerPillText}>Max Capacity</Text>
                  </View>
                )}
              </View>

              <View style={[styles.valBox, isVenue2Bigger && styles.winnerValBox]}>
                <View style={styles.iconValRow}>
                  <Users size={16} color={colors.brandPrimary} />
                  <Text style={[styles.valBigText, isVenue2Bigger && styles.winnerText]}>
                    {venue2.seating_capacity.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.valSubText}>guests seated</Text>
                {isVenue2Bigger && (
                  <View style={styles.winnerPill}>
                    <Text style={styles.winnerPillText}>Max Capacity</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 4. DINING CAPACITY */}
          <View style={styles.metricCard} testID="metric-row-dining">
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Dining Hall Capacity</Text>
            </View>
            <View style={styles.splitRow}>
              <View style={styles.valBox}>
                <View style={styles.iconValRow}>
                  <Utensils size={15} color={colors.brandPrimary} />
                  <Text style={styles.valBigText}>{venue1.food_capacity.toLocaleString()}</Text>
                </View>
                <Text style={styles.valSubText}>batch dining capacity</Text>
              </View>
              <View style={styles.valBox}>
                <View style={styles.iconValRow}>
                  <Utensils size={15} color={colors.brandPrimary} />
                  <Text style={styles.valBigText}>{venue2.food_capacity.toLocaleString()}</Text>
                </View>
                <Text style={styles.valSubText}>batch dining capacity</Text>
              </View>
            </View>
          </View>

          {/* 5. VALET & PARKING */}
          <View style={styles.metricCard} testID="metric-row-parking">
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Valet & Parking Availability</Text>
            </View>
            <View style={styles.splitRow}>
              <View style={styles.valBox}>
                <Car size={16} color={colors.brandPrimary} />
                <Text style={styles.valFeatureText}>{venue1.parking_capacity || "Available with Valet"}</Text>
              </View>
              <View style={styles.valBox}>
                <Car size={16} color={colors.brandPrimary} />
                <Text style={styles.valFeatureText}>{venue2.parking_capacity || "Available with Valet"}</Text>
              </View>
            </View>
          </View>

          {/* 6. GENERATOR POWER BACKUP */}
          <View style={styles.metricCard} testID="metric-row-generator">
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Generator Power Backup</Text>
            </View>
            <View style={styles.splitRow}>
              <View style={styles.valBox}>
                <Zap size={16} color="#D97706" />
                <Text style={styles.valFeatureText}>{venue1.generator_details || "100% Soundproof DG Backup"}</Text>
              </View>
              <View style={styles.valBox}>
                <Zap size={16} color="#D97706" />
                <Text style={styles.valFeatureText}>{venue2.generator_details || "100% Soundproof DG Backup"}</Text>
              </View>
            </View>
          </View>

          {/* 7. AC BRIDAL & FAMILY ROOMS */}
          <View style={styles.metricCard} testID="metric-row-rooms">
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>AC Bridal & Guest Rooms</Text>
            </View>
            <View style={styles.splitRow}>
              <View style={styles.valBox}>
                <Text style={styles.valBigText}>{venue1.rooms_count} Deluxe Suites</Text>
                <Text style={styles.valSubText}>AC furnished rooms</Text>
              </View>
              <View style={styles.valBox}>
                <Text style={styles.valBigText}>{venue2.rooms_count} Deluxe Suites</Text>
                <Text style={styles.valSubText}>AC furnished rooms</Text>
              </View>
            </View>
          </View>

          {/* 8. CATERING POLICY */}
          <View style={styles.metricCard} testID="metric-row-catering">
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Catering Policy</Text>
            </View>
            <View style={styles.splitRow}>
              <View style={styles.valBox}>
                <Text style={styles.valFeatureText}>{venue1.catering_policy}</Text>
              </View>
              <View style={styles.valBox}>
                <Text style={styles.valFeatureText}>{venue2.catering_policy}</Text>
              </View>
            </View>
          </View>

          {/* 9. CUSTOMER RATINGS */}
          <View style={styles.metricCard} testID="metric-row-ratings">
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Customer Rating & Reviews</Text>
            </View>
            <View style={styles.splitRow}>
              <View style={[styles.valBox, isVenue1HigherRating && styles.winnerValBox]}>
                <View style={styles.iconValRow}>
                  <Star size={15} color="#F59E0B" fill="#F59E0B" />
                  <Text style={[styles.valBigText, { color: "#F59E0B" }]}>{venue1.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.valSubText}>({venue1.reviews_count} reviews)</Text>
              </View>
              <View style={[styles.valBox, isVenue2HigherRating && styles.winnerValBox]}>
                <View style={styles.iconValRow}>
                  <Star size={15} color="#F59E0B" fill="#F59E0B" />
                  <Text style={[styles.valBigText, { color: "#F59E0B" }]}>{venue2.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.valSubText}>({venue2.reviews_count} reviews)</Text>
              </View>
            </View>
          </View>

          {/* 10. ADVANCE DEPOSIT */}
          <View style={styles.metricCard} testID="metric-row-deposit">
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Advance Booking Deposit</Text>
            </View>
            <View style={styles.splitRow}>
              <View style={styles.valBox}>
                <Text style={styles.valBigText}>
                  ₹{(venue1.pricing_breakdown?.advance_booking_deposit || Math.round(venue1.price_per_day * 0.2)).toLocaleString()}
                </Text>
                <Text style={styles.valSubText}>advance deposit required</Text>
              </View>
              <View style={styles.valBox}>
                <Text style={styles.valBigText}>
                  ₹{(venue2.pricing_breakdown?.advance_booking_deposit || Math.round(venue2.price_per_day * 0.2)).toLocaleString()}
                </Text>
                <Text style={styles.valSubText}>advance deposit required</Text>
              </View>
            </View>
          </View>

          {/* Bottom Action Row (View Profile / Enquire) */}
          <View style={styles.bottomActionsSplitRow}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Pressable
                testID="compare-view-venue-1-btn"
                style={styles.actionBtn}
                onPress={() => router.push(`/hall/${venue1.id}`)}
              >
                <Building2 size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText} numberOfLines={1}>
                  View {venue1.name.split(" ")[0]}
                </Text>
              </Pressable>
            </View>

            <View style={{ flex: 1, paddingLeft: 6 }}>
              <Pressable
                testID="compare-view-venue-2-btn"
                style={styles.actionBtn}
                onPress={() => router.push(`/hall/${venue2.id}`)}
              >
                <Building2 size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText} numberOfLines={1}>
                  View {venue2.name.split(" ")[0]}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* VENUE PICKER MODAL */}
      <Modal
        visible={pickerTarget !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPickerTarget(null)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <View>
                <Text style={styles.pickerTitle}>
                  Select {pickerTarget === "left" ? "Venue 1 (Left)" : "Venue 2 (Right)"}
                </Text>
                <Text style={styles.pickerSub}>Choose any available or saved convention hall</Text>
              </View>
              <Pressable
                testID="close-venue-picker-btn"
                style={styles.pickerCloseBtn}
                onPress={() => setPickerTarget(null)}
              >
                <X size={18} color={colors.onSurface} />
              </Pressable>
            </View>

            {/* Search Box */}
            <View style={styles.pickerSearchBox}>
              <Search size={16} color={colors.brandPrimary} />
              <TextInput
                testID="venue-picker-search-input"
                style={styles.pickerSearchInput}
                placeholder="Search venue by name, area, or pincode..."
                placeholderTextColor={colors.muted}
                value={pickerSearch}
                onChangeText={setPickerSearch}
              />
              {pickerSearch.length > 0 && (
                <Pressable onPress={() => setPickerSearch("")}>
                  <X size={14} color={colors.muted} />
                </Pressable>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
              {filteredPickerHalls.map((hall) => {
                const isCurrent =
                  (pickerTarget === "left" && hall.id === selectedHall1Id) ||
                  (pickerTarget === "right" && hall.id === selectedHall2Id);

                return (
                  <Pressable
                    key={hall.id}
                    testID={`picker-select-hall-${hall.id}`}
                    style={[styles.pickerHallItem, isCurrent && styles.pickerHallItemCurrent]}
                    onPress={() => handleSelectVenueFromPicker(hall)}
                  >
                    <Image
                      source={{ uri: hall.photos[0] }}
                      style={styles.pickerHallThumb}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerHallName} numberOfLines={1}>
                        {hall.name}
                      </Text>
                      <Text style={styles.pickerHallLocation}>
                        PIN: {hall.pincode} • {hall.area}, {hall.city}
                      </Text>
                      <Text style={styles.pickerHallSpecs}>
                        ₹{(hall.price_per_day / 100000).toFixed(1)}L/day • {hall.seating_capacity} Seats • {hall.rating} ★
                      </Text>
                    </View>
                    {isCurrent && (
                      <View style={styles.selectedPill}>
                        <Text style={styles.selectedPillText}>Selected</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.muted,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.brandPrimary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleGroup: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 1,
  },
  swapHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  contentScroll: {
    padding: 16,
  },
  splitVenueHeaderCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: "relative",
    marginBottom: 16,
  },
  venueColumnLeft: {
    flex: 1,
    paddingRight: 8,
    alignItems: "center",
  },
  venueColumnRight: {
    flex: 1,
    paddingLeft: 8,
    alignItems: "center",
  },
  venueThumb: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
  },
  venueName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandPrimary,
    textAlign: "center",
    minHeight: 34,
    marginBottom: 2,
  },
  venueArea: {
    fontSize: 10.5,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 8,
  },
  changeVenueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    width: "100%",
  },
  changeVenueBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  centerSwapFloatingBtn: {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: [{ translateX: -18 }, { translateY: -18 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  metricsContainer: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  metricHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 6,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.2,
  },
  metricFormula: {
    fontSize: 10,
    color: colors.muted,
  },
  badgeLeftHighlight: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRightHighlight: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#15803D",
  },
  splitRow: {
    flexDirection: "row",
    gap: 10,
  },
  valBox: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
  },
  winnerValBox: {
    borderColor: colors.brandPrimary,
    backgroundColor: "#FDF8F8",
  },
  iconValRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  valBigText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.onSurface,
  },
  winnerText: {
    color: colors.brandPrimary,
  },
  valSubText: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
    textAlign: "center",
  },
  valFeatureText: {
    fontSize: 11,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 15,
    marginTop: 4,
  },
  winnerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  winnerPillText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  bottomActionsSplitRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    padding: 16,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 10,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  pickerSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  pickerCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 12,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 12.5,
    color: colors.onSurface,
  },
  pickerHallItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerHallItemCurrent: {
    borderColor: colors.brandPrimary,
    backgroundColor: "#FDF8F8",
  },
  pickerHallThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
  },
  pickerHallName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  pickerHallLocation: {
    fontSize: 11,
    color: colors.onSurfaceSecondary,
    marginTop: 1,
  },
  pickerHallSpecs: {
    fontSize: 10.5,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 2,
  },
  selectedPill: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  selectedPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyCompareBox: {
    backgroundColor: colors.surface,
    margin: 20,
    marginTop: 40,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyCompareTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginTop: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyCompareSub: {
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
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
}));
