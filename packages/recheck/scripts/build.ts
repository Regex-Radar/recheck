import { build as esbuild } from "esbuild";

import type {
  BuildOptions,
  Plugin,
  PluginBuild,
  OnLoadArgs,
} from "esbuild";

const isProduction = process.env["NODE_ENV"] === "production";

const inlineWorkerPlugin: Plugin = {
  name: "inline-worker",
  setup(build: PluginBuild) {
    const { plugins, ...initialOptions } = build.initialOptions;
    const filter = /[.\\/]worker\.(?:js|ts)$/;
    build.onLoad({ filter }, async (args: OnLoadArgs) => {
      const result = await esbuild({
        ...initialOptions,
        entryPoints: [args.path],
        inject: [`src/inject/worker-${initialOptions.platform}.ts`],
        format: "iife",
        target: "es2020",
        write: false,
        logLevel: 'error',
        plugins: plugins?.filter((plugin) => plugin !== inlineWorkerPlugin),
        sourcemap: isProduction ? false : "inline",
      });
      const workerCode = result.outputFiles![0].text;

      let contents = "";
      contents += `const script = ${JSON.stringify(workerCode)};\n`;
      contents += "\n";
      contents += "export default function createInlineWorker() {\n";
      contents +=
        '  const blob = new Blob([script], { type: "text/javascript" });\n';
      contents += "  const url = URL.createObjectURL(blob);\n";
      contents += "  const worker = new Worker(url);\n";
      contents += "  URL.revokeObjectURL(url);\n";
      contents += "  return worker;\n";
      contents += "}\n";

      return {
        contents,
        loader: "js",
      };
    });
  },
};

type SimpleBuildOptions = Pick<BuildOptions, 'entryPoints' | 'inject' | 'format' | 'platform' | 'outfile' | 'plugins'>;

async function build(options: SimpleBuildOptions) {
  const buildOptions: BuildOptions = {
    bundle: true,
    minify: isProduction,
    target: "es2020",
    logLevel: "error",
    packages: 'external',
    ...options,
  };
  if (buildOptions.format === 'esm') {
    if (buildOptions.outfile) {
      buildOptions.outfile = buildOptions.outfile.replace(/\.js$/, '.mjs');
    }
    // by default esbuild will try `main` package imports before `module`, causing to often bundle dependencies as CJS
    // setting `mainFields` will look for a `module` format (ESM) before `main` (usually CJS)
    // see: https://esbuild.github.io/api/#main-fields
    buildOptions.mainFields = ['module', 'main'];
    if (buildOptions.platform === 'browser') {
      // if `platform` is browser, have esbuild check for a `browser` format over `module` and `main`
      buildOptions.mainFields.unshift('browser');
    }
  }
  return await esbuild(buildOptions);
}

const main = async () => {
  const formats: BuildOptions['format'][] = ['cjs', 'esm'];

  for (const format of formats) {
    await build({
      entryPoints: ["src/main.ts"],
      inject: ["src/inject/main.ts"],
      format,
      platform: "node",
      plugins: [inlineWorkerPlugin],
      outfile: "lib/main.js",
    });
  }

  for (const format of formats) {
    await build({
      entryPoints: ["src/browser.ts"],
      format,
      platform: "browser",
      plugins: [inlineWorkerPlugin],
      outfile: "lib/browser.js",
    });
  }

  for (const format of formats) {
    await build({
      entryPoints: ["src/synckit-worker.ts"],
      format,
      platform: "node",
      plugins: [inlineWorkerPlugin],
      outfile: "lib/synckit-worker.js",
    });
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
