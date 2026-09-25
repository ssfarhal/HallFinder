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
import {
  X,
  Star,
  CheckCircle,
  Sparkles,
  Crown,
  AlertCircle,
} from "lucide-react-native";
import { submitHallReview } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme, makeStyles } from "../theme";
import { useQueryClient } from "@tanstack/react-query";

interface ReviewModalProps {
  visible: boolean;
  hallId: string;
  hallName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const EVENT_TYPES = [
  "Wedding Reception",
  "Betrothal & Engagement",
  "Birthday Celebration",
  "Corporate Summit",
  "Family Function",
];

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  hallId,
  hallName,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [eventType, setEventType] = useState<string>("Wedding Reception");
  const [reviewerName, setReviewerName] = useState<string>(user?.name || "Arjun Sharma");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (user?.name) {
      setReviewerName(user.name);
    }
  }, [user]);

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!title.trim()) {
      setErrorMsg("Please provide a title for your review.");
      return;
    }
    if (!comment.trim() || comment.trim().length < 10) {
      setErrorMsg("Please write at least 10 characters describing your experience.");
      return;
    }

    try {
      setSubmitting(true);
      await submitHallReview(hallId, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        event_type: eventType,
        reviewer_name: reviewerName.trim() || "Verified Customer",
      });

      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["hallReviews", hallId] });
      queryClient.invalidateQueries({ queryKey: ["hall", hallId] });
      queryClient.invalidateQueries({ queryKey: ["halls"] });
      queryClient.invalidateQueries({ queryKey: ["adminReviews"] });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAndReset = () => {
    setSuccess(false);
    setErrorMsg(null);
    setTitle("");
    setComment("");
    setRating(5);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseAndReset}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.proPill}>
                <Crown size={12} color={colors.onBrandPrimary} fill={colors.onBrandPrimary} />
                <Text style={styles.proPillText}>PRO REVIEW</Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Review {hallName}
              </Text>
            </View>

            <Pressable
              testID="close-review-modal-btn"
              style={styles.closeBtn}
              onPress={handleCloseAndReset}
            >
              <X size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          {success ? (
            <View style={styles.successView} testID="review-submit-success-view">
              <View style={styles.successIconBox}>
                <CheckCircle size={44} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Review Published!</Text>
              <Text style={styles.successText}>
                Your verified {rating}-star review for {hallName} has been saved in MongoDB and updated the venue&apos;s overall rating.
              </Text>

              <Pressable
                testID="done-review-btn"
                style={styles.submitBtn}
                onPress={handleCloseAndReset}
              >
                <Text style={styles.submitBtnText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              testID="review-form-scrollview"
            >
              {errorMsg && (
                <View style={styles.errorBox} testID="review-error-banner">
                  <AlertCircle size={15} color={colors.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {/* Star Rating Picker (1 to 5) */}
              <View style={styles.ratingPickerSection}>
                <Text style={styles.inputLabel}>Select Your Rating (1-5 Stars) *</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <Pressable
                      key={starNum}
                      testID={`select-star-${starNum}`}
                      style={styles.starTouch}
                      onPress={() => setRating(starNum)}
                    >
                      <Star
                        size={32}
                        color={starNum <= rating ? "#F59E0B" : colors.border}
                        fill={starNum <= rating ? "#F59E0B" : "transparent"}
                      />
                    </Pressable>
                  ))}
                  <Text style={styles.ratingScoreText}>{rating}.0 / 5.0</Text>
                </View>
              </View>

              {/* Review Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Review Title *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    testID="review-title-input"
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Unforgettable Royal Experience!"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              {/* Event Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Hosted</Text>
                <View style={styles.chipsRow}>
                  {EVENT_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.chip,
                        eventType === type && styles.chipSelected,
                      ]}
                      onPress={() => setEventType(type)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          eventType === type && styles.chipTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Reviewer Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Name (Displayed on Review)</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    testID="review-name-input"
                    style={styles.input}
                    value={reviewerName}
                    onChangeText={setReviewerName}
                    placeholder="e.g. Arjun Sharma"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              {/* Written Review Comment */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Detailed Review & Feedback *</Text>
                <View style={[styles.inputBox, styles.textAreaBox]}>
                  <TextInput
                    testID="review-comment-input"
                    style={[styles.input, styles.textArea]}
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Share feedback on hall atmosphere, generator backup, dining area, AC, and parking..."
                    placeholderTextColor={colors.muted}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              <Pressable
                testID="submit-review-btn"
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onBrandPrimary} size="small" />
                ) : (
                  <>
                    <Sparkles size={16} color={colors.onBrandPrimary} />
                    <Text style={styles.submitBtnText}>Submit Pro Customer Review</Text>
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
    maxHeight: "92%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitleGroup: {
    flex: 1,
    gap: 4,
  },
  proPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  proPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.onBrandPrimary,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
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
    flex: 1,
  },
  ratingPickerSection: {
    backgroundColor: colors.surfaceSecondary,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  starTouch: {
    padding: 4,
  },
  ratingScoreText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
  },
  textAreaBox: {
    height: 90,
    paddingVertical: 8,
  },
  input: {
    fontSize: 13,
    color: colors.onSurface,
  },
  textArea: {
    height: "100%",
    textAlignVertical: "top",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  chipText: {
    fontSize: 11.5,
    color: colors.onSurfaceSecondary,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: colors.onBrandPrimary,
    fontWeight: "700",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brandPrimary,
    height: 48,
    borderRadius: 12,
    marginTop: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.onBrandPrimary,
    fontSize: 14,
    fontWeight: "700",
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
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.brandPrimary,
    marginBottom: 6,
  },
  successText: {
    fontSize: 13,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
}));
