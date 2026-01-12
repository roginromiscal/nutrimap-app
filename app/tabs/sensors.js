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
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useMap } from "./map-context";

const { height } = Dimensions.get("window");

export default function DetailsScreen() {
  const [location, setLocation] = useState(null);
  const slideAnimation = useRef(new Animated.Value(height)).current;
  const panResponder = useRef(null);
  const scrollRef = useRef(null);
  const isAtTop = useRef(true);

  const navigation = useNavigation();
  const route = useRoute();
  const { mapRef, mapRegion, setMapRegion } = useMap();

  /* =====================
     GET USER LOCATION
  ===================== */
  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      const region = {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setLocation(region);

      if (!mapRegion && mapRef.current) {
        mapRef.current.animateToRegion(region);
      }
    };

    getLocation();
  }, []);

  /* =====================
     BOTTOM SHEET DRAG
  ===================== */
  useEffect(() => {
    panResponder.current = PanResponder.create({
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
          }).start(() => navigation.navigate("home"));
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

  /* =====================
     ANIMATE ON FOCUS
  ===================== */
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
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* ================= MAP ================= */}
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="hybrid"
        initialRegion={
          mapRegion || {
            latitude: 8.482,
            longitude: 124.647,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }
        }
        showsUserLocation
        onRegionChange={setMapRegion}
      >
        {location && (
          <Marker
            coordinate={location}
            title="Your Location"
            pinColor="blue"
          />
        )}
      </MapView>

      {/* ================= BOTTOM SHEET ================= */}
      <Animated.View
        style={[
          styles.bottomSheet,
          { transform: [{ translateY: slideAnimation }] },
        ]}
        {...panResponder.current?.panHandlers}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            isAtTop.current = e.nativeEvent.contentOffset.y <= 0;
          }}
        >
          {/* ⬇️ TOP SPACING UNCHANGED */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sensors</Text>
          </View>

          {/* ================= SENSOR CARD ================= */}
          <View style={styles.sensorsContainer}>
            <View style={styles.sensorCard}>
              <Image
                source={require("../../assets/images/npk sensor.jpg")}
                style={styles.sensorImage}
              />

              <View style={styles.sensorInfo}>
                <Text style={styles.sensorName}>7-in-1 NPK Sensor</Text>
                <Text style={styles.sensorDesc}>
                  Measures soil nutrients and conditions in real time.
                </Text>
              </View>

              <View style={styles.sensorStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* =====================
        STYLES
===================== */
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
    backgroundColor: "#FFFFFF",
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

  sensorsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  sensorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  sensorImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: "contain",
  },

  sensorInfo: {
    flex: 1,
  },

  sensorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#123",
  },

  sensorDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  sensorStatus: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
    marginBottom: 4,
  },

  statusText: {
    fontSize: 12,
    color: "#333",
  },
});
