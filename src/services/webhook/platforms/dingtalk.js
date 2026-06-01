import crypto from 'crypto';

export class DingtalkAdapter {
  constructor() {
    this.baseUrl = 'https://oapi.dingtalk.com/robot/send';
  }

  // 发送消息
  async send(config, message) {
    const { webhookUrl, secret } = config;
    
    let url = webhookUrl;
    
    // 如果有签名密钥，添加签名参数
    if (secret) {
      const timestamp = Date.now();
      const sign = this.generateSign(timestamp, secret);
      url += `&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
    }

    // 构建请求体
    const body = this.buildBody(message);

    // 发送请求
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (result.errcode !== 0) {
      throw new Error(`Dingtalk webhook error: ${result.errmsg}`);
    }

    return { success: true, platform: 'dingtalk', data: result };
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
        title: message.title,
        text: `# ${message.title}\n\n${message.content}`
      }
    };
  }

  // 生成签名
  generateSign(timestamp, secret) {
    const stringToSign = `${timestamp}\n${secret}`;
    const hmac = crypto.createHmac('sha256', stringToSign);
    return hmac.update('').digest('base64');
  }
}

export default DingtalkAdapter;