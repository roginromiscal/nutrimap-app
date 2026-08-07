import { db } from './sqlite';

export const deleteScan = async (id) => {
  await db.runAsync(
    `DELETE FROM scans WHERE id = ?`,
    [id]
  );
};
