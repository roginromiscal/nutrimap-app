# NutriMap

Mobile app for scanning soil plots, pulling readings from an ESP32 NPK sensor, and getting crop recommendations based on the local dataset. Built with Expo Router.

## Setup

```bash
npm install
npx expo run:android
```

This creates and launches a native Android build with Bluetooth support. Expo Go does not include the Bluetooth module.

## Project layout

- `app/auth/` — welcome, login, and register screens (pre-login stack)
- `app/tabs/` — home, sensors, scanned areas, details, settings (post-login tab bar)
- `components/` — shared UI components
- `lib/` — Firebase, map context, online-status hook
- `lib/database/` — SQLite access, sync, sensor polling, crop recommendation logic, and the bundled `cropDataset.db`

## Notes

- The sensor uses Bluetooth Classic serial. On Android, enable Bluetooth and allow the app to find and pair with `NutriMap-Sensor` when prompted.
- Bluetooth communication requires a native Android build; Expo Go does not include the Bluetooth module. Rebuild with `npx expo run:android` after installing dependencies.
- The ESP32 firmware uses Classic Bluetooth SPP, which is not supported by this app on iOS.
- Scans are written to SQLite first and synced to Firestore in the background once the device is back online.
