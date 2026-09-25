import React from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Users,
  Utensils,
  Car,
  Zap,
  Heart,
  Star,
  MapPin,
  CalendarCheck2,
  Lock,
  Crown,
  Sparkles,
} from "lucide-react-native";
import { Hall } from "../types";
import { useTheme, makeStyles } from "../theme";
import { useFavorites } from "../context/FavoritesContext";
import { usePro } from "../context/ProContext";

interface HallCardProps {
  hall: Hall;
  onBookPress?: (hall: Hall) => void;
  onInstantBookPress?: (hall: Hall) => void;
}

export const HallCard: React.FC<HallCardProps> = ({ hall, onBookPress, onInstantBookPress }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isPro, openUpgradeModal } = usePro();
  const favorited = isFavorite(hall.id);

  const mainPhoto =
    hall.photos && hall.photos.length > 0
      ? hall.photos[0]
      : "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80";

  const formattedPrice = (hall.price_per_day / 100000).toFixed(1);

  const handleCardPress = () => {
    router.push(`/hall/${hall.id}`);
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    if (isPro) {
      toggleFavorite(hall);
    } else {
      openUpgradeModal("Saving Favourite Convention Halls");
    }
  };

  const handleBookDatePress = (e: any) => {
    e.stopPropagation();
    if (onInstantBookPress) {
      onInstantBookPress(hall);
    } else if (onBookPress) {
      onBookPress(hall);
    } else {
      router.push(`/hall/${hall.id}`);
    }
  };

  return (
    <Pressable
      testID={`hall-card-container-${hall.id}`}
      style={styles.card}
      onPress={handleCardPress}
    >
      {/* Photo Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: mainPhoto }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />

        {/* Top Badges */}
        <View style={styles.imageHeaderRow}>
          <View style={styles.pincodePill}>
            <MapPin size={11} color={colors.onBrandPrimary} />
            <Text style={styles.pincodePillText}>PIN: {hall.pincode}</Text>
          </View>

          <Pressable
            testID={`favorite-btn-${hall.id}`}
            style={[styles.favoriteBtn, favorited && styles.favoriteBtnActive]}
            onPress={handleFavoritePress}
            hitSlop={8}
          >
            <Heart
              size={16}
              color={favorited ? "#EF4444" : "#FFFFFF"}
              fill={favorited ? "#EF4444" : "rgba(0,0,0,0.3)"}
            />
          </Pressable>
        </View>

        {/* Price & Rating Overlay */}
        <View style={styles.imageFooterRow}>
          {isPro ? (
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>₹{formattedPrice} Lakh</Text>
              <Text style={styles.priceSubtext}>/day</Text>
            </View>
          ) : (
            <Pressable
              testID={`unlock-price-pill-${hall.id}`}
              style={styles.lockedPricePill}
              onPress={(e) => {
                e.stopPropagation();
                openUpgradeModal("Per-Day Pricing Breakdown");
              }}
            >
              <Lock size={12} color={colors.brandPrimary} />
              <Text style={styles.lockedPriceText}>₹ Unlock Pro Price</Text>
            </Pressable>
          )}

          <View style={styles.ratingPill}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{hall.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsCount}>({hall.reviews_count})</Text>
          </View>
        </View>
      </View>

      {/* Content Body */}
      <View style={styles.body}>
        <View style={styles.titleSection}>
          <Text testID={`hall-card-name-${hall.id}`} style={styles.name} numberOfLines={1}>
            {hall.name}
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            {hall.area}, {hall.city}
          </Text>
        </View>

        {/* Key Specs Grid */}
        <View style={styles.specsGrid}>
          {/* Seating */}
          <View style={styles.specItem}>
            <View style={styles.specIconBox}>
              <Users size={14} color={colors.brandPrimary} />
            </View>
            <View>
              <Text style={styles.specVal}>{hall.seating_capacity}</Text>
              <Text style={styles.specLabel}>Seating</Text>
            </View>
          </View>

          {/* Dining */}
          <View style={styles.specItem}>
            <View style={styles.specIconBox}>
              <Utensils size={14} color={colors.brandPrimary} />
            </View>
            <View>
              <Text style={styles.specVal}>{hall.food_capacity}</Text>
              <Text style={styles.specLabel}>Dining</Text>
            </View>
          </View>

          {/* Parking */}
          <View style={styles.specItem}>
            <View style={styles.specIconBox}>
              <Car size={14} color={colors.brandPrimary} />
            </View>
            <View>
              <Text style={styles.specVal}>{hall.parking_available ? "Valet" : "Limited"}</Text>
              <Text style={styles.specLabel}>Parking</Text>
            </View>
          </View>

          {/* Generator */}
          <View style={styles.specItem}>
            <View style={styles.specIconBox}>
              <Zap size={14} color={colors.brandPrimary} />
            </View>
            <View>
              <Text style={styles.specVal}>{hall.generator_backup ? "100% DG" : "Standard"}</Text>
              <Text style={styles.specLabel}>Backup</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footerRow}>
          <View style={styles.statusIndicator}>
            {isPro ? (
              <>
                <View style={styles.greenDot} />
                <Text style={styles.statusText}>Live Calendar Synced</Text>
              </>
            ) : (
              <View style={styles.proFeaturePill}>
                <Crown size={11} color={colors.brandPrimary} />
                <Text style={styles.proFeaturePillText}>Pro Unlocks Booking</Text>
              </View>
            )}
          </View>

          <Pressable
            testID={`hall-card-book-action-${hall.id}`}
            style={[styles.bookBtn, !isPro && styles.bookBtnProPrompt]}
            onPress={handleBookDatePress}
          >
            {isPro ? (
              <>
                <CalendarCheck2 size={14} color={colors.onBrandPrimary} />
                <Text style={styles.bookBtnText}>Book & Reserve</Text>
              </>
            ) : (
              <>
                <Sparkles size={13} color={colors.brandPrimary} />
                <Text style={styles.bookBtnProPromptText}>Check Dates (Pro)</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    height: 185,
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageHeaderRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pincodePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(107, 28, 47, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pincodePillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  favoriteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  favoriteBtnActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  imageFooterRow: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  lockedPricePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(107, 28, 47, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  lockedPriceText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  priceSubtext: {
    color: "#E5E7EB",
    fontSize: 11,
    marginLeft: 2,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
  },
  reviewsCount: {
    color: "#6B7280",
    fontSize: 10,
  },
  body: {
    padding: 14,
  },
  titleSection: {
    marginBottom: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.brandPrimary,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  location: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
  },
  specsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  specIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  specVal: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.onSurface,
  },
  specLabel: {
    fontSize: 9.5,
    color: colors.muted,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: "600",
  },
  proFeaturePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proFeaturePillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookBtnProPrompt: {
    backgroundColor: colors.brandPrimary,
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bookBtnProPromptText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
}));
