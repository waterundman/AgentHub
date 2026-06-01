import crypto from 'crypto';

export class FeishuAdapter {
  constructor() {
    this.baseUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook';
  }

  // 发送消息
  async send(config, message) {
    const { webhookUrl, secret } = config;
    
    // 构建请求体
    const body = this.buildBody(message);
    
    // 如果有签名密钥，添加签名
    if (secret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const sign = this.generateSign(timestamp, secret);
      body.timestamp = timestamp;
      body.sign = sign;
    }

    // 发送请求
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(`Feishu webhook error: ${result.msg}`);
    }

    return { success: true, platform: 'feishu', data: result };
  }

  // 构建请求体
  buildBody(message) {
    // 根据消息类型构建不同的请求体
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
      msg_type: 'text',
      content: {
        text: `【${message.project || 'AgentHub'}】${message.title}\n\n${message.content}`
      }
    };
  }

  // 构建富文本消息
  buildPostBody(message) {
    return {
      msg_type: 'post',
      content: {
        post: {
          zh_cn: {
            title: message.title,
            content: [
              [
                { tag: 'text', text: message.content }
              ]
            ]
          }
        }
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

export default FeishuAdapter;