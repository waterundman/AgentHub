/**
 * Image Generation Agent - 标准化接口
 * 将生图 agent 适配到 AgentHub 范式
 */

import { IMAGE_GEN_AGENT } from "../agent";
import { generateImage as _generateImage, waitForTaskComplete } from "./image_gen.js";

export async function generateImage(prompt, options = {}) {
  const config = { ...IMAGE_GEN_AGENT.config, ...options };
  
  const result = await _generateImage(prompt, {
    size: options.size || config.defaultSize,
    n: options.n || 1,
    seed: options.seed,
  });

  return {
    type: "image_generation",
    agent: IMAGE_GEN_AGENT.name,
    prompt,
    model: config.model,
    size: options.size || config.defaultSize,
    status: result.success ? "completed" : "failed",
    images: result.images || [],
    outputDir: config.outputDir,
  };
}

export async function generateBatch(prompts, options = {}) {
  const config = { ...IMAGE_GEN_AGENT.config, ...options };
  const results = [];

  for (const prompt of prompts) {
    try {
      const result = await generateImage(prompt, options);
      results.push(result);
    } catch (err) {
      results.push({
        type: "image_generation",
        agent: IMAGE_GEN_AGENT.name,
        prompt,
        status: "failed",
        error: err.message,
      });
    }
  }

  return {
    type: "batch_image_generation",
    agent: IMAGE_GEN_AGENT.name,
    results,
    total: prompts.length,
    succeeded: results.filter(r => r.status === "completed").length,
    failed: results.filter(r => r.status === "failed").length,
  };
}

export { IMAGE_GEN_AGENT };
