import type { Diagnostics, HasAbortSignal, Parameters } from "../../types.js";
import { check, type Agent } from "./backend/agent.js";
import type { WorkerPool } from "./backend/worker-pool.js";

export type CheckFn = (
  source: string,
  flags: string,
  params?: Parameters & HasAbortSignal,
) => Promise<Diagnostics>;
export type CheckSyncFn = (
  source: string,
  flags: string,
  params?: Parameters,
) => Diagnostics;

export type Backend = AgentBackend | WorkerPoolBackend;

export interface AgentBackend {
  createAgent(): Promise<Agent>;
}

export interface WorkerPoolBackend {
  createWorkerPool(workerPath?: string, workerPoolSize?: number): WorkerPool;
}
export async function createCheck(backend: AgentBackend): Promise<CheckFn>;
export async function createCheck(backend: WorkerPoolBackend, workerPath?: string, workerPoolSize?: number): Promise<CheckFn>;
export async function createCheck(backend: Backend, workerPath?: string, workerPoolSize?: number): Promise<CheckFn>
export async function createCheck(backend: Backend, workerPath?: string, workerPoolSize?: number): Promise<CheckFn> {
  if ("createAgent" in backend) {
    const agent = await backend.createAgent();
    return (...args) => check(agent, ...args);
  } else {
    const pool = backend.createWorkerPool(workerPath, workerPoolSize);
    return (...args) => pool.check(...args);
  }
}

export interface BackendSync {
  createCheckSync(): CheckSyncFn;
}

export function createCheckSync(backend: BackendSync): CheckSyncFn {
  return backend.createCheckSync();
}
