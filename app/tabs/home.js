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
  const scanAbortControllerRef = useRef(null);

  const { location, initialRegion } = useMap();
  const [mapRegion, setMapRegion] = useState(null);
  const isOnline = useIsOnline();

  const [scannedAreas, setScannedAreas] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const cancelScan = () => scanAbortControllerRef.current?.abort();

  const handleScan = async () => {
    if (scanAbortControllerRef.current) return;

    const controller = new AbortController();
    scanAbortControllerRef.current = controller;
    setIsScanning(true);

    const loadingTimer = new Promise((resolve) => setTimeout(resolve, 2000));
    let inserted;
    let scanError;

    try {
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
      if (controller.signal.aborted) return;

      await new Promise((resolve) => setTimeout(resolve, 100));
      if (controller.signal.aborted) return;

      try {
        inserted = await insertScan({ signal: controller.signal });
      } catch (err) {
        if (!controller.signal.aborted && err.code !== "SCAN_CANCELLED") {
          scanError = err;
        }
      }

      if (controller.signal.aborted) return;
      await loadingTimer;
      if (controller.signal.aborted) return;
    } finally {
      if (scanAbortControllerRef.current === controller) {
        scanAbortControllerRef.current = null;
      }
      setIsScanning(false);
    }

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
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={cancelScan}
      >
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingCard}>
            <Text style={styles.loadingTitle}>Scanning your area</Text>
            <Text style={styles.loadingMessage}>
              Keep your sensor nearby while collecting soil readings.
            </Text>
            <ActivityIndicator
              style={styles.loadingSpinner}
              size="large"
              color="#1B5333"
            />
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.cancelScanButton}
              onPress={cancelScan}
            >
              <Text style={styles.cancelScanButtonText}>Cancel scan</Text>
            </TouchableOpacity>
          </View>
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
  loadingBackdrop: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13, 30, 20, 0.48)",
    paddingHorizontal: 24,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    elevation: 12,
    shadowColor: "#102A1B",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
  },
  loadingTitle: {
    color: "#1B5333",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingMessage: {
    marginTop: 8,
    color: "#4B5563",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  loadingSpinner: {
    marginTop: 22,
  },
  cancelScanButton: {
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  cancelScanButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
});
