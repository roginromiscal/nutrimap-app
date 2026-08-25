import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";

import { ensureCropDatabase } from "../../lib/database/cropSetup";
import { initDatabase } from "../../lib/database/initDB";
import { watchAndSyncScans } from "../../lib/database/syncScans";
import { MapProvider, useMap } from "../../lib/mapContext";

function TabsContent() {
  const { setLocation } = useMap();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const current = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (err) {
        console.warn("Location unavailable:", err);
      }
    })();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#B7CDBF",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="home"
              size={26}
              color={focused ? "#fff" : "#B7CDBF"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scanned_area"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="search"
              size={26}
              color={focused ? "#fff" : "#B7CDBF"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="sensors"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="radio-outline"
              size={26}
              color={focused ? "#fff" : "#B7CDBF"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="settings-outline"
              size={26}
              color={focused ? "#fff" : "#B7CDBF"}
            />
          ),
        }}
      />

      <Tabs.Screen name="details" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  useEffect(() => {
    let unsubscribeSync;
    let cancelled = false;

    initDatabase()
      .then(() => {
        const unsubscribe = watchAndSyncScans();
        if (cancelled) {
          unsubscribe();
        } else {
          unsubscribeSync = unsubscribe;
        }
      })
      .catch((err) => console.error("DB init failed:", err));

    ensureCropDatabase().catch((err) =>
      console.error("Crop database setup failed:", err)
    );

    return () => {
      cancelled = true;
      unsubscribeSync?.();
    };
  }, []);

  return (
    <MapProvider>
      <View style={styles.container}>
        <TabsContent />
      </View>
    </MapProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 15,
    backgroundColor: "#1B5333",
    height: 70,
    borderTopWidth: 0,
    elevation: 8,
    zIndex: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
});