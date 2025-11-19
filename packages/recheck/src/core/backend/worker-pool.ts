import type {
  Diagnostics,
  HasAbortSignal,
  Parameters,
} from "../../../types.js";
import { Ref, SubscribeFn } from "./agent.js";
import type { ID, Response } from "./jsonrpc.js";
import type { WorkerInterface } from "./worker/worker-interface.js";

type PendingRequest = Ref & {
  id: ID;
  source: string;
  flags: string;
  params: Parameters;
  worker?: WorkerInterface;
  onabort?: () => void;
} & HasAbortSignal;

export class WorkerPool {
  private runningWorkerSize = 0;
  private readonly freeWorkers: WorkerInterface[] = [];
  private readonly pendingRequests = new Map<number, PendingRequest>();
  private readonly queue: PendingRequest[] = [];
  private nextID = 0;

  constructor(
    private readonly createWorker: () => WorkerInterface,
    private readonly maxWorkerSize = 1,
  ) {}

  check(
    source: string,
    flags: string,
    params: Parameters & HasAbortSignal = {},
  ): Promise<Diagnostics> {
    const id = this.nextID++;
    const copy = { ...params };

    // remove signal from the params, as its not serializable
    const signal = copy.signal;
    if (signal) {
      delete copy.signal;
    }

    // remove logger from the params, as its not serializable
    // keep an empty object to signal to the backend it should send logs
    const logger = copy.logger;
    if (logger) {
      copy.logger = {} as SubscribeFn;
    }

    return new Promise((resolve, reject) => {
      const pendingRequest: PendingRequest = {
        id,
        source,
        flags,
        params: copy,
        resolve,
        reject,
        subscribe: logger,
        signal,
      };
      this.pendingRequests.set(id, pendingRequest);
      this.queue.push(pendingRequest);
      this.wake();
    });
  }

  kill() {
    for (const pendingRequest of this.pendingRequests.values()) {
      this.cancel(pendingRequest);
    }
    for (const worker of this.freeWorkers) {
      worker.terminate();
    }
    this.runningWorkerSize = 0;
  }

  private workerId = 0;
  private wake() {
    while (this.queue.length > 0) {
      let worker = this.freeWorkers.shift();
      if (!worker) {
        if (this.runningWorkerSize <= this.maxWorkerSize) {
          const id = this.workerId++;
          this.runningWorkerSize += 1;
          worker = this.createWorker();
          this.setupWorker(worker);
        } else {
          break;
        }
      }

      const pendingRequest = this.queue.shift()!;
      if (pendingRequest.signal?.aborted) {
        this.cancel(pendingRequest);
        this.freeWorkers.unshift(worker);
        continue;
      }

      worker.ref?.();
      pendingRequest.worker = worker;

      const request = {
        id: pendingRequest.id,
        source: pendingRequest.source,
        flags: pendingRequest.flags,
        params: pendingRequest.params,
      };
      const json = JSON.stringify(request);
      worker.postMessage(json);

      if (pendingRequest.signal) {
        pendingRequest.onabort = () => this.cancel(pendingRequest);
        pendingRequest.signal.addEventListener("abort", pendingRequest.onabort);
      }
    }
  }

  private setupWorker(worker: WorkerInterface) {
    worker.addEventListener("message", ({ data }: MessageEvent<string>) => {
      const response: Response<Diagnostics, string> = JSON.parse(data);

      if (typeof response.id !== "number") {
        return;
      }

      const pendingRequest = this.pendingRequests.get(response.id);
      if (!pendingRequest) {
        return;
      }

      if ("message" in response) {
        pendingRequest.subscribe?.(response.message);
        return;
      }

      if ("result" in response) {
        this.deregister(pendingRequest);
        pendingRequest.resolve(response.result);
        worker.unref?.();
        this.freeWorkers.push(worker);
        this.wake();
      }
    });

    worker.unref?.();

    return worker;
  }

  private cancel(pendingRequest: PendingRequest) {
    this.deregister(pendingRequest);

    pendingRequest.resolve({
      source: pendingRequest.source,
      flags: pendingRequest.flags,
      status: "unknown",
      error: { kind: "cancel" },
    });

    if (pendingRequest.worker) {
      this.runningWorkerSize -= 1;
      pendingRequest.worker.terminate();
    }

    this.wake();
  }

  private deregister(pendingRequest: PendingRequest) {
    this.pendingRequests.delete(pendingRequest.id);

    if (pendingRequest.signal && pendingRequest.onabort) {
      pendingRequest.signal.removeEventListener(
        "abort",
        pendingRequest.onabort,
      );
    }
  }
}
