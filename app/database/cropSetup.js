import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const DB_NAME = 'cropDataset.db';
const SQLITE_DIR = `${FileSystem.documentDirectory}SQLite`;
const DB_PATH = `${SQLITE_DIR}/${DB_NAME}`;

export async function ensureCropDatabase() {
  try {
    // Check if DB already exists
    const info = await FileSystem.getInfoAsync(DB_PATH);
    if (info.exists) {
      console.log('✅ Crop database already exists');
      return true;
    }

    // Load DB from bundled assets
    const asset = Asset.fromModule(
      require('../database/cropDataset.db')
    );

    await asset.downloadAsync();

    // Ensure SQLite directory exists
    await FileSystem.makeDirectoryAsync(SQLITE_DIR, {
      intermediates: true,
    });

    // Copy DB to SQLite directory
    await FileSystem.copyAsync({
      from: asset.localUri ?? asset.uri,
      to: DB_PATH,
    });

    console.log('✅ Crop database copied to SQLite folder');
    return true;
  } catch (err) {
    console.error('❌ Failed to setup crop database', err);
    return false;
  }
}
