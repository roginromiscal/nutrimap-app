export const scanCancelledError = () => {
  const error = new Error("Scan cancelled.");
  error.code = "SCAN_CANCELLED";
  return error;
};

export const isScanCancelled = (error) => error?.code === "SCAN_CANCELLED";

export const isExpectedDisconnectError = (error) =>
  /not connected|socket might(?: be)? closed/i.test(error?.message ?? "");

export const throwIfScanCancelled = (signal) => {
  if (signal?.aborted) throw scanCancelledError();
};

const runCancellationCleanup = (cleanup) => {
  if (!cleanup) return;

  try {
    Promise.resolve(cleanup()).catch((error) =>
      isExpectedDisconnectError(error)
        ? undefined
        : console.warn(
            "Failed to stop Bluetooth operation after scan cancellation",
            error,
          ),
    );
  } catch (error) {
    if (!isExpectedDisconnectError(error)) {
      console.warn(
        "Failed to stop Bluetooth operation after scan cancellation",
        error,
      );
    }
  }
};

export const awaitWithCancellation = (operation, signal, onCancel) => {
  if (!signal) return Promise.resolve(operation);
  if (signal.aborted) {
    runCancellationCleanup(onCancel);
    return Promise.reject(scanCancelledError());
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", handleAbort);
      callback(value);
    };
    const handleAbort = () => {
      runCancellationCleanup(onCancel);
      finish(reject, scanCancelledError());
    };

    signal.addEventListener("abort", handleAbort, { once: true });
    Promise.resolve(operation).then(
      (value) =>
        finish(
          signal.aborted ? reject : resolve,
          signal.aborted ? scanCancelledError() : value,
        ),
      (error) => finish(reject, error),
    );
  });
};
