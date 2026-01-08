import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
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


const { height } = Dimensions.get("window");

// Sample scanned areas with soil data
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

export default function DetailsScreen() {
  const [location, setLocation] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const route = useRoute();
  const slideAnimation = useRef(new Animated.Value(height)).current;
  const panResponder = useRef(null);
  const scrollRef = useRef(null);
  const isAtTop = useRef(true);
  const navigation = useNavigation();
  const { mapRef: contextMapRef, mapRegion, setMapRegion, initialRegion } = useMap();
  const mapRef = contextMapRef;

  // Get selected area from route params when navigating from scanned_area
  useEffect(() => {
    if (route.params?.selectedArea) {
      setSelectedArea(route.params.selectedArea);
    }
  }, [route.params?.selectedArea]);

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

        // Only animate to location on first load if no saved map region
        if (!mapRegion && mapRef.current) {
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    getLocation();
  }, []);

  // Set up pan responder for drag-to-dismiss
  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const vertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
        // Only activate when dragging downwards and ScrollView is at top
        return vertical && gestureState.dy > 0 && isAtTop.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnimation.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 200) {
          Animated.timing(slideAnimation, {
            toValue: height,
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            navigation.navigate("home");
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

  // Animate in when screen loads
  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  // Reset animation when screen gains focus
  useFocusEffect(
    useCallback(() => {
      slideAnimation.setValue(0);
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
      
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 300);
    }, [slideAnimation])
  );

  const initialRegionState = location || {
    latitude: 8.482,
    longitude: 124.647,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  const handleRegionChange = (region) => {
    setMapRegion(region);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion || initialRegionState}
        mapType="hybrid"
        showsUserLocation={true}
        onRegionChange={handleRegionChange}
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
            onPress={() => setSelectedArea(area)}
          />
        ))}
      </MapView>

      {/* Animated Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: slideAnimation }],
          },
        ]}
        {...panResponder.current?.panHandlers}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y || 0;
            isAtTop.current = y <= 0;
          }}
        >
          <View style={styles.dragHandleContainer} {...panResponder.current?.panHandlers}>
            <View style={styles.dragHandle} />
          </View>
          
          {selectedArea ? (
            // Land Area Details View
            <View>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Land Area Detail</Text>
              </View>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  navigation.navigate("scanned_area");
                }}
              >
                <Text style={styles.backButtonText}>← Back to Areas</Text>
              </TouchableOpacity>

              <View style={styles.detailsInfoBox}>
                <Text style={styles.detailsInfoLabel}>Date Scanned: {selectedArea.dateScanned}</Text>
                <Text style={styles.detailsInfoLabel}>Area Coordinates: {selectedArea.coordinates}</Text>
              </View>

              {/* Nutrient Chart */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>NPK Nutrients</Text>
                
                {/* Chart with proper bars */}
                <View style={styles.chartArea}>
                  {/* Y-axis with labels */}
                  <View style={styles.chartYAxis}>
                    <Text style={styles.yAxisText}>100</Text>
                    <Text style={styles.yAxisText}>75</Text>
                    <Text style={styles.yAxisText}>50</Text>
                    <Text style={styles.yAxisText}>25</Text>
                    <Text style={styles.yAxisText}>0</Text>
                  </View>

                  {/* Bars section */}
                  <View style={styles.barsSection}>
                    {/* Background bars */}
                    <View style={styles.barsBackgroundContainer}>
                      <View style={styles.barBackgroundLine} />
                      <View style={styles.barBackgroundLine} />
                      <View style={styles.barBackgroundLine} />
                      <View style={styles.barBackgroundLine} />
                    </View>

                    {/* Actual bars */}
                    <View style={styles.barsDisplayContainer}>
                      {/* Nitrogen */}
                      <View style={styles.barItemContainer}>
                        <View style={[styles.barItem, { height: Math.round(selectedArea.nitrogen * 2.2) }]}>
                          <Text style={styles.barText}>{selectedArea.nitrogen}</Text>
                        </View>
                        <Text style={styles.barLabel}>N</Text>
                        <Text style={styles.barUnit}>{selectedArea.nitrogen} mg/kg</Text>
                      </View>

                      {/* Phosphorus */}
                      <View style={styles.barItemContainer}>
                        <View style={[styles.barItem, { height: Math.round(selectedArea.phosphorus * 2.2), backgroundColor: "#50C878" }]}>
                          <Text style={styles.barText}>{selectedArea.phosphorus}</Text>
                        </View>
                        <Text style={styles.barLabel}>P</Text>
                        <Text style={styles.barUnit}>{selectedArea.phosphorus} mg/kg</Text>
                      </View>

                      {/* Potassium */}
                      <View style={styles.barItemContainer}>
                        <View style={[styles.barItem, { height: Math.round(selectedArea.potassium * 2.2), backgroundColor: "#FFB84D" }]}>
                          <Text style={styles.barText}>{selectedArea.potassium}</Text>
                        </View>
                        <Text style={styles.barLabel}>K</Text>
                        <Text style={styles.barUnit}>{selectedArea.potassium} mg/kg</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: "#4A90E2" }]} />
                    <Text style={styles.legendLabel}>Nitrogen - {selectedArea.nitrogen} mg/kg</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: "#50C878" }]} />
                    <Text style={styles.legendLabel}>Phosphorus - {selectedArea.phosphorus} mg/kg</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: "#FFB84D" }]} />
                    <Text style={styles.legendLabel}>Potassium - {selectedArea.potassium} mg/kg</Text>
                  </View>
                </View>
              </View>

              {/* Soil Properties */}
              <View style={styles.propertiesContainer}>
                <View style={styles.propertyRow}>
                  <Text style={styles.propertyLabel}>Soil Moisture</Text>
                  <Text style={styles.propertyValue}>{selectedArea.moisture} %</Text>
                </View>
                <View style={styles.propertyRow}>
                  <Text style={styles.propertyLabel}>Temperature</Text>
                  <Text style={styles.propertyValue}>{selectedArea.temperature} °C</Text>
                </View>
              </View>

              {/* Crop Recommendation */}
              <View style={styles.cropContainer}>
                <Text style={styles.cropTitle}>Crop Recommendation</Text>
                
                <View style={styles.cropCard}>
                  <Image
                    source={{ uri: "https://via.placeholder.com/80?text=" + selectedArea.cropRecommendation }}
                    style={styles.cropImage}
                  />
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropName}>{selectedArea.cropRecommendation}</Text>
                    <Text style={styles.cropDescription}>
                      {selectedArea.cropDescription}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 100 }} />
            </View>
          ) : (
            // No area selected view
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No Area Selected</Text>
              <Text style={styles.emptyStateText}>
                Please select a scanned area from the area list to view detailed soil analysis and crop recommendations.
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

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
