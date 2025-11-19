import type { MessagePort as NodeMessagePort } from "node:worker_threads";

export interface WorkerMessagePort {
  onMessage(callback: (message: string) => void): void;
  postMessage(message: string): void;
}

export function createThreadPort(port: NodeMessagePort): WorkerMessagePort {
  return {
    onMessage(callback: (message: string) => void): void {
      port.on("message", callback);
    },
    postMessage(message: string): void {
      port.postMessage(message);
    },
  };
}

type WebMessagePort = Pick<Window, "addEventListener" | "postMessage">;

export function createWebPort(port: WebMessagePort): WorkerMessagePort {
  return {
    onMessage(callback: (message: string) => void): void {
      port.addEventListener("message", ({ data }) => callback(data));
    },
    postMessage(message: string): void {
      port.postMessage(message);
    },
  };
}
