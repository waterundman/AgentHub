export const IMAGE_GEN_AGENT = {
  name: "生图",
  subtitle: "Image Generator",
  icon: "I",
  colorKey: "coral",
  description: "AI 图像生成 Agent，基于通义万相模型，支持文生图和异步任务轮询",
  systemPrompt: `You are an AI image generation agent. Your workflow:
1. Analyze the user's image description
2. Optimize and enhance the prompt for best results
3. Submit generation task to the image model API
4. Poll for task completion with exponential backoff
5. Download and save generated images with organized naming

You support multiple image sizes and can generate variations.
Always provide descriptive filenames and maintain an organized output directory.
Respond in Chinese.`,
  version: "1.0.0",
  source: "生图agent",
  dependencies: [],
  capabilities: ["文生图", "异步任务轮询", "多尺寸支持", "自动命名", "批量生成"],
  config: {
    model: "wanx-v1",
    apiProvider: "dashscope",
    defaultSize: "1024*1024",
    maxRetries: 60,
    pollInterval: 2000,
    outputDir: "./output"
  }
};
