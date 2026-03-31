import { PPT_MASTER_AGENT } from "../../projects/ppt-master/agent";
import { CLEANER_AGENT } from "../../projects/cleaner/agent";
import { IMAGE_GEN_AGENT } from "../../projects/image-gen/agent";

export const PROJECT_AGENTS = [
  PPT_MASTER_AGENT,
  CLEANER_AGENT,
  IMAGE_GEN_AGENT,
];

export function getProjectAgent(name) {
  return PROJECT_AGENTS.find(a => a.name === name);
}

export function getProjectAgentsByCapability(capability) {
  return PROJECT_AGENTS.filter(a => a.capabilities.includes(capability));
}

export function registerProjectAgent(agent) {
  PROJECT_AGENTS.push(agent);
}
