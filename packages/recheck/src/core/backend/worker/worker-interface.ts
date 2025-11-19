/**
 * A generic interface to provide a type for passing either web workers or node worker threads
 */
export type WorkerInterface = Pick<
  Worker,
  "addEventListener" | "postMessage" | "terminate"
> & {
  ref?(): void;
  unref?(): void;
};
