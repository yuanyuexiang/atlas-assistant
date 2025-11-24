# Atlas Assistant API 测试工具

## 简介

这是一个全面的 API 测试工具，用于测试 Atlas Assistant 后端的所有接口。

## 功能特性

- ✅ 完整的 API 覆盖（认证、智能体、知识库、客服、对话）
- 📊 详细的测试报告和统计
- 🎨 彩色日志输出
- ⚡ 流式对话测试
- 💾 JSON 格式结果保存
- 🔄 环境切换（生产/本地）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

> 注意：本工具使用 Node.js 原生 fetch API，需要 Node.js 18+ 版本

### 2. 运行测试

```bash
# 测试生产环境（默认）
npm test

# 测试本地环境
npm run test:local

# 或者
npm test -- --env=local
```

### 3. 指定模块测试

```bash
# 只测试认证模块
npm test -- --module=auth

# 只测试智能体模块
npm test -- --module=agents

# 只测试知识库模块
npm test -- --module=knowledge

# 只测试客服模块
npm test -- --module=conversations

# 只测试对话模块
npm test -- --module=chat

# 只测试流式对话
npm test -- --module=stream
```

## 测试模块

### 1. 认证模块 (01-auth.test.js)
- 健康检查
- 用户注册（动态用户名）
- 用户登录
- 获取当前用户
- 更新用户信息
- 错误密码测试

### 2. 智能体模块 (02-agents.test.js)
- 创建智能体（多种类型）
- 获取智能体列表
- 获取智能体详情
- 更新智能体
- 筛选列表

### 3. 知识库模块 (03-knowledge.test.js)
- 上传文档
- 获取文档列表
- 获取统计信息
- 删除文档

### 4. 客服模块 (04-conversations.test.js)
- 创建客服
- 获取客服列表
- 获取客服详情
- 更新客服
- 筛选列表

### 5. 对话模块 (05-chat.test.js)
- 同步对话
- 多轮对话
- 流式对话（SSE）

## 输出示例

```
🚀 Atlas Assistant API 测试工具
═══════════════════════════════════════════════════════════
📌 测试环境: PROD
📌 API地址: https://atlas.matrix-net.tech/atlas/api
📌 测试模块: ALL
═══════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 模块 1/6: 认证模块
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 测试: 健康检查
✅ 健康检查通过 (45ms)

▶ 测试: 用户注册
✅ 用户注册成功 (234ms)
  用户名: test_user_1732456789
  邮箱: test_1732456789@example.com

...

═══════════════════════════════════════════════════════════
📊 测试报告
═══════════════════════════════════════════════════════════
总测试数: 28
✅ 通过: 28 (100.0%)
❌ 失败: 0 (0.0%)
⏱️  总耗时: 12.45s
📈 平均耗时: 445ms

📦 模块统计:
  ✅ 认证模块: 6/6 (100.0%) - 1.23s
  ✅ 智能体模块: 6/6 (100.0%) - 2.45s
  ✅ 知识库模块: 4/4 (100.0%) - 4.56s
  ✅ 客服模块: 5/5 (100.0%) - 1.89s
  ✅ 对话模块: 4/4 (100.0%) - 2.32s
  ✅ 流式对话: 1/1 (100.0%) - 2.45s

💾 报告已保存: ./results/test-results-2025-11-24.json
```

## 测试结果

测试结果保存在 `results/` 目录：
- `test-results-YYYY-MM-DD.json` - 带日期的测试结果
- `latest-test-results.json` - 最新的测试结果

结果包含：
- 总体统计（通过率、耗时等）
- 模块统计
- 详细的每个测试结果

## 目录结构

```
api-tester/
├── lib/
│   ├── api-client.js    # HTTP 客户端
│   ├── logger.js        # 日志工具
│   └── reporter.js      # 报告生成器
├── tests/
│   ├── 01-auth.test.js  # 认证测试
│   ├── 02-agents.test.js # 智能体测试
│   ├── 03-knowledge.test.js # 知识库测试
│   ├── 04-conversations.test.js # 客服测试
│   └── 05-chat.test.js  # 对话测试
├── results/             # 测试结果目录
├── index.js            # 主入口
├── package.json
└── README.md
```

## 注意事项

1. **Node.js 版本**: 需要 Node.js 18+ （支持原生 fetch）
2. **网络连接**: 确保可以访问测试环境的 API
3. **测试数据**: 每次运行会创建新的测试数据（避免冲突）
4. **知识库测试**: 会等待 3 秒让 Milvus 初始化
5. **Milvus Lite 限制**: 删除操作可能不完全支持

## 开发指南

### 添加新的测试模块

1. 在 `tests/` 目录创建新文件 `XX-module.test.js`
2. 导出测试函数
3. 在 `index.js` 中引入并调用

### 自定义日志

```javascript
import Logger from './lib/logger.js';

const logger = new Logger('模块名');

logger.info('信息');
logger.success('成功');
logger.error('错误', error);
logger.warn('警告');
logger.debug('调试', data);
```

### 添加测试结果

```javascript
reporter.add(
  '模块名',      // 模块
  '测试名称',    // 测试用例
  true,         // 是否通过
  duration,     // 耗时(ms)
  null,         // 错误信息
  { key: 'value' }  // 额外数据
);
```

## License

MIT
