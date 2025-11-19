import type { WorkerInterface } from "../worker/worker-interface.js";

// these imports will be handled by an esbuild plugin
// `workerSourceCode` will be the source code of the workers, to allow for calling `createInlineWorker()`
// it is important that these value is only used in the `createInlineWorker` function body to make sure the ScalaJS code base is removed
// by tree-shaking / dead code elimination
import webWorkerSourceCode from "./web.worker.ts?raw";
// `workerPath` will be a (default) path to the worker source file
// it is important that the `createWorker` functions allow for the caller to override these values,
// as the path's might vary based on the compiletime and runtime environments
const defaultwebWorkerPath = import.meta.resolve("../web.worker.js");
// TODO: fix this path

export function createInlineWebWorker(): WorkerInterface {
  const blob = new Blob([webWorkerSourceCode], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url);
  return worker;
}

export function createWebWorker(
  webWorkerPath: string | URL = defaultwebWorkerPath,
): WorkerInterface {
  if (
    typeof webWorkerPath === "string" &&
    webWorkerPath.startsWith("file://")
  ) {
    webWorkerPath = new URL(webWorkerPath);
  }
  const worker = new Worker(webWorkerPath);
  return worker;
}
