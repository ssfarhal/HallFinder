import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
} from "react-native";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Info, Calendar as CalendarIcon } from "lucide-react-native";
import { useTheme, makeStyles } from "../theme";

interface AvailabilityCalendarProps {
  bookedDates: string[]; // list of "YYYY-MM-DD"
  selectedDate?: string;
  onSelectDate: (dateStr: string, isBooked: boolean) => void;
  hallName?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  bookedDates = [],
  selectedDate,
  onSelectDate,
}) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const initialDateObj = selectedDate ? new Date(selectedDate) : new Date();
  const [currentYear, setCurrentYear] = useState(
    isNaN(initialDateObj.getFullYear()) ? 2026 : initialDateObj.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    isNaN(initialDateObj.getMonth()) ? 8 : initialDateObj.getMonth()
  );

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const bookedSet = new Set(bookedDates);

  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const daysGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push({ empty: true, key: `empty-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateString(currentYear, currentMonth, day);
    const isBooked = bookedSet.has(dateStr);
    const isSelected = selectedDate === dateStr;
    daysGrid.push({
      empty: false,
      day,
      dateStr,
      isBooked,
      isSelected,
      key: dateStr,
    });
  }

  let monthBookedCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = formatDateString(currentYear, currentMonth, d);
    if (bookedSet.has(dStr)) monthBookedCount++;
  }
  const monthAvailableCount = daysInMonth - monthBookedCount;

  return (
    <View testID="hall-availability-calendar" style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <CalendarIcon size={18} color={colors.brandPrimary} />
          <Text style={styles.headerTitle}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
        </View>

        <View style={styles.navControls}>
          <Pressable
            testID="calendar-prev-month-btn"
            style={styles.navBtn}
            onPress={handlePrevMonth}
            hitSlop={8}
          >
            <ChevronLeft size={18} color={colors.onSurface} />
          </Pressable>
          <Pressable
            testID="calendar-next-month-btn"
            style={styles.navBtn}
            onPress={handleNextMonth}
            hitSlop={8}
          >
            <ChevronRight size={18} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Stats summary */}
      <View style={styles.statsSummaryRow}>
        <View style={styles.statPillAvailable}>
          <CheckCircle2 size={13} color={colors.success} />
          <Text style={styles.statTextAvailable}>{monthAvailableCount} Available (Green)</Text>
        </View>
        <View style={styles.statPillBooked}>
          <XCircle size={13} color={colors.error} />
          <Text style={styles.statTextBooked}>{monthBookedCount} Booked (Red)</Text>
        </View>
      </View>

      {/* Weekdays */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((wd) => (
          <Text key={wd} style={styles.weekdayLabel}>
            {wd}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {daysGrid.map((item) => {
          if (item.empty) {
            return <View key={item.key} style={styles.emptyDayCell} />;
          }

          const { day, dateStr, isBooked, isSelected } = item;

          return (
            <Pressable
              key={item.key}
              testID={`calendar-day-${dateStr}`}
              style={[
                styles.dayCell,
                isBooked ? styles.dayCellBooked : styles.dayCellAvailable,
                isSelected && styles.dayCellSelected,
              ]}
              onPress={() => onSelectDate(dateStr!, isBooked!)}
            >
              <Text
                style={[
                  styles.dayNumber,
                  isBooked ? styles.dayNumberBooked : styles.dayNumberAvailable,
                  isSelected && styles.dayNumberSelected,
                ]}
              >
                {day}
              </Text>
              <Text
                style={[
                  styles.dayStatusBadge,
                  isBooked ? styles.dayStatusBooked : styles.dayStatusAvailable,
                  isSelected && styles.dayStatusSelected,
                ]}
              >
                {isBooked ? "Booked" : "Open"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Open</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.brandPrimary }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
      </View>

      {selectedDate && (
        <View style={styles.selectedBanner}>
          <Info size={15} color={colors.brandPrimary} />
          <Text style={styles.selectedBannerText}>
            Selected Date: <Text style={styles.boldText}>{selectedDate}</Text>
            {bookedSet.has(selectedDate) ? " (Booked)" : " (Available to reserve)"}
          </Text>
        </View>
      )}
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
  },
  navControls: {
    flexDirection: "row",
    gap: 6,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsSummaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  statPillAvailable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(46, 125, 50, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.3)",
  },
  statTextAvailable: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  statPillBooked: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(211, 47, 47, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.3)",
  },
  statTextBooked: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.error,
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  weekdayLabel: {
    width: "13.5%",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyDayCell: {
    width: "13.5%",
    height: 48,
    marginBottom: 6,
  },
  dayCell: {
    width: "13.5%",
    height: 48,
    marginBottom: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    borderWidth: 1,
  },
  dayCellAvailable: {
    backgroundColor: "rgba(46, 125, 50, 0.1)",
    borderColor: "rgba(46, 125, 50, 0.35)",
  },
  dayCellBooked: {
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    borderColor: "rgba(211, 47, 47, 0.35)",
  },
  dayCellSelected: {
    borderColor: colors.brandPrimary,
    borderWidth: 2,
    backgroundColor: colors.brandTertiary,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: "700",
  },
  dayNumberAvailable: {
    color: colors.onSurface,
  },
  dayNumberBooked: {
    color: colors.error,
  },
  dayNumberSelected: {
    color: colors.brandPrimary,
  },
  dayStatusBadge: {
    fontSize: 7.5,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 1,
  },
  dayStatusAvailable: {
    color: colors.success,
  },
  dayStatusBooked: {
    color: colors.error,
  },
  dayStatusSelected: {
    color: colors.brandPrimary,
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendText: {
    fontSize: 11,
    color: colors.onSurfaceSecondary,
  },
  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: colors.surfaceTertiary,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedBannerText: {
    fontSize: 12,
    color: colors.onSurface,
  },
  boldText: {
    fontWeight: "700",
    color: colors.brandPrimary,
  },
}));
