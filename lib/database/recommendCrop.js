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
    ph: Number(item.ph ?? item['pH'] ?? 0),
  }));

  const distances = normalized.map(item => {
    const distance = Math.sqrt(
      Math.pow(soil.n - item.N, 2) +
      Math.pow(soil.p - item.P, 2) +
      Math.pow(soil.k - item.K, 2) +
      Math.pow(soil.temperature - item.temperature, 2) +
      Math.pow(soil.ph - item.ph, 2)
    );

    return { crop: item.crop, distance };
  });

  const uniqueMap = new Map();
  for (const item of distances) {
    const existing = uniqueMap.get(item.crop);
    if (!existing || item.distance < existing.distance) {
      uniqueMap.set(item.crop, item);
    }
  }
  const uniqueDistances = Array.from(uniqueMap.values());

  return uniqueDistances
    .sort((a, b) => a.distance - b.distance)
    .map((item, index) => ({
      rank: index + 1,
      crop: item.crop,
      confidence: Math.max(0.1, 1 - item.distance / 150)
    }));
};
