import { loadCropDataAsync } from './cropStore';

// fallback static data if DB is not available
const FALLBACK_CROPS = [
  { crop: 'Corn', N: 70, P: 40, K: 60, temperature: 25, humidity: 60, ph: 6.5 },
  { crop: 'Rice', N: 60, P: 50, K: 70, temperature: 26, humidity: 75, ph: 6.2 },
  { crop: 'Vegetables', N: 80, P: 60, K: 55, temperature: 22, humidity: 65, ph: 6.8 },
];

export const recommendCrop = async (soil) => {
  let cropData = [];
  try {
    cropData = await loadCropDataAsync();
  } catch (err) {
    console.warn('Could not load crop data from DB, using fallback', err);
    cropData = FALLBACK_CROPS;
  }

  // Normalize rows if they come from DB (column names may vary)
  const normalized = cropData.map(item => ({
    crop: item.crop ?? item.Crops ?? item.crop_name ?? item.CROP ?? 'Unknown',
    N: parseFloat(item.N ?? item.n ?? item.Nitrogen ?? 0),
    P: parseFloat(item.P ?? item.p ?? item.Phosphorus ?? 0),
    K: parseFloat(item.K ?? item.k ?? item.Potassium ?? 0),
    temperature: parseFloat(item.Temperature ?? item.temperature ?? item.temp ?? 0),
    humidity: parseFloat(item.Humidity ?? item.humidity ?? item.h ?? 0),
    ph: parseFloat(item['pH'] ?? item.ph ?? 0),
    rainfall: parseFloat(item.RainFall ?? item.rainfall ?? 0),
  }));

  let bestMatch = null;
  let smallestDistance = Infinity;

  normalized.forEach(item => {
    const distance = Math.sqrt(
      Math.pow(soil.n - item.N, 2) +
      Math.pow(soil.p - item.P, 2) +
      Math.pow(soil.k - item.K, 2) +
      Math.pow(soil.temperature - item.temperature, 2) +
      Math.pow((soil.moisture ?? soil.humidity ?? 0) - item.humidity, 2) +
      Math.pow(soil.ph - item.ph, 2)
    );

    if (distance < smallestDistance) {
      smallestDistance = distance;
      bestMatch = item.crop;
    }
  });

  return {
    crop: bestMatch || 'Unknown',
    confidence: Math.max(0, 1 - smallestDistance / 200) // normalized
  };
};
