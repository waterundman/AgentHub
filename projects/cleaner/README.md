# 清扫者 Agent

磁盘清理 Agent，自动扫描并清理系统垃圾文件、临时文件和缓存。

## 来源

原始项目: `W:\项目仓库\清扫者agent`

## 迁移内容

```
projects/cleaner/
├── agent.js           # AgentHub 标准化定义
├── src/
│   ├── index.js       # 标准化调用接口 (spawn Python)
│   └── clean_disk.py  # 完整 Python 清理脚本 (从原项目复制)
└── package.json       # Node.js 包配置
```

## 功能

- 临时文件夹清理 (TEMP, Windows Temp, Prefetch)
- 回收站清理
- 浏览器缓存清理 (Chrome, Edge, Firefox)
- Windows 更新缓存清理
- 系统日志清理
- 缩略图缓存清理
- DNS 缓存刷新
- 休眠文件清理
- 微信/QQ 缓存清理
- VSCode 缓存清理

## 使用

```javascript
import { cleanPaths, scanPaths } from '../../projects/cleaner/src/index.js';

// 扫描 (dry-run)
const scan = await scanPaths();

// 执行清理
const result = await cleanPaths(null, {
  dryRun: false,
  onProgress: (chunk) => console.log(chunk),
});
```

## 注意

- 需要 Python 3.x 环境
- 部分清理需要管理员权限
- 默认 dry-run 模式，不会真正删除文件
