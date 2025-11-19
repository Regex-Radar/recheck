import {
  createCheck,
  createCheckSync,
  java,
  native,
  scalajs,
  synckit,
  threadWorker,
  webWorker,
  worker,
} from "./core/index.js";
import type {
  Backend,
  BackendSync,
  CheckFn,
  CheckSyncFn,
} from "./core/builder.js";

let checkFn: CheckFn | undefined;
export const check: CheckFn = async (...args) => {
  throwIfTypeError(args[0], args[1]);
  if (!checkFn) {
    let backend: Backend | undefined;
    const RECHECK_BACKEND = process.env["RECHECK_BACKEND"] ?? "auto";
    switch (RECHECK_BACKEND) {
      case "auto": {
        throw new Error(`invalid backend: auto`);
      }
      case "native": {
        backend = native;
        break;
      }
      case "java": {
        backend = java;
        break;
      }
      case "web-worker": {
        backend = webWorker;
        break;
      }
      case "thread-worker": {
        backend = threadWorker;
        break;
      }
      case "worker": {
        backend = worker;
        break;
      }
    }
    if (!backend) {
      throw new Error(`invalid backend: ${RECHECK_BACKEND}`);
    }
    checkFn = await createCheck(backend);
  }
  return checkFn!(...args);
};

let checkSyncFn: CheckSyncFn | undefined;
export const checkSync: CheckSyncFn = (...args) => {
  throwIfTypeError(args[0], args[1]);
  if (!checkSyncFn) {
    let backend: BackendSync | undefined;
    const RECHECK_SYNC_BACKEND = process.env["RECHECK_SYNC_BACKEND"] ?? "auto";
    switch (RECHECK_SYNC_BACKEND) {
      case "auto": {
        throw new Error(`invalid backend: auto`);
      }
      case "synckit": {
        backend = synckit;
        break;
      }
      case "pure": {
        backend = scalajs;
        break;
      }
    }
    if (!backend) {
      throw new Error(`invalid backend: ${RECHECK_SYNC_BACKEND}`);
    }
    checkSyncFn = createCheckSync(backend);
  }
  return checkSyncFn!(...args);
};

function throwIfTypeError(source: string, flags: string) {
  if (typeof source !== "string") {
    throw new TypeError(
      `Expected 'source' to be a string, but got ${typeof source}`,
    );
  }
  if (typeof flags !== "string") {
    throw new TypeError(
      `Expected 'flags' to be a string, but got ${typeof flags}`,
    );
  }
}
