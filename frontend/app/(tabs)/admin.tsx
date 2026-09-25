import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  Building2,
  CheckCircle2,
  MessageSquare,
  PlusCircle,
  Calendar,
  Reply,
  Users,
} from "lucide-react-native";
import { Header } from "@/src/components/Header";
import { AddHallModal } from "@/src/components/AddHallModal";
import { fetchAdminReviews, fetchHalls, toggleBookedDate, replyToReviewApi, fetchAdminStats } from "@/src/api";
import { HallReview, Hall } from "@/src/types";
import { useTheme, makeStyles } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";
import { useAuth } from "@/src/context/AuthContext";

const DESK_TABS = ["Customer Reviews", "Manage Halls", "Platform Stats"];

const HALL_OPTIONS = [
  { id: "all", name: "All Convention Halls" },
  { id: "Sri Krishna Grand Convention Centre", name: "Sri Krishna Grand" },
  { id: "Imperial Palace Banquet & Convention Hall", name: "Imperial Palace" },
  { id: "Cyber Grand Convention & Lawn", name: "Cyber Grand" },
  { id: "Mahalaxmi Kalyana Mandapam & Palace", name: "Mahalaxmi Mandapam" },
  { id: "Emerald Grand Ballroom & Convention", name: "Emerald Ballroom" },
];

const RATING_FILTERS = [
  { label: "All Stars", value: 0 },
  { label: "5 Stars Only", value: 5 },
  { label: "4+ Stars", value: 4 },
];

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"Customer Reviews" | "Manage Halls" | "Platform Stats">("Customer Reviews");
  const [selectedHall, setSelectedHall] = useState<string>("all");
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [addHallModalVisible, setAddHallModalVisible] = useState(false);

  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");

  const {
    data: adminData,
    isLoading: isReviewsLoading,
    isRefetching: isReviewsRefetching,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["adminReviews", selectedHall, minRatingFilter],
    queryFn: () =>
      fetchAdminReviews(
        selectedHall !== "all" ? selectedHall : undefined,
        minRatingFilter > 0 ? minRatingFilter : undefined
      ),
  });

  const {
    data: hallsList = [],
    isLoading: isHallsLoading,
    refetch: refetchHalls,
  } = useQuery({
    queryKey: ["halls"],
    queryFn: () => fetchHalls(),
  });

  const {
    data: platformStats,
  } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => fetchAdminStats(),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      replyToReviewApi(id, reply, user?.name || "Sri Krishna Venue Management"),
    onSuccess: () => {
      setReplyingReviewId(null);
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["adminReviews"] });
      queryClient.invalidateQueries({ queryKey: ["hallReviews"] });
    },
  });

  const toggleDateMutation = useMutation({
    mutationFn: ({ hallId, dateStr, action }: { hallId: string; dateStr: string; action: "add" | "remove" }) =>
      toggleBookedDate(hallId, dateStr, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["halls"] });
    },
  });

  const handleSendReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    replyMutation.mutate({ id: reviewId, reply: replyText.trim() });
  };

  const bottomChrome = usesNativeTabs ? insets.bottom : 16;
  const stats = adminData?.stats || {
    total_reviews: 5,
    overall_average_rating: 4.9,
    positive_rating_percentage: 98,
    total_halls: 6,
  };
  const reviews = adminData?.reviews || [];

  const renderReviewItem = ({ item }: { item: HallReview }) => {
    const isReplying = replyingReviewId === item.id;

    return (
      <View testID={`admin-review-card-${item.id || item.title}`} style={styles.reviewCard}>
        <View style={styles.reviewCardHeader}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                color={s <= item.rating ? "#F59E0B" : colors.border}
                fill={s <= item.rating ? "#F59E0B" : "transparent"}
              />
            ))}
            <Text style={styles.ratingNumText}>{item.rating}.0</Text>
          </View>

          <View style={styles.verifiedBadge}>
            <CheckCircle2 size={11} color={colors.success} />
            <Text style={styles.verifiedBadgeText}>Verified Customer</Text>
          </View>
        </View>

        <Text style={styles.reviewTitle}>{item.title}</Text>
        <Text style={styles.reviewComment}>{item.comment}</Text>

        {/* Existing Owner Reply */}
        {item.owner_reply && (
          <View style={styles.existingReplyBox}>
            <Text style={styles.existingReplyHeader}>
              Reply from {item.owner_reply.replied_by}:
            </Text>
            <Text style={styles.existingReplyText}>{item.owner_reply.reply}</Text>
          </View>
        )}

        <View style={styles.reviewMetaRow}>
          <View>
            <Text style={styles.reviewerName}>{item.reviewer_name}</Text>
            <Text style={styles.eventTypeText}>{item.event_type || "Wedding Event"}</Text>
          </View>
          <View style={styles.hallTag}>
            <Building2 size={11} color={colors.brandPrimary} />
            <Text style={styles.hallTagText} numberOfLines={1}>
              {item.hall_name}
            </Text>
          </View>
        </View>

        {/* Owner Reply Action */}
        <View style={styles.ownerActionRow}>
          {isReplying ? (
            <View style={styles.replyInputBox}>
              <TextInput
                testID={`reply-input-${item.id}`}
                style={styles.replyTextInput}
                placeholder="Write owner response..."
                placeholderTextColor={colors.muted}
                value={replyText}
                onChangeText={setReplyText}
              />
              <Pressable
                testID={`send-reply-btn-${item.id}`}
                style={styles.sendReplyBtn}
                onPress={() => handleSendReply(item.id)}
              >
                <Text style={styles.sendReplyBtnText}>Send</Text>
              </Pressable>
              <Pressable
                style={styles.cancelReplyBtn}
                onPress={() => setReplyingReviewId(null)}
              >
                <Text style={styles.cancelReplyBtnText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              testID={`reply-review-btn-${item.id}`}
              style={styles.replyBtn}
              onPress={() => {
                setReplyingReviewId(item.id);
                setReplyText("");
              }}
            >
              <Reply size={13} color={colors.brandPrimary} />
              <Text style={styles.replyBtnText}>
                {item.owner_reply ? "Edit Owner Reply" : "Reply to Customer"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const renderHallItem = ({ item }: { item: Hall }) => {
    return (
      <View testID={`admin-hall-card-${item.id}`} style={styles.hallItemCard}>
        <View style={styles.hallItemHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hallItemName}>{item.name}</Text>
            <Text style={styles.hallItemLocation}>PIN: {item.pincode} • {item.city}</Text>
          </View>
          <View style={styles.hallItemPriceBadge}>
            <Text style={styles.hallItemPriceText}>₹{(item.price_per_day / 100000).toFixed(1)}L / day</Text>
          </View>
        </View>

        <View style={styles.hallItemSpecs}>
          <Text style={styles.hallItemSpecText}>Seating: {item.seating_capacity}</Text>
          <Text style={styles.hallItemSpecText}>•</Text>
          <Text style={styles.hallItemSpecText}>Dining: {item.food_capacity}</Text>
          <Text style={styles.hallItemSpecText}>•</Text>
          <Text style={styles.hallItemSpecText}>Booked Dates: {item.booked_dates?.length || 0}</Text>
        </View>

        <View style={styles.hallItemActions}>
          <Pressable
            testID={`block-date-btn-${item.id}`}
            style={styles.dateBlockBtn}
            onPress={() => {
              const testDate = "2026-10-30";
              const isAlready = item.booked_dates?.includes(testDate);
              toggleDateMutation.mutate({
                hallId: item.id,
                dateStr: testDate,
                action: isAlready ? "remove" : "add",
              });
            }}
          >
            <Calendar size={13} color={colors.onBrandPrimary} />
            <Text style={styles.dateBlockBtnText}>
              {item.booked_dates?.includes("2026-10-30")
                ? "Unblock 2026-10-30"
                : "Block 2026-10-30 (Calendar Sync)"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Owner Desk"
        subtitle="Hall Listings, Reviews & Sentiment Desk"
        rightAction={
          <Pressable
            testID="open-add-hall-modal-btn"
            style={styles.addHallHeaderBtn}
            onPress={() => setAddHallModalVisible(true)}
          >
            <PlusCircle size={14} color={colors.onBrandPrimary} />
            <Text style={styles.addHallHeaderText}>+ Add Hall</Text>
          </Pressable>
        }
      />

      {/* Overview Analytics Bar */}
      <View style={styles.analyticsBar} testID="admin-overview-stats">
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.overall_average_rating} ★</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.total_reviews}</Text>
          <Text style={styles.statLabel}>Total Reviews</Text>
        </View>
        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: colors.success }]}>
            {stats.positive_rating_percentage}%
          </Text>
          <Text style={styles.statLabel}>Positive Score</Text>
        </View>
      </View>

      {/* Desk Subtabs */}
      <View style={styles.subtabsRow}>
        {DESK_TABS.map((t) => (
          <Pressable
            key={t}
            testID={`admin-tab-${t.toLowerCase().replace(" ", "-")}`}
            style={[styles.subtabBtn, activeTab === t && styles.subtabBtnActive]}
            onPress={() => setActiveTab(t as any)}
          >
            <Text style={[styles.subtabText, activeTab === t && styles.subtabTextActive]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "Customer Reviews" && (
        <>
          {/* Hall Filter Horizontal Row */}
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hallFilterScroll}
            >
              {HALL_OPTIONS.map((h) => (
                <Pressable
                  key={h.id}
                  testID={`admin-hall-filter-${h.id}`}
                  style={[
                    styles.hallFilterPill,
                    selectedHall === h.id && styles.hallFilterPillSelected,
                  ]}
                  onPress={() => setSelectedHall(h.id)}
                >
                  <Text
                    style={[
                      styles.hallFilterText,
                      selectedHall === h.id && styles.hallFilterTextSelected,
                    ]}
                  >
                    {h.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Rating Filters Row */}
          <View style={styles.ratingFilterRow}>
            {RATING_FILTERS.map((rf) => (
              <Pressable
                key={rf.value}
                testID={`admin-rating-filter-${rf.value}`}
                style={[
                  styles.ratingFilterPill,
                  minRatingFilter === rf.value && styles.ratingFilterPillSelected,
                ]}
                onPress={() => setMinRatingFilter(rf.value)}
              >
                <Text
                  style={[
                    styles.ratingFilterText,
                    minRatingFilter === rf.value && styles.ratingFilterTextSelected,
                  ]}
                >
                  {rf.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id || item.title}
            renderItem={renderReviewItem}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: bottomChrome + 24 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isReviewsRefetching}
                onRefresh={refetchReviews}
                tintColor={colors.brandPrimary}
                colors={[colors.brandPrimary]}
              />
            }
            ListEmptyComponent={
              !isReviewsLoading ? (
                <View style={styles.emptyView} testID="admin-no-reviews-view">
                  <MessageSquare size={36} color={colors.brandPrimary} />
                  <Text style={styles.emptyTitle}>No Reviews Yet for Selected Venue</Text>
                  <Text style={styles.emptySubtitle}>
                    Verified reviews submitted by Pro members will appear here in real-time with owner reply options.
                  </Text>
                </View>
              ) : (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={colors.brandPrimary} />
                  <Text style={styles.loadingText}>Syncing reviews from MongoDB...</Text>
                </View>
              )
            }
          />
        </>
      )}

      {activeTab === "Manage Halls" && (
        <FlatList
          data={hallsList}
          keyExtractor={(item) => item.id}
          renderItem={renderHallItem}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: bottomChrome + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isHallsLoading}
              onRefresh={refetchHalls}
              tintColor={colors.brandPrimary}
              colors={[colors.brandPrimary]}
            />
          }
        />
      )}

      {activeTab === "Platform Stats" && (
        <ScrollView
          contentContainerStyle={[styles.listContainer, { paddingBottom: bottomChrome + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsCardGrid}>
            <View style={styles.statsGridCard}>
              <Building2 size={24} color={colors.brandPrimary} />
              <Text style={styles.statsGridVal}>{platformStats?.total_halls || hallsList.length}</Text>
              <Text style={styles.statsGridLabel}>Active Convention Halls</Text>
            </View>
            <View style={styles.statsGridCard}>
              <Users size={24} color={colors.brandPrimary} />
              <Text style={styles.statsGridVal}>{platformStats?.total_pro_members || 1}</Text>
              <Text style={styles.statsGridLabel}>Pro VIP Subscribers</Text>
            </View>
            <View style={styles.statsGridCard}>
              <MessageSquare size={24} color={colors.brandPrimary} />
              <Text style={styles.statsGridVal}>{platformStats?.total_reviews || reviews.length}</Text>
              <Text style={styles.statsGridLabel}>Verified Customer Reviews</Text>
            </View>
            <View style={styles.statsGridCard}>
              <Calendar size={24} color={colors.brandPrimary} />
              <Text style={styles.statsGridVal}>{platformStats?.total_enquiries || 5}</Text>
              <Text style={styles.statsGridLabel}>Booking Enquiries</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Add New Hall Modal */}
      <AddHallModal
        visible={addHallModalVisible}
        onClose={() => setAddHallModalVisible(false)}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  addHallHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addHallHeaderText: {
    color: colors.onBrandPrimary,
    fontSize: 11,
    fontWeight: "800",
  },
  analyticsBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statVal: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "70%",
    backgroundColor: colors.divider,
    alignSelf: "center",
  },
  subtabsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subtabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  subtabBtnActive: {
    backgroundColor: colors.brandPrimary,
  },
  subtabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  subtabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  filterSection: {
    height: 48,
    justifyContent: "center",
    marginTop: 6,
  },
  hallFilterScroll: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  hallFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hallFilterPillSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  hallFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  hallFilterTextSelected: {
    color: "#FFFFFF",
  },
  ratingFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  ratingFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingFilterPillSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  ratingFilterText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  ratingFilterTextSelected: {
    color: "#FFFFFF",
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingNumText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(46, 125, 50, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.success,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 12.5,
    color: colors.onSurfaceSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  existingReplyBox: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.brandPrimary,
  },
  existingReplyHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginBottom: 2,
  },
  existingReplyText: {
    fontSize: 12,
    color: colors.onSurface,
  },
  reviewMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurface,
  },
  eventTypeText: {
    fontSize: 11,
    color: colors.muted,
  },
  hallTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 160,
  },
  hallTagText: {
    fontSize: 10.5,
    color: colors.brandPrimary,
    fontWeight: "600",
  },
  ownerActionRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
  },
  replyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  replyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  replyInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  replyTextInput: {
    flex: 1,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    color: colors.onSurface,
  },
  sendReplyBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sendReplyBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  cancelReplyBtn: {
    paddingHorizontal: 8,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelReplyBtnText: {
    color: colors.muted,
    fontSize: 12,
  },
  hallItemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hallItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hallItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
  },
  hallItemLocation: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  hallItemPriceBadge: {
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hallItemPriceText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  hallItemSpecs: {
    flexDirection: "row",
    gap: 6,
    marginVertical: 8,
  },
  hallItemSpecText: {
    fontSize: 11.5,
    color: colors.onSurfaceSecondary,
  },
  hallItemActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
  },
  dateBlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateBlockBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 11.5,
    fontWeight: "700",
  },
  statsCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  statsGridCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsGridVal: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginTop: 8,
  },
  statsGridLabel: {
    fontSize: 11.5,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  emptyView: {
    padding: 36,
    alignItems: "center",
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
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
