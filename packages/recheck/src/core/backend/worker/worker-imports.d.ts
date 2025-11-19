/**
 * imports of this module should be resolved by an esbuild plugin
 */
declare module "*?raw" {
  const sourceCode: string;
  export default sourceCode;
}
