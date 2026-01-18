import { Ionicons } from "@expo/vector-icons";
import { Tabs, useNavigation } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { initDatabase } from "../database/initDB";
import { MapProvider, useMap } from "./map-context";

/* Background map + tabs + floating scan button */

function TabsContent() {
  const { mapRef, location, initialRegion } = useMap();
  const navigation = useNavigation();

  return (
    <>
      {/* 🔵 Persistent Background Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        mapType="hybrid"
        showsUserLocation
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
            pinColor="blue"
          />
        )}
      </MapView>

      {/* 🧭 Tabs Overlay */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#B7CDBF",
          sceneContainerStyle: {
            backgroundColor: "transparent",
          },
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

        {/* 🚫 Hidden details tab */}
        <Tabs.Screen name="details" options={{ href: null }} />
      </Tabs>

    </>
  );
}

export default function TabsLayout() {
  useEffect(() => {
    initDatabase().catch((err) =>
      console.error("DB init failed:", err)
    );
  }, []);

  return (
    <MapProvider>
      <View style={styles.container}>
        <TabsContent />
      </View>
    </MapProvider>
  );
}

/* ❗ STYLES ARE UNTOUCHED */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
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
  scanButtonContainer: {
    position: "absolute",
    bottom: 45,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  scanButton: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
});
