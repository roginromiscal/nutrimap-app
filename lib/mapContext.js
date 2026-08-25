import { createContext, useContext, useState } from "react";

const MapContext = createContext(null);

export function MapProvider({ children }) {
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
        location,
        setLocation,
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
