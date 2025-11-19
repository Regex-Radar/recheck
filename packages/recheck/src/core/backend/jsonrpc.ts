type JsonObject = { [key: string]: JsonValue };

type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;

export type ID = number;

export interface Request<T = JsonValue> {
  jsonrpc: string;
  id?: ID;
  method: string;
  params: T;
}

export type Response<T, M> =
  | ResultResponse<T>
  | PushResponse<M>
  | ErrorResponse;

export interface ResultResponse<T = JsonValue> {
  jsonrpc: string;
  id: ID;
  result: T;
}

export interface PushResponse<T = JsonValue> {
  jsonrpc: string;
  id: ID;
  message: T;
}

export interface ErrorResponse {
  jsonrpc: string;
  id?: ID;
  error: { code: number; message: string };
}
