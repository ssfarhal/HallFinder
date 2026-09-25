import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X, PlusCircle, CheckCircle, AlertCircle } from "lucide-react-native";
import { createHall } from "../api";
import { useTheme, makeStyles } from "../theme";
import { useQueryClient } from "@tanstack/react-query";

interface AddHallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddHallModal: React.FC<AddHallModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [pincode, setPincode] = useState("560001");
  const [area, setArea] = useState("Indiranagar");
  const [city, setCity] = useState("Bangalore");
  const [fullAddress, setFullAddress] = useState("");
  const [pricePerDay, setPricePerDay] = useState("200000");
  const [seatingCapacity, setSeatingCapacity] = useState("1000");
  const [foodCapacity, setFoodCapacity] = useState("500");
  const [contactPhone, setContactPhone] = useState("+91 98450 12345");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!name.trim() || !pincode.trim() || !city.trim() || !pricePerDay.trim()) {
      setErrorMsg("Please fill in Hall Name, Pincode, City, and Price per Day.");
      return;
    }

    try {
      setSubmitting(true);
      await createHall({
        name: name.trim(),
        tagline: tagline.trim() || "Premier Luxury Convention & Wedding Hall",
        pincode: pincode.trim(),
        area: area.trim() || city.trim(),
        city: city.trim(),
        state: "Karnataka",
        full_address: fullAddress.trim() || `${area}, ${city} - ${pincode}`,
        description: description.trim() || `${name} offers grand air-conditioned luxury hall space with top notch acoustics, ample valet parking, and 100% DG generator backup.`,
        price_per_day: parseInt(pricePerDay, 10) || 200000,
        seating_capacity: parseInt(seatingCapacity, 10) || 1000,
        food_capacity: parseInt(foodCapacity, 10) || 500,
        contact_phone: contactPhone.trim() || "+91 98450 12345",
        contact_email: "owner@conventioncenter.com",
        parking_capacity: "200+ Cars with Valet",
        generator_details: "100% 250 kVA Soundproof DG Set",
        generator_backup: true,
        parking_available: true,
        ac_available: true,
        rooms_count: 6,
        catering_policy: "In-house & Outside Caterers Allowed",
        amenities: ["Central AC", "250 kVA DG Backup", "Valet Parking", "6 AC Rooms", "Dining Hall", "Audio Lighting"],
        photos: [
          "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        ],
        event_types: ["Wedding", "Reception", "Engagement", "Corporate", "Cultural"],
        featured: false,
      });

      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["halls"] });
      queryClient.invalidateQueries({ queryKey: ["pincodes"] });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create hall listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setErrorMsg(null);
    onClose();
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
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Add New Convention Hall</Text>
              <Text style={styles.headerSubtitle}>Owner self-listing into HallFinder database</Text>
            </View>
            <Pressable testID="close-add-hall-modal-btn" style={styles.closeBtn} onPress={handleClose}>
              <X size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          {success ? (
            <View style={styles.successBox} testID="add-hall-success-view">
              <CheckCircle size={48} color={colors.success} />
              <Text style={styles.successTitle}>Hall Created & Published!</Text>
              <Text style={styles.successSub}>
                Your convention hall has been saved in MongoDB and is now discoverable by pincode search.
              </Text>
              <Pressable testID="done-add-hall-btn" style={styles.submitBtn} onPress={handleClose}>
                <Text style={styles.submitBtnText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {errorMsg && (
                <View style={styles.errorBox}>
                  <AlertCircle size={15} color={colors.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hall Name *</Text>
                <TextInput
                  testID="new-hall-name-input"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Royal Crystal Palace"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tagline / Subtitle</Text>
                <TextInput
                  testID="new-hall-tagline-input"
                  style={styles.input}
                  value={tagline}
                  onChangeText={setTagline}
                  placeholder="e.g. Luxurious Grand Ballroom for Weddings"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Pincode *</Text>
                  <TextInput
                    testID="new-hall-pincode-input"
                    style={styles.input}
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="560001"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TextInput
                    testID="new-hall-city-input"
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Bangalore"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Area / Locality</Text>
                <TextInput
                  testID="new-hall-area-input"
                  style={styles.input}
                  value={area}
                  onChangeText={setArea}
                  placeholder="e.g. Indiranagar / MG Road"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price per Day (INR) *</Text>
                <TextInput
                  testID="new-hall-price-input"
                  style={styles.input}
                  value={pricePerDay}
                  onChangeText={setPricePerDay}
                  keyboardType="number-pad"
                  placeholder="200000"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Seating Capacity</Text>
                  <TextInput
                    testID="new-hall-seating-input"
                    style={styles.input}
                    value={seatingCapacity}
                    onChangeText={setSeatingCapacity}
                    keyboardType="number-pad"
                    placeholder="1000"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Dining Capacity</Text>
                  <TextInput
                    testID="new-hall-dining-input"
                    style={styles.input}
                    value={foodCapacity}
                    onChangeText={setFoodCapacity}
                    keyboardType="number-pad"
                    placeholder="500"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Owner Contact Phone</Text>
                <TextInput
                  testID="new-hall-phone-input"
                  style={styles.input}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="+91 98450 12345"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Address & Landmarks</Text>
                <TextInput
                  testID="new-hall-address-input"
                  style={[styles.input, { height: 60, textAlignVertical: "top" }]}
                  value={fullAddress}
                  onChangeText={setFullAddress}
                  placeholder="Complete street address..."
                  placeholderTextColor={colors.muted}
                  multiline
                />
              </View>

              <Pressable
                testID="submit-new-hall-btn"
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onBrandPrimary} size="small" />
                ) : (
                  <>
                    <PlusCircle size={18} color={colors.onBrandPrimary} />
                    <Text style={styles.submitBtnText}>Publish Convention Hall</Text>
                  </>
                )}
              </Pressable>
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
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "94%",
    paddingBottom: 20,
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
    fontSize: 17,
    fontWeight: "700",
    color: colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 11.5,
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
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: colors.onSurface,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    height: 48,
    borderRadius: 12,
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  successBox: {
    padding: 30,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
}));
