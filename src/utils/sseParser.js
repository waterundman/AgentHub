/**
 * SSE (Server-Sent Events) 解析器
 * 支持增量数据提取、错误处理、缓冲区管理
 */

export class SSEParser {
  constructor(options = {}) {
    this.onData = options.onData || (() => {});
    this.onDone = options.onDone || (() => {});
    this.onError = options.onError || (() => {});
    this.buffer = '';
    this.eventData = '';
    this.eventType = '';
    this.retry = null;
  }

  /**
   * 解析 ReadableStream 流
   * @param {ReadableStream} stream - fetch response.body
   * @returns {Promise<void>}
   */
  async parse(stream) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          this.flushBuffer();
          this.onDone();
          break;
        }

        this.buffer += decoder.decode(value, { stream: true });
        this.processBuffer();
      }
    } catch (err) {
      this.onError(err);
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 通过回调逐步喂入文本块
   * @param {string} chunk - 文本块
   */
  feed(chunk) {
    this.buffer += chunk;
    this.processBuffer();
  }

  /**
   * 信号流结束
   */
  finish() {
    this.flushBuffer();
    this.onDone();
  }

  processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this.parseLine(line);
    }
  }

  flushBuffer() {
    if (this.buffer) {
      this.parseLine(this.buffer);
      this.buffer = '';
    }
  }

  /**
   * 解析单行SSE数据
   * @param {string} line - 单行内容
   */
  parseLine(line) {
    const trimmed = line.replace(/\r$/, '');

    if (trimmed === '') {
      this.dispatchEvent();
      return;
    }

    if (trimmed.startsWith(':')) {
      return;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      this.eventData += trimmed;
      return;
    }

    const field = trimmed.slice(0, colonIndex);
    let value = trimmed.slice(colonIndex + 1);
    if (value.startsWith(' ')) {
      value = value.slice(1);
    }

    switch (field) {
      case 'event':
        this.eventType = value;
        break;
      case 'data':
        this.eventData += (this.eventData ? '\n' : '') + value;
        break;
      case 'id':
        break;
      case 'retry':
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) this.retry = parsed;
        break;
      default:
        break;
    }
  }

  dispatchEvent() {
    if (!this.eventData) {
      this.eventType = '';
      return;
    }

    let parsedData = null;
    try {
      parsedData = JSON.parse(this.eventData);
    } catch {
      parsedData = this.eventData;
    }

    this.onData({
      type: this.eventType || 'message',
      data: parsedData,
      raw: this.eventData,
    });

    this.eventData = '';
    this.eventType = '';
  }

  /**
   * 重置解析器状态
   */
  reset() {
    this.buffer = '';
    this.eventData = '';
    this.eventType = '';
    this.retry = null;
  }
}

/**
 * 从 SSE JSON 数据中提取文本内容
 * 兼容 OpenAI / Anthropic / DeepSeek 等主流格式
 * @param {object} json - 解析后的 JSON
 * @param {string} provider - 提供商标识
 * @returns {string}
 */
export function extractStreamText(json, provider = 'openai') {
  if (!json || typeof json !== 'object') return '';

  if (provider === 'anthropic') {
    if (json.type === 'content_block_delta') {
      return json.delta?.text || '';
    }
    return '';
  }

  return json.choices?.[0]?.delta?.content || '';
}

/**
 * 检查是否为流结束标记
 * @param {string} data - 原始数据字符串
 * @returns {boolean}
 */
export function isStreamDone(data) {
  return data === '[DONE]' || data?.type === 'message_stop';
}
