import { createContext, useContext, useRef, useState } from "react";

const MapContext = createContext(null);

export function MapProvider({ children }) {
  const mapRef = useRef(null);

  const [mapRegion, setMapRegion] = useState(null);
  const [location, setLocation] = useState(null);

  const initialRegion = {
    latitude: 8.482,
    longitude: 124.647,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <MapContext.Provider
      value={{
        mapRef,
        mapRegion,
        setMapRegion,
        location,
        setLocation, // ✅ THIS WAS MISSING
        initialRegion,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error("useMap must be used inside MapProvider");
  }
  return ctx;
}
