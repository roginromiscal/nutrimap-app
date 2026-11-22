import { PermissionsAndroid, Platform } from "react-native";
import BluetoothClassic from "react-native-bluetooth-classic";

const SENSOR_NAME = "NutriMap-Sensor";
const CONNECT_RETRY_DELAY_MS = 15000;
const SENSOR_RESPONSE_TIMEOUT_MS = 5000;
const PING_TIMEOUT_MS = 3500;

const bluetoothConnectionError = (message) => {
  const error = new Error(message);
  error.code = "BLUETOOTH_CONNECTION_FAILED";
  return error;
};

let connectedDevice = null;
let dataSubscription = null;
let connectionPromise = null;
let lastConnectionFailureAt = 0;
let lastConnectionError = null;
const responseWaiters = new Set();

const requestBluetoothPermissions = async () => {
  const permissions =
    Platform.Version >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

  const results = await PermissionsAndroid.requestMultiple(permissions);
  const denied = permissions.some(
    (permission) => results[permission] !== PermissionsAndroid.RESULTS.GRANTED,
  );

  if (denied) {
    throw bluetoothConnectionError(
      "Bluetooth permissions are required. Allow Bluetooth access in app settings, then scan again.",
    );
  }
};

const parseSensorMessage = (message) => {
  let data;
  try {
    data = JSON.parse(message);
  } catch {
    return null;
  }

  if (data.status === "ok") return { type: "status" };
  if (data.error) return { type: "error", message: data.error };

  const reading = {
    n: Number(data.nitrogen),
    p: Number(data.phosphorus),
    k: Number(data.potassium),
    temperature: Number(data.temperature),
    moisture: Number(data.moisture),
    ph: Number(data.ph),
  };

  return Object.values(reading).every(Number.isFinite)
    ? { type: "reading", reading }
    : null;
};

const notifyWaiters = (message) => {
  for (const waiter of responseWaiters) {
    if (waiter.matches(message)) waiter.resolve(message);
  }
};

const handleSensorData = ({ data }) => {
  for (const line of String(data || "").split(/\r?\n/)) {
    const message = parseSensorMessage(line.trim());
    if (!message) continue;

    if (message.type === "error") {
      for (const waiter of responseWaiters) {
        if (waiter.type === "reading") {
          waiter.reject(new Error(message.message));
        }
      }
    } else {
      notifyWaiters(message);
    }
  }
};

const createResponseWaiter = (type, timeoutMs, timeoutMessage) => {
  let waiter;
  const promise = new Promise((resolve, reject) => {
    const finish = (callback, value) => {
      clearTimeout(timeout);
      responseWaiters.delete(waiter);
      callback(value);
    };

    waiter = {
      type,
      matches: (message) =>
        message.type === type ||
        (type === "ping" && ["reading", "status"].includes(message.type)),
      resolve: (value) => finish(resolve, value),
      reject: (error) => finish(reject, error),
    };
    const timeout = setTimeout(
      () => waiter.reject(new Error(timeoutMessage)),
      timeoutMs,
    );
    responseWaiters.add(waiter);
  });

  return {
    promise,
    cancel: (error) => waiter?.reject(error),
  };
};

const findOrPairSensor = async () => {
  const bondedDevices = await BluetoothClassic.getBondedDevices();
  let sensor = bondedDevices.find((device) => device.name === SENSOR_NAME);

  if (!sensor) {
    const discoveredDevices = await BluetoothClassic.startDiscovery();
    sensor = discoveredDevices.find((device) => device.name === SENSOR_NAME);
  }

  if (!sensor) {
    throw bluetoothConnectionError(
      `Could not find ${SENSOR_NAME}. Make sure the ESP32 is powered on and nearby, and Bluetooth is enabled.`,
    );
  }

  if (!sensor.bonded) {
    sensor = await BluetoothClassic.pairDevice(sensor.address);
  }

  return sensor;
};

const connectToSensor = async () => {
  if (Platform.OS !== "android") {
    throw bluetoothConnectionError(
      "The ESP32 Classic Bluetooth connection is currently supported on Android only.",
    );
  }

  await requestBluetoothPermissions();

  if (!(await BluetoothClassic.isBluetoothAvailable())) {
    throw bluetoothConnectionError("This device does not support Bluetooth.");
  }

  if (!(await BluetoothClassic.isBluetoothEnabled())) {
    const enabled = await BluetoothClassic.requestBluetoothEnabled();
    if (!enabled) {
      throw bluetoothConnectionError(
        "Turn on Bluetooth to connect to the sensor, then scan again.",
      );
    }
  }

  let sensor;
  try {
    sensor = await findOrPairSensor();
  } catch (error) {
    if (error.code === "BLUETOOTH_CONNECTION_FAILED") throw error;
    throw bluetoothConnectionError(
      `Could not find or pair with ${SENSOR_NAME}. Make sure it is powered on and accept the pairing request.${error.message ? ` Details: ${error.message}` : ""}`,
    );
  }

  let device;
  try {
    device = await BluetoothClassic.connectToDevice(sensor.address, {
      delimiter: "\n",
    });
  } catch (error) {
    throw bluetoothConnectionError(
      `Could not connect to ${SENSOR_NAME}. Make sure it is powered on and nearby, then accept the Bluetooth pairing request.${error.message ? ` Details: ${error.message}` : ""}`,
    );
  }

  connectedDevice = device;
  dataSubscription = device.onDataReceived(handleSensorData);
  lastConnectionFailureAt = 0;
  lastConnectionError = null;
  return device;
};

const getSensorConnection = async ({ force = false } = {}) => {
  if (connectedDevice) {
    try {
      if (await connectedDevice.isConnected()) return connectedDevice;
    } catch {}
    dataSubscription?.remove();
    dataSubscription = null;
    connectedDevice = null;
  }

  if (connectionPromise) return connectionPromise;

  if (
    !force &&
    lastConnectionError &&
    Date.now() - lastConnectionFailureAt < CONNECT_RETRY_DELAY_MS
  ) {
    throw lastConnectionError;
  }

  connectionPromise = connectToSensor();
  try {
    return await connectionPromise;
  } catch (error) {
    const connectionError =
      error.code === "BLUETOOTH_CONNECTION_FAILED"
        ? error
        : bluetoothConnectionError(
            `Unable to connect to ${SENSOR_NAME}. Turn on Bluetooth, keep the ESP32 nearby, and allow pairing.${error.message ? ` Details: ${error.message}` : ""}`,
          );
    lastConnectionFailureAt = Date.now();
    lastConnectionError = connectionError;
    throw connectionError;
  } finally {
    connectionPromise = null;
  }
};

export const pingSensor = async () => {
  try {
    const device = await getSensorConnection();
    const response = createResponseWaiter(
      "ping",
      PING_TIMEOUT_MS,
      "The sensor did not respond over Bluetooth.",
    );
    try {
      await device.write("ping\n");
    } catch (error) {
      response.cancel(error);
      throw error;
    }
    await response.promise;
    return true;
  } catch {
    return false;
  }
};

export const fetchSensorReading = async () => {
  const device = await getSensorConnection({ force: true });
  const response = createResponseWaiter(
    "reading",
    SENSOR_RESPONSE_TIMEOUT_MS,
    "The sensor did not send a reading over Bluetooth. Make sure the probe is ready, then try again.",
  );

  try {
    await device.write("sensor\n");
    const message = await response.promise;
    return message.reading;
  } catch (error) {
    response.cancel(error);
    throw error;
  }
};
