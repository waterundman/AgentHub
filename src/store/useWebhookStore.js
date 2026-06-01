import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWebhookStore = create(
  persist(
    (set, get) => ({
      // 配置列表
      configs: [],
      
      // 添加配置
      addConfig: (config) => {
        const newConfig = {
          id: Date.now().toString(),
          ...config,
          createdAt: new Date().toISOString()
        };
        set(state => ({
          configs: [...state.configs, newConfig]
        }));
        return newConfig;
      },
      
      // 更新配置
      updateConfig: (id, updates) => {
        set(state => ({
          configs: state.configs.map(c => 
            c.id === id ? { ...c, ...updates } : c
          )
        }));
      },
      
      // 删除配置
      deleteConfig: (id) => {
        set(state => ({
          configs: state.configs.filter(c => c.id !== id)
        }));
      },
      
      // 获取配置
      getConfig: (id) => {
        return get().configs.find(c => c.id === id);
      },
      
      // 设置默认配置
      setDefault: (id) => {
        set(state => ({
          configs: state.configs.map(c => ({
            ...c,
            isDefault: c.id === id
          }))
        }));
      },
      
      // 获取默认配置
      getDefault: () => {
        return get().configs.find(c => c.isDefault) || get().configs[0];
      }
    }),
    {
      name: 'webhook-storage',
      partialize: (state) => ({ configs: state.configs })
    }
  )
);
