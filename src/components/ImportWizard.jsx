import React, { useState, useCallback, useRef } from 'react';
import { Icon } from './Icon';
import { transcriptionEngine } from '../services/transcriptionEngine';
import { getSupportedFormats } from '../services/transcriptionRules';
import { TranscriptionPreview } from './TranscriptionPreview';

export function ImportWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const steps = [
    { title: '选择文件', icon: 'Upload' },
    { title: '格式检测', icon: 'Search' },
    { title: '预览转写', icon: 'Eye' },
    { title: '导入中', icon: 'Loader' },
    { title: '完成', icon: 'Check' },
  ];

  const supportedFormats = getSupportedFormats();

  // 处理文件拖拽
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      detectFormat(droppedFiles);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      detectFormat(selectedFiles);
    }
  }, []);

  // 检测格式
  const detectFormat = async (files) => {
    try {
      setStep(1);
      setError(null);
      
      // 添加小延迟以显示检测动画
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const detectedFormat = await transcriptionEngine.detectFormat(files);
      setFormat(detectedFormat);
      
      if (detectedFormat === 'unknown') {
        setError('未能自动检测到支持的格式，请选择正确的文件');
        setStep(0);
        return;
      }
      
      // 自动开始预览
      await generatePreview(files, detectedFormat);
    } catch (err) {
      setError(err.message);
      setStep(0);
    }
  };

  // 手动选择格式
  const handleFormatSelect = async (selectedFormat) => {
    setFormat(selectedFormat);
    await generatePreview(files, selectedFormat);
  };

  // 生成预览
  const generatePreview = async (files, format) => {
    try {
      setStep(2);
      setError(null);
      const result = await transcriptionEngine.transcribe(files, format);
      setPreview(result);
    } catch (err) {
      setError(err.message);
      setStep(0);
    }
  };

  // 执行导入
  const handleImport = async () => {
    try {
      setStep(3);
      setError(null);
      
      // 模拟进度
      for (let i = 0; i <= 100; i += 5) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setStep(4);
    } catch (err) {
      setError(err.message);
    }
  };

  // 完成导入
  const handleComplete = () => {
    onComplete(preview);
  };

  // 重新选择
  const handleReset = () => {
    setStep(0);
    setFiles([]);
    setFormat(null);
    setPreview(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.5)', 
      zIndex: 9999, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{ 
        background: 'var(--color-background-primary)', 
        borderRadius: '12px', 
        width: '90%', 
        maxWidth: '560px', 
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* 头部 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 20px',
          borderBottom: '0.5px solid var(--color-border-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '6px', 
              background: 'var(--color-background-info)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Icon name="Download" size={14} color="var(--color-border-info)" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                导入外部项目
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                支持多种 Agent 框架格式
              </div>
            </div>
          </div>
          <button 
            onClick={onCancel}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '4px',
              color: 'var(--color-text-tertiary)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* 步骤指示器 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '4px', 
          padding: '12px 20px',
          borderBottom: '0.5px solid var(--color-border-secondary)'
        }}>
          {steps.map((s, i) => (
            <div 
              key={i}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '12px',
                background: i === step ? 'var(--color-background-info)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                width: '18px', 
                height: '18px', 
                borderRadius: '50%', 
                background: i < step ? 'var(--color-success)' : i === step ? 'var(--color-border-info)' : 'var(--color-border-tertiary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}>
                {i < step ? (
                  <Icon name="Check" size={10} color="white" />
                ) : (
                  <span style={{ fontSize: '9px', color: 'white', fontWeight: 600 }}>{i + 1}</span>
                )}
              </div>
              <span style={{ 
                fontSize: '11px', 
                color: i === step ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                fontWeight: i === step ? 500 : 400
              }}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* 内容区域 */}
        <div style={{ 
          flex: 1, 
          padding: '20px', 
          overflowY: 'auto',
          minHeight: '280px'
        }}>
          {/* Step 0: 文件选择 */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  border: `2px dashed ${isDragOver ? 'var(--color-border-info)' : 'var(--color-border-secondary)'}`,
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '40px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  background: isDragOver ? 'var(--color-background-info)' : 'var(--color-background-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon name="Upload" size={32} color={isDragOver ? 'var(--color-border-info)' : 'var(--color-text-tertiary)'} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    拖拽文件到此处
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    或点击选择文件
                  </div>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  multiple 
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ 
                background: 'var(--color-background-secondary)', 
                borderRadius: 'var(--border-radius-md)', 
                padding: '12px',
                border: '0.5px solid var(--color-border-secondary)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  支持的格式
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {supportedFormats.map(f => (
                    <span 
                      key={f.id}
                      style={{ 
                        padding: '3px 8px', 
                        background: 'var(--color-background-primary)', 
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: 'var(--color-text-secondary)',
                        border: '0.5px solid var(--color-border-secondary)'
                      }}
                      title={f.description}
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px', 
                  borderRadius: 'var(--border-radius-md)', 
                  background: 'var(--color-danger-light)', 
                  border: '0.5px solid var(--color-danger-border)',
                  fontSize: '12px',
                  color: 'var(--color-text-danger)'
                }}>
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 1: 格式检测 */}
          {step === 1 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '16px',
              padding: '40px 0'
            }}>
              <div style={{ animation: 'spin 1s linear infinite' }}>
                <Icon name="Loader" size={32} color="var(--color-border-info)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  正在检测格式...
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  分析 {files.length} 个文件
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 预览 */}
          {step === 2 && preview && (
            <TranscriptionPreview 
              data={preview}
              onConfirm={handleImport}
              onBack={handleReset}
            />
          )}

          {/* Step 3: 导入中 */}
          {step === 3 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '16px',
              padding: '40px 0'
            }}>
              <div style={{ 
                width: '100%', 
                maxWidth: '300px',
                height: '6px',
                background: 'var(--color-background-secondary)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: '100%', 
                  background: 'var(--color-success)',
                  width: `${progress}%`,
                  transition: 'width 0.1s linear',
                  borderRadius: '3px'
                }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  正在导入...
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  {progress}% · 导入 {preview?.agents?.length || 0} 个 Agent
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 完成 */}
          {step === 4 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '16px',
              padding: '40px 0'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: 'var(--color-success-light)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                animation: 'scaleIn 0.3s ease'
              }}>
                <Icon name="Check" size={24} color="var(--color-success)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  导入完成！
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  已成功导入 {preview?.agents?.length || 0} 个 Agent
                </div>
              </div>
              <button 
                onClick={handleComplete}
                style={{ 
                  padding: '10px 24px', 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  background: 'var(--color-text-primary)', 
                  color: 'var(--color-background-primary)', 
                  border: 'none', 
                  borderRadius: 'var(--border-radius-md)', 
                  cursor: 'pointer', 
                  fontFamily: 'var(--font-sans)' 
                }}
              >
                完成
              </button>
            </div>
          )}
        </div>

        {/* 底部 */}
        {step < 3 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            padding: '12px 20px',
            borderTop: '0.5px solid var(--color-border-secondary)'
          }}>
            <button 
              onClick={onCancel}
              style={{ 
                padding: '8px 16px', 
                fontSize: '12px', 
                background: 'transparent', 
                border: '0.5px solid var(--color-border-secondary)', 
                borderRadius: 'var(--border-radius-md)', 
                cursor: 'pointer', 
                color: 'var(--color-text-secondary)', 
                fontFamily: 'var(--font-sans)' 
              }}
            >
              取消
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
