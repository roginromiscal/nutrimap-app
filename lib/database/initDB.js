import { db } from './sqlite';

export const initDatabase = async () => {
  let retries = 3;
  
  while (retries > 0) {
    try {
      // Check if table already exists
      const tables = await db.getAllAsync(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='scans'
      `);
      
      if (tables && tables.length > 0) {
        console.log('✅ scans table already exists');
        return true;
      }
      
      // Create table if it doesn't exist
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

      console.log('✅ SQLite database initialized successfully');
      return true;
    } catch (err) {
      retries--;
      console.error(`❌ Database initialization attempt failed (${retries} retries left):`, err);
      
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.error('❌ Failed to initialize database after retries');
  return false;
};
