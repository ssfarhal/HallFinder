import React from "react";
import { View, Text, Pressable } from "react-native";
import { Lock, Crown, Sparkles, ArrowRight } from "lucide-react-native";
import { usePro } from "../context/ProContext";
import { useTheme, makeStyles } from "../theme";

interface LockedFeatureTeaserProps {
  title: string;
  description: string;
  featureKey?: string;
  compact?: boolean;
}

export const LockedFeatureTeaser: React.FC<LockedFeatureTeaserProps> = ({
  title,
  description,
  featureKey = "pro_feature",
  compact = false,
}) => {
  const { openUpgradeModal } = usePro();
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View
      testID={`locked-teaser-${featureKey}`}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <View style={styles.topRow}>
        <View style={styles.lockBadge}>
          <Lock size={16} color={colors.brandPrimary} />
        </View>
        <View style={styles.proTag}>
          <Crown size={12} color={colors.onBrandPrimary} fill={colors.onBrandPrimary} />
          <Text style={styles.proTagText}>PRO ONLY</Text>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <Pressable
        testID={`unlock-pro-btn-${featureKey}`}
        style={styles.unlockBtn}
        onPress={() => openUpgradeModal(title)}
      >
        <Sparkles size={14} color={colors.onBrandPrimary} />
        <Text style={styles.unlockBtnText}>Unlock Pro (From ₹42/mo or Code GT011103)</Text>
        <ArrowRight size={14} color={colors.onBrandPrimary} />
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: "#FDF8F8",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "rgba(107, 28, 47, 0.25)",
    borderStyle: "dashed",
    marginVertical: 10,
    alignItems: "flex-start",
  },
  cardCompact: {
    padding: 12,
    marginVertical: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  lockBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  proTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  proTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brandPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: colors.onSurfaceSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: "stretch",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  unlockBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
}));
