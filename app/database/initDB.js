import { db } from './sqlite';

export const initDatabase = async () => {
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

        -- Location and descriptive fields
        latitude REAL,
        longitude REAL,

        title TEXT,              
        description TEXT,
        coordinates TEXT,
        dateScanned TEXT,

        synced INTEGER DEFAULT 0,
        created_at TEXT
      );
    `);

    console.log('✅ SQLite database initialized');
  } catch (err) {
    console.error('❌ Failed to initialize database', err);
  }
};
