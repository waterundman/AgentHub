import { FeishuAdapter } from './feishu';
import { DingtalkAdapter } from './dingtalk';
import { WecomAdapter } from './wecom';

const PLATFORM_MAP = {
  feishu: FeishuAdapter,
  dingtalk: DingtalkAdapter,
  wecom: WecomAdapter
};

export function getPlatformAdapter(platform) {
  const AdapterClass = PLATFORM_MAP[platform];
  if (!AdapterClass) {
    throw new Error(`Unknown webhook platform: ${platform}`);
  }
  return new AdapterClass();
}

export { FeishuAdapter } from './feishu';
export { DingtalkAdapter } from './dingtalk';
export { WecomAdapter } from './wecom';