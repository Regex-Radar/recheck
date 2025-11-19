import type { WorkerPoolBackend } from "../../builder.js";
import { WorkerPool } from "../worker-pool.js";
import { createWebWorker } from "./create-worker.js";

export const createWorkerPool: WorkerPoolBackend["createWorkerPool"] = (
  webWorkerPath?: string,
  workerPoolSize?: number,
) => {
  const pool = new WorkerPool(
    () => createWebWorker(webWorkerPath),
    workerPoolSize,
  );
  return pool;
};
