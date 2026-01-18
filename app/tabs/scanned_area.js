import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useMap } from "./map-context";

const { height } = Dimensions.get("window");

// SQLite helpers
import { deleteScan } from "../database/deleteScan";
import { getUserScans } from "../database/getUserScans";
import { updateScanTitle } from "../database/updateScanTitle";

import { auth } from "./firebaseConfig";

export default function ScannedAreaScreen() {
  const router = useRouter();

  const scrollRef = useRef(null);
  const isAtTop = useRef(true);
  const slideAnimation = useRef(new Animated.Value(height)).current;
  const panResponder = useRef(null);


  const [sheetVisible, setSheetVisible] = useState(true); // ✅ USED
  const [location, setLocation] = useState(null);
  const [scannedAreas, setScannedAreas] = useState([]);

  // Rename modal
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [selectedArea, setSelectedArea] = useState(null);

  const { mapRef, mapRegion, setMapRegion, initialRegion } = useMap();


  // 🔄 Load scans
  const loadScans = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setScannedAreas([]);
      return;
    }
    const rows = await getUserScans(uid);
    setScannedAreas(rows);
  };

  useFocusEffect(
    useCallback(() => {
      loadScans();
      setSheetVisible(true);            // ✅ ensure sheet visible
      slideAnimation.setValue(0);       // ✅ reset position
    }, [])
  );

  // 📍 Location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const current = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  // 🧲 Bottom sheet drag
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
          useNativeDriver: false,
        }).start(() => {
          if (shouldDismiss) {
            setSheetVisible(false);        // ✅ hide sheet
            router.replace("/tabs/home"); // ✅ go home
          }
        });
      },
    });
  }, []);

  const handleAreaSelect = (area) => {
    if (area.latitude && area.longitude) {
      const region = {
        latitude: area.latitude,
        longitude: area.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // ✅ Zoom shared map to selected area
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 500);

      // ✅ Bring bottom sheet back up if dismissed
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    // ✅ Navigate to details screen
    router.push({
      pathname: "/tabs/details",
      params: {
        selectedArea: JSON.stringify(area),
      },
    });
  };


  // 🗑 Delete
  const handleDelete = (area) => {
    Alert.alert("Delete Scanned Area", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteScan(area.id);
          loadScans();
        },
      },
    ]);
  };

  // ✏ Rename
  const handleRename = (area) => {
    setSelectedArea(area);
    setRenameText(area.title);
    setRenameVisible(true);
  };

  const saveRename = async () => {
    if (!renameText.trim()) return;
    await updateScanTitle(selectedArea.id, renameText.trim());
    setRenameVisible(false);
    setSelectedArea(null);
    loadScans();
  };

  const handleLongPress = (area) => {
    Alert.alert(area.title, "Choose an option", [
      { text: "Rename", onPress: () => handleRename(area) },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(area) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion || initialRegion}
        mapType="hybrid"
        showsUserLocation
      >
        {location && <Marker coordinate={location} pinColor="blue" />}

        {scannedAreas.map(
          (area) =>
            area.latitude &&
            area.longitude && (
              <Marker
                key={area.id}
                coordinate={{ latitude: area.latitude, longitude: area.longitude }}
                title={area.title}
                pinColor="green"
              />
            )
        )}
      </MapView>

      {/* ✅ Bottom Sheet ONLY when visible */}
      {sheetVisible && (
        <Animated.View
          style={[styles.bottomSheet, { transform: [{ translateY: slideAnimation }] }]}
          {...panResponder.current?.panHandlers}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.bottomSheetContent}
            contentContainerStyle={{ paddingBottom: 80 }} // ✅ IMPORTANT
            onScroll={(e) => (isAtTop.current = e.nativeEvent.contentOffset.y <= 0)}
            scrollEventThrottle={16}
          >

            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Scanned Area</Text>
            </View>

            {scannedAreas.length > 0 && (
              <Text style={styles.helperText}>
                Tip: Tap and hold a card to rename or delete it.
              </Text>
            )}

            {scannedAreas.length > 0 ? (
              scannedAreas.map((area) => (
                <TouchableOpacity
                  key={area.id}
                  style={styles.locationCard}
                  onPress={() => handleAreaSelect(area)}
                  onLongPress={() => handleLongPress(area)}
                >
                  <View style={styles.locationCardContent}>
                    <Text style={styles.locationTitle}>{area.title}</Text>
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
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateTitle}>No Scanned Areas</Text>
                <Text style={styles.emptyStateText}>
                  Scan a land area to view soil data and crop recommendations.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* Rename Modal (unchanged) */}
      <Modal visible={renameVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename Scanned Area</Text>
            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setRenameVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveRename}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 10,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "center",
  alignItems: "center",
},

modalBox: {
  width: "85%",
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  padding: 20,
  elevation: 10, // Android shadow
},

modalTitle: {
  fontSize: 16,
  fontWeight: "bold",
  color: "#1B5333",
  marginBottom: 12,
},

modalInput: {
  borderWidth: 1,
  borderColor: "#D1D5DB",
  borderRadius: 8,
  paddingVertical: 10,
  paddingHorizontal: 12,
  fontSize: 14,
  marginBottom: 20,
  color: "#111827",
},

modalActions: {
  flexDirection: "row",
  justifyContent: "flex-end",
},

modalButton: {
  paddingVertical: 8,
  paddingHorizontal: 12,
},

modalCancelText: {
  color: "#6B7280",
  fontSize: 14,
  marginRight: 10,
},

modalSaveButton: {
  marginLeft: 10,
},

modalSaveText: {
  color: "#1B5333",
  fontSize: 14,
  fontWeight: "bold",
},

});



