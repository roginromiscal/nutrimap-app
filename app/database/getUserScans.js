import { db } from './sqlite';

export const getUserScans = async (uid) => {
  try {
    const rows = await db.getAllAsync(
      `
      SELECT *
      FROM scans
      WHERE user_uid = ?
      ORDER BY created_at ASC
      `,
      [uid]
    );

    if (!rows || rows.length === 0) return [];

    // Auto-generate default titles ONLY if missing
    const processed = rows.map((scan, index) => ({
      ...scan,
      title:
        scan.title && scan.title.trim() !== ''
          ? scan.title
          : `Scanned Area ${index + 1}`,
    }));

    return processed;
  } catch (err) {
    console.error('❌ Failed to get scans', err);
    return [];
  }
};
