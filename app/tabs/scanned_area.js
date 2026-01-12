import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useMap } from "./map-context";

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

export default function ScannedAreaScreen() {
  const scrollRef = useRef(null);
  const isAtTop = useRef(true);
  const navigation = useNavigation();
  const slideAnimation = useRef(new Animated.Value(height)).current;
  const panResponder = useRef(null);
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const { mapRegion, setMapRegion, initialRegion } = useMap();

  const handleAreaSelect = (area) => {
    // Navigate to details tab using jumpTo for tab navigation
    navigation.jumpTo("details", { selectedArea: area });
  };

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
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    getLocation();
  }, []);

  // Set up pan responder for drag-to-dismiss on drag handle only
  useEffect(() => {
    panResponder.current = PanResponder.create({
      // Always be ready to handle touch on drag handle
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const vertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
        // Take over when dragging downwards and the ScrollView is at top
        return vertical && gestureState.dy > 0 && isAtTop.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnimation.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 200) {
          // Drag down enough to dismiss
          Animated.timing(slideAnimation, {
            toValue: height,
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            navigation.navigate("home");
          });
        } else {
          // Snap back to top
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

  // Reset animation when focused
  useFocusEffect(
    useCallback(() => {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
      
      // Sync map with home screen's map region
      if (mapRef.current && mapRegion) {
        mapRef.current.animateToRegion(mapRegion, 300);
      }
      
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 300);
    }, [slideAnimation, mapRegion])
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion || initialRegion}
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
            onPress={() => navigation.jumpTo("details", { selectedArea: area })}
          />
        ))}
      </MapView>

      {/* Animated Bottom Sheet - Location Selector */}
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
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
              scrollEnabled={isAtTop.current}
              onScroll={(e) => {
                const y = e.nativeEvent.contentOffset.y || 0;
                isAtTop.current = y <= 0;
              }}
              contentContainerStyle={{ paddingBottom: 20 }}
        >
              <View style={styles.dragHandleContainer} {...panResponder.current?.panHandlers}>
                <View style={styles.dragHandle} />
              </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Scanned Area</Text>
          </View>

          {SAMPLE_SCANNED_AREAS.length > 0 ? (
            <View style={styles.locationListContainer}>
              {SAMPLE_SCANNED_AREAS.map((area) => (
                <TouchableOpacity
                  key={area.id}
                  style={styles.locationCard}
                  onPress={() => handleAreaSelect(area)}
                >
                  <View style={styles.locationCardContent}>
                    <Text style={styles.locationTitle}>{area.title}</Text>
                    <Text style={styles.locationDescription}>
                      {area.description}
                    </Text>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationInfoText}>
                        Date Scanned: {area.dateScanned}
                      </Text>
                      <Text style={styles.locationInfoText}>
                        Area Coordinates: {area.coordinates}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.arrowText}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No Scanned Areas</Text>
              <Text style={styles.emptyStateText}>
                Please scan an area first from the home screen to view detailed
                soil analysis and crop recommendations.
              </Text>
            </View>
          )}

          <View style={{ height: 30 }} />
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
  locationListContainer: {
    paddingHorizontal: 4,
  },
  locationCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  locationCardContent: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1B5333",
    marginBottom: 4,
  },
  locationDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  locationInfo: {
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    padding: 8,
  },
  locationInfoText: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
  },
  arrowText: {
    fontSize: 24,
    color: "#1B5333",
    marginLeft: 12,
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
});

export { SAMPLE_SCANNED_AREAS };

