# 生图 Agent

AI 图像生成 Agent，基于通义万相 (Wanx) 模型，支持文生图和异步任务轮询。

## 来源

原始项目: `W:\项目仓库\生图agent`

## 迁移内容

```
projects/image-gen/
├── agent.js           # AgentHub 标准化定义
├── src/
│   ├── index.js       # 标准化调用接口
│   └── image_gen.js   # 完整生图引擎 (从原项目复制)
└── package.json       # Node.js 包配置 (含 node-fetch, dotenv)
```

## 功能

- 文生图 (通义万相 wanx-v1)
- 异步任务轮询 (最长 2 分钟)
- 多尺寸支持 (1024*1024, 720*1280 等)
- 自动命名与组织输出目录
- 批量生成
- Seed 控制可复现性

## 安装

```bash
cd projects/image-gen
npm install
```

## 配置

创建 `.env` 文件:
```
DASHSCOPE_API_KEY=your-api-key-here
IMAGE_REPO_PATH=./output
```

## 使用

```javascript
import { generateImage, generateBatch } from '../../projects/image-gen/src/index.js';

// 单张生成
const result = await generateImage("一只可爱的猫咪在草地上玩耍");

// 批量生成
const batch = await generateBatch([
  "日落时分的海边",
  "雪山下的湖泊",
  "星空下的帐篷",
]);
```
