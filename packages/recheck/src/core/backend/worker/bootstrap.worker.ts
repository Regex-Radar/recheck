import type { WorkerMessagePort } from "./port.js";
import type { CheckSyncFn } from "../../builder.js";
import type { Diagnostics, Parameters } from "../../../../types.js";

type Logger = (message: string) => void;

function createLogger(port: WorkerMessagePort, id: unknown): Logger {
  return (message: string) => {
    const stringified = JSON.stringify({ id, message });
    port.postMessage(stringified);
  };
}

interface Request {
  id: unknown;
  source: string;
  flags: string;
  params: Parameters;
}

interface Response {
  id: unknown;
  result: Diagnostics;
}

export function bootstrapWorker(port: WorkerMessagePort, check: CheckSyncFn) {
  port.onMessage((message) => {
    const request: Request = JSON.parse(message);
    let logger: Logger | undefined;
    if (request.params.logger !== undefined) {
      logger = createLogger(port, request.id);
    }
    const result = check(request.source, request.flags, {
      ...request.params,
      logger,
    });
    const response: Response = { id: request.id, result };
    port.postMessage(JSON.stringify(response));
  });
}
