import { db } from './sqlite';

export const initDatabase = async () => {
  let retries = 3;

  while (retries > 0) {
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS scans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scan_uuid TEXT,
          user_uid TEXT,

          nitrogen REAL,
          phosphorus REAL,
          potassium REAL,
          temperature REAL,
          moisture REAL,
          ph REAL,

          recommended_crop TEXT,
          confidence REAL,

          latitude REAL,
          longitude REAL,

          title TEXT,              
          description TEXT,
          coordinates TEXT,
          dateScanned TEXT,

          synced INTEGER DEFAULT 0,
          created_at TEXT
        );
        CREATE TABLE IF NOT EXISTS scan_deletions (
          scan_uuid TEXT PRIMARY KEY,
          user_uid TEXT
        );
      `);

      return true;
    } catch (err) {
      retries--;
      console.error(`Database init failed, ${retries} retries left`, err);

      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  console.error("Failed to initialize database after retries");
  return false;
};
