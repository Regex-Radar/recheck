import { createWorkerPool as createWebWorkerPool } from "../web-worker/index.js";
import { createWorkerPool as createThreadWorkerPool } from "../thread-worker/index.js";
import type { WorkerPoolBackend } from "../../builder.js";
import type { WorkerPool } from "../worker-pool.js";

export const createWorkerPool: WorkerPoolBackend["createWorkerPool"] = (
  workerPath?: string,
): WorkerPool => {
  const RECHECK_PLATFORM = process.env["RECHECK_PLATFORM"] ?? "auto";
  switch (RECHECK_PLATFORM) {
    case "auto": {
    }
    case "node": {
      return createThreadWorkerPool(workerPath);
    }
    case "browser": {
      return createWebWorkerPool(workerPath);
    }
    default: {
      throw new Error(`invalid platform: ${RECHECK_PLATFORM}`);
    }
  }
};
