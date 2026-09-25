import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTheme, makeStyles } from "../theme";

export interface PincodeOption {
  pincode: string;
  city: string;
  area: string;
}

const POPULAR_PINCODES: PincodeOption[] = [
  { pincode: "560001", city: "Bangalore", area: "MG Road" },
  { pincode: "560034", city: "Bangalore", area: "Koramangala" },
  { pincode: "600001", city: "Chennai", area: "George Town" },
  { pincode: "400001", city: "Mumbai", area: "Colaba / Fort" },
  { pincode: "110001", city: "Delhi", area: "Connaught Place" },
  { pincode: "500081", city: "Hyderabad", area: "Hitec City" },
];

interface PincodeChipListProps {
  selectedPincode?: string;
  onSelectPincode: (pincode: string) => void;
  onClear?: () => void;
}

export const PincodeChipList: React.FC<PincodeChipListProps> = ({
  selectedPincode,
  onSelectPincode,
  onClear,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        testID="pincode-chips-row"
      >
        <Pressable
          testID="pincode-chip-all"
          style={[
            styles.chip,
            !selectedPincode && styles.chipSelected,
          ]}
          onPress={onClear}
        >
          <Text
            style={[
              styles.chipText,
              !selectedPincode && styles.chipTextSelected,
            ]}
          >
            All Cities
          </Text>
        </Pressable>

        {POPULAR_PINCODES.map((item) => {
          const isSelected = selectedPincode === item.pincode;
          return (
            <Pressable
              key={item.pincode}
              testID={`pincode-chip-${item.pincode}`}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => onSelectPincode(item.pincode)}
            >
              <MapPin
                size={12}
                color={isSelected ? colors.onBrandPrimary : colors.brandPrimary}
                style={styles.pinIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {item.pincode} • {item.city}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  wrapper: {
    height: 56,
    justifyContent: "center",
  },
  container: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  pinIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: "500",
    color: colors.onSurfaceSecondary,
  },
  chipTextSelected: {
    color: colors.onBrandPrimary,
    fontWeight: "700",
  },
}));
