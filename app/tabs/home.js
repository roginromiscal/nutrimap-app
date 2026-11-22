import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

import OfflineMapNotice from "../../components/OfflineMapNotice";
import { getUserScans } from "../../lib/database/getUserScans";
import { insertScan } from "../../lib/database/insertScan";
import { auth } from "../../lib/firebase";
import { useMap } from "../../lib/mapContext";
import { useIsOnline } from "../../lib/useIsOnline";

export default function HomeScreen() {
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const { location, initialRegion } = useMap();
  const [mapRegion, setMapRegion] = useState(null);
  const isOnline = useIsOnline();

  const [scannedAreas, setScannedAreas] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);

    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const loadingTimer = new Promise((resolve) => setTimeout(resolve, 2000));
    let inserted;
    let scanError;
    try {
      inserted = await insertScan();
    } catch (err) {
      scanError = err;
    }
    await loadingTimer;
    setIsScanning(false);

    if (scanError) {
      const alertTitle =
        scanError.code === "ZERO_NPK_READING"
          ? "No Soil Nutrient Readings"
          : scanError.code === "BLUETOOTH_CONNECTION_FAILED"
            ? "Bluetooth Connection Failed"
            : "Scan Failed";
      Alert.alert(
        alertTitle,
        scanError.message || "Something went wrong while reading the sensor.",
      );
      return;
    }

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
  };

  const loadScans = async () => {
    const uid = auth.currentUser?.uid ?? "local";
    const data = await getUserScans(uid);
    setScannedAreas(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadScans();
    }, []),
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
            ),
        )}
      </MapView>

      {!isOnline && <OfflineMapNotice />}

      <View style={styles.scanButtonContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          disabled={isScanning}
          onPress={handleScan}
        >
          <Ionicons name="scan-outline" size={30} color="#1B5333" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isScanning}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1B5333" />
          <Text style={styles.loadingTitle}>Scanning your area</Text>
          <Text style={styles.loadingMessage}>
            Reading soil data from your sensor...
          </Text>
        </View>
      </Modal>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    padding: 32,
  },
  loadingTitle: {
    marginTop: 20,
    color: "#1B5333",
    fontSize: 20,
    fontWeight: "700",
  },
  loadingMessage: {
    marginTop: 8,
    color: "#4B5563",
    fontSize: 15,
    textAlign: "center",
  },
});
