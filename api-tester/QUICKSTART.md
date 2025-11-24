# Atlas API 测试工具 - 快速开始

## 🚀 快速运行

```bash
cd api-tester

# 运行完整测试
npm test

# 查看测试结果
cat TEST_RESULTS.md
cat results/latest-test-results.json
```

## 📊 最新测试结果概览

**测试时间**: 2025-11-24 19:21  
**通过率**: 73.9% (17/23)  
**总耗时**: 15.2秒

### 模块通过率
- ✅ 对话模块: 100% (3/3) 
- ✅ 流式对话: 100% (1/1)
- 🟡 认证模块: 83.3% (5/6)
- 🟡 智能体模块: 66.7% (4/6)
- 🟡 客服模块: 60% (3/5)
- 🔴 知识库模块: 50% (1/2)

## 🎯 关键发现

### ✅ 可用功能
1. **认证系统完全可用** - 注册、登录、Token认证
2. **智能体 CRUD 正常** - 创建、查询、更新
3. **客服管理正常** - 创建、查询、更新、关联智能体
4. **对话功能正常** - 同步对话、流式对话、多轮对话

### ⚠️ 需要注意
1. **列表接口** - 返回格式需要前端适配 (可能是分页对象)
2. **文件上传** - 返回400，需要检查字段名和格式
3. **AI响应** - 返回错误提示（可能因为知识库为空）

## 💡 前端开发建议

### 1. 列表接口适配
```typescript
// 后端可能返回分页对象
const response = await api.get('/agents');
const agents = response.data.items || response.data || [];
```

### 2. 可以立即开始开发的模块
- ✅ 登录/注册页面
- ✅ 智能体管理页面 (CRUD)
- ✅ 客服管理页面 (CRUD)
- ✅ 对话界面 (UI先行)

### 3. 需要等修复的功能
- ⏳ 知识库上传 (确认字段名)
- ⏳ 对话完整流程 (需要上传知识库测试)

## 📁 项目结构

```
api-tester/
├── lib/                    # 核心工具库
│   ├── api-client.js      # HTTP 客户端
│   ├── logger.js          # 彩色日志
│   └── reporter.js        # 测试报告
├── tests/                  # 测试模块
│   ├── 01-auth.test.js
│   ├── 02-agents.test.js
│   ├── 03-knowledge.test.js
│   ├── 04-conversations.test.js
│   └── 05-chat.test.js
├── results/                # 测试结果
│   ├── latest-test-results.json
│   └── test-results-2025-11-24.json
├── index.js               # 主入口
├── TEST_RESULTS.md        # 详细测试报告
└── README.md              # 完整文档
```

## 🔧 常用命令

```bash
# 完整测试
npm test

# 只测试认证
npm run test:auth

# 只测试智能体
npm run test:agents

# 只测试对话
npm run test:chat

# 本地环境测试
npm run test:local
```

## 📈 性能指标

| 操作 | 耗时 | 评价 |
|------|------|------|
| 用户登录 | 408ms | ✅ 良好 |
| 创建资源 | 40-100ms | ✅ 优秀 |
| 查询详情 | 30-40ms | ✅ 优秀 |
| 流式对话 TTFB | 51ms | ✅ 优秀 |

## 🎓 测试数据

**自动生成**: 每次运行使用时间戳创建唯一数据，避免冲突

**示例**:
- 用户: `test_user_1763983281044`
- 智能体: `test_agent_1763983282791`
- 客服: `test_conv_1763983286322`

## 🐛 已知问题

1. **SSL证书**: 使用 `NODE_TLS_REJECT_UNAUTHORIZED=0` 忽略自签名证书
2. **列表格式**: 返回 `[object Object]`，需要检查响应格式
3. **文件上传**: 400错误，需要确认正确的字段名
4. **AI错误**: 知识库为空时返回错误提示

## 📞 下一步

1. ✅ **可以开始前端开发** - 认证、智能体、客服管理
2. ⏳ **等待后端确认** - 文件上传字段名
3. 🔍 **调试对话功能** - 上传知识库后重新测试

---

**完整文档**: [TEST_RESULTS.md](./TEST_RESULTS.md)  
**测试结果**: [results/latest-test-results.json](./results/latest-test-results.json)
