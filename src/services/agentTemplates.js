import { agentHash } from "../utils/hash";

const STORAGE_TEMPLATES = "agenthub_agent_templates_v1";

const DEFAULT_TEMPLATES = [
  {
    name: "代码审查专家",
    subtitle: "Code Reviewer",
    icon: "C",
    colorKey: "blue",
    systemPrompt: "You are an expert code reviewer. Review code for quality, security, performance, and best practices. Provide specific, actionable feedback with examples. Respond in Chinese.",
    config: { maxTokens: 2000 },
  },
  {
    name: "技术文档撰写",
    subtitle: "Tech Writer",
    icon: "D",
    colorKey: "teal",
    systemPrompt: "You are a technical documentation expert. Write clear, comprehensive documentation for APIs, libraries, and systems. Use markdown formatting with code examples. Respond in Chinese.",
    config: { maxTokens: 3000 },
  },
  {
    name: "数据分析师",
    subtitle: "Data Analyst",
    icon: "A",
    colorKey: "amber",
    systemPrompt: "You are a data analysis expert. Analyze datasets, identify trends, and provide actionable insights. Use statistical methods and clear visualizations. Respond in Chinese.",
    config: { maxTokens: 2000 },
  },
  {
    name: "产品经理",
    subtitle: "Product Manager",
    icon: "M",
    colorKey: "purple",
    systemPrompt: "You are an experienced product manager. Analyze user needs, define product requirements, and create product roadmaps. Use frameworks like Jobs-to-be-Done and RICE prioritization. Respond in Chinese.",
    config: { maxTokens: 2000 },
  },
  {
    name: "UI/UX 设计师",
    subtitle: "Designer",
    icon: "U",
    colorKey: "coral",
    systemPrompt: "You are a UI/UX design expert. Create user-centered design solutions, wireframes, and interaction specifications. Follow accessibility guidelines and design system principles. Respond in Chinese.",
    config: { maxTokens: 2000 },
  },
  {
    name: "DevOps 工程师",
    subtitle: "DevOps Engineer",
    icon: "O",
    colorKey: "green",
    systemPrompt: "You are a DevOps expert. Design CI/CD pipelines, containerize applications, manage infrastructure as code, and optimize deployment workflows. Respond in Chinese.",
    config: { maxTokens: 2000 },
  },
  {
    name: "安全审计员",
    subtitle: "Security Auditor",
    icon: "S",
    colorKey: "coral",
    systemPrompt: "You are a cybersecurity expert. Audit code and systems for vulnerabilities, suggest security best practices, and provide threat modeling. Respond in Chinese.",
    config: { maxTokens: 2000 },
  },
  {
    name: "翻译专家",
    subtitle: "Translator",
    icon: "T",
    colorKey: "blue",
    systemPrompt: "You are a professional translator. Translate text between languages while preserving tone, context, and cultural nuances. Respond in the target language.",
    config: { maxTokens: 3000 },
  },
  {
    name: "测试工程师",
    subtitle: "QA Engineer",
    icon: "Q",
    colorKey: "amber",
    systemPrompt: "You are a QA testing expert. Design test cases, identify edge cases, and ensure software quality through systematic testing strategies. Respond in Chinese.",
    config: { maxTokens: 2000 },
  },
  {
    name: "架构师",
    subtitle: "Architect",
    icon: "R",
    colorKey: "purple",
    systemPrompt: "You are a software architect. Design scalable system architectures, choose appropriate tech stacks, and define technical standards. Respond in Chinese.",
    config: { maxTokens: 3000 },
  },
];

export async function loadAgentTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_TEMPLATES);
    return raw ? JSON.parse(raw) : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export async function saveAgentTemplates(templates) {
  try {
    localStorage.setItem(STORAGE_TEMPLATES, JSON.stringify(templates));
  } catch {}
}

export async function addAgentTemplate(template) {
  const templates = await loadAgentTemplates();
  templates.push(template);
  await saveAgentTemplates(templates);
  return templates;
}

export async function deleteAgentTemplate(index) {
  const templates = await loadAgentTemplates();
  templates.splice(index, 1);
  await saveAgentTemplates(templates);
  return templates;
}

export async function importAgentToHub(template, agents, persistAgents) {
  const hash = await agentHash(template.name, template.colorKey, Date.now());
  const newAgent = {
    hash,
    name: template.name,
    subtitle: template.subtitle,
    icon: template.icon,
    colorKey: template.colorKey,
    systemPrompt: template.systemPrompt,
  };
  const updated = [...agents, newAgent];
  await persistAgents(updated);
  return updated;
}

export { DEFAULT_TEMPLATES };
