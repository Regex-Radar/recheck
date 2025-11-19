import { spawn } from "node:child_process";
import type {
  ChildProcessByStdio,
  StdioNull,
  StdioPipe,
} from "node:child_process";
import type Stream from "node:stream";

import type { Request, Response } from "./jsonrpc.js";
import {
  createRequest,
  type MethodType,
  type MethodTypeToMessage,
} from "./protocol.js";
import type { Diagnostics, HasAbortSignal, Parameters } from "../../../types.js";

/**
 * Ref is a pair of promise `resolve`/`reject` functions, and `subscribe` handler of request.
 */
export type Ref<T = Diagnostics, M = string, E extends Error = Error> = {
  resolve: (value: T) => void;
  reject: (err: E) => void;
  subscribe?: (message: M) => void;
};

export type SubscribeFn = (message: any) => void;

type ChildProcess = ChildProcessByStdio<Stream.Writable, Stream.Readable, null>;

/**
 * Agent is a shallow `recheck agent` command wrapper.
 * It is JSON-RPC client via `child` process's stdio.
 */
export class Agent {
  private nextID = 0;
  private readonly refs = new Map<number, Ref>();

  private constructor(private readonly child: ChildProcess) {
    this.setup();
  }

  request<T extends MethodType>(
    method: T,
    params: MethodTypeToMessage[T],
    subscribe?: SubscribeFn,
  ) {
    const id = this.nextID++;
    const promise = new Promise<Diagnostics>((resolve, reject) => {
      const request: Request<typeof params> = createRequest({
        id,
        method,
        params,
      });
      this.write(request);
      this.register(id, { resolve, reject, subscribe });
    });
    return { id, promise };
  }

  notify<T extends MethodType>(method: T, params: MethodTypeToMessage[T]) {
    const request: Request<typeof params> = createRequest({ method, params });
    this.write(request);
  }

  kill() {
    this.child.unref();
    this.child.kill();
  }

  static spawn(
    command: string,
    args: string[] = [],
    stdio: [StdioPipe, StdioPipe, StdioNull] = ["pipe", "pipe", "ignore"],
  ): Promise<Agent> {
    return new Promise(async (resolve, reject) => {
      const child = spawn(command, args, {
        windowsHide: true,
        stdio,
      });

      const close = () => reject(new Error("process is closed"));
      child.on("error", reject);
      child.on("close", close);

      // Remove references from the child process
      child.unref();
      if ('unref' in child.stdin && typeof child.stdin.unref === 'function') {
        child.stdin.unref();
      }
      if ('unref' in child.stdout && typeof child.stdout.unref === 'function') {
        child.stdout.unref();
      }

      const agent = new Agent(child);
      try {
        await agent.request("ping", {}).promise;
        child.off("error", reject);
        child.off("close", close);
        resolve(agent);
      } catch (error) {
        reject(error);
      }
    });
  }

  private write<T>(request: Request<T>) {
    const text = JSON.stringify(request) + "\n";
    this.child.stdin.write(text);
  }

  private read(response: Response<Diagnostics, string>) {
    if (typeof response.id !== 'number') {
      return;
    }

    const ref = this.refs.get(response.id);
    if (!ref) {
      return;
    }

    if ("message" in response) {
      ref.subscribe?.(response.message);
      return;
    }

    if ("result" in response) {
      ref.resolve(response.result);
      this.deregister(response.id);
    }
  }

  private setup() {
    let buffer = "";

    this.child.stdout.on("data", (data: Buffer) => {
      const text = data.toString("utf-8");
      const lines = text.split("\n");
      const hasNewline = lines.length > 1;

      const lastLine = lines.pop() ?? "";
      const firstLine = lines.shift() ?? "";

      if (hasNewline) {
        lines.unshift(buffer + firstLine);
        buffer = "";
      }

      for (const line of lines) {
        if (line === "") {
          continue;
        }

        const response: Response<Diagnostics, string> = JSON.parse(line);
        this.read(response);
      }

      buffer += lastLine;
    });
  }

  private register(id: number, ref: Ref) {
    this.refs.set(id, ref);
    if (this.refs.size === 1) {
      this.child.ref();
    }
  }

  private deregister(id: number) {
    this.refs.delete(id);
    if (this.refs.size === 0) {
      this.child.unref();
    }
  }
}

export function check(
  agent: Agent,
  source: string,
  flags: string,
  params: Parameters & HasAbortSignal = {},
): Promise<Diagnostics> {
  const copy: typeof params = { ...params };

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

  const { id, promise } = agent.request(
    "check",
    { source, flags, params: copy },
    logger,
  );

  signal?.addEventListener("abort", () => {
    agent.notify("cancel", { id });
  });

  return promise;
}
