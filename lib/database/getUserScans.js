import { db } from './sqlite';

export const getUserScans = async (uid) => {
  try {
    // Verify table exists before querying
    const tableCheck = await db.getAllAsync(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='scans'
    `);
    
    if (!tableCheck || tableCheck.length === 0) {
      console.warn('⚠️ scans table does not exist yet');
      return [];
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
      console.log('⚠️ No scans found');
      return [];
    }

    console.log('📋 Retrieved scans:', rows.length, 'Sample N=' + (rows[0]?.nitrogen || 0));

    // Auto-generate default titles ONLY if missing
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
    console.error('❌ Failed to get scans', err);
    return [];
  }
};
