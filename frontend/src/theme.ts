import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

// Luxe Dark Palette from design_guidelines.json
const dark = {
  surface: "#0C0E12",
  onSurface: "#F2F4F7",
  surfaceSecondary: "#15181F",
  onSurfaceSecondary: "#D0D5DD",
  surfaceTertiary: "#1E232D",
  onSurfaceTertiary: "#98A2B3",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#0C0E12",
  muted: "#98A2B3",

  brand: "#C5A880",
  onBrand: "#0C0E12",
  brandPrimary: "#D4AF37", // Luxe Gold
  onBrandPrimary: "#0C0E12",
  brandSecondary: "#B8860B", // Warm Gold
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "rgba(212, 175, 55, 0.15)",
  onBrandTertiary: "#D4AF37",

  success: "#2E7D32",
  onSuccess: "#E8F5E9",
  warning: "#ED6C02",
  onWarning: "#FFF3E0",
  error: "#D32F2F",
  onError: "#FFEBEE",
  info: "#0288D1",
  onInfo: "#E1F5FE",

  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(212, 175, 55, 0.4)",
  divider: "rgba(255, 255, 255, 0.05)",
};

const light = { ...dark };

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const scheme: ColorScheme = "dark";
  return { scheme, colors: themes.dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
