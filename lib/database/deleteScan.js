import { auth } from '../firebase';
import { db } from './sqlite';
import { syncPendingScans } from './syncScans';

export const deleteScan = async (id) => {
  const scan = await db.getFirstAsync(
    `SELECT scan_uuid, user_uid FROM scans WHERE id = ?`,
    [id]
  );

  if (
    scan?.scan_uuid &&
    auth.currentUser?.uid &&
    scan.user_uid === auth.currentUser.uid
  ) {
    await db.runAsync(
      `INSERT OR REPLACE INTO scan_deletions (scan_uuid, user_uid) VALUES (?, ?)`,
      [scan.scan_uuid, scan.user_uid]
    );
  }

  await db.runAsync(
    `DELETE FROM scans WHERE id = ?`,
    [id]
  );

  syncPendingScans().catch((err) =>
    console.warn('Scan deletion sync failed', err)
  );
};
