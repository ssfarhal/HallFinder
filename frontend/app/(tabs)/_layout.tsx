import React from "react";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";
import { Building2, Heart, CalendarCheck, MapPin, ShieldCheck } from "lucide-react-native";
import { useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

export default function TabsLayout() {
  const { colors } = useTheme();

  if (usesNativeTabs) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="building.2.fill" />
          <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="favorites">
          <NativeTabs.Trigger.Icon sf="heart.fill" />
          <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="enquiries">
          <NativeTabs.Trigger.Icon sf="calendar.badge.clock" />
          <NativeTabs.Trigger.Label>Enquiries</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="admin">
          <NativeTabs.Trigger.Icon sf="person.badge.shield.checkmark.fill" />
          <NativeTabs.Trigger.Label>Owner Desk</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: {
          alignSelf: "center",
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarTestID: "tab-explore",
          tabBarIcon: ({ color }) => <Building2 color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Saved",
          tabBarTestID: "tab-favorites",
          tabBarIcon: ({ color }) => <Heart color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="enquiries"
        options={{
          title: "Enquiries",
          tabBarTestID: "tab-enquiries",
          tabBarIcon: ({ color }) => <CalendarCheck color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="pincodes"
        options={{
          title: "Pincodes",
          tabBarTestID: "tab-pincodes",
          tabBarIcon: ({ color }) => <MapPin color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Owner Desk",
          tabBarTestID: "tab-admin",
          tabBarIcon: ({ color }) => <ShieldCheck color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
