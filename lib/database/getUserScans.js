import { auth } from '../firebase';
import { db } from './sqlite';
import { initDatabase } from './initDB';
import { getCloudScans, syncPendingScans } from './syncScans';

export const getUserScans = async (uid) => {
  try {
    await initDatabase();

    if (uid && uid !== 'local' && auth.currentUser?.uid === uid) {
      try {
        await syncPendingScans();
        const [cloudScans, pendingDeletions] = await Promise.all([
          getCloudScans(uid),
          db.getAllAsync(
            `SELECT scan_uuid FROM scan_deletions WHERE user_uid = ?`,
            [uid]
          ),
        ]);
        const deletedScanIds = new Set(
          pendingDeletions.map((deletion) => deletion.scan_uuid)
        );

        for (const scan of cloudScans) {
          const scanUuid = scan.scan_uuid || scan.id;
          if (!scanUuid || deletedScanIds.has(scanUuid)) continue;

          const existing = await db.getFirstAsync(
            `SELECT id, synced FROM scans WHERE user_uid = ? AND scan_uuid = ?`,
            [uid, scanUuid]
          );
          if (existing && existing.synced === 0) continue;

          const dateScanned =
            scan.dateScanned || scan.created_at || new Date().toISOString();
          const recommendedCrop =
            typeof scan.recommended_crop === 'string'
              ? scan.recommended_crop
              : JSON.stringify(scan.recommended_crop ?? []);
          const values = [
            scan.nitrogen ?? null,
            scan.phosphorus ?? null,
            scan.potassium ?? null,
            scan.temperature ?? null,
            scan.moisture ?? null,
            scan.ph ?? null,
            recommendedCrop,
            scan.confidence ?? null,
            scan.latitude ?? null,
            scan.longitude ?? null,
            scan.title || 'Scanned Area',
            scan.description || '',
            scan.coordinates || '',
            dateScanned,
            scan.created_at || dateScanned,
          ];

          if (existing) {
            await db.runAsync(
              `UPDATE scans SET
                nitrogen = ?, phosphorus = ?, potassium = ?, temperature = ?,
                moisture = ?, ph = ?, recommended_crop = ?, confidence = ?,
                latitude = ?, longitude = ?, title = ?, description = ?,
                coordinates = ?, dateScanned = ?, created_at = ?, synced = 1
              WHERE id = ?`,
              [...values, existing.id]
            );
          } else {
            await db.runAsync(
              `INSERT INTO scans (
                scan_uuid, user_uid, nitrogen, phosphorus, potassium,
                temperature, moisture, ph, recommended_crop, confidence,
                latitude, longitude, title, description, coordinates,
                dateScanned, created_at, synced
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
              [scanUuid, uid, ...values]
            );
          }
        }
      } catch (err) {
        console.warn('Failed to restore scans from cloud; showing local scans', err);
      }
    }

    const rows = await db.getAllAsync(
      `
      SELECT *
      FROM scans
      WHERE user_uid = ?
      ORDER BY created_at DESC
      `,
      [uid]
    );

    if (!rows || rows.length === 0) {
      return [];
    }

    const processed = rows.map((scan, index) => ({
      ...scan,
      title:
        scan.title && scan.title.trim() !== ''
          ? scan.title
          : `Scanned Area ${index + 1}`,
      dateScanned:
        scan.dateScanned && !isNaN(new Date(scan.dateScanned).getTime())
          ? scan.dateScanned
          : new Date().toISOString(),
    }));

    return processed;
  } catch (err) {
    console.error('Failed to get scans', err);
    return [];
  }
};
