export class WecomAdapter {
  constructor() {
    this.baseUrl = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send';
  }

  // 发送消息
  async send(config, message) {
    const { webhookUrl } = config;

    // 构建请求体
    const body = this.buildBody(message);

    // 发送请求
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (result.errcode !== 0) {
      throw new Error(`Wecom webhook error: ${result.errmsg}`);
    }

    return { success: true, platform: 'wecom', data: result };
  }

  // 构建请求体
  buildBody(message) {
    switch (message.type) {
      case 'task_complete':
      case 'error':
      case 'status':
      case 'test':
      default:
        return this.buildTextBody(message);
    }
  }

  // 构建文本消息
  buildTextBody(message) {
    return {
      msgtype: 'text',
      text: {
        content: `【${message.project || 'AgentHub'}】${message.title}\n\n${message.content}`
      }
    };
  }

  // 构建Markdown消息
  buildMarkdownBody(message) {
    return {
      msgtype: 'markdown',
      markdown: {
        content: `# ${message.title}\n\n${message.content}`
      }
    };
  }
}

export default WecomAdapter;