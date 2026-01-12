import * as Location from "expo-location";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const MapContext = createContext(null);

export function MapProvider({ children }) {
  const mapRef = useRef(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return;
        }

        const pos = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (e) {
        console.warn("Location permission error", e);
      }
    })();
  }, []);

  const initialRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }
    : {
        latitude: 8.482,
        longitude: 124.647,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

  return (
    <MapContext.Provider
      value={{ mapRef, mapRegion, setMapRegion, initialRegion, location }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return ctx;
}
