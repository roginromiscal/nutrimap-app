import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

// Sample scanned areas
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

export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Permission to access location was denied");
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = currentLocation.coords;
        
        setLocation({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        // Center map on current location
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    getLocation();
  }, []);

  const initialRegion = location || {
    latitude: 8.482,
    longitude: 124.647,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        mapType="hybrid"
        showsUserLocation={true}
      >
        {/* Display user's current location */}
        {location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="Your Location"
            description="Current device location"
            pinColor="blue"
          />
        )}

        {/* Display sample scanned areas */}
        {SAMPLE_SCANNED_AREAS.map((area) => (
          <Marker
            key={area.id}
            coordinate={{ latitude: area.latitude, longitude: area.longitude }}
            title={area.title}
            description={area.description}
            pinColor="green"
            onPress={() => navigation.navigate("scanned_area")}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
});
