import { getPlatformAdapter } from './platforms';

export class WebhookService {
  constructor(config = {}) {
    this.config = config;
    this.projectName = config.projectName || 'AgentHub';
  }

  // 发送消息
  async send(platform, webhookConfig, message) {
    const adapter = getPlatformAdapter(platform);
    
    // 在消息中添加项目名称标识
    const enrichedMessage = this.addProjectIdentifier(message);
    
    return await adapter.send(webhookConfig, enrichedMessage);
  }

  // 发送任务完成通知
  async sendTaskComplete(webhookConfig, taskResult) {
    const message = {
      type: 'task_complete',
      title: `✅ 任务完成 - ${this.projectName}`,
      content: `Agent: ${taskResult.agentName}\n任务: ${taskResult.task}\n耗时: ${taskResult.duration}ms`,
      data: taskResult
    };
    
    return await this.send(webhookConfig.platform, webhookConfig, message);
  }

  // 发送错误通知
  async sendError(webhookConfig, error) {
    const message = {
      type: 'error',
      title: `❌ 执行错误 - ${this.projectName}`,
      content: `错误: ${error.message}\nAgent: ${error.agentName || 'Unknown'}`,
      data: error
    };
    
    return await this.send(webhookConfig.platform, webhookConfig, message);
  }

  // 发送状态报告
  async sendStatusReport(webhookConfig, status) {
    const message = {
      type: 'status',
      title: `📊 状态报告 - ${this.projectName}`,
      content: `运行中: ${status.running}\n完成: ${status.completed}\n失败: ${status.failed}`,
      data: status
    };
    
    return await this.send(webhookConfig.platform, webhookConfig, message);
  }

  // 测试连接
  async testConnection(platform, webhookConfig) {
    const message = {
      type: 'test',
      title: `🔗 连接测试 - ${this.projectName}`,
      content: '这是一条测试消息，用于验证Webhook配置是否正确。',
      timestamp: Date.now()
    };
    
    return await this.send(platform, webhookConfig, message);
  }

  // 添加项目名称标识
  addProjectIdentifier(message) {
    return {
      ...message,
      project: this.projectName,
      timestamp: message.timestamp || Date.now()
    };
  }
}

export default WebhookService;