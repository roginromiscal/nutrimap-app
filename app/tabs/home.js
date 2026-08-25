import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "expo-router";
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

import { getUserScans } from "../../lib/database/getUserScans";
import { insertScan } from "../../lib/database/insertScan";
import { auth } from "../../lib/firebase";
import { useMap } from "../../lib/mapContext";
import OfflineMapNotice from "../../components/OfflineMapNotice";
import { useIsOnline } from "../../lib/useIsOnline";

export default function HomeScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const { location, initialRegion } = useMap();
  const [mapRegion, setMapRegion] = useState(null);
  const isOnline = useIsOnline();

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
    if (location) {
      mapRef.current?.animateToRegion(location, 500);
    }
  }, [location]);

  return (
    <View style={styles.container}>
      <MapView
        key={scannedAreas.map((a) => a.id).join("-")}
        ref={mapRef}
        style={styles.map}
        initialRegion={location || initialRegion}
        mapType="hybrid"
        showsUserLocation
        onRegionChangeComplete={setMapRegion}
      >
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
                    selectedArea: JSON.stringify(area),
                  })
                }
              />
            )
        )}
      </MapView>

      {!isOnline && <OfflineMapNotice />}

      <View style={styles.scanButtonContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          disabled={isScanning}
          onPress={async () => {
            setIsScanning(true);
            try {
              const inserted = await insertScan();
              await loadScans();

              Alert.alert("Scan saved", "Area scanned successfully", [
                {
                  text: "View",
                  onPress: () =>
                  navigation.navigate("details", {
                    selectedArea: JSON.stringify(inserted),
                  }),
                },
                { text: "OK" },
              ]);
            } catch (err) {
              Alert.alert(
                "Scan failed",
                err.message || "Something went wrong while reading the sensor."
              );
            } finally {
              setIsScanning(false);
            }
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