import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Dimensions,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Star,
  Users,
  Utensils,
  Car,
  Zap,
  Phone,
  CheckCircle,
  CalendarCheck,
  Building,
  X,
  AlertTriangle,
  Navigation,
  MessageSquare,
  Crown,
  Check,
  CreditCard,
} from "lucide-react-native";
import { fetchHallById, fetchHallAvailability, fetchHallReviews } from "@/src/api";
import { AvailabilityCalendar } from "@/src/components/AvailabilityCalendar";
import { BookingModal } from "@/src/components/BookingModal";
import { InstantBookingModal } from "@/src/components/InstantBookingModal";
import { ReviewModal } from "@/src/components/ReviewModal";
import { LockedFeatureTeaser } from "@/src/components/LockedFeatureTeaser";
import { useFavorites } from "@/src/context/FavoritesContext";
import { usePro } from "@/src/context/ProContext";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme, makeStyles } from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HallDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useStyles();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isPro, openUpgradeModal } = usePro();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("2026-10-15");
  const [isDateBookedSelected, setIsDateBookedSelected] = useState<boolean>(false);
  const [bookedWarningMsg, setBookedWarningMsg] = useState<string | null>(null);

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [instantBookingModalVisible, setInstantBookingModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const {
    data: hall,
    isLoading: isHallLoading,
    error: hallError,
  } = useQuery({
    queryKey: ["hall", id],
    queryFn: () => fetchHallById(id!),
    enabled: !!id,
  });

  const { data: availabilityData } = useQuery({
    queryKey: ["availability", id],
    queryFn: () => fetchHallAvailability(id!),
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["hallReviews", id],
    queryFn: () => fetchHallReviews(id!),
    enabled: !!id,
  });

  if (isHallLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading convention hall details...</Text>
      </View>
    );
  }

  if (!hall || hallError) {
    return (
      <View style={styles.errorScreen}>
        <Building size={48} color={colors.brandPrimary} />
        <Text style={styles.errorTitle}>Convention Hall Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The requested convention hall could not be loaded from MongoDB.
        </Text>
        <Pressable
          testID="hall-not-found-back-btn"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Discovery</Text>
        </Pressable>
      </View>
    );
  }

  const favorited = isFavorite(hall.id);
  const bookedDatesList = availabilityData?.booked_dates || hall.booked_dates || [];
  const photos = hall.photos && hall.photos.length > 0 ? hall.photos : [];

  const handleCalendarDateSelect = (dateStr: string, isBooked: boolean) => {
    setSelectedCalendarDate(dateStr);
    setIsDateBookedSelected(isBooked);

    if (isBooked) {
      setBookedWarningMsg(
        `Date ${dateStr} is already booked for this hall. Please select an open green date to send an enquiry.`
      );
      return;
    }

    setBookedWarningMsg(null);
    setBookingModalVisible(true);
  };

  const handleOpenEnquiryModal = () => {
    if (!isPro) {
      openUpgradeModal("Booking Enquiry Form & Real-time Date Lock");
      return;
    }
    const isCurrentlyBooked = isDateBookedSelected || bookedDatesList.includes(selectedCalendarDate);
    if (isCurrentlyBooked) {
      setBookedWarningMsg(
        `Selected date (${selectedCalendarDate}) is already booked for this hall. Please choose an open green date on the calendar first.`
      );
      return;
    }
    setBookedWarningMsg(null);
    setBookingModalVisible(true);
  };

  const handleOpenInstantBooking = () => {
    if (!isPro) {
      openUpgradeModal("Instant Reservation & Deposit Checkout");
      return;
    }
    setInstantBookingModalVisible(true);
  };

  const handleOpenGoogleMaps = () => {
    const mapsUrl =
      hall.google_maps_url ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${hall.name} ${hall.full_address}`
      )}`;
    Linking.openURL(mapsUrl);
  };

  const handleCallVenue = () => {
    if (!isPro) {
      openUpgradeModal("Direct Hall Owner & Manager Phone Numbers");
      return;
    }
    Linking.openURL(`tel:${hall.contact_phone || "+919845012345"}`);
  };

  const handleCallManager = () => {
    if (!isPro) {
      openUpgradeModal("Direct Hall Manager Contact");
      return;
    }
    Linking.openURL(`tel:${hall.manager_phone || hall.contact_phone}`);
  };

  const handleWhatsAppVenue = () => {
    if (!isPro) {
      openUpgradeModal("Direct WhatsApp Chat with Venue Owner");
      return;
    }
    const cleanPhone = (hall.whatsapp_number || hall.contact_phone).replace(/[^0-9]/g, "");
    Linking.openURL(`https://wa.me/${cleanPhone}?text=Hi,%20I%20am%20interested%20in%20booking%20${encodeURIComponent(hall.name)}`);
  };

  const handleFavoritePress = () => {
    if (isPro) {
      toggleFavorite(hall);
    } else {
      openUpgradeModal("Shortlisting and Saving Favourite Halls");
    }
  };

  const handleWriteReviewPress = () => {
    if (!isAuthenticated) {
      openAuthModal("Signing in to write a review");
      return;
    }
    if (!isPro) {
      openUpgradeModal("Writing Customer Reviews & Ratings");
      return;
    }
    setReviewModalVisible(true);
  };

  const isCurrentSelectionBooked = isDateBookedSelected || bookedDatesList.includes(selectedCalendarDate);
  const pricing = hall.pricing_breakdown || {
    base_rent_per_day: hall.price_per_day,
    advance_booking_deposit: Math.round(hall.price_per_day * 0.2),
    cleaning_and_maintenance: Math.round(hall.price_per_day * 0.05),
    gst_percentage: 18,
    approx_total_per_day: Math.round((hall.price_per_day + Math.round(hall.price_per_day * 0.05)) * 1.18),
  };
  const reviewsList = reviewsData?.reviews || [];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        {/* Photo Gallery Carousel */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const index = Math.round(x / SCREEN_WIDTH);
              setActivePhotoIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {photos.map((photoUrl, idx) => (
              <Pressable
                key={photoUrl + idx}
                testID={`hall-gallery-photo-${idx}`}
                onPress={() => setFullscreenPhoto(photoUrl)}
              >
                <Image
                  source={{ uri: photoUrl }}
                  style={{ width: SCREEN_WIDTH, height: 280 }}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </ScrollView>

          {/* Top Controls */}
          <View
            style={[
              styles.galleryNavOverlay,
              { top: Math.max(insets.top, 16) },
            ]}
          >
            <Pressable
              testID="hall-details-back-btn"
              style={styles.roundIconBtn}
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.topRightBtns}>
              <Pressable
                testID={`hall-details-favorite-btn-${hall.id}`}
                style={[styles.roundIconBtn, favorited && styles.roundIconBtnActive]}
                onPress={handleFavoritePress}
              >
                <Heart
                  size={18}
                  color={favorited ? "#EF4444" : "#FFFFFF"}
                  fill={favorited ? "#EF4444" : "transparent"}
                />
              </Pressable>
            </View>
          </View>

          {/* Photo Indicators */}
          {photos.length > 1 && (
            <View style={styles.dotsRow}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    activePhotoIndex === i && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Pincode & City Tag */}
          <View style={styles.pincodeTag}>
            <MapPin size={12} color={colors.onBrandPrimary} />
            <Text style={styles.pincodeTagText}>
              PIN: {hall.pincode} • {hall.city}
            </Text>
          </View>
        </View>

        {/* Main Content Body */}
        <View style={styles.contentBody}>
          {/* Header Title Section */}
          <View style={styles.headerBlock}>
            <Text style={styles.hallName}>{hall.name}</Text>
            <Text style={styles.tagline}>{hall.tagline}</Text>

            {/* Address & Google Maps */}
            <View style={styles.locationBlock}>
              <View style={styles.locationRow}>
                <MapPin size={16} color={colors.brandPrimary} style={{ marginTop: 2 }} />
                <Text style={styles.addressText}>{hall.full_address}</Text>
              </View>

              <Pressable
                testID="open-google-maps-btn"
                style={styles.googleMapsBtn}
                onPress={handleOpenGoogleMaps}
              >
                <Navigation size={14} color={colors.brandPrimary} />
                <Text style={styles.googleMapsBtnText}>Open in Google Maps</Text>
              </Pressable>
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingNum}>{hall.rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({hall.reviews_count} Verified Reviews)</Text>
              </View>
            </View>
          </View>

          {/* Specifications Grid */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Hall Specifications</Text>
            <View style={styles.specCardsGrid}>
              <View style={styles.specCard}>
                <View style={styles.specCardIcon}>
                  <Users size={20} color={colors.brandPrimary} />
                </View>
                <Text style={styles.specCardVal}>{hall.seating_capacity}</Text>
                <Text style={styles.specCardLabel}>Seating Capacity</Text>
              </View>

              <View style={styles.specCard}>
                <View style={styles.specCardIcon}>
                  <Utensils size={20} color={colors.brandPrimary} />
                </View>
                <Text style={styles.specCardVal}>{hall.food_capacity}</Text>
                <Text style={styles.specCardLabel}>Dining Capacity</Text>
              </View>

              <View style={styles.specCard}>
                <View style={styles.specCardIcon}>
                  <Car size={20} color={colors.brandPrimary} />
                </View>
                <Text style={styles.specCardVal}>{hall.parking_available ? "Valet" : "Limited"}</Text>
                <Text style={styles.specCardLabel}>Parking</Text>
              </View>

              <View style={styles.specCard}>
                <View style={styles.specCardIcon}>
                  <Zap size={20} color={colors.brandPrimary} />
                </View>
                <Text style={styles.specCardVal}>{hall.generator_backup ? "100% DG" : "Standard"}</Text>
                <Text style={styles.specCardLabel}>Power Backup</Text>
              </View>
            </View>

            <View style={styles.specDetailBanner}>
              <Car size={16} color={colors.brandPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.specDetailBannerTitle}>Parking Facility</Text>
                <Text style={styles.specDetailBannerText}>{hall.parking_capacity}</Text>
              </View>
            </View>

            <View style={styles.specDetailBanner}>
              <Zap size={16} color={colors.brandPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.specDetailBannerTitle}>Generator Specs</Text>
                <Text style={styles.specDetailBannerText}>{hall.generator_details}</Text>
              </View>
            </View>
          </View>

          {/* PER-DAY PRICING BREAKDOWN (PRO TIER FEATURE) */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleWithBadge}>
              <Text style={styles.sectionHeading}>Per-Day Pricing Breakdown</Text>
              {isPro ? (
                <View style={styles.proUnlockedPill}>
                  <Check size={11} color={colors.onBrandPrimary} />
                  <Text style={styles.proUnlockedText}>PRO UNLOCKED</Text>
                </View>
              ) : null}
            </View>

            {isPro && pricing ? (
              <View style={styles.pricingCard} testID="pro-pricing-breakdown-card">
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Base Hall Rent (per day)</Text>
                  <Text style={styles.pricingVal}>₹{pricing.base_rent_per_day.toLocaleString()}</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Advance Booking Deposit</Text>
                  <Text style={styles.pricingVal}>₹{pricing.advance_booking_deposit.toLocaleString()}</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Cleaning & Maintenance</Text>
                  <Text style={styles.pricingVal}>₹{pricing.cleaning_and_maintenance.toLocaleString()}</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>GST & Service Tax ({pricing.gst_percentage}%)</Text>
                  <Text style={styles.pricingVal}>
                    ₹{(Math.round((pricing.base_rent_per_day + pricing.cleaning_and_maintenance) * (pricing.gst_percentage / 100))).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.pricingTotalRow}>
                  <Text style={styles.pricingTotalLabel}>Estimated Total / Day</Text>
                  <Text style={styles.pricingTotalVal}>₹{pricing.approx_total_per_day.toLocaleString()}</Text>
                </View>
              </View>
            ) : (
              <LockedFeatureTeaser
                title="Exact Pricing & Cost Breakdown"
                description="Unlock Pro to view base rent tariffs, advance booking deposit requirements, cleaning charges, and tax breakdowns."
                featureKey="pricing"
              />
            )}
          </View>

          {/* REAL-TIME AVAILABILITY CALENDAR (PRO TIER FEATURE) */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleWithBadge}>
              <Text style={styles.sectionHeading}>Real-Time Availability Calendar</Text>
              {isPro ? (
                <View style={styles.proUnlockedPill}>
                  <Check size={11} color={colors.onBrandPrimary} />
                  <Text style={styles.proUnlockedText}>PRO UNLOCKED</Text>
                </View>
              ) : null}
            </View>

            {isPro ? (
              <View testID="pro-calendar-active-section">
                <Text style={styles.sectionSubheading}>
                  Live sync with MongoDB • Green = Open, Red = Booked
                </Text>

                {bookedWarningMsg && (
                  <View style={styles.bookedWarningBox} testID="booked-date-warning">
                    <AlertTriangle size={16} color={colors.error} />
                    <Text style={styles.bookedWarningText}>{bookedWarningMsg}</Text>
                  </View>
                )}

                <AvailabilityCalendar
                  bookedDates={bookedDatesList}
                  selectedDate={selectedCalendarDate}
                  onSelectDate={handleCalendarDateSelect}
                  hallName={hall.name}
                />

                <Pressable
                  testID="calendar-open-enquiry-btn"
                  style={[
                    styles.calendarEnquireAction,
                    isCurrentSelectionBooked && styles.calendarEnquireActionDisabled,
                  ]}
                  onPress={handleOpenEnquiryModal}
                >
                  <CalendarCheck size={18} color={colors.onBrandPrimary} />
                  <Text style={styles.calendarEnquireActionText}>
                    {isCurrentSelectionBooked
                      ? `Date ${selectedCalendarDate} is Booked (Select Open Date)`
                      : `Enquire for Selected Date (${selectedCalendarDate})`}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <LockedFeatureTeaser
                title="Live Date Availability Calendar"
                description="Unlock Pro to access the real-time calendar showing booked dates in red and open auspicious dates in green with 1-tap booking."
                featureKey="calendar"
              />
            )}
          </View>

          {/* Description */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>About this Convention Hall</Text>
            <Text style={styles.descriptionText}>{hall.description}</Text>
          </View>

          {/* Amenities */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Included Amenities</Text>
            <View style={styles.amenitiesList}>
              {hall.amenities.map((amenity, idx) => (
                <View key={idx} style={styles.amenityItem}>
                  <CheckCircle size={15} color={colors.success} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Policies */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Venue & Catering Policies</Text>
            <View style={styles.policyCard}>
              <Text style={styles.policyTitle}>Catering Policy</Text>
              <Text style={styles.policyText}>{hall.catering_policy}</Text>

              <Text style={[styles.policyTitle, { marginTop: 10 }]}>
                Rooms Included
              </Text>
              <Text style={styles.policyText}>
                {hall.rooms_count} Furnished Air-Conditioned Bridal & Family Rooms
              </Text>
            </View>
          </View>

          {/* DIRECT OWNER CONTACT (PRO TIER FEATURE) */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleWithBadge}>
              <Text style={styles.sectionHeading}>Direct Owner & Manager Contact</Text>
              {isPro ? (
                <View style={styles.proUnlockedPill}>
                  <Check size={11} color={colors.onBrandPrimary} />
                  <Text style={styles.proUnlockedText}>PRO UNLOCKED</Text>
                </View>
              ) : null}
            </View>

            {isPro ? (
              <View style={styles.contactCard} testID="pro-contacts-card">
                <Pressable
                  testID="hall-call-phone-btn"
                  style={styles.contactActionBtn}
                  onPress={handleCallVenue}
                >
                  <Phone size={16} color={colors.onBrandPrimary} />
                  <Text style={styles.contactActionBtnText}>
                    Call Owner: {hall.contact_phone}
                  </Text>
                </Pressable>

                {hall.manager_phone && (
                  <Pressable
                    testID="hall-call-manager-btn"
                    style={styles.contactActionSecondaryBtn}
                    onPress={handleCallManager}
                  >
                    <Phone size={15} color={colors.brandPrimary} />
                    <Text style={styles.contactActionSecondaryText}>
                      Call Manager: {hall.manager_phone}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  testID="hall-whatsapp-btn"
                  style={styles.whatsappBtn}
                  onPress={handleWhatsAppVenue}
                >
                  <MessageSquare size={16} color="#FFFFFF" />
                  <Text style={styles.whatsappBtnText}>Chat on WhatsApp</Text>
                </Pressable>
              </View>
            ) : (
              <LockedFeatureTeaser
                title="Direct Owner & Manager Phone Numbers"
                description="Unlock Pro to directly call venue owners, talk with banquet managers, and start WhatsApp chats."
                featureKey="contacts"
              />
            )}
          </View>

          {/* REVIEWS & RATINGS SECTION */}
          <View style={styles.sectionBlock} testID="hall-reviews-section">
            <View style={styles.sectionTitleWithBadge}>
              <Text style={styles.sectionHeading}>Customer Reviews & Ratings</Text>
              <Pressable
                testID="write-review-btn"
                style={styles.writeReviewHeaderBtn}
                onPress={handleWriteReviewPress}
              >
                <Star size={13} color={colors.onBrandPrimary} fill={colors.onBrandPrimary} />
                <Text style={styles.writeReviewBtnText}>Write a Review</Text>
              </Pressable>
            </View>

            <View style={styles.reviewSummaryCard}>
              <View style={styles.scoreBox}>
                <Text style={styles.bigScoreText}>{reviewsData?.average_rating || hall.rating.toFixed(1)}</Text>
                <View style={styles.summaryStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} color="#F59E0B" fill="#F59E0B" />
                  ))}
                </View>
                <Text style={styles.reviewCountSub}>
                  {reviewsData?.total_reviews || hall.reviews_count} verified reviews
                </Text>
              </View>

              <View style={styles.proReviewNotice}>
                <Crown size={14} color={colors.brandPrimary} />
                <Text style={styles.proReviewNoticeText}>
                  {isPro
                    ? "Pro Member: You can leave a star rating and verified review."
                    : "Free Tier: You can read reviews. Unlock Pro or code GT011103 to write a review."}
                </Text>
              </View>
            </View>

            {reviewsList.map((rev) => (
              <View
                key={rev.id || rev.title}
                style={styles.reviewItemCard}
                testID={`customer-review-${rev.id || rev.title}`}
              >
                <View style={styles.reviewItemHeader}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        color={s <= rev.rating ? "#F59E0B" : colors.border}
                        fill={s <= rev.rating ? "#F59E0B" : "transparent"}
                      />
                    ))}
                    <Text style={styles.ratingDigit}>{rev.rating}.0</Text>
                  </View>
                  <View style={styles.verifiedTag}>
                    <CheckCircle size={10} color={colors.success} />
                    <Text style={styles.verifiedTagText}>Verified</Text>
                  </View>
                </View>

                <Text style={styles.reviewItemTitle}>{rev.title}</Text>
                <Text style={styles.reviewItemComment}>{rev.comment}</Text>

                {rev.owner_reply && (
                  <View style={styles.ownerReplyPreview}>
                    <Text style={styles.ownerReplyPreviewTitle}>Venue Owner Reply:</Text>
                    <Text style={styles.ownerReplyPreviewText}>{rev.owner_reply.reply}</Text>
                  </View>
                )}

                <View style={styles.reviewFooter}>
                  <Text style={styles.reviewerMetaName}>{rev.reviewer_name}</Text>
                  <Text style={styles.reviewerEventType}>{rev.event_type || "Wedding Event"}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Booking Bar */}
      <View
        testID="hall-sticky-bottom-bar"
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        {isPro ? (
          <>
            <View style={styles.stickyPriceInfo}>
              <Text style={styles.stickyPriceLabel}>Rent per Day</Text>
              <Text style={styles.stickyPriceVal}>
                ₹{(hall.price_per_day / 100000).toFixed(1)} Lakh
              </Text>
            </View>

            <View style={styles.bottomButtonsRow}>
              <Pressable
                testID="hall-bottom-instant-reserve-btn"
                style={styles.instantReserveBtn}
                onPress={handleOpenInstantBooking}
              >
                <CreditCard size={15} color={colors.onBrandPrimary} />
                <Text style={styles.instantReserveBtnText}>Instant Reserve</Text>
              </Pressable>

              <Pressable
                testID="hall-bottom-enquire-now-btn"
                style={[
                  styles.stickyBookBtn,
                  isCurrentSelectionBooked && styles.stickyBookBtnDisabled,
                ]}
                onPress={handleOpenEnquiryModal}
              >
                <CalendarCheck size={16} color={colors.onBrandPrimary} />
                <Text style={styles.stickyBookBtnText}>Enquire</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.stickyPriceInfo}>
              <Text style={styles.stickyPriceLabel}>Access Tier</Text>
              <Text style={styles.stickyFreeLabel}>Free Tier</Text>
            </View>

            <Pressable
              testID="hall-bottom-enquire-now-btn"
              style={styles.stickyUnlockProBtn}
              onPress={() => openUpgradeModal("Booking Enquiries & Live Availability")}
            >
              <Crown size={16} color={colors.onBrandPrimary} fill={colors.onBrandPrimary} />
              <Text style={styles.stickyUnlockProBtnText}>Unlock Pro to Book</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Enquiry Modal */}
      <BookingModal
        visible={bookingModalVisible}
        hall={hall}
        initialDate={selectedCalendarDate}
        onClose={() => setBookingModalVisible(false)}
      />

      {/* Instant Reservation Modal */}
      <InstantBookingModal
        visible={instantBookingModalVisible}
        hall={hall}
        initialDate={selectedCalendarDate}
        onClose={() => setInstantBookingModalVisible(false)}
      />

      {/* Write Review Modal */}
      <ReviewModal
        visible={reviewModalVisible}
        hallId={hall.id}
        hallName={hall.name}
        onClose={() => setReviewModalVisible(false)}
      />

      {/* Fullscreen Photo */}
      <Modal
        visible={!!fullscreenPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenPhoto(null)}
      >
        <View style={styles.fullscreenModal}>
          <Pressable
            testID="close-fullscreen-photo-btn"
            style={[
              styles.closeFullscreenBtn,
              { top: Math.max(insets.top, 20) },
            ]}
            onPress={() => setFullscreenPhoto(null)}
          >
            <X size={24} color="#FFFFFF" />
          </Pressable>
          {fullscreenPhoto && (
            <Image
              source={{ uri: fullscreenPhoto }}
              style={styles.fullscreenImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.muted,
  },
  errorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: colors.surface,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    marginVertical: 10,
  },
  backButton: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  backButtonText: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  galleryContainer: {
    position: "relative",
    backgroundColor: "#000",
  },
  galleryNavOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roundIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(12, 14, 18, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roundIconBtnActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  topRightBtns: {
    flexDirection: "row",
    gap: 10,
  },
  dotsRow: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.brandPrimary,
  },
  pincodeTag: {
    position: "absolute",
    bottom: 12,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pincodeTagText: {
    color: colors.onBrandPrimary,
    fontSize: 11,
    fontWeight: "800",
  },
  contentBody: {
    padding: 16,
  },
  headerBlock: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 16,
    marginBottom: 16,
  },
  hallName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13.5,
    color: colors.onSurfaceSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  locationBlock: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  addressText: {
    fontSize: 13,
    color: colors.onSurface,
    flex: 1,
    lineHeight: 18,
  },
  googleMapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surfaceTertiary,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleMapsBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  ratingNum: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurface,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.muted,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionTitleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  proUnlockedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proUnlockedText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.onBrandPrimary,
    letterSpacing: 0.5,
  },
  sectionSubheading: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 12,
  },
  pricingCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pricingLabel: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
  },
  pricingVal: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurface,
  },
  pricingTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    marginTop: 4,
  },
  pricingTotalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  pricingTotalVal: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  specCardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
    marginTop: 6,
  },
  specCard: {
    width: "48%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  specCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specCardVal: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
  },
  specCardLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  specDetailBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specDetailBannerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: 2,
  },
  specDetailBannerText: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    lineHeight: 17,
  },
  bookedWarningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(211, 47, 47, 0.15)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)",
  },
  bookedWarningText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: "600",
    flex: 1,
  },
  calendarEnquireAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  calendarEnquireActionDisabled: {
    backgroundColor: colors.surfaceTertiary,
    opacity: 0.8,
  },
  calendarEnquireActionText: {
    color: colors.onBrandPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  descriptionText: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
    lineHeight: 20,
    marginTop: 6,
  },
  amenitiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    width: "48%",
  },
  amenityText: {
    fontSize: 12,
    color: colors.onSurface,
    flex: 1,
  },
  policyCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginBottom: 2,
  },
  policyText: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    lineHeight: 17,
  },
  contactCard: {
    gap: 10,
    marginTop: 6,
  },
  contactActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  contactActionBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  contactActionSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  contactActionSecondaryText: {
    color: colors.brandPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    paddingVertical: 11,
    borderRadius: 10,
  },
  whatsappBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  stickyBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  stickyPriceInfo: {},
  stickyPriceLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  stickyPriceVal: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  stickyFreeLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  instantReserveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
  },
  instantReserveBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 12.5,
    fontWeight: "800",
  },
  stickyBookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
  },
  stickyBookBtnDisabled: {
    backgroundColor: colors.surfaceSecondary,
    opacity: 0.8,
  },
  stickyBookBtnText: {
    color: colors.onSurface,
    fontSize: 12.5,
    fontWeight: "700",
  },
  stickyUnlockProBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  stickyUnlockProBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 13.5,
    fontWeight: "800",
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeFullscreenBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "80%",
  },
  writeReviewHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  writeReviewBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  reviewSummaryCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  scoreBox: {
    alignItems: "center",
    marginBottom: 8,
  },
  bigScoreText: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.brandPrimary,
  },
  summaryStarsRow: {
    flexDirection: "row",
    gap: 4,
    marginVertical: 4,
  },
  reviewCountSub: {
    fontSize: 11.5,
    color: colors.muted,
  },
  proReviewNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  proReviewNoticeText: {
    fontSize: 11,
    color: colors.brandPrimary,
    fontWeight: "600",
    textAlign: "center",
  },
  reviewItemCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingDigit: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F59E0B",
    marginLeft: 4,
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(46, 125, 50, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.success,
  },
  reviewItemTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: 3,
  },
  reviewItemComment: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  ownerReplyPreview: {
    backgroundColor: colors.surfaceTertiary,
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.brandPrimary,
    marginBottom: 8,
  },
  ownerReplyPreviewTitle: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  ownerReplyPreviewText: {
    fontSize: 11.5,
    color: colors.onSurface,
    marginTop: 2,
  },
  reviewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 6,
  },
  reviewerMetaName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.onSurface,
  },
  reviewerEventType: {
    fontSize: 11,
    color: colors.muted,
  },
}));
