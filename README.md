# NutriMap

Mobile app for scanning soil plots, pulling readings from an ESP32 NPK sensor, and getting crop recommendations based on the local dataset. Built with Expo Router.

## Setup

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` / `i` to open an Android/iOS build.

## Project layout

- `app/auth/` — welcome, login, and register screens (pre-login stack)
- `app/tabs/` — home, sensors, scanned areas, details, settings (post-login tab bar)
- `components/` — shared UI components
- `lib/` — Firebase, map context, online-status hook
- `lib/database/` — SQLite access, sync, sensor polling, crop recommendation logic, and the bundled `cropDataset.db`

## Notes

- The sensor tab expects the phone to be connected to the ESP32's own Wi-Fi access point (`NutriMap-Sensor`) — it polls a fixed local IP, there's no discovery step.
- Scans are written to SQLite first and synced to Firestore in the background once the device is back online.
