/**
 * 工具注册表服务
 * 管理工具定义、权限和调用日志
 */

// 工具注册表
class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.callLogs = [];
  }

  // 注册工具
  register(tool) {
    if (!tool.name) {
      throw new Error('Tool must have a name');
    }
    this.tools.set(tool.name, {
      ...tool,
      registeredAt: Date.now()
    });
  }

  // 获取工具定义
  get(name) {
    return this.tools.get(name);
  }

  // 列出所有工具
  list() {
    return Array.from(this.tools.values());
  }

  // 按分类列出工具
  listByCategory(category) {
    return this.list().filter(tool => tool.category === category);
  }

  // 记录调用日志
  logCall(record) {
    const logEntry = {
      ...record,
      timestamp: record.timestamp || Date.now(),
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.callLogs.push(logEntry);
    
    // 保持最近1000条记录
    if (this.callLogs.length > 1000) {
      this.callLogs = this.callLogs.slice(-1000);
    }
    
    return logEntry;
  }

  // 获取调用历史
  getCallHistory(agentHash, limit = 50) {
    return this.callLogs
      .filter(log => log.agentHash === agentHash)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // 获取工具调用统计
  getToolStats(agentHash) {
    const stats = {};
    this.callLogs
      .filter(log => log.agentHash === agentHash)
      .forEach(log => {
        if (!stats[log.toolName]) {
          stats[log.toolName] = { total: 0, success: 0, failed: 0, totalDuration: 0 };
        }
        stats[log.toolName].total++;
        if (log.success) {
          stats[log.toolName].success++;
        } else {
          stats[log.toolName].failed++;
        }
        stats[log.toolName].totalDuration += log.duration || 0;
      });
    return stats;
  }

  // 清空调用历史
  clearHistory() {
    this.callLogs = [];
  }
}

// 预定义工具
const BUILT_IN_TOOLS = [
  { 
    name: 'file_read', 
    displayName: '读取文件', 
    description: '读取文件内容',
    category: 'read', 
    icon: 'FileText',
    parameters: { path: 'string', encoding: 'string' },
    permissions: ['fs.read'],
    sandboxed: true
  },
  { 
    name: 'file_write', 
    displayName: '写入文件', 
    description: '写入文件内容',
    category: 'write', 
    icon: 'FileText',
    parameters: { path: 'string', content: 'string', encoding: 'string' },
    permissions: ['fs.write'],
    sandboxed: true
  },
  { 
    name: 'execute_command', 
    displayName: '执行命令', 
    description: '执行系统命令',
    category: 'execute', 
    icon: 'Terminal',
    parameters: { command: 'string', args: 'array', cwd: 'string' },
    permissions: ['process.execute'],
    sandboxed: true
  },
  { 
    name: 'http_request', 
    displayName: 'HTTP请求', 
    description: '发送HTTP请求',
    category: 'network', 
    icon: 'Globe',
    parameters: { url: 'string', method: 'string', headers: 'object', body: 'string' },
    permissions: ['network.http'],
    sandboxed: true
  },
  { 
    name: 'web_search', 
    displayName: '网络搜索', 
    description: '搜索网络内容',
    category: 'network', 
    icon: 'Search',
    parameters: { query: 'string', engine: 'string', limit: 'number' },
    permissions: ['network.search'],
    sandboxed: true
  },
  { 
    name: 'code_edit', 
    displayName: '编辑代码', 
    description: '编辑代码文件',
    category: 'write', 
    icon: 'Code',
    parameters: { path: 'string', edits: 'array' },
    permissions: ['fs.write', 'code.edit'],
    sandboxed: true
  },
  { 
    name: 'code_search', 
    displayName: '搜索代码', 
    description: '搜索代码内容',
    category: 'read', 
    icon: 'Search',
    parameters: { pattern: 'string', path: 'string', include: 'string' },
    permissions: ['fs.read', 'code.search'],
    sandboxed: false
  },
  { 
    name: 'env_read', 
    displayName: '读取环境变量', 
    description: '读取环境变量',
    category: 'system', 
    icon: 'Settings',
    parameters: { name: 'string' },
    permissions: ['env.read'],
    sandboxed: false
  },
  {
    name: 'git_status',
    displayName: 'Git状态',
    description: '获取Git仓库状态',
    category: 'system',
    icon: 'GitBranch',
    parameters: { path: 'string' },
    permissions: ['git.read'],
    sandboxed: false
  },
  {
    name: 'git_commit',
    displayName: 'Git提交',
    description: '创建Git提交',
    category: 'system',
    icon: 'GitCommit',
    parameters: { message: 'string', files: 'array' },
    permissions: ['git.write'],
    sandboxed: true
  },
  {
    name: 'clipboard_read',
    displayName: '读取剪贴板',
    description: '读取剪贴板内容',
    category: 'system',
    icon: 'Clipboard',
    parameters: {},
    permissions: ['clipboard.read'],
    sandboxed: false
  },
  {
    name: 'clipboard_write',
    displayName: '写入剪贴板',
    description: '写入剪贴板内容',
    category: 'system',
    icon: 'Clipboard',
    parameters: { content: 'string' },
    permissions: ['clipboard.write'],
    sandboxed: true
  },
  {
    name: 'notification_send',
    displayName: '发送通知',
    description: '发送系统通知',
    category: 'system',
    icon: 'Bell',
    parameters: { title: 'string', body: 'string' },
    permissions: ['notification.send'],
    sandboxed: false
  },
  {
    name: 'browser_open',
    displayName: '打开浏览器',
    description: '在浏览器中打开URL',
    category: 'network',
    icon: 'ExternalLink',
    parameters: { url: 'string' },
    permissions: ['browser.open'],
    sandboxed: true
  },
  {
    name: 'database_query',
    displayName: '数据库查询',
    description: '执行数据库查询',
    category: 'system',
    icon: 'Database',
    parameters: { query: 'string', params: 'array' },
    permissions: ['database.read'],
    sandboxed: true
  }
];

export const toolRegistry = new ToolRegistry();
BUILT_IN_TOOLS.forEach(t => toolRegistry.register(t));