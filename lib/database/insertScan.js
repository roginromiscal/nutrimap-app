import * as Location from 'expo-location';
import { auth } from '../firebase';
import { fetchSensorReading } from './espSensor';
import { recommendCrop } from './recommendCrop';
import { db } from './sqlite';
import { syncPendingScans } from './syncScans';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const insertScan = async () => {
  const uid = auth.currentUser?.uid ?? 'local';

  let scanCount = 0;
  try {
    const rows = await db.getAllAsync(
      `SELECT COUNT(*) AS count FROM scans WHERE user_uid = ?`,
      [uid]
    );
    scanCount = rows?.[0]?.count ?? 0;
  } catch {}

  const title = `Scanned Area ${scanCount + 1}`;

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        return {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          coordinates: `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`,
        };
      }
    } catch {}
    return { latitude: null, longitude: null, coordinates: '' };
  };

  const [{ latitude, longitude, coordinates }, soil] = await Promise.all([
    getLocation(),
    fetchSensorReading(),
  ]);

  const looksUnplugged =
    soil.moisture <= 0 && soil.n <= 0 && soil.p <= 0 && soil.k <= 0;

  if (looksUnplugged) {
    throw new Error(
      'The sensor is reading all zeros. Make sure the probe is fully inserted into the soil, then scan again.'
    );
  }

  let recommendations = [];
  try {
    const result = await recommendCrop(soil);
    recommendations = (result || []).map(item => ({
      crop: item.crop || "Unknown",
      confidence: Math.round((item.confidence || 0) * 100)
    }));
  } catch (err) {
    console.warn('Recommendation error', err);
  }

  const dateScanned = new Date().toISOString();

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
      JSON.stringify(recommendations),
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

  const inserted = rows?.[0] ?? null;

  syncPendingScans().catch((err) =>
    console.warn('Scan sync failed', err)
  );

  return inserted;
};
