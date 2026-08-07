import { getCropDatabase } from "./cropDb";

export const loadCropDataAsync = async () => {
  try {
    const db = await getCropDatabase();

    const rows = await db.getAllAsync(`
      SELECT
        N,
        P,
        K,
        Temperature,
        Humidity,
        pH,
        rainfall,
        Crops AS crop
      FROM crop_dataset
    `);

    return rows ?? [];
  } catch (err) {
    console.error("❌ Failed to load crop data", err);
    return [];
  }
};
