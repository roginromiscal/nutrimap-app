import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MapProvider, useMap } from "../../context/MapContext";

const SAMPLE_SCANNED_AREAS = [
  {
    id: 1,
    latitude: 8.475,
    longitude: 124.640,
    title: "Farm Area 1",
    description: "Corn field",
    dateScanned: "09/12/2025",
    coordinates: "8.475, 124.640",
    nitrogen: 70,
    phosphorus: 55,
    potassium: 75,
    moisture: 65,
    temperature: 28,
    cropRecommendation: "Corn",
    cropDescription: "Suitable due to enough nitrogen level",
  },
  {
    id: 2,
    latitude: 8.485,
    longitude: 124.655,
    title: "Farm Area 2",
    description: "Rice paddy",
    dateScanned: "08/12/2025",
    coordinates: "8.485, 124.655",
    nitrogen: 60,
    phosphorus: 65,
    potassium: 70,
    moisture: 75,
    temperature: 26,
    cropRecommendation: "Rice",
    cropDescription: "Perfect conditions for rice cultivation",
  },
  {
    id: 3,
    latitude: 8.480,
    longitude: 124.630,
    title: "Farm Area 3",
    description: "Vegetable garden",
    dateScanned: "10/12/2025",
    coordinates: "8.480, 124.630",
    nitrogen: 80,
    phosphorus: 70,
    potassium: 65,
    moisture: 80,
    temperature: 29,
    cropRecommendation: "Vegetables",
    cropDescription: "High nitrogen perfect for leafy vegetables",
  },
];

function TabsContent() {
  const { mapRef, location, initialRegion } = useMap();

  return (
    <>
      {/* Persistent Map in Background */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        mapType="hybrid"
        showsUserLocation={true}
      >
        {location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="Your Location"
            description="Current device location"
            pinColor="blue"
          />
        )}

        {SAMPLE_SCANNED_AREAS.map((area) => (
          <Marker
            key={area.id}
            coordinate={{ latitude: area.latitude, longitude: area.longitude }}
            title={area.title}
            description={area.description}
            pinColor="green"
          />
        ))}
      </MapView>

      {/* Tabs Overlay */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#B7CDBF",
          tabBarItemStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            height: 70,
            paddingBottom: 0,
          },
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

        {/* Hidden details tab - only accessible via navigation */}
        <Tabs.Screen
          name="details"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Floating Scan Button */}
      <View style={styles.scanButtonContainer}>
        <View style={styles.scanButton}>
          <Ionicons name="scan-outline" size={32} color="#1B5333" />
        </View>
      </View>
    </>
  );
}

export default function TabsLayout() {
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