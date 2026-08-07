import { createContext, useContext, useState } from "react";

const MapContext = createContext(null);

// Shares the device's last-known location across tabs so switching tabs
// doesn't re-trigger the permission prompt / GPS fetch every time. Each
// screen still owns its own MapView instance and ref — sharing a single
// MapView ref across screens caused native rendering conflicts.
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
