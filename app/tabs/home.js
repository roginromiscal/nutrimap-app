import { Ionicons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 8.482,
          longitude: 124.647,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        mapType="hybrid"
      >
        <Marker
          coordinate={{ latitude: 8.482, longitude: 124.647 }}
          title="Cagayan de Oro"
          description="Sample marker"
        />
      </MapView>

      {/* Floating Scan Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="scan-outline" size={30} color="#1B5333" />
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
  fabContainer: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fab: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 40,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
});
