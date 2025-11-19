import { Worker as WorkerThread } from "node:worker_threads";
import type { WorkerInterface } from "../worker/worker-interface.js";

// these imports will be handled by an esbuild plugin
// `workerSourceCode` will be the source code of the workers, to allow for calling `createInlineWorker()`
// it is important that these value is only used in the `createInlineWorker` function body to make sure the ScalaJS code base is removed
// by tree-shaking / dead code elimination
import threadWorkerSourceCode from "./thread.worker.ts?raw";
// `workerPath` will be a (default) path to the worker source file
// it is important that the `createWorker` functions allow for the caller to override these values,
// as the path's might vary based on the compiletime and runtime environments
const defaultThreadWorkerPath = import.meta.resolve("../thread.worker.js");
// TODO: fix this path

function createWorkerInterface(thread: WorkerThread): WorkerInterface {
  return {
    addEventListener(name: "message", callback: (data: unknown) => void): void {
      thread.on("message", (data: unknown) => callback({ data }));
    },
    postMessage(message: string): void {
      thread.postMessage(message);
    },
    terminate() {
      return thread.terminate();
    },
    ref() {
      thread.ref();
    },
    unref() {
      thread.unref();
    },
  };
}

export function createInlineThreadWorker(): WorkerInterface {
  const thread = new WorkerThread(threadWorkerSourceCode, { eval: true });
  return createWorkerInterface(thread);
}

export function createThreadWorker(
  threadWorkerPath: string | URL = defaultThreadWorkerPath,
): WorkerInterface {
  if (typeof threadWorkerPath === 'string' && threadWorkerPath.startsWith("file://")) {
    threadWorkerPath = new URL(threadWorkerPath);
  }
  const thread = new WorkerThread(threadWorkerPath);
  return createWorkerInterface(thread);
}
