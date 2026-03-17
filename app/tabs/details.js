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
import { recommendCrop } from "../database/recommendCrop";
import { auth } from "./firebaseConfig";
import { useMap } from "./map-context";

const { height } = Dimensions.get("window");

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [location, setLocation] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [scannedAreas, setScannedAreas] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const slideAnimation = useRef(new Animated.Value(height)).current;
  const panResponder = useRef(null);
  const scrollRef = useRef(null);
  const isAtTop = useRef(true);

  const { mapRef, mapRegion, setMapRegion } = useMap();

  /* -------------------- SAFE PARSE -------------------- */
  useEffect(() => {
    try {
      let parsed = params.selectedArea;

      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }

      if (!parsed) return;

      setSelectedArea(parsed);

      if (parsed.latitude && parsed.longitude) {
        const region = {
          latitude: parseFloat(parsed.latitude),
          longitude: parseFloat(parsed.longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 500);
      }

    } catch (err) {
      console.log("Parse error:", err);
    }
  }, [params.selectedArea]);

  /* -------------------- LOAD SCANS -------------------- */
  useFocusEffect(
    useCallback(() => {
      const uid = auth.currentUser?.uid ?? "local";
      getUserScans(uid).then(setScannedAreas);
      slideAnimation.setValue(0);
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

      if (!mapRegion) setMapRegion(region);
    })();
  }, []);

  /* -------------------- NORMALIZE DATA -------------------- */
  const normalizeSoil = (area) => {
    if (!area) return null;

    return {
      nitrogen: area.nitrogen ?? area.n ?? 0,
      phosphorus: area.phosphorus ?? area.p ?? 0,
      potassium: area.potassium ?? area.k ?? 0,
      temperature: area.temperature ?? 0,
      moisture: area.moisture ?? 0,
      ph: area.ph ?? 0,
    };
  };

  const soil = normalizeSoil(selectedArea);

  /* -------------------- RECOMMENDATIONS -------------------- */
  useEffect(() => {
    const load = async () => {
      if (!selectedArea) return;

      try {
        if (selectedArea.recommended_crop) {
          const parsed = JSON.parse(selectedArea.recommended_crop);
          setRecommendations(parsed);
          return;
        }

      const result = await recommendCrop({
        n: soil.nitrogen,
        p: soil.phosphorus,
        k: soil.potassium,
        temperature: soil.temperature,
        moisture: soil.moisture,
        ph: soil.ph,
      });
        setRecommendations(result || []);
      } catch {
        setRecommendations([]);
      }
    };

    load();
  }, [selectedArea]);

  /* -------------------- GRAPH DATA (ONLY NPK) -------------------- */
const soilData = [
  { label: "N", value: Number(soil?.nitrogen || 0), color: "#4CAF50" },
  { label: "P", value: Number(soil?.phosphorus || 0), color: "#2196F3" },
  { label: "K", value: Number(soil?.potassium || 0), color: "#FF9800" },
];

  const maxVal = Math.max(...soilData.map(d => d.value), 1);

  /* -------------------- DRAG -------------------- */
  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (e, g) =>
        Math.abs(g.dy) > Math.abs(g.dx) && g.dy > 5 && isAtTop.current,

      onPanResponderMove: (e, g) => {
        if (g.dy > 0) slideAnimation.setValue(g.dy);
      },

      onPanResponderRelease: (e, g) => {
        const shouldDismiss = g.dy > 200;

        Animated.timing(slideAnimation, {
          toValue: shouldDismiss ? height : 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (shouldDismiss) {
            router.replace("/tabs/home");
          }
        });
      },
    });
  }, []);

  /* -------------------- UI -------------------- */
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
                  router.push({
                    pathname: "/details",
                    params: {
                      selectedArea: JSON.stringify(area),
                    },
                  })
                }
              />
            )
        )}
      </MapView>

      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnimation }] }]} {...panResponder.current?.panHandlers}>
        <ScrollView
          ref={scrollRef}
          style={styles.bottomSheetContent}
          onScroll={e => (isAtTop.current = e.nativeEvent.contentOffset.y <= 0)}
          scrollEventThrottle={16}
        >
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {selectedArea ? (
            <View>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Land Area Detail</Text>
              </View>

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

              {/* 📊 NPK GRAPH ONLY */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>NPK Levels</Text>

                <View style={styles.chartArea}>
                  <View style={styles.barsDisplayContainer}>
                    {soilData.map((item, i) => {
                      const rawHeight = (item.value / maxVal) * 180;
                      const h = Math.max(rawHeight, 10); // ✅ ensures visible bars

                      return (
                        <View key={i} style={styles.barItemContainer}>
                          <View style={[styles.barItem, { height: h, backgroundColor: item.color }]}>
                            <Text style={styles.barText}>{item.value}</Text>
                          </View>
                          <Text style={styles.barLabel}>{item.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* 📋 OTHER DATA */}
              <View style={styles.propertiesContainer}>
                <View style={styles.propertyRow}>
                  <Text style={styles.propertyLabel}>Moisture</Text>
                  <Text style={styles.propertyValue}>{soil?.moisture}</Text>
                </View>
                <View style={styles.propertyRow}>
                  <Text style={styles.propertyLabel}>Temperature</Text>
                  <Text style={styles.propertyValue}>{soil?.temperature}°C</Text>
                </View>
                <View style={styles.propertyRow}>
                  <Text style={styles.propertyLabel}>pH Level</Text>
                  <Text style={styles.propertyValue}>{soil?.ph}</Text>
                </View>
              </View>

              {/* 🌱 CROPS */}
              <View style={styles.cropContainer}>
                <Text style={styles.cropTitle}>Crop Recommendations</Text>

                {recommendations.length > 0 ? (
                  recommendations.map((rec, i) => (
                    <View key={i} style={styles.cropCard}>
                      <Image
                        source={{ uri: "https://via.placeholder.com/80" }}
                        style={styles.cropImage}
                      />
                      <View style={styles.cropInfo}>
                        <Text style={styles.cropName}>
                          {i + 1}. {rec.crop}
                        </Text>
                        <Text style={styles.cropDescription}>
                          Confidence: {rec.confidence}%
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text>No recommendations available</Text>
                )}
              </View>

              <View style={{ height: 100 }} />
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text>No Area Selected</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ⚠️ KEEP YOUR STYLES BELOW UNCHANGED */

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
    flex: 1,
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
