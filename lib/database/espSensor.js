const ESP32_SENSOR_URL = 'http://192.168.4.1/sensor';
const ESP32_PING_URL = 'http://192.168.4.1/ping';
const FETCH_TIMEOUT_MS = 5000;
const PING_TIMEOUT_MS = 3000;

export const pingSensor = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    const response = await fetch(ESP32_PING_URL, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

export const fetchSensorReading = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(ESP32_SENSOR_URL, { signal: controller.signal });
  } catch {
    throw new Error(
      'Could not reach the soil sensor. Make sure your phone is connected to the "NutriMap-Sensor" WiFi network.'
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error('The sensor is on but not ready yet — try again in a moment.');
  }

  const data = await response.json();

  return {
    n: Number(data.nitrogen),
    p: Number(data.phosphorus),
    k: Number(data.potassium),
    temperature: Number(data.temperature),
    moisture: Number(data.moisture),
    ph: Number(data.ph),
  };
};
