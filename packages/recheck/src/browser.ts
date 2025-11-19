import type { CheckFn, CheckSyncFn } from "./core/builder.js";
import {
  webWorker,
  scalajs,
  createCheck,
  createCheckSync,
} from "./core/index.js";

let checkFn: CheckFn | undefined;
export const check: CheckFn = async (...args) => {
  if (!checkFn) {
    checkFn = await createCheck(webWorker);
  }
  return checkFn!(...args);
};

let checkSyncFn: CheckSyncFn | undefined;
export const checkSync: CheckSyncFn = (...args) => {
  if (!checkSyncFn) {
    checkSyncFn = createCheckSync(scalajs);
  }
  return checkSyncFn!(...args);
};
