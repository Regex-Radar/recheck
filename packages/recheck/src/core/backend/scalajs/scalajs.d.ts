/**
 * imports of this module should be resolved by an esbuild plugin
 */
declare module "#scalajs/recheck" {
  export const check: import("../../builder").CheckSyncFn;
}
