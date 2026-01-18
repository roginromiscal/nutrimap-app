import * as Location from 'expo-location';
import { auth } from '../tabs/firebaseConfig';
import { recommendCrop } from './recommendCrop';
import { db } from './sqlite';

/* --------------------------------------------------
   UUID v4 generator (Expo-safe)
-------------------------------------------------- */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/* --------------------------------------------------
   MAIN SCAN FUNCTION
-------------------------------------------------- */
export const insertMockScan = async (callback) => {
  const uid = auth.currentUser?.uid ?? 'local';

  /* --------------------------------------------------
     1️⃣ Get scan count (for auto title)
  -------------------------------------------------- */
  let scanCount = 0;
  try {
    const rows = await db.getAllAsync(
      `SELECT COUNT(*) AS count FROM scans WHERE user_uid = ?`,
      [uid]
    );
    scanCount = rows?.[0]?.count ?? 0;
  } catch (err) {
    console.warn('⚠️ Failed to get scan count', err);
  }

  const title = `Scanned Area ${scanCount + 1}`;

  /* --------------------------------------------------
     2️⃣ Get location (safe + permission aware)
  -------------------------------------------------- */
  let latitude = null;
  let longitude = null;
  let coordinates = '';

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      latitude = loc.coords.latitude;
      longitude = loc.coords.longitude;
      coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  } catch (err) {
    console.warn('⚠️ Location unavailable', err);
  }

  /* --------------------------------------------------
     3️⃣ Soil data (MOCK – ESP32 compatible)
     Replace this with real sensor payload later
  -------------------------------------------------- */
  const soilRaw = {
    n: Math.round((Math.random() * 80 + 20) * 10) / 10,
    p: Math.round((Math.random() * 70 + 10) * 10) / 10,
    k: Math.round((Math.random() * 60 + 10) * 10) / 10,
    temperature: Math.round((Math.random() * 10 + 20) * 10) / 10,
    moisture: Math.round((Math.random() * 40 + 40) * 10) / 10,
    ph: Math.round((Math.random() * 2 + 5.5) * 10) / 10
  };

  /* --------------------------------------------------
     4️⃣ Sanitize soil data (sensor-safe)
  -------------------------------------------------- */
  const soil = {
    n: Number(soilRaw.n) || 0,
    p: Number(soilRaw.p) || 0,
    k: Number(soilRaw.k) || 0,
    temperature: Number(soilRaw.temperature) || 0,
    moisture: Number(soilRaw.moisture) || 0,
    ph: Number(soilRaw.ph) || 7
  };

  /* --------------------------------------------------
     5️⃣ Get crop recommendation (FAIL-SAFE)
  -------------------------------------------------- */
  let recommendation = {
    crop: 'Unknown',
    confidence: 0
  };

  try {
    const result = await recommendCrop(soil);
    if (result?.crop) {
      recommendation.crop = result.crop;
      recommendation.confidence = Math.round(
        Math.max(0, Math.min(1, result.confidence ?? 0)) * 100
      );
    }
  } catch (err) {
    console.warn('⚠️ Crop recommendation failed', err);
  }

  const dateScanned = new Date().toISOString();

  /* --------------------------------------------------
     6️⃣ Insert scan into SQLite
  -------------------------------------------------- */
  try {
    await db.runAsync(
      `
      INSERT INTO scans (
        scan_uuid,
        user_uid,

        nitrogen,
        phosphorus,
        potassium,
        temperature,
        moisture,
        ph,

        recommended_crop,
        confidence,

        latitude,
        longitude,
        title,
        description,
        coordinates,
        dateScanned,

        synced,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        generateUUID(),
        uid,

        soil.n,
        soil.p,
        soil.k,
        soil.temperature,
        soil.moisture,
        soil.ph,

        recommendation.crop,
        recommendation.confidence,

        latitude,
        longitude,
        title,
        '',
        coordinates,
        dateScanned,

        0,
        dateScanned
      ]
    );

    /* --------------------------------------------------
       7️⃣ Return latest scan
    -------------------------------------------------- */
    const rows = await db.getAllAsync(
      `SELECT * FROM scans WHERE user_uid = ? ORDER BY created_at DESC LIMIT 1`,
      [uid]
    );

    callback && callback(rows?.[0] ?? null);

  } catch (err) {
    console.error('❌ Failed to insert scan', err);
    callback && callback(null);
  }
};
