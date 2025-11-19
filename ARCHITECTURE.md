# Feature-Based Architecture 重构完成

## 项目结构

已成功从传统分层架构重构为 2025 年标准的 Feature-Based Architecture：

```
atlas-assistant/
├── app/                          # 应用入口
│   ├── main.tsx                  # React 入口点
│   ├── providers.tsx             # 全局 Provider (Ant Design)
│   └── router.tsx                # 路由配置
│
├── features/                     # 功能模块（按业务划分）
│   ├── auth/                     # 认证功能
│   │   ├── api/
│   │   │   └── auth.ts          # 认证 API
│   │   ├── components/
│   │   │   ├── LoginForm.tsx    # 登录/注册表单
│   │   │   └── LoginForm.module.css
│   │   ├── hooks/
│   │   │   └── useAuth.ts       # 认证 Hook
│   │   └── store.ts             # 认证状态管理
│   │
│   └── chat/                     # 对话功能
│       ├── api/
│       │   ├── chat.ts          # 对话 API
│       │   └── sse.ts           # SSE 流式服务
│       ├── components/
│       │   ├── MessageBubble.tsx     # 消息气泡
│       │   ├── ChatWindow.tsx        # 对话窗口
│       │   └── ChatInput.tsx         # 输入框
│       ├── hooks/
│       │   └── useSSEChat.ts    # SSE 对话 Hook
│       └── store.ts             # 对话状态管理
│
├── pages/                        # 页面组件（路由级别）
│   ├── login/
│   │   └── LoginPage.tsx        # 登录页面
│   └── chat/
│       └── ChatPage.tsx         # 对话页面
│
├── components/                   # 通用组件
│   ├── common/                   # 公共业务组件
│   │   └── MainLayout/          # 主布局
│   │       ├── MainLayout.tsx
│   │       └── MainLayout.module.css
│   └── ui/                       # 纯 UI 组件（未来扩展）
│
├── lib/                          # 通用库
│   ├── http/
│   │   └── http.ts              # Axios 封装
│   ├── hooks/
│   │   └── useDebounce.ts       # 通用 Hooks
│   ├── utils/
│   │   └── format.ts            # 工具函数
│   └── constants.ts             # 常量定义
│
├── types/                        # TypeScript 类型定义
│   ├── api.d.ts                 # API 类型
│   └── models.d.ts              # 数据模型类型
│
└── styles/                       # 全局样式
    └── global.css               # 全局 CSS
```

## 已实现功能

### ✅ 基础设施
- React 19 + TypeScript 5.9 + Vite 6.0
- Ant Design 5.29 UI 框架
- Zustand 状态管理
- React Router 7.9 路由
- Axios HTTP 客户端（带拦截器）
- 端口 3000

### ✅ 认证功能 (features/auth)
- 登录/注册表单组件
- JWT Token 管理
- 用户状态持久化
- 受保护的路由
- useAuth Hook

### ✅ 对话功能 (features/chat)
- SSE 流式对话
- 消息气泡组件（支持 Markdown）
- 实时消息展示
- 自动滚动
- 停止流式输出
- useSSEChat Hook

### ✅ 布局与路由
- MainLayout 主布局（Header + Sider + Content）
- 侧边栏导航（对话/智能体/客服/知识库）
- 用户信息下拉菜单
- 受保护的路由系统

## 核心优势

### Feature-Based Architecture 优点：
1. **高内聚低耦合**：每个功能模块独立，包含 API、组件、hooks、状态管理
2. **易于维护**：功能相关代码集中在一起，修改不影响其他模块
3. **团队协作友好**：不同开发者可并行开发不同 feature，减少冲突
4. **可扩展性强**：新增功能只需添加新的 feature 目录
5. **代码复用**：通用逻辑放在 lib/，业务逻辑在 features/ 内复用

### 技术栈优势：
- **React 19**：最新稳定版，性能优化
- **TypeScript**：完整类型安全
- **SSE**：比 WebSocket 更简单，满足单向流式需求
- **Zustand**：轻量级状态管理，比 Redux 简单
- **Ant Design**：企业级 UI 组件库

## 待开发功能

后续需要完成的 features：

```
features/
├── agent/                        # 智能体管理（待开发）
│   ├── api/agent.ts
│   ├── components/
│   │   ├── AgentCard.tsx
│   │   ├── AgentForm.tsx
│   │   └── AgentList.tsx
│   ├── hooks/useAgent.ts
│   └── store.ts
│
├── conversation/                 # 客服管理（待开发）
│   ├── api/conversation.ts
│   ├── components/
│   │   ├── ConversationCard.tsx
│   │   └── ConversationList.tsx
│   ├── hooks/useConversation.ts
│   └── store.ts
│
└── knowledge/                    # 知识库管理（待开发）
    ├── api/knowledge.ts
    ├── components/
    │   ├── FileUpload.tsx
    │   └── DocumentList.tsx
    ├── hooks/useKnowledge.ts
    └── store.ts
```

## 开发指南

### 启动开发服务器
```bash
npm run dev
# 访问 http://localhost:3000
```

### 添加新功能模块
1. 在 `features/` 创建新目录
2. 创建 `api/`、`components/`、`hooks/`、`store.ts`
3. 在 `pages/` 创建对应页面
4. 在 `app/router.tsx` 添加路由

### 环境变量
```bash
# .env.development
VITE_API_BASE_URL=https://atlas.matrix-net.tech/api
VITE_APP_TITLE=Atlas Assistant
VITE_APP_VERSION=1.0.0
```

## API 集成

后端 API：`https://atlas.matrix-net.tech/api`
- 使用 JWT Bearer Token 认证
- Traefik 反向代理已配置
- 无需前端 API 代理

## 部署

### Docker 构建
```bash
docker build -t atlas-assistant:latest .
docker run -p 80:80 atlas-assistant:latest
```

### 生产构建
```bash
npm run build
# 输出在 dist/ 目录
```

---

**架构重构完成时间**: 2025年
**技术栈版本**: React 19.2.0, TypeScript 5.9.3, Vite 6.0.7
**架构模式**: Feature-Based Architecture (2025 标准)
