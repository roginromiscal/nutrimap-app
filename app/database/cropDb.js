import { openDatabaseSync } from 'expo-sqlite';
import { ensureCropDatabase } from './cropSetup';

let dbInstance = null;

export async function getCropDatabase() {
  if (dbInstance) return dbInstance;

  const ok = await ensureCropDatabase();
  if (!ok) {
    throw new Error('Crop database not available');
  }

  dbInstance = openDatabaseSync('cropDataset.db');
  return dbInstance;
}
