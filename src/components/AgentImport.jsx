import React, { useState, useCallback } from 'react';
import { Icon } from './Icon';

export function AgentImport({ onComplete, onCancel }) {
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const agentFile = files.find(f => f.name.endsWith('.agent'));

    if (agentFile) {
      await handleFile(agentFile);
    } else {
      setError('请选择 .agent 文件');
    }
  }, []);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleFile(file);
    }
  }, []);

  const handleFile = async (file) => {
    setImporting(true);
    setProgress(0);
    setError(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const content = await readFileAsText(file);
      const packageData = JSON.parse(content);

      clearInterval(progressInterval);
      setProgress(100);

      setPreview({
        fileName: file.name,
        manifest: packageData.manifest,
        fileCount: Object.keys(packageData.files || {}).length
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;

    setImporting(true);
    setProgress(0);

    try {
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      onComplete(preview.manifest);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  return (
    <div className="agent-import">
      <h3>
        <Icon name="Download" size={16} />
        导入 Agent
      </h3>

      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Icon name="Upload" size={32} />
        <p>拖拽 .agent 文件到此处</p>
        <p className="hint">或</p>
        <label className="file-select">
          <Icon name="Folder" size={14} />
          选择文件
          <input
            type="file"
            accept=".agent"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {error && (
        <div className="error-message">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}

      {importing && (
        <div className="import-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
      )}

      {preview && !importing && (
        <div className="preview">
          <h4>导入预览</h4>
          <div className="preview-info">
            <div className="info-item">
              <span className="label">Agent名称</span>
              <span className="value">{preview.manifest?.agent?.name || 'Unknown'}</span>
            </div>
            <div className="info-item">
              <span className="label">版本</span>
              <span className="value">{preview.manifest?.agent?.version || '1.0.0'}</span>
            </div>
            <div className="info-item">
              <span className="label">文件数</span>
              <span className="value">{preview.fileCount}</span>
            </div>
            <div className="info-item">
              <span className="label">描述</span>
              <span className="value">{preview.manifest?.agent?.description || '无'}</span>
            </div>
          </div>

          <div className="preview-actions">
            <button onClick={onCancel} className="cancel-btn">
              取消
            </button>
            <button onClick={handleConfirm} className="confirm-btn">
              <Icon name="Check" size={14} />
              确认导入
            </button>
          </div>
        </div>
      )}

      <style>{`
        .agent-import {
          padding: 16px;
          background: var(--color-background-primary);
          border-radius: 12px;
          border: 1px solid var(--color-border-secondary);
        }
        .agent-import h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          font-size: 14px;
          font-weight: 600;
        }
        .drop-zone {
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 2px dashed var(--color-border-secondary);
          border-radius: 8px;
          background: var(--color-background-secondary);
          transition: all 0.2s;
        }
        .drop-zone.dragging {
          border-color: var(--color-border-info);
          background: var(--color-background-info);
        }
        .drop-zone p {
          margin: 0;
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .drop-zone .hint {
          font-size: 11px;
          color: var(--color-text-tertiary);
        }
        .file-select {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--color-text-primary);
          color: var(--color-background-primary);
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }
        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--color-background-error);
          color: var(--color-text-error);
          border-radius: 6px;
          font-size: 12px;
          margin-top: 12px;
        }
        .import-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
        }
        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--color-background-secondary);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--color-text-primary);
          transition: width 0.2s;
        }
        .preview {
          margin-top: 16px;
          padding: 16px;
          background: var(--color-background-secondary);
          border-radius: 8px;
        }
        .preview h4 {
          margin: 0 0 12px 0;
          font-size: 13px;
          font-weight: 600;
        }
        .preview-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .info-item .label {
          color: var(--color-text-secondary);
        }
        .info-item .value {
          font-weight: 500;
        }
        .preview-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}
