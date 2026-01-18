import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
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

  // Load scans
  useFocusEffect(
    useCallback(() => {
      const uid = auth.currentUser?.uid ?? "local";
      getUserScans(uid).then(setScannedAreas);
    }, [])
  );

  // Get device location
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
      {/* MAP */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion || initialRegion}
        mapType="hybrid"
        showsUserLocation
        onRegionChangeComplete={setMapRegion}
      >
        {location && (
          <Marker coordinate={location} pinColor="blue" />
        )}

        {scannedAreas.map(
          area =>
            area.latitude &&
            area.longitude && (
              <Marker
                key={area.id}
                coordinate={{
                  latitude: area.latitude,
                  longitude: area.longitude,
                }}
                title={area.title}
                pinColor="green"
                onPress={() =>
                  navigation.navigate("details", {
                    selectedArea: area,
                  })
                }
              />
            )
        )}
      </MapView>

      {/* ✅ SCAN BUTTON — HOME ONLY */}
      <View style={styles.scanButtonContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={async () => {
            const inserted = await new Promise(resolve =>
              insertMockScan(resolve)
            );

            if (inserted) {
              Alert.alert("Scan saved", "Area scanned successfully", [
                {
                  text: "View",
                  onPress: () =>
                    navigation.navigate("details", {
                      selectedArea: inserted,
                    }),
                },
                { text: "OK" },
              ]);
            }
          }}
        >
          <Ionicons name="scan-outline" size={30} color="#1B5333" />
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
