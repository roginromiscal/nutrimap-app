import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getUserScans } from "../database/getUserScans";
import { auth } from "./firebaseConfig";
import { useMap } from "./map-context";

const { height } = Dimensions.get("window");

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [location, setLocation] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [scannedAreas, setScannedAreas] = useState([]);

  const slideAnimation = useRef(new Animated.Value(height)).current;
  const panResponder = useRef(null);
  const scrollRef = useRef(null);
  const isAtTop = useRef(true);

  const { mapRef, mapRegion, setMapRegion } = useMap();

  /* -------------------- PARSE SELECTED AREA -------------------- */
  useEffect(() => {
    if (params.selectedArea) {
      try {
        const parsed =
          typeof params.selectedArea === "string"
            ? JSON.parse(params.selectedArea)
            : params.selectedArea;

        setSelectedArea(parsed);

        if (parsed?.latitude && parsed?.longitude) {
          const region = {
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setMapRegion(region);
          mapRef.current?.animateToRegion(region, 500);
        }
      } catch (err) {
        console.error("Failed to parse selectedArea", err);
      }
    }
  }, [params.selectedArea]);

  /* -------------------- LOAD SCANS FOR MARKERS -------------------- */
  useFocusEffect(
    useCallback(() => {
      const uid = auth.currentUser?.uid ?? "local";
      getUserScans(uid)
        .then(setScannedAreas)
        .catch(err => console.error("Failed to load scans", err));

      slideAnimation.setValue(0); // ✅ reset bottom sheet every time
    }, [])
  );

  /* -------------------- LOCATION -------------------- */
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

      if (!mapRegion) {
        setMapRegion(region);
      }
    })();
  }, []);

  /* -------------------- BOTTOM SHEET DRAG -------------------- */
  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > Math.abs(g.dx) && g.dy > 5 && isAtTop.current,

      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnimation.setValue(g.dy);
      },

      onPanResponderRelease: (_, g) => {
        if (g.dy > 200) {
          Animated.timing(slideAnimation, {
            toValue: height,
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            router.replace("/tabs/home"); // ✅ drag down → HOME
          });
        } else {
          Animated.timing(slideAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
      },
    });
  }, []);

  /* -------------------- RENDER -------------------- */
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion || location}
        mapType="hybrid"
        showsUserLocation
        onRegionChangeComplete={setMapRegion}
      >
        {location && (
          <Marker coordinate={location} title="Your Location" pinColor="blue" />
        )}

        {scannedAreas.map(
          area =>
            area.latitude &&
            area.longitude && (
              <Marker
                key={area.id}
                coordinate={{ latitude: area.latitude, longitude: area.longitude }}
                title={area.title}
                pinColor="green"
                onPress={() => setSelectedArea(area)}
              />
            )
        )}
      </MapView>

        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnimation }] },
          ]}
        >
        <ScrollView
          ref={scrollRef}
          style={styles.bottomSheetContent}
          onScroll={e => (isAtTop.current = e.nativeEvent.contentOffset.y <= 0)}
          scrollEventThrottle={16}
          nestedScrollEnabled
        >
          <View
            style={styles.dragHandleContainer}
            {...panResponder.current?.panHandlers}  
          >
            <View style={styles.dragHandle} />
          </View>

          {selectedArea ? (
            <View>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Land Area Detail</Text>
              </View>

              {/* BACK TO SCANNED AREA */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push("/tabs/scanned_area")}
              >
                <Text style={styles.backButtonText}>← Back to Areas</Text>
              </TouchableOpacity>

              <View style={styles.detailsInfoBox}>
                <Text style={styles.detailsInfoLabel}>
                  Date Scanned: {selectedArea.dateScanned}
                </Text>
                <Text style={styles.detailsInfoLabel}>
                  Area Coordinates: {selectedArea.coordinates}
                </Text>
              </View>

              {/* NPK */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>NPK Nutrients</Text>

                <View style={styles.chartArea}>
                  <View style={styles.chartYAxis}>
                    <Text style={styles.yAxisText}>100</Text>
                    <Text style={styles.yAxisText}>75</Text>
                    <Text style={styles.yAxisText}>50</Text>
                    <Text style={styles.yAxisText}>25</Text>
                    <Text style={styles.yAxisText}>0</Text>
                  </View>

                  <View style={styles.barsSection}>
                    <View style={styles.barsDisplayContainer}>
                      {[
                        { label: "N", value: selectedArea.nitrogen, color: "#4A90E2" },
                        { label: "P", value: selectedArea.phosphorus, color: "#50C878" },
                        { label: "K", value: selectedArea.potassium, color: "#FFB84D" },
                      ].map((item, i) => (
                        <View key={i} style={styles.barItemContainer}>
                          <View
                            style={[
                              styles.barItem,
                              {
                                height: Math.min(item.value * 2.2, 220),
                                backgroundColor: item.color,
                              },
                            ]}
                          >
                            <Text style={styles.barText}>{item.value}</Text>
                          </View>
                          <Text style={styles.barLabel}>{item.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* SOIL */}
              <View style={styles.propertiesContainer}>
                <View style={styles.propertyRow}>
                  <Text style={styles.propertyLabel}>Moisture</Text>
                  <Text style={styles.propertyValue}>{selectedArea.moisture} %</Text>
                </View>
                <View style={styles.propertyRow}>
                  <Text style={styles.propertyLabel}>Temperature</Text>
                  <Text style={styles.propertyValue}>{selectedArea.temperature} °C</Text>
                </View>
                <View style={styles.propertyRow}>
                  <Text style={styles.propertyLabel}>pH</Text>
                  <Text style={styles.propertyValue}>{selectedArea.ph}</Text>
                </View>
              </View>

              {/* CROP */}
              <View style={styles.cropContainer}>
                <Text style={styles.cropTitle}>Crop Recommendation</Text>
                <View style={styles.cropCard}>
                  <Image
                    source={{ uri: "https://via.placeholder.com/80" }}
                    style={styles.cropImage}
                  />
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropName}>
                      {selectedArea.recommended_crop || "N/A"}
                    </Text>
                    <Text style={styles.cropDescription}>
                      Based on soil conditions
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 100 }} />
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No Area Selected</Text>
              <Text style={styles.emptyStateText}>
                Select a scanned area to view details.
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ⚠️ STYLES ARE UNTOUCHED BELOW */




const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: -2 },
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D3D3D3",
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 12,
  },
  header: {
    backgroundColor: "#1B5333",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chartContainer: {
    marginBottom: 20,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  chartArea: {
    flexDirection: "row",
    marginBottom: 12,
    height: 240,
  },
  chartYAxis: {
    width: 35,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 8,
  },
  yAxisText: {
    fontSize: 10,
    color: "#999",
    fontWeight: "600",
  },
  barsSection: {
    flex: 1,
    position: "relative",
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#999",
    paddingBottom: 8,
  },
  barsBackgroundContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  barBackgroundLine: {
    height: 1,
    backgroundColor: "#E0E0E0",
    width: "100%",
  },
  barsDisplayContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: "100%",
    paddingHorizontal: 4,
  },
  barItemContainer: {
    alignItems: "center",
    flex: 1,
    maxWidth: 60,
  },
  barItem: {
    width: 45,
    backgroundColor: "#4A90E2",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  barText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  barUnit: {
    fontSize: 9,
    color: "#999",
    marginTop: 2,
  },
  legend: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 11,
    color: "#666",
  },
  propertiesContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  propertyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  propertyLabel: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  propertyValue: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  cropContainer: {
    marginBottom: 20,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  cropCard: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cropImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#E8E8E8",
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  cropDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  emptyStateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 13,
    color: "#1B5333",
    fontWeight: "600",
  },
  detailsInfoBox: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#1B5333",
  },
  detailsInfoLabel: {
    fontSize: 12,
    color: "#333",
    marginBottom: 6,
  },
});
