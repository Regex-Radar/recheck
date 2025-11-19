import { parentPort } from "node:worker_threads";
import { check } from "#scalajs/recheck";
import { bootstrapWorker } from "../worker/bootstrap.worker.js";
import { createThreadPort } from "../worker/port.js";

if (!parentPort) {
  const message = `'parentPort' is not set, this is required to run in a node worker thread`;
  throw new Error(message);
}

const port = createThreadPort(parentPort);
bootstrapWorker(port, check);
