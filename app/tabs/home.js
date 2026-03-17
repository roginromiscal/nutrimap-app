import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

import { getUserScans } from "../database/getUserScans";
import { insertMockScan } from "../database/insertScan";
import { auth } from "./firebaseConfig";
import { useMap } from "./map-context";

export default function HomeScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const {
    mapRegion,
    setMapRegion,
    location,
    setLocation,
    initialRegion,
  } = useMap();

  const [scannedAreas, setScannedAreas] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const loadScans = async () => {
    const uid = auth.currentUser?.uid ?? "local";
    const data = await getUserScans(uid);
    setScannedAreas(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadScans();
    }, [])
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const current = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setLocation(region);
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 300);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion || initialRegion}
        mapType="hybrid"
        showsUserLocation
        onRegionChangeComplete={setMapRegion}
      >
        {location && <Marker coordinate={location} pinColor="blue" />}

        {scannedAreas.map(
          (area) =>
            area.latitude &&
            area.longitude && (
              <Marker
                key={area.id}
                coordinate={{
                  latitude: parseFloat(area.latitude),
                  longitude: parseFloat(area.longitude),
                }}
                title={area.title}
                pinColor="green"
              onPress={() =>
                navigation.navigate("details", {
                  selectedArea: JSON.stringify(area), // ✅ ALWAYS STRING
                })
              }
              />
            )
        )}
      </MapView>

      <View style={styles.scanButtonContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          disabled={isScanning}
          onPress={async () => {
            setIsScanning(true);
            const inserted = await new Promise((resolve) =>
              insertMockScan(resolve)
            );

            if (inserted) {
              await loadScans(); // ✅ IMPORTANT FIX

              Alert.alert("Scan saved", "Area scanned successfully", [
                {
                  text: "View",
                  onPress: () =>
                  navigation.navigate("details", {
                    selectedArea: JSON.stringify(inserted), // ✅ FIX
                  }),
                },
                { text: "OK" },
              ]);
            }
            setIsScanning(false);
          }}
        >
          {isScanning ? (
            <ActivityIndicator size="large" color="#1B5333" />
          ) : (
            <Ionicons name="scan-outline" size={30} color="#1B5333" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  scanButtonContainer: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    zIndex: 10,
  },
  scanButton: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 50,
    elevation: 6,
  },
});
