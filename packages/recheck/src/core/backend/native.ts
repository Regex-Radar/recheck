import { fileURLToPath } from "node:url";
import type { AgentBackend } from "../builder.js";
import { Agent } from "./agent.js";

let agent: Agent | null = null;

export const createAgent: AgentBackend["createAgent"] =
  async (): Promise<Agent> => {
    if (agent) {
      return agent;
    }
    // NOTE: bundlers might replace `process.env['RECHECK_BIN']` with a constant string
    let bin = process.env["RECHECK_BIN"];
    if (!bin) {
      bin = resolveBin();
    }
    agent = await Agent.spawn(bin, ["agent"]);
    return agent;
  };

/** A mapping from a supported platform (OS) name to the corresponding package name component. */
const osNames: Record<string, string> = {
  darwin: "macos",
  linux: "linux",
  win32: "windows",
};

/** A mapping from a supported architecture (CPU) name to the corresponding package name component. */
const cpuNames: Record<string, string> = {
  x64: "x64",
  arm64: "arm64",
};

function resolveBin(): string {
  const os = osNames[process.platform];
  const cpu = cpuNames[process.arch];

  // When `os` or `cpu` is not available, it means this platform is not supported.
  if (!os || !cpu) {
    throw new Error(`this os (${os}) or cpu ${cpu} is not supported`);
  }

  const pkg = `recheck-${os}-${cpu}`;
  const url = import.meta.resolve(`${pkg}/recheck`);
  return fileURLToPath(url);
}
