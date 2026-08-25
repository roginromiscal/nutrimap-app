import { useFocusEffect, useNavigation } from "expo-router";
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
import MapView from "react-native-maps";
import { pingSensor } from "../../lib/database/espSensor";
import { useMap } from "../../lib/mapContext";
import OfflineMapNotice from "../../components/OfflineMapNotice";
import { useIsOnline } from "../../lib/useIsOnline";

const { height } = Dimensions.get("window");
const PING_INTERVAL_MS = 4000;

const STATUS = {
  checking: { color: "#B0B0B0", label: "Checking…" },
  online: { color: "#4CAF50", label: "Online" },
  offline: { color: "#E53935", label: "Offline" },
};

export default function SensorsScreen() {
  const [slideAnimation] = useState(() => new Animated.Value(height));
  const [panHandlers, setPanHandlers] = useState(null);
  const scrollRef = useRef(null);
  const isAtTop = useRef(true);
  const mapRef = useRef(null);

  const navigation = useNavigation();
  const { location, initialRegion } = useMap();
  const [mapRegion, setMapRegion] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState("checking");
  const isOnline = useIsOnline();

  useEffect(() => {
    if (location) {
      mapRef.current?.animateToRegion(location, 500);
    }
  }, [location]);

  useEffect(() => {
    const responder = PanResponder.create({
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
    setPanHandlers(responder.panHandlers);
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const checkStatus = async () => {
        const online = await pingSensor();
        if (!cancelled) setDeviceStatus(online ? "online" : "offline");
      };

      setDeviceStatus("checking");
      checkStatus();
      const interval = setInterval(checkStatus, PING_INTERVAL_MS);

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={location || initialRegion}
        mapType="hybrid"
        showsUserLocation
        onRegionChangeComplete={setMapRegion}
      />

      {!isOnline && <OfflineMapNotice />}

      <Animated.View
        style={[
          styles.bottomSheet,
          { transform: [{ translateY: slideAnimation }] },
        ]}
        {...panHandlers}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            isAtTop.current = e.nativeEvent.contentOffset.y <= 0;
          }}
        >
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sensors</Text>
          </View>

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
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS[deviceStatus].color },
                  ]}
                />
                <Text style={styles.statusText}>
                  {STATUS[deviceStatus].label}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
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
    marginBottom: 4,
  },

  statusText: {
    fontSize: 12,
    color: "#333",
  },
});
