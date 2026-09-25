import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  CalendarCheck,
  Clock,
  Phone,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Crown,
  Sparkles,
  CreditCard,
} from "lucide-react-native";
import { Header } from "@/src/components/Header";
import { fetchEnquiries, cancelBookingEnquiry, fetchBookings } from "@/src/api";
import { BookingEnquiry, InstantBooking } from "@/src/types";
import { usePro } from "@/src/context/ProContext";
import { useTheme, makeStyles } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

const TAB_MODES = ["Enquiries", "Instant Bookings"];
const STATUS_FILTERS = ["All", "Pending", "Confirmed", "Cancelled"];

export default function EnquiriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { isPro, openUpgradeModal } = usePro();

  const [activeTabMode, setActiveTabMode] = useState<"Enquiries" | "Instant Bookings">("Enquiries");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const {
    data: enquiries = [],
    isLoading: isEnquiriesLoading,
    isRefetching: isEnquiriesRefetching,
    refetch: refetchEnquiries,
  } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => fetchEnquiries(),
  });

  const {
    data: bookings = [],
    isLoading: isBookingsLoading,
    isRefetching: isBookingsRefetching,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => fetchBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (enquiryId: string) => cancelBookingEnquiry(enquiryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["halls"] });
    },
  });

  const filteredEnquiries = enquiries.filter((item) => {
    if (selectedStatus === "All") return true;
    return item.status.toLowerCase() === selectedStatus.toLowerCase();
  });

  const handleCancelEnquiry = (enquiry: BookingEnquiry) => {
    cancelMutation.mutate(enquiry.id || enquiry.reference_id);
  };

  const handleCallVenue = (phone?: string) => {
    const targetPhone = phone || "+919845012345";
    Linking.openURL(`tel:${targetPhone}`);
  };

  const bottomChrome = usesNativeTabs ? insets.bottom : 16;

  const renderEnquiryItem = ({ item }: { item: BookingEnquiry }) => {
    const isCancelled = item.status === "Cancelled";
    const isConfirmed = item.status === "Confirmed";

    return (
      <View
        testID={`enquiry-card-${item.reference_id}`}
        style={[styles.enquiryCard, isCancelled && styles.cardCancelled]}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.refCode}>{item.reference_id}</Text>
            <Text style={styles.createdDate}>
              Submitted {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isConfirmed
                ? styles.badgeConfirmed
                : isCancelled
                ? styles.badgeCancelled
                : styles.badgePending,
            ]}
          >
            {isConfirmed ? (
              <CheckCircle2 size={12} color={colors.success} />
            ) : isCancelled ? (
              <XCircle size={12} color={colors.error} />
            ) : (
              <Clock size={12} color={colors.warning} />
            )}
            <Text
              style={[
                styles.statusBadgeText,
                isConfirmed
                  ? styles.textConfirmed
                  : isCancelled
                  ? styles.textCancelled
                  : styles.textPending,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <Pressable
          testID={`enquiry-hall-link-${item.reference_id}`}
          style={styles.hallRow}
          onPress={() => router.push(`/hall/${item.hall_id}`)}
        >
          {item.hall_photo ? (
            <Image
              source={{ uri: item.hall_photo }}
              style={styles.hallThumb}
              contentFit="cover"
            />
          ) : (
            <View style={styles.hallThumbPlaceholder}>
              <CalendarCheck size={20} color={colors.brandPrimary} />
            </View>
          )}
          <View style={styles.hallMeta}>
            <Text style={styles.hallName} numberOfLines={1}>
              {item.hall_name}
            </Text>
            <Text style={styles.hallLocation}>
              PIN: {item.hall_pincode} • {item.hall_area || item.hall_city}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>

        <View style={styles.detailsGrid}>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>EVENT TYPE</Text>
            <Text style={styles.detailVal}>{item.event_type}</Text>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>EVENT DATE</Text>
            <Text style={[styles.detailVal, { color: colors.brandPrimary }]}>
              {item.event_date}
            </Text>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>GUESTS</Text>
            <Text style={styles.detailVal}>{item.guest_count} Pax</Text>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>FOOD</Text>
            <Text style={styles.detailVal}>{item.food_preference}</Text>
          </View>
        </View>

        <View style={styles.contactNote}>
          <Text style={styles.contactNoteText}>
            Enquiry for: <Text style={{ fontWeight: "700" }}>{item.customer_name}</Text> ({item.customer_phone})
          </Text>
          {item.additional_notes ? (
            <Text style={styles.notesText} numberOfLines={2}>
              {`"${item.additional_notes}"`}
            </Text>
          ) : null}
        </View>

        <View style={styles.cardActionsRow}>
          <Pressable
            testID={`call-venue-btn-${item.reference_id}`}
            style={styles.callBtn}
            onPress={() => handleCallVenue()}
          >
            <Phone size={14} color={colors.onBrandPrimary} />
            <Text style={styles.callBtnText}>Call Venue</Text>
          </Pressable>

          {!isCancelled && (
            <Pressable
              testID={`cancel-enquiry-btn-${item.reference_id}`}
              style={styles.cancelBtn}
              onPress={() => handleCancelEnquiry(item)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const renderBookingItem = ({ item }: { item: InstantBooking }) => {
    return (
      <View testID={`booking-card-${item.booking_reference}`} style={styles.enquiryCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.refCode}>{item.booking_reference}</Text>
            <Text style={styles.createdDate}>
              Booked {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, styles.badgeConfirmed]}>
            <CheckCircle2 size={12} color={colors.success} />
            <Text style={[styles.statusBadgeText, styles.textConfirmed]}>
              PAID & RESERVED
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.hallRow}
          onPress={() => router.push(`/hall/${item.hall_id}`)}
        >
          {item.hall_photo ? (
            <Image source={{ uri: item.hall_photo }} style={styles.hallThumb} contentFit="cover" />
          ) : (
            <View style={styles.hallThumbPlaceholder}>
              <CreditCard size={20} color={colors.brandPrimary} />
            </View>
          )}
          <View style={styles.hallMeta}>
            <Text style={styles.hallName} numberOfLines={1}>{item.hall_name}</Text>
            <Text style={styles.hallLocation}>PIN: {item.hall_pincode} • {item.hall_city}</Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>

        <View style={styles.detailsGrid}>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>DATE RESERVED</Text>
            <Text style={[styles.detailVal, { color: colors.brandPrimary }]}>{item.event_date}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>DEPOSIT PAID</Text>
            <Text style={[styles.detailVal, { color: colors.success }]}>₹{item.deposit_amount?.toLocaleString()}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>TOTAL RENT</Text>
            <Text style={styles.detailVal}>₹{item.total_rent?.toLocaleString()}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>GUESTS</Text>
            <Text style={styles.detailVal}>{item.guest_count} Pax</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="My Bookings & Enquiries"
        subtitle={
          isPro
            ? "Track & Manage Your Convention Hall Reservations"
            : "Booking Requests Dashboard (Pro)"
        }
      />

      {/* Free Tier Notice Banner */}
      {!isPro && (
        <Pressable
          testID="enquiries-pro-upgrade-banner"
          style={styles.proUpgradeBanner}
          onPress={() => openUpgradeModal("Booking Requests & Instant Reservations")}
        >
          <Crown size={16} color={colors.onBrandPrimary} fill={colors.onBrandPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.proBannerTitle}>Free Tier • Unlock Pro / Enter Code GT011103</Text>
            <Text style={styles.proBannerSub}>
              Pro unlocks live calendar date booking and instant reservation deposits.
            </Text>
          </View>
          <Sparkles size={16} color={colors.brandPrimary} />
        </Pressable>
      )}

      {/* Top Toggle: Enquiries vs Instant Bookings */}
      <View style={styles.tabToggleRow}>
        {TAB_MODES.map((mode) => (
          <Pressable
            key={mode}
            testID={`toggle-mode-${mode.toLowerCase().replace(" ", "-")}`}
            style={[styles.tabToggleBtn, activeTabMode === mode && styles.tabToggleBtnActive]}
            onPress={() => setActiveTabMode(mode as any)}
          >
            <Text style={[styles.tabToggleText, activeTabMode === mode && styles.tabToggleTextActive]}>
              {mode} ({mode === "Enquiries" ? enquiries.length : bookings.length})
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Status Filter Tabs */}
      {activeTabMode === "Enquiries" && (
        <View style={styles.filterTabsRow}>
          {STATUS_FILTERS.map((st) => (
            <Pressable
              key={st}
              testID={`status-filter-${st}`}
              style={[
                styles.filterTab,
                selectedStatus === st && styles.filterTabActive,
              ]}
              onPress={() => setSelectedStatus(st)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedStatus === st && styles.filterTabTextActive,
                ]}
              >
                {st}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {activeTabMode === "Enquiries" ? (
        <FlatList
          data={filteredEnquiries}
          keyExtractor={(item) => item.id || item.reference_id}
          renderItem={renderEnquiryItem}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: bottomChrome + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isEnquiriesRefetching}
              onRefresh={refetchEnquiries}
              tintColor={colors.brandPrimary}
              colors={[colors.brandPrimary]}
            />
          }
          ListEmptyComponent={
            !isEnquiriesLoading ? (
              <View testID="empty-enquiries-view" style={styles.emptyView}>
                <View style={styles.emptyIconBox}>
                  <CalendarCheck size={36} color={colors.brandPrimary} />
                </View>
                <Text style={styles.emptyTitle}>No Enquiries Found</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedStatus !== "All"
                    ? `You have no ${selectedStatus.toLowerCase()} booking enquiries.`
                    : "You haven't sent any booking requests yet. Browse convention halls by pincode, pick your auspicious dates, and submit an enquiry!"}
                </Text>
                <Pressable
                  testID="explore-halls-from-enquiries-btn"
                  style={styles.exploreBtn}
                  onPress={() => router.push("/(tabs)")}
                >
                  <Text style={styles.exploreBtnText}>Discover Convention Halls</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.brandPrimary} />
                <Text style={styles.loadingText}>Loading your enquiries...</Text>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id || item.booking_reference}
          renderItem={renderBookingItem}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: bottomChrome + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isBookingsRefetching}
              onRefresh={refetchBookings}
              tintColor={colors.brandPrimary}
              colors={[colors.brandPrimary]}
            />
          }
          ListEmptyComponent={
            !isBookingsLoading ? (
              <View style={styles.emptyView} testID="empty-bookings-view">
                <View style={styles.emptyIconBox}>
                  <CreditCard size={36} color={colors.brandPrimary} />
                </View>
                <Text style={styles.emptyTitle}>No Instant Reservations Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Lock your event date with an instant deposit payment directly from any convention hall profile page.
                </Text>
              </View>
            ) : (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.brandPrimary} />
                <Text style={styles.loadingText}>Loading instant reservations...</Text>
              </View>
            )
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
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  proUpgradeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.brandTertiary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  proBannerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  proBannerSub: {
    fontSize: 11,
    color: colors.onSurfaceSecondary,
    marginTop: 1,
  },
  tabToggleRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabToggleBtnActive: {
    backgroundColor: colors.brandPrimary,
  },
  tabToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  tabToggleTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  filterTabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  filterTabText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  enquiryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCancelled: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 8,
  },
  refCode: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.brandPrimary,
    letterSpacing: 0.5,
  },
  createdDate: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePending: {
    backgroundColor: "rgba(237, 108, 2, 0.15)",
  },
  textPending: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: "700",
  },
  badgeConfirmed: {
    backgroundColor: "rgba(46, 125, 50, 0.15)",
  },
  textConfirmed: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "700",
  },
  badgeCancelled: {
    backgroundColor: "rgba(211, 47, 47, 0.15)",
  },
  textCancelled: {
    color: colors.error,
    fontSize: 11,
    fontWeight: "700",
  },
  hallRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  hallThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  hallThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  hallMeta: {
    flex: 1,
  },
  hallName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.onSurface,
  },
  hallLocation: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  detailBox: {
    width: "50%",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.5,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurface,
    marginTop: 2,
  },
  contactNote: {
    marginBottom: 12,
  },
  contactNoteText: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
  },
  notesText: {
    fontSize: 11,
    fontStyle: "italic",
    color: colors.muted,
    marginTop: 4,
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  callBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyView: {
    padding: 32,
    alignItems: "center",
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
  exploreBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exploreBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  loadingBox: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 10,
  },
}));
