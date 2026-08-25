import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const DB_NAME = 'cropDataset.db';
const SQLITE_DIR = `${FileSystem.documentDirectory}SQLite`;
const DB_PATH = `${SQLITE_DIR}/${DB_NAME}`;

export async function ensureCropDatabase() {
  try {
    const info = await FileSystem.getInfoAsync(DB_PATH);
    if (info.exists && info.size > 100000) {
      return true;
    }
    if (info.exists) {
      console.warn(`Existing crop database looks incomplete (${info.size} bytes), re-copying`);
      await FileSystem.deleteAsync(DB_PATH, { idempotent: true });
    }

    const asset = Asset.fromModule(require('./cropDataset.db'));
    await asset.downloadAsync();

    await FileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true });
    await FileSystem.copyAsync({
      from: asset.localUri ?? asset.uri,
      to: DB_PATH,
    });

    return true;
  } catch (err) {
    console.error('Failed to setup crop database', err);
    return false;
  }
}
