import { createSyncFn } from "synckit";
import type { CheckSyncFn } from "../../builder.js";
const defaultSynckitWorkerPath = import.meta.resolve("./synckit.worker");

export function createCheckSync(
  synckitWorkerPath: string | URL = defaultSynckitWorkerPath,
) {
  if (typeof synckitWorkerPath === 'string' && synckitWorkerPath.startsWith("file://")) {
    synckitWorkerPath = new URL(synckitWorkerPath);
  }
  throw new Error('not implemented, seems like this will stall when using a sync function?');
  return createSyncFn<CheckSyncFn>(synckitWorkerPath);
}
