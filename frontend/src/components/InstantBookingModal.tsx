import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  X,
  Calendar,
  CheckCircle,
  CreditCard,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  User,
  Sparkles,
  AlertCircle,
} from "lucide-react-native";
import { Hall, InstantBookingPayload } from "../types";
import { createInstantBooking } from "../api";
import { useTheme, makeStyles } from "../theme";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

interface InstantBookingModalProps {
  visible: boolean;
  hall: Hall | null;
  initialDate?: string;
  onClose: () => void;
  onSuccess?: (bookingRef: string) => void;
}

export const InstantBookingModal: React.FC<InstantBookingModalProps> = ({
  visible,
  hall,
  initialDate,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(initialDate || "2026-10-20");
  const [eventType, setEventType] = useState<string>("Wedding");
  const [guestCount, setGuestCount] = useState<number>(600);
  const [customerName, setCustomerName] = useState<string>(user?.name || "Arjun Sharma");
  const [customerPhone, setCustomerPhone] = useState<string>("9876543210");
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || "arjun.sharma@example.com");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBookingRef, setConfirmedBookingRef] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialDate) setSelectedDate(initialDate);
  }, [initialDate]);

  React.useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  if (!hall) return null;

  const depositRequired = hall.pricing_breakdown?.advance_booking_deposit || Math.round(hall.price_per_day * 0.2);

  const handleConfirmReservation = async () => {
    setErrorMessage(null);
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setErrorMessage("Please fill all contact details.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: InstantBookingPayload = {
        hall_id: hall.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        event_type: eventType,
        event_date: selectedDate,
        guest_count: guestCount,
        deposit_amount: depositRequired,
        food_preference: "Veg & Non-Veg",
      };

      const res = await createInstantBooking(payload);
      setConfirmedBookingRef(res.booking_reference);
      queryClient.invalidateQueries({ queryKey: ["halls"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["availability", hall.id] });

      if (onSuccess) {
        onSuccess(res.booking_reference);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Reservation could not be processed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmedBookingRef(null);
    setErrorMessage(null);
    onClose();
  };

  const handleViewBookings = () => {
    handleClose();
    router.push("/(tabs)/enquiries");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.headerTitle}>Instant Hall Reservation</Text>
                <Sparkles size={16} color={colors.brandPrimary} />
              </View>
              <Text style={styles.headerSubtitle}>
                Lock date with instant deposit payment
              </Text>
            </View>
            <Pressable
              testID="close-instant-booking-modal-btn"
              style={styles.closeBtn}
              onPress={handleClose}
            >
              <X size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          {confirmedBookingRef ? (
            <View testID="instant-booking-confirmed-view" style={styles.successView}>
              <View style={styles.successIconBox}>
                <CheckCircle size={44} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Reservation Confirmed & Paid!</Text>
              <Text style={styles.successSubtitle}>
                Your date {selectedDate} has been locked in MongoDB and your deposit receipt is confirmed.
              </Text>

              <View style={styles.receiptCard}>
                <Text style={styles.receiptRefLabel}>BOOKING REFERENCE</Text>
                <Text style={styles.receiptRefValue}>{confirmedBookingRef}</Text>
                <Text style={styles.receiptVenue}>{hall.name}</Text>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Deposit Paid:</Text>
                  <Text style={styles.receiptRowVal}>₹{depositRequired.toLocaleString()}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Status:</Text>
                  <Text style={[styles.receiptRowVal, { color: colors.success }]}>CONFIRMED</Text>
                </View>
              </View>

              <Pressable
                testID="done-instant-booking-btn"
                style={styles.primaryBtn}
                onPress={handleViewBookings}
              >
                <Text style={styles.primaryBtnText}>View in My Bookings</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              testID="instant-booking-form-scrollview"
            >
              <View style={styles.venueSummaryBox}>
                <Image
                  source={{ uri: hall.photos[0] }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.venueName} numberOfLines={1}>{hall.name}</Text>
                  <Text style={styles.venueLocation}>{hall.area}, {hall.city}</Text>
                  <Text style={styles.venuePrice}>Base Rent: ₹{(hall.price_per_day / 100000).toFixed(1)} Lakh/day</Text>
                </View>
              </View>

              {errorMessage && (
                <View style={styles.errorBox} testID="instant-booking-error-banner">
                  <AlertCircle size={15} color={colors.error} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Date & Guests */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reserved Event Date (YYYY-MM-DD) *</Text>
                <View style={styles.inputBox}>
                  <Calendar size={16} color={colors.brandPrimary} />
                  <TextInput
                    testID="instant-booking-date-input"
                    style={styles.input}
                    value={selectedDate}
                    onChangeText={setSelectedDate}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Type & Occasion</Text>
                <View style={styles.inputBox}>
                  <Building2 size={16} color={colors.brandPrimary} />
                  <TextInput
                    testID="instant-booking-event-type-input"
                    style={styles.input}
                    value={eventType}
                    onChangeText={setEventType}
                  />
                </View>
              </View>

              {/* Deposit Breakdown */}
              <View style={styles.depositBox}>
                <Text style={styles.depositBoxTitle}>Instant Reservation Deposit</Text>
                <View style={styles.depositRow}>
                  <Text style={styles.depositLabel}>Advance Booking Deposit (20%)</Text>
                  <Text style={styles.depositVal}>₹{depositRequired.toLocaleString()}</Text>
                </View>
                <View style={styles.depositRow}>
                  <Text style={styles.depositLabel}>Payment Gateway Charge</Text>
                  <Text style={styles.depositVal}>₹0 (Free)</Text>
                </View>
                <View style={styles.depositTotalRow}>
                  <Text style={styles.depositTotalLabel}>Pay Now to Lock Date</Text>
                  <Text style={styles.depositTotalVal}>₹{depositRequired.toLocaleString()}</Text>
                </View>
              </View>

              {/* Contact Details */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Name *</Text>
                <View style={styles.inputBox}>
                  <User size={16} color={colors.brandPrimary} />
                  <TextInput
                    testID="instant-booking-name-input"
                    style={styles.input}
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone *</Text>
                <View style={styles.inputBox}>
                  <Phone size={16} color={colors.brandPrimary} />
                  <TextInput
                    testID="instant-booking-phone-input"
                    style={styles.input}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <View style={styles.inputBox}>
                  <Mail size={16} color={colors.brandPrimary} />
                  <TextInput
                    testID="instant-booking-email-input"
                    style={styles.input}
                    value={customerEmail}
                    onChangeText={setCustomerEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* CTA */}
              <Pressable
                testID="confirm-instant-booking-btn"
                style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                onPress={handleConfirmReservation}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onBrandPrimary} size="small" />
                ) : (
                  <>
                    <CreditCard size={18} color={colors.onBrandPrimary} />
                    <Text style={styles.primaryBtnText}>
                      Pay ₹{depositRequired.toLocaleString()} & Reserve Date
                    </Text>
                  </>
                )}
              </Pressable>

              <View style={styles.securityRow}>
                <ShieldCheck size={14} color={colors.success} />
                <Text style={styles.securityText}>
                  Instant Booking Guarantee • 100% Refundable according to venue policy
                </Text>
              </View>
            </ScrollView>
          )}
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
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  venueSummaryBox: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  venueName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  venueLocation: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  venuePrice: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.success,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(211, 47, 47, 0.15)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)",
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.onSurface,
    marginBottom: 5,
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
  depositBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  depositBoxTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginBottom: 8,
  },
  depositRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  depositLabel: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
  },
  depositVal: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.onSurface,
  },
  depositTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
    marginTop: 6,
  },
  depositTotalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurface,
  },
  depositTotalVal: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.brandPrimary,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    height: 50,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.onBrandPrimary,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  securityText: {
    fontSize: 10.5,
    color: colors.muted,
    textAlign: "center",
  },
  successView: {
    padding: 24,
    alignItems: "center",
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(46, 125, 50, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  receiptCard: {
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  receiptRefLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
  },
  receiptRefValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginVertical: 4,
  },
  receiptVenue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurface,
    marginBottom: 8,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  receiptRowLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  receiptRowVal: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurface,
  },
}));
