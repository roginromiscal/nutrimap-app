import { db } from "./sqlite";
import { syncPendingScans } from "./syncScans";

export const updateScanTitle = async (id, newTitle) => {
  await db.runAsync(`UPDATE scans SET title = ?, synced = 0 WHERE id = ?`, [
    newTitle,
    id,
  ]);

  await syncPendingScans();
};
