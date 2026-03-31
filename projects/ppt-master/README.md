# PPT Master Agent

专业的 PPT 生成 Agent，支持多种模板风格，从文档自动生成高质量演示文稿。

## 来源

原始项目: `W:\项目仓库\ppt生成agent\ppt-master`

## 迁移内容

```
projects/ppt-master/
├── agent.js           # AgentHub 标准化定义
├── src/
│   └── index.js       # 标准化调用接口
├── scripts/           # 完整 Python 脚本 (从原项目复制)
│   ├── svg_to_pptx/   # SVG → PPTX 转换引擎
│   ├── svg_finalize/  # SVG 最终处理
│   ├── image_backends/# 多后端图像生成
│   └── *.py           # 各类工具脚本
└── package.json       # Node.js 包配置
```

## 功能

- 文档分析 → 大纲生成 → SVG 幻灯片设计 → PPTX 转换
- 支持 20+ 模板风格 (麦肯锡、Anthropic、Google、学术答辩等)
- 多后端图像生成 (DALL-E, Midjourney, 通义万相等)
- 完整的 SVG → DrawingML → PPTX 转换管线

## 使用

```javascript
import { generatePPT, listTemplates } from '../../projects/ppt-master/src/index.js';

// 列出可用模板
const templates = await listTemplates();

// 生成 PPT
const result = await generatePPT("AI 编程工具对比分析", {
  template: "mckinsey",
  maxSlides: 20,
  onProgress: (chunk) => console.log(chunk),
});
```
