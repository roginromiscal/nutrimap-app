import { loadCropDataAsync } from './cropStore';

export const recommendCrop = async (soil) => {

  let cropData = [];
  try {
    cropData = await loadCropDataAsync();
  } catch {
    return [];
  }

  const normalized = cropData.map(item => ({
    crop: item.crop ?? item.Crops ?? 'Unknown',
    N: Number(item.N ?? item.n ?? 0),
    P: Number(item.P ?? item.p ?? 0),
    K: Number(item.K ?? item.k ?? 0),
    temperature: Number(item.temperature ?? item.Temperature ?? 0),
    humidity: Number(item.humidity ?? item.Humidity ?? 0),
    ph: Number(item.ph ?? item['pH'] ?? 0),
  }));

  // ✅ STEP 1: compute distances
  const distances = normalized.map(item => {
    const distance = Math.sqrt(
      Math.pow(soil.n - item.N, 2) +
      Math.pow(soil.p - item.P, 2) +
      Math.pow(soil.k - item.K, 2) +
      Math.pow(soil.temperature - item.temperature, 2) +
      Math.pow(soil.moisture - item.humidity, 2) +
      Math.pow(soil.ph - item.ph, 2)
    );

    return { crop: item.crop, distance };
  });

  // ✅ STEP 2: keep ONLY best per crop (remove duplicates)
  const uniqueMap = new Map();

  for (let item of distances) {
    if (!uniqueMap.has(item.crop)) {
      uniqueMap.set(item.crop, item);
    } else {
      // keep the smaller distance
      const existing = uniqueMap.get(item.crop);
      if (item.distance < existing.distance) {
        uniqueMap.set(item.crop, item);
      }
    }
  }

  // ✅ STEP 3: convert back to array
  const uniqueDistances = Array.from(uniqueMap.values());

  // ✅ STEP 4: sort + limit to top 5
  return uniqueDistances
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5) // will return less if not enough
    .map((item, index) => ({
      rank: index + 1,
      crop: item.crop,
      confidence: Math.max(0.1, 1 - item.distance / 150)
    }));
};