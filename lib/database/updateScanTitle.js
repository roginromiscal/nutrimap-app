import { db } from './sqlite';

export const updateScanTitle = async (id, newTitle) => {
  await db.runAsync(
    `UPDATE scans SET title = ? WHERE id = ?`,
    [newTitle, id]
  );
};
