import type { Parameters } from "../../../types.js";
import type { ID, Request } from "./jsonrpc.js";

type PartialRequest<T extends MethodType> = {
  id?: ID;
  method: T;
  params: MethodTypeToMessage[T];
};

export function createRequest<T extends MethodType>({
  id,
  method,
  params,
}: PartialRequest<T>): Request<typeof params> {
  return {
    jsonrpc: "2.0+push",
    id,
    method,
    params,
  };
}

export type MethodType = "check" | "cancel" | "ping";

export interface MethodTypeToMessage {
  check: CheckMessageParams;
  cancel: CancelMessageParams;
  ping: PingMessageParams;
}

export type MessageParams =
  | CheckMessageParams
  | CancelMessageParams
  | PingMessageParams;

export interface CheckMessageParams {
  source: string;
  flags: string;
  params: Parameters;
}

export interface CancelMessageParams {
  id: ID;
}

export interface PingMessageParams {}
