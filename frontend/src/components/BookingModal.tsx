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
  Building2,
  Phone,
  Mail,
  User,
  FileText,
  Utensils,
  AlertCircle,
} from "lucide-react-native";
import { Hall, BookingEnquiryPayload } from "../types";
import { createBookingEnquiry } from "../api";
import { useTheme, makeStyles } from "../theme";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

interface BookingModalProps {
  visible: boolean;
  hall: Hall | null;
  initialDate?: string;
  onClose: () => void;
  onSuccess?: (referenceId: string) => void;
}

const EVENT_TYPES = [
  "Wedding",
  "Reception",
  "Engagement",
  "Birthday Celebration",
  "Corporate Event",
  "Cultural & Hall Event",
];

const GUEST_PRESETS = [200, 500, 800, 1200, 2000];

export const BookingModal: React.FC<BookingModalProps> = ({
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

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || "2026-10-15"
  );
  const [eventType, setEventType] = useState<string>("Wedding");
  const [guestCount, setGuestCount] = useState<number>(500);
  const [foodPreference, setFoodPreference] = useState<string>("Veg Only");
  const [customerName, setCustomerName] = useState<string>(user?.name || "Arjun Sharma");
  const [customerPhone, setCustomerPhone] = useState<string>("9845012345");
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || "arjun.sharma@example.com");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successRefId, setSuccessRefId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  React.useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  if (!hall) return null;

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage("Please enter your full name");
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    if (!selectedDate) {
      setErrorMessage("Please choose an event date");
      return;
    }

    const bookedDates = hall.booked_dates || [];
    if (bookedDates.includes(selectedDate)) {
      setErrorMessage(`The date ${selectedDate} is already booked for this hall. Please pick an open green date.`);
      return;
    }

    try {
      setSubmitting(true);
      const payload: BookingEnquiryPayload = {
        hall_id: hall.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        event_type: eventType,
        event_date: selectedDate,
        guest_count: guestCount,
        food_preference: foodPreference,
        additional_notes: notes.trim(),
      };

      const res = await createBookingEnquiry(payload);
      setSuccessRefId(res.reference_id);
      queryClient.invalidateQueries({ queryKey: ["halls"] });
      queryClient.invalidateQueries({ queryKey: ["hall", hall.id] });
      queryClient.invalidateQueries({ queryKey: ["availability", hall.id] });
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });

      if (onSuccess) {
        onSuccess(res.reference_id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit booking enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessRefId(null);
    setErrorMessage(null);
    onClose();
  };

  const handleDoneAndViewEnquiries = () => {
    setSuccessRefId(null);
    setErrorMessage(null);
    onClose();
    router.push("/(tabs)/enquiries");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleResetAndClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Send Booking Enquiry</Text>
              <Text style={styles.headerSubtitle}>
                Syncs with {hall.name} availability
              </Text>
            </View>
            <Pressable
              testID="close-booking-modal-btn"
              style={styles.closeBtn}
              onPress={handleResetAndClose}
            >
              <X size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          {successRefId ? (
            <View testID="booking-success-view" style={styles.successView}>
              <View style={styles.successIconBox}>
                <CheckCircle size={44} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Booking Enquiry Sent!</Text>
              <Text style={styles.successSubtitle}>
                Your enquiry has been registered in MongoDB and forwarded to the venue manager.
              </Text>

              <View style={styles.refCard}>
                <Text style={styles.refLabel}>REFERENCE NUMBER</Text>
                <Text style={styles.refValue}>{successRefId}</Text>
                <Text style={styles.refDetail}>
                  Event: {eventType} on {selectedDate} ({guestCount} Guests)
                </Text>
                <Text style={styles.refVenue}>{hall.name}</Text>
              </View>

              <Pressable
                testID="done-booking-btn"
                style={styles.primaryBtn}
                onPress={handleDoneAndViewEnquiries}
              >
                <Text style={styles.primaryBtnText}>Done & View Enquiries</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              testID="booking-form-scrollview"
            >
              <View style={styles.hallStrip}>
                <Image
                  source={{ uri: hall.photos[0] }}
                  style={styles.hallThumbnail}
                  contentFit="cover"
                />
                <View style={styles.hallStripInfo}>
                  <Text style={styles.hallStripName} numberOfLines={1}>
                    {hall.name}
                  </Text>
                  <Text style={styles.hallStripArea}>
                    PIN: {hall.pincode} • {hall.area}
                  </Text>
                  <Text style={styles.hallStripPrice}>
                    ₹{(hall.price_per_day / 100000).toFixed(1)} Lakh / day
                  </Text>
                </View>
              </View>

              {errorMessage && (
                <View style={styles.errorBanner} testID="booking-error-banner">
                  <AlertCircle size={16} color={colors.error} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {/* Event Date Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Date (YYYY-MM-DD) *</Text>
                <View style={styles.inputBox}>
                  <Calendar size={18} color={colors.brandPrimary} />
                  <TextInput
                    testID="booking-event-date-input"
                    style={styles.textInput}
                    value={selectedDate}
                    onChangeText={setSelectedDate}
                    placeholder="2026-10-15"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <Text style={styles.inputHelp}>
                  Selected date will be locked for enquiry review
                </Text>
              </View>

              {/* Event Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Type *</Text>
                <View style={styles.chipsRow}>
                  {EVENT_TYPES.map((type) => {
                    const isSelected = eventType === type;
                    return (
                      <Pressable
                        key={type}
                        testID={`event-type-chip-${type}`}
                        style={[
                          styles.eventChip,
                          isSelected && styles.eventChipSelected,
                        ]}
                        onPress={() => setEventType(type)}
                      >
                        <Text
                          style={[
                            styles.eventChipText,
                            isSelected && styles.eventChipTextSelected,
                          ]}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Guest Count Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Expected Guests ({guestCount} people)
                </Text>
                <View style={styles.chipsRow}>
                  {GUEST_PRESETS.map((preset) => (
                    <Pressable
                      key={preset}
                      testID={`guest-preset-${preset}`}
                      style={[
                        styles.presetChip,
                        guestCount === preset && styles.presetChipSelected,
                      ]}
                      onPress={() => setGuestCount(preset)}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          guestCount === preset && styles.presetChipTextSelected,
                        ]}
                      >
                        {preset}+
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Food Preference */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Food Preference</Text>
                <View style={styles.row}>
                  {["Veg Only", "Veg & Non-Veg"].map((pref) => (
                    <Pressable
                      key={pref}
                      testID={`food-pref-${pref}`}
                      style={[
                        styles.foodChip,
                        foodPreference === pref && styles.foodChipSelected,
                      ]}
                      onPress={() => setFoodPreference(pref)}
                    >
                      <Utensils
                        size={14}
                        color={
                          foodPreference === pref
                            ? colors.onBrandPrimary
                            : colors.onSurfaceSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.foodChipText,
                          foodPreference === pref && styles.foodChipTextSelected,
                        ]}
                      >
                        {pref}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Customer Contact Details */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Full Name *</Text>
                <View style={styles.inputBox}>
                  <User size={18} color={colors.brandPrimary} />
                  <TextInput
                    testID="customer-name-input"
                    style={styles.textInput}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="e.g. Ramesh Kumar"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
                <View style={styles.inputBox}>
                  <Phone size={18} color={colors.brandPrimary} />
                  <TextInput
                    testID="customer-phone-input"
                    style={styles.textInput}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    placeholder="e.g. 9845012345"
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <View style={styles.inputBox}>
                  <Mail size={18} color={colors.brandPrimary} />
                  <TextInput
                    testID="customer-email-input"
                    style={styles.textInput}
                    value={customerEmail}
                    onChangeText={setCustomerEmail}
                    placeholder="e.g. ramesh@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Special Requirements / Notes</Text>
                <View style={[styles.inputBox, styles.textAreaBox]}>
                  <FileText size={18} color={colors.muted} style={{ marginTop: 2 }} />
                  <TextInput
                    testID="customer-notes-input"
                    style={[styles.textInput, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Stage decoration, extra AC bridal rooms, catering assistance..."
                    placeholderTextColor={colors.muted}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              <Pressable
                testID="submit-booking-enquiry-btn"
                style={[styles.primaryBtn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onBrandPrimary} size="small" />
                ) : (
                  <>
                    <Building2 size={18} color={colors.onBrandPrimary} />
                    <Text style={styles.primaryBtnText}>
                      Send Booking Request to Venue
                    </Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.disclaimer}>
                By sending, your enquiry is saved in MongoDB. The venue manager will call you within 2 business hours.
              </Text>
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
  headerTitle: {
    fontSize: 18,
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
  hallStrip: {
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
  hallThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  hallStripInfo: {
    flex: 1,
  },
  hallStripName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  hallStripArea: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    marginTop: 2,
  },
  hallStripPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(211, 47, 47, 0.15)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)",
  },
  errorBannerText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurface,
    marginBottom: 6,
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
    height: 46,
  },
  textAreaBox: {
    height: 80,
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
  },
  textArea: {
    height: "100%",
    textAlignVertical: "top",
  },
  inputHelp: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  eventChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventChipSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  eventChipText: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
  },
  eventChipTextSelected: {
    color: colors.onBrandPrimary,
    fontWeight: "700",
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurfaceSecondary,
  },
  presetChipTextSelected: {
    color: colors.onBrandPrimary,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  foodChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodChipSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  foodChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.onSurfaceSecondary,
  },
  foodChipTextSelected: {
    color: colors.onBrandPrimary,
    fontWeight: "600",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    height: 50,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.onBrandPrimary,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 16,
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
    fontSize: 20,
    fontWeight: "700",
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
  refCard: {
    width: "100%",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  refLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 1,
  },
  refValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginVertical: 4,
  },
  refDetail: {
    fontSize: 12,
    color: colors.onSurface,
    fontWeight: "600",
    marginTop: 4,
  },
  refVenue: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
}));
