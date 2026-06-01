/**
 * 转写引擎
 * 负责格式检测、规则匹配、数据转换和项目生成
 */

import { getRuleByFormat, getRules } from './transcriptionRules';
import { agentHash } from '../utils/hash';

const COLOR_KEYS = ["purple", "teal", "coral", "blue", "amber", "green"];
const ICON_CHARS = "ABCDEFGHIJKLMNOP";

export class TranscriptionEngine {
  constructor() {
    this.rules = getRules();
  }

  /**
   * 检测文件格式
   * @param {Array} files - 文件列表
   * @returns {Promise<string>} 检测到的格式
   */
  async detectFormat(files) {
    const fileNames = files.map(f => f.name || f.webkitRelativePath || '');
    
    for (const rule of this.rules) {
      const match = await this.matchRule(files, fileNames, rule);
      if (match) {
        return rule.sourceFormat;
      }
    }
    return 'unknown';
  }

  /**
   * 匹配规则
   * @param {Array} files - 文件列表
   * @param {Array} fileNames - 文件名列表
   * @param {Object} rule - 规则对象
   * @returns {Promise<boolean>} 是否匹配
   */
  async matchRule(files, fileNames, rule) {
    let fileMatchCount = 0;
    let contentMatchCount = 0;
    let hasFileMatcher = false;
    let hasContentMatcher = false;

    for (const matcher of rule.matchers) {
      if (matcher.type === 'file') {
        hasFileMatcher = true;
        const found = fileNames.some(name => this.matchPattern(name, matcher.pattern));
        if (found) fileMatchCount++;
      } else if (matcher.type === 'content') {
        hasContentMatcher = true;
        for (const file of files) {
          try {
            const content = await this.readFileContent(file);
            const regex = new RegExp(matcher.pattern, 'm');
            if (regex.test(content)) {
              contentMatchCount++;
              break;
            }
          } catch (e) {
            // 忽略读取错误
          }
        }
      } else if (matcher.type === 'pattern') {
        const found = fileNames.some(name => this.matchPattern(name, matcher.pattern));
        if (found) fileMatchCount++;
      }
    }

    // 如果只有文件匹配器，需要至少一个匹配
    if (hasFileMatcher && !hasContentMatcher) {
      return fileMatchCount > 0;
    }
    // 如果只有内容匹配器，需要至少一个匹配
    if (!hasFileMatcher && hasContentMatcher) {
      return contentMatchCount > 0;
    }
    // 如果两者都有，需要都至少匹配一个
    return fileMatchCount > 0 && contentMatchCount > 0;
  }

  /**
   * 模式匹配
   * @param {string} filename - 文件名
   * @param {string} pattern - 匹配模式
   * @returns {boolean} 是否匹配
   */
  matchPattern(filename, pattern) {
    if (!filename || !pattern) return false;
    
    // 标准化路径分隔符
    const normalizedFilename = filename.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');
    
    // 转换 glob 模式为正则表达式
    const regexStr = normalizedPattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^/]*')
      .replace(/\*\*/g, '.*');
    
    const regex = new RegExp(`^${regexStr}$`, 'i');
    return regex.test(normalizedFilename);
  }

  /**
   * 读取文件内容
   * @param {File} file - 文件对象
   * @returns {Promise<string>} 文件内容
   */
  async readFileContent(file) {
    if (file._cachedContent) {
      return file._cachedContent;
    }
    const content = await file.text();
    file._cachedContent = content;
    return content;
  }

  /**
   * 执行转写
   * @param {Array} files - 文件列表
   * @param {string} format - 源格式
   * @returns {Promise<Object>} 转写结果
   */
  async transcribe(files, format) {
    const rule = getRuleByFormat(format);
    if (!rule) {
      throw new Error(`不支持的格式: ${format}`);
    }

    // 1. 提取数据
    const extracted = await this.extract(files, rule);

    // 2. 转换数据
    const transformed = await this.transform(extracted, rule);

    // 3. 生成项目结构
    return this.generateProject(transformed, format);
  }

  /**
   * 提取数据
   * @param {Array} files - 文件列表
   * @param {Object} rule - 规则对象
   * @returns {Promise<Object>} 提取的数据
   */
  async extract(files, rule) {
    const data = {};

    for (const file of files) {
      const fileName = file.name || file.webkitRelativePath || '';
      const content = await this.readFileContent(file);

      // 存储文件内容
      data[fileName] = content;

      // 尝试解析结构化文件
      if (fileName.endsWith('.json') || fileName.endsWith('.jsonc')) {
        try {
          const cleanContent = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
          data[`${fileName}_parsed`] = JSON.parse(cleanContent);
        } catch (e) {
          // JSON解析失败，保留原始内容
        }
      } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
        data[`${fileName}_parsed`] = this.parseYAML(content);
      } else if (fileName.endsWith('.py')) {
        data[`${fileName}_parsed`] = this.parsePython(content);
      }
    }

    return data;
  }

  /**
   * 简单YAML解析
   * @param {string} content - YAML内容
   * @returns {Object} 解析结果
   */
  parseYAML(content) {
    const result = {};
    const lines = content.split('\n');
    let currentKey = null;
    let currentObj = result;
    const stack = [{ obj: result, indent: -1 }];

    for (const line of lines) {
      const trimmed = line.trimStart();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = line.length - trimmed.length;
      const match = trimmed.match(/^([^:]+):\s*(.*)$/);

      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();

        // 调整栈
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop();
        }
        currentObj = stack[stack.length - 1].obj;

        if (value) {
          currentObj[key] = value.replace(/^["']|["']$/g, '');
        } else {
          currentObj[key] = {};
          stack.push({ obj: currentObj[key], indent });
        }
      }
    }

    return result;
  }

  /**
   * Python文件解析
   * @param {string} content - Python内容
   * @returns {Object} 解析结果
   */
  parsePython(content) {
    const result = {
      imports: [],
      agents: [],
      chains: [],
    };

    // 提取导入
    const importRegex = /(?:from\s+(\S+)\s+)?import\s+(.+)/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      result.imports.push({
        module: match[1],
        names: match[2].split(',').map(s => s.trim()),
      });
    }

    // 提取Agent定义（LangChain风格）
    const agentRegex = /(\w+)\s*=\s*(?:Agent|ConversationalAgent|ZeroShotAgent)\s*\(([^)]*)\)/g;
    while ((match = agentRegex.exec(content)) !== null) {
      const agentName = match[1];
      const agentArgs = this.parsePythonArgs(match[2]);
      result.agents.push({
        name: agentName,
        ...agentArgs,
      });
    }

    // 提取CrewAI风格Agent定义
    const crewAgentRegex = /(\w+)\s*=\s*Agent\s*\(\s*role\s*=\s*["']([^"']+)["']/g;
    while ((match = crewAgentRegex.exec(content)) !== null) {
      result.agents.push({
        name: match[1],
        role: match[2],
      });
    }

    return result;
  }

  /**
   * 解析Python函数参数
   * @param {string} argsStr - 参数字符串
   * @returns {Object} 解析结果
   */
  parsePythonArgs(argsStr) {
    const result = {};
    const regex = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\w+))/g;
    let match;
    while ((match = regex.exec(argsStr)) !== null) {
      result[match[1]] = match[2] || match[3] || match[4];
    }
    return result;
  }

  /**
   * 转换数据
   * @param {Object} data - 提取的数据
   * @param {Object} rule - 规则对象
   * @returns {Promise<Object>} 转换结果
   */
  async transform(data, rule) {
    const result = { agents: [] };

    // 根据格式应用不同的转换逻辑
    switch (rule.sourceFormat) {
      case 'claude-code':
        return this.transformClaudeCode(data);
      case 'opencode':
        return this.transformOpenCode(data);
      case 'cursor':
        return this.transformCursor(data);
      case 'windsurf':
        return this.transformWindsurf(data);
      case 'markdown':
        return this.transformMarkdown(data);
      case 'autogpt':
        return this.transformAutoGPT(data);
      case 'langchain':
        return this.transformLangChain(data);
      case 'crewai':
        return this.transformCrewAI(data);
      case 'autogen':
        return this.transformAutoGen(data);
      case 'generic-json':
        return this.transformGenericJSON(data);
      default:
        return result;
    }
  }

  /**
   * 转换Claude Code格式
   */
  transformClaudeCode(data) {
    const result = { name: 'Claude Code Project', agents: [] };
    
    // 查找settings.json
    for (const [key, content] of Object.entries(data)) {
      if (key.endsWith('settings.json') && data[`${key}_parsed`]) {
        const settings = data[`${key}_parsed`];
        result.name = settings.project_name || result.name;
      }
    }

    // 查找prompt文件
    let agentIndex = 0;
    for (const [key, content] of Object.entries(data)) {
      if (key.endsWith('.md') && !key.endsWith('_parsed')) {
        const name = key.split('/').pop().replace('.md', '');
        result.agents.push({
          name: this.formatName(name),
          systemPrompt: content,
          icon: ICON_CHARS[agentIndex % ICON_CHARS.length],
          colorKey: COLOR_KEYS[agentIndex % COLOR_KEYS.length],
          subtitle: 'Imported from Claude Code',
        });
        agentIndex++;
      }
    }

    return result;
  }

  /**
   * 转换OpenCode格式
   */
  transformOpenCode(data) {
    const result = { name: 'OpenCode Project', agents: [] };

    for (const [key, content] of Object.entries(data)) {
      if ((key.endsWith('opencode.json') || key.endsWith('opencode.jsonc')) && data[`${key}_parsed`]) {
        const config = data[`${key}_parsed`];
        result.name = config.project || config.name || result.name;

        if (config.agents && Array.isArray(config.agents)) {
          config.agents.forEach((agent, i) => {
            result.agents.push({
              name: agent.name || `Agent ${i + 1}`,
              systemPrompt: agent.systemPrompt || agent.prompt || '',
              icon: agent.icon || ICON_CHARS[i % ICON_CHARS.length],
              colorKey: agent.color || COLOR_KEYS[i % COLOR_KEYS.length],
              subtitle: agent.description || 'Imported from OpenCode',
            });
          });
        }
      }
    }

    return result;
  }

  /**
   * 转换Cursor格式
   */
  transformCursor(data) {
    const result = { name: 'Cursor Project', agents: [] };
    let agentIndex = 0;

    for (const [key, content] of Object.entries(data)) {
      if ((key.endsWith('.cursorrules') || key.includes('.cursor/rules/')) && !key.endsWith('_parsed')) {
        result.agents.push({
          name: this.formatName(key.split('/').pop().replace('.cursorrules', 'rules')),
          systemPrompt: content,
          icon: ICON_CHARS[agentIndex % ICON_CHARS.length],
          colorKey: COLOR_KEYS[agentIndex % COLOR_KEYS.length],
          subtitle: 'Imported from Cursor',
        });
        agentIndex++;
      }
    }

    return result;
  }

  /**
   * 转换Windsurf格式
   */
  transformWindsurf(data) {
    const result = { name: 'Windsurf Project', agents: [] };
    let agentIndex = 0;

    for (const [key, content] of Object.entries(data)) {
      if ((key.endsWith('.windsurfrules') || key.includes('.windsurf/')) && !key.endsWith('_parsed')) {
        result.agents.push({
          name: this.formatName(key.split('/').pop().replace('.windsurfrules', 'rules')),
          systemPrompt: content,
          icon: ICON_CHARS[agentIndex % ICON_CHARS.length],
          colorKey: COLOR_KEYS[agentIndex % COLOR_KEYS.length],
          subtitle: 'Imported from Windsurf',
        });
        agentIndex++;
      }
    }

    return result;
  }

  /**
   * 转换Markdown格式
   */
  transformMarkdown(data) {
    const result = { name: 'Markdown Import', agents: [] };
    let agentIndex = 0;

    for (const [key, content] of Object.entries(data)) {
      if (key.endsWith('.md') && !key.endsWith('_parsed')) {
        const sections = this.parseMarkdownSections(content);
        
        if (sections.length > 0) {
          sections.forEach((section, i) => {
            result.agents.push({
              name: section.title || `Agent ${agentIndex + 1}`,
              systemPrompt: section.content,
              icon: ICON_CHARS[agentIndex % ICON_CHARS.length],
              colorKey: COLOR_KEYS[agentIndex % COLOR_KEYS.length],
              subtitle: 'Imported from Markdown',
            });
            agentIndex++;
          });
        } else {
          // 整个文件作为一个agent
          const title = content.match(/^#\s+(.+)$/m)?.[1] || key.replace('.md', '');
          result.agents.push({
            name: this.formatName(title),
            systemPrompt: content,
            icon: ICON_CHARS[agentIndex % ICON_CHARS.length],
            colorKey: COLOR_KEYS[agentIndex % COLOR_KEYS.length],
            subtitle: 'Imported from Markdown',
          });
          agentIndex++;
        }
      }
    }

    return result;
  }

  /**
   * 解析Markdown章节
   */
  parseMarkdownSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;

    for (const line of lines) {
      const h1Match = line.match(/^#\s+(.+)$/);
      const h2Match = line.match(/^##\s+(.+)$/);

      if (h1Match || h2Match) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: (h1Match || h2Match)[1].trim(),
          content: '',
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.map(s => ({
      ...s,
      content: s.content.trim(),
    }));
  }

  /**
   * 转换AutoGPT格式
   */
  transformAutoGPT(data) {
    const result = { name: 'AutoGPT Project', agents: [] };

    for (const [key, content] of Object.entries(data)) {
      if ((key.endsWith('ai_settings.yaml') || key.endsWith('ai_settings.yml')) && data[`${key}_parsed`]) {
        const settings = data[`${key}_parsed`];
        result.name = settings.ai_name || result.name;

        if (settings.goals) {
          result.agents.push({
            name: settings.ai_name || 'AutoGPT Agent',
            systemPrompt: `Goals:\n${settings.goals.join('\n')}`,
            icon: 'A',
            colorKey: 'purple',
            subtitle: 'Imported from AutoGPT',
          });
        }
      }
    }

    return result;
  }

  /**
   * 转换LangChain格式
   */
  transformLangChain(data) {
    const result = { name: 'LangChain Project', agents: [] };
    let agentIndex = 0;

    for (const [key, content] of Object.entries(data)) {
      if (key.endsWith('.py') && data[`${key}_parsed`]) {
        const parsed = data[`${key}_parsed`];
        const fileName = key.split('/').pop().replace('.py', '');
        result.name = this.formatName(fileName);

        parsed.agents.forEach(agent => {
          result.agents.push({
            name: agent.name || `Agent ${agentIndex + 1}`,
            systemPrompt: agent.system_prompt || agent.prefix || '',
            icon: ICON_CHARS[agentIndex % ICON_CHARS.length],
            colorKey: COLOR_KEYS[agentIndex % COLOR_KEYS.length],
            subtitle: 'Imported from LangChain',
          });
          agentIndex++;
        });
      }
    }

    return result;
  }

  /**
   * 转换CrewAI格式
   */
  transformCrewAI(data) {
    const result = { name: 'CrewAI Project', agents: [] };
    let agentIndex = 0;

    // 查找agents.yaml
    for (const [key, content] of Object.entries(data)) {
      if (key.endsWith('agents.yaml') && data[`${key}_parsed`]) {
        const agentsConfig = data[`${key}_parsed`];
        for (const [name, config] of Object.entries(agentsConfig)) {
          result.agents.push({
            name: config.name || this.formatName(name),
            systemPrompt: `${config.role || ''}\n${config.goal || ''}\n${config.backstory || ''}`.trim(),
            icon: ICON_CHARS[agentIndex % ICON_CHARS.length],
            colorKey: COLOR_KEYS[agentIndex % COLOR_KEYS.length],
            subtitle: config.role || 'Imported from CrewAI',
          });
          agentIndex++;
        }
      }
    }

    // 查找Python文件中的Agent定义
    for (const [key, content] of Object.entries(data)) {
      if (key.endsWith('.py') && data[`${key}_parsed`]) {
        const parsed = data[`${key}_parsed`];
        parsed.agents.forEach(agent => {
          if (!result.agents.find(a => a.name === agent.name)) {
            result.agents.push({
              name: agent.name || `Agent ${agentIndex + 1}`,
              systemPrompt: `Role: ${agent.role || ''}`,
              icon: ICON_CHARS[agentIndex % ICON_CHARS.length],
              colorKey: COLOR_KEYS[agentIndex % COLOR_KEYS.length],
              subtitle: agent.role || 'Imported from CrewAI',
            });
            agentIndex++;
          }
        });
      }
    }

    return result;
  }

  /**
   * 转换AutoGen格式
   */
  transformAutoGen(data) {
    const result = { name: 'AutoGen Project', agents: [] };
    let agentIndex = 0;

    for (const [key, content] of Object.entries(data)) {
      if (key.endsWith('autogen_config.json') && data[`${key}_parsed`]) {
        const config = data[`${key}_parsed`];
        result.name = config.project || result.name;

        if (config.agents && Array.isArray(config.agents)) {
          config.agents.forEach(agent => {
            result.agents.push({
              name: agent.name || `Agent ${agentIndex + 1}`,
              systemPrompt: agent.system_message || agent.systemPrompt || '',
              icon: ICON_CHARS[agentIndex % ICON_CHARS.length],
              colorKey: COLOR_KEYS[agentIndex % COLOR_KEYS.length],
              subtitle: agent.description || 'Imported from AutoGen',
            });
            agentIndex++;
          });
        }
      }
    }

    return result;
  }

  /**
   * 转换通用JSON格式
   */
  transformGenericJSON(data) {
    const result = { name: 'Imported Project', agents: [] };
    let agentIndex = 0;

    for (const [key, content] of Object.entries(data)) {
      if (key.endsWith('.json') && data[`${key}_parsed`]) {
        const config = data[`${key}_parsed`];
        result.name = config.name || config.project || result.name;

        const agentsList = config.agents || config.assistants || config.bots || [];
        if (Array.isArray(agentsList)) {
          agentsList.forEach(agent => {
            result.agents.push({
              name: agent.name || `Agent ${agentIndex + 1}`,
              systemPrompt: agent.systemPrompt || agent.prompt || agent.system_prompt || agent.instructions || '',
              icon: agent.icon || ICON_CHARS[agentIndex % ICON_CHARS.length],
              colorKey: agent.color || agent.colorKey || COLOR_KEYS[agentIndex % COLOR_KEYS.length],
              subtitle: agent.description || agent.subtitle || 'Imported',
            });
            agentIndex++;
          });
        }
      }
    }

    return result;
  }

  /**
   * 格式化名称
   * @param {string} name - 原始名称
   * @returns {string} 格式化后的名称
   */
  formatName(name) {
    if (!name) return 'Agent';
    return name
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  /**
   * 生成项目结构
   * @param {Object} data - 转换后的数据
   * @param {string} format - 源格式
   * @returns {Object} 项目结构
   */
  generateProject(data, format) {
    const agents = (data.agents || []).map((agent, i) => ({
      hash: `${agent.name}-${Date.now()}-${i}`,
      name: agent.name || `Agent ${i + 1}`,
      subtitle: agent.subtitle || `Imported from ${format}`,
      icon: agent.icon || ICON_CHARS[i % ICON_CHARS.length],
      colorKey: agent.colorKey || COLOR_KEYS[i % COLOR_KEYS.length],
      systemPrompt: agent.systemPrompt || '',
      llmConfig: null,
    }));

    return {
      name: data.name || 'Imported Project',
      agents,
      config: data.config || {},
      sourceFormat: format,
      importedAt: new Date().toISOString(),
    };
  }
}

// 导出单例
export const transcriptionEngine = new TranscriptionEngine();
