import NetInfo from '@react-native-community/netinfo';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { db as sqlite } from './sqlite';

export const syncPendingScans = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const net = await NetInfo.fetch();
  if (!net.isConnected || net.isInternetReachable === false) return;

  let pending = [];
  try {
    pending = await sqlite.getAllAsync(
      `SELECT * FROM scans WHERE user_uid = ? AND synced = 0`,
      [uid]
    );
  } catch (err) {
    console.error('Failed to read pending scans', err);
    return;
  }

  for (const scan of pending) {
    try {
      let recommendedCrop = [];
      try {
        recommendedCrop = scan.recommended_crop
          ? JSON.parse(scan.recommended_crop)
          : [];
      } catch {
        recommendedCrop = scan.recommended_crop;
      }

      await setDoc(doc(db, 'users', uid, 'scans', scan.scan_uuid), {
        scan_uuid: scan.scan_uuid,
        user_uid: scan.user_uid,
        nitrogen: scan.nitrogen,
        phosphorus: scan.phosphorus,
        potassium: scan.potassium,
        temperature: scan.temperature,
        moisture: scan.moisture,
        ph: scan.ph,
        recommended_crop: recommendedCrop,
        confidence: scan.confidence,
        latitude: scan.latitude,
        longitude: scan.longitude,
        title: scan.title,
        description: scan.description,
        coordinates: scan.coordinates,
        dateScanned: scan.dateScanned,
        created_at: scan.created_at,
        syncedAt: new Date().toISOString(),
      });

      await sqlite.runAsync(`UPDATE scans SET synced = 1 WHERE id = ?`, [
        scan.id,
      ]);
    } catch (err) {
      console.warn(`Failed to sync scan ${scan.scan_uuid}`, err);
    }
  }
};

export const watchAndSyncScans = () => {
  syncPendingScans().catch((err) =>
    console.warn('Initial scan sync failed', err)
  );

  let wasConnected = null;
  const unsubscribe = NetInfo.addEventListener((state) => {
    const isOnline = !!state.isConnected && state.isInternetReachable !== false;
    if (isOnline && wasConnected === false) {
      syncPendingScans().catch((err) =>
        console.warn('Reconnect scan sync failed', err)
      );
    }
    wasConnected = isOnline;
  });

  return unsubscribe;
};
