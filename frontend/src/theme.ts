import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

// BookMyEvents Dark Maroon Palette (#6B1C1C)
const light = {
  surface: "#FFFFFF",
  onSurface: "#111827",
  surfaceSecondary: "#F8F9FA",
  onSurfaceSecondary: "#374151",
  surfaceTertiary: "#F3F4F6",
  onSurfaceTertiary: "#4B5563",
  surfaceInverse: "#111827",
  onSurfaceInverse: "#FFFFFF",
  muted: "#6B7280",

  brand: "#6B1C1C",
  onBrand: "#FFFFFF",
  brandPrimary: "#6B1C1C", // Deep Dark Maroon
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#8B263E", // Rich Maroon Accent
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "rgba(107, 28, 47, 0.12)",
  onBrandTertiary: "#6B1C1C",

  success: "#15803D",
  onSuccess: "#FFFFFF",
  warning: "#B45309",
  onWarning: "#FFFFFF",
  error: "#B91C1C",
  onError: "#FFFFFF",
  info: "#1D4ED8",
  onInfo: "#FFFFFF",

  border: "#E5E7EB",
  borderStrong: "rgba(107, 28, 47, 0.35)",
  divider: "#F3F4F6",
};

const dark = { ...light };

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  return { scheme: "light", colors: themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
