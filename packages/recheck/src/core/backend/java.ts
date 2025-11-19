import { fileURLToPath } from "node:url";
import { Agent } from "./agent.js";
import type { AgentBackend } from "../builder.js";

let agent: Agent | null = null;

export const createAgent: AgentBackend["createAgent"] =
  async (): Promise<Agent> => {
    if (agent) {
      return agent;
    }
    // NOTE: bundlers might replace `process.env['RECHECK_JAR']` with a constant string
    let jar = process.env["RECHECK_JAR"];
    if (!jar) {
      jar = resolveJar();
    }
    agent = await Agent.spawn("java", ["-jar", jar, "agent"]);
    return agent;
  };

function resolveJar(): string {
  const url = import.meta.resolve(`recheck-jar/recheck.jar`);
  return fileURLToPath(url);
}
