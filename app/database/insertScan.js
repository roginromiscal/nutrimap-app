import * as Location from 'expo-location';
import { auth } from '../tabs/firebaseConfig';
import { recommendCrop } from './recommendCrop';
import { db } from './sqlite';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const insertMockScan = async (callback) => {
  const uid = auth.currentUser?.uid ?? 'local';

  // TITLE
  let scanCount = 0;
  try {
    const rows = await db.getAllAsync(
      `SELECT COUNT(*) AS count FROM scans WHERE user_uid = ?`,
      [uid]
    );
    scanCount = rows?.[0]?.count ?? 0;
  } catch {}

  const title = `Scanned Area ${scanCount + 1}`;

  // LOCATION
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
  } catch {}

  // MOCK SOIL DATA
  const soil = {
    n: Math.round(Math.random() * 60 + 30),
    p: Math.round(Math.random() * 40 + 20),
    k: Math.round(Math.random() * 40 + 20),
    temperature: Math.round(Math.random() * 10 + 20),
    moisture: Math.round(Math.random() * 40 + 40),
    ph: Math.round((Math.random() * 2 + 5.5) * 10) / 10
  };

  // ✅ GET TOP 5 CROPS
  let recommendations = [];
  try {
    const result = await recommendCrop(soil);

    recommendations = (result || []).slice(0, 5).map(item => ({
      crop: item.crop || "Unknown",
      confidence: Math.round((item.confidence || 0) * 100)
    }));

  } catch (err) {
    console.warn('Recommendation error', err);
  }

  const dateScanned = new Date().toISOString();

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

        JSON.stringify(recommendations), // ✅ important
        0,

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

    const rows = await db.getAllAsync(
      `SELECT * FROM scans WHERE user_uid = ? ORDER BY created_at DESC LIMIT 1`,
      [uid]
    );

    callback && callback(rows?.[0] ?? null);

  } catch (err) {
    console.error('Insert error', err);
    callback && callback(null);
  }
};
