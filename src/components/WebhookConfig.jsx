import React, { useState } from 'react';
import { Icon } from './Icon';
import { useWebhookStore } from '../store/useWebhookStore';
import { WebhookService } from '../services/webhook';

const PLATFORMS = [
  { id: 'feishu', name: '飞书', icon: 'MessageSquare' },
  { id: 'dingtalk', name: '钉钉', icon: 'MessageCircle' },
  { id: 'wecom', name: '企业微信', icon: 'MessagesSquare' }
];

export function WebhookConfig({ onClose }) {
  const { configs, addConfig, updateConfig, deleteConfig, setDefault } = useWebhookStore();
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // 新配置表单
  const [form, setForm] = useState({
    name: '',
    platform: 'feishu',
    webhookUrl: '',
    secret: '',
    projectName: 'AgentHub'
  });

  // 添加配置
  const handleAdd = () => {
    if (!form.name || !form.webhookUrl) return;
    
    addConfig(form);
    setForm({ name: '', platform: 'feishu', webhookUrl: '', secret: '', projectName: 'AgentHub' });
    setShowAdd(false);
  };

  // 测试连接
  const handleTest = async (config) => {
    setTesting(config.id);
    setTestResult(null);

    try {
      const service = new WebhookService({ projectName: config.projectName });
      const result = await service.testConnection(config.platform, config);
      setTestResult({ success: true, message: '连接成功！' });
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="webhook-config">
      <div className="webhook-header">
        <h3>
          <Icon name="Webhook" size={16} />
          Webhook 配置
        </h3>
        <button onClick={onClose} className="close-btn">
          <Icon name="X" size={16} />
        </button>
      </div>

      {/* 配置列表 */}
      <div className="config-list">
        {configs.length === 0 ? (
          <div className="empty-state">
            <Icon name="Webhook" size={32} />
            <p>暂无Webhook配置</p>
            <p className="hint">点击下方按钮添加配置</p>
          </div>
        ) : (
          configs.map(config => (
            <div key={config.id} className={`config-item ${config.isDefault ? 'default' : ''}`}>
              <div className="config-info">
                <div className="config-icon">
                  <Icon name={PLATFORMS.find(p => p.id === config.platform)?.icon || 'Webhook'} size={20} />
                </div>
                <div className="config-details">
                  <div className="config-name">{config.name}</div>
                  <div className="config-platform">{PLATFORMS.find(p => p.id === config.platform)?.name}</div>
                  <div className="config-url">{config.webhookUrl.substring(0, 30)}...</div>
                </div>
              </div>
              <div className="config-actions">
                <button 
                  onClick={() => handleTest(config)}
                  disabled={testing === config.id}
                  title="测试连接"
                >
                  <Icon name={testing === config.id ? 'Loader' : 'Zap'} size={14} />
                </button>
                <button onClick={() => setDefault(config.id)} title="设为默认">
                  <Icon name="Star" size={14} />
                </button>
                <button onClick={() => deleteConfig(config.id)} title="删除">
                  <Icon name="Trash" size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 测试结果 */}
      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          <Icon name={testResult.success ? 'Check' : 'X'} size={14} />
          <span>{testResult.message}</span>
        </div>
      )}

      {/* 添加配置 */}
      {showAdd ? (
        <div className="add-form">
          <h4>添加 Webhook 配置</h4>
          
          <div className="form-field">
            <label>配置名称</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="例如：飞书通知"
            />
          </div>

          <div className="form-field">
            <label>平台</label>
            <select
              value={form.platform}
              onChange={e => setForm({ ...form, platform: e.target.value })}
            >
              {PLATFORMS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Webhook URL</label>
            <input
              type="text"
              value={form.webhookUrl}
              onChange={e => setForm({ ...form, webhookUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {(form.platform === 'feishu' || form.platform === 'dingtalk') && (
            <div className="form-field">
              <label>签名密钥（可选）</label>
              <input
                type="password"
                value={form.secret}
                onChange={e => setForm({ ...form, secret: e.target.value })}
                placeholder="用于消息签名验证"
              />
            </div>
          )}

          <div className="form-field">
            <label>项目名称</label>
            <input
              type="text"
              value={form.projectName}
              onChange={e => setForm({ ...form, projectName: e.target.value })}
              placeholder="AgentHub"
            />
          </div>

          <div className="form-actions">
            <button onClick={() => setShowAdd(false)} className="cancel-btn">取消</button>
            <button onClick={handleAdd} className="add-btn" disabled={!form.name || !form.webhookUrl}>
              <Icon name="Plus" size={14} />
              添加
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="add-config-btn">
          <Icon name="Plus" size={14} />
          添加 Webhook 配置
        </button>
      )}

      <style>{`
        .webhook-config {
          padding: 16px;
          background: var(--color-background-primary);
          border-radius: 12px;
          border: 1px solid var(--color-border-secondary);
        }
        .webhook-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .webhook-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }
        .config-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .config-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--color-background-secondary);
          border-radius: 8px;
          border: 1px solid var(--color-border-tertiary);
        }
        .config-item.default {
          border-color: var(--color-border-info);
        }
        .config-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .config-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-background-primary);
          border-radius: 8px;
        }
        .config-name {
          font-size: 13px;
          font-weight: 500;
        }
        .config-platform {
          font-size: 11px;
          color: var(--color-text-secondary);
        }
        .config-url {
          font-size: 11px;
          color: var(--color-text-tertiary);
          font-family: var(--font-mono);
        }
        .config-actions {
          display: flex;
          gap: 4px;
        }
        .config-actions button {
          padding: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--color-text-secondary);
          border-radius: 4px;
        }
        .config-actions button:hover {
          background: var(--color-background-primary);
        }
        .add-config-btn {
          width: 100%;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          border: 1px dashed var(--color-border-secondary);
          border-radius: 8px;
          cursor: pointer;
          color: var(--color-text-secondary);
          font-size: 13px;
        }
        .add-form {
          padding: 16px;
          background: var(--color-background-secondary);
          border-radius: 8px;
        }
        .form-field {
          margin-bottom: 12px;
        }
        .form-field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .form-field input, .form-field select {
          width: 100%;
          padding: 8px;
          font-size: 13px;
          border: 1px solid var(--color-border-secondary);
          border-radius: 6px;
          background: var(--color-background-primary);
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 16px;
        }
        .test-result {
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .test-result.success {
          background: var(--color-background-success);
          color: var(--color-text-success);
        }
        .test-result.error {
          background: var(--color-background-error);
          color: var(--color-text-error);
        }
      `}</style>
    </div>
  );
}
