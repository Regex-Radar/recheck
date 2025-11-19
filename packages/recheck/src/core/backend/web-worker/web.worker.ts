import { check } from "#scalajs/recheck";
import { createWebPort } from "../worker/port.js";
import { bootstrapWorker } from "../worker/bootstrap.worker.js";

if (!self) {
  const message = `'self' is not available, this is required to run in a web worker`;
  throw new Error(message);
}

const port = createWebPort(self);
bootstrapWorker(port, check);
