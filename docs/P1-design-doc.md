# MindVault P1 增强设计文档

> **版本：v1.0** | 创建：2026-05-29 | 关联 Issue：COKE-38
> **目标**：多格式支持 + 多轮对话 + 检索沙盒 + 产品化交互

---

## 1. 设计目标与范围

P1 在 P0（RAG 最小闭环）基础上增强为**可用产品**。P0 已交付：单文件上传（TXT/MD/PDF/docx）、单轮问答 + SSE 流式、pgvector HNSW 检索、会话管理、前端 Chat/KB 页面 + 引用溯源。

P1 补齐 8 个能力缺口：

| 编号 | 模块 | 能力 | 当前状态 |
|------|------|------|----------|
| P1-1 | 智能问答 | 多轮对话上下文注入 | ❌ session 和 history 已存储，但 LLM prompt 不含历史对话 |
| P1-2 | 智能问答 | 意图识别分类 | ❌ SSE progress 事件写死 "正在理解问题..." |
| P1-3 | 安全 | API Key 鉴权 | ❌ `verify_api_key` 函数已定义但未注册为路由依赖 |
| P1-4 | 安全 | 接口限流 | ❌ slowapi Limiter 已初始化但未应用 `@limiter.limit` 装饰器 |
| P1-5 | 运维 | loguru 日志轮转 | ❌ 只输出 stderr，未配置文件 sink（rotation/retention） |
| P1-6 | 前端 | 知识卡片生成 | ❌ 无分享/导出功能 |
| P1-7 | 前端 | 移动端响应式适配 | ❌ 无移动端 hamburger 菜单、无 safe-area 适配 |
| P1-8 | 配置 | 环境变量完整性 | ❌ .env 缺少若干已定义字段 |

---

## 2. 系统架构（P1 增量视角）

```
┌────────────────────────────────────────────────────────────────────┐
│                    前端层 (Next.js 14)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │ ChatMessage  │  │ KnowledgeCard│  │ Sidebar (Mobile Adaptive) │ │
│  │  + 分享按钮   │  │  html2canvas │  │  hamburger + overlay     │ │
│  └──────────────┘  └──────────────┘  └───────────────────────────┘ │
└────────────────────────────┬───────────────────────────────────────┘
                             │ REST + SSE
┌────────────────────────────▼───────────────────────────────────────┐
│                  API 网关层 (FastAPI) ★ P1 新增安全层               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │ AuthMiddleware   │  │ RateLimiter     │  │ RequestLogger     │  │
│  │ Bearer API Key   │  │ chat 30/min     │  │ (已有)            │  │
│  │ (skip /health)   │  │ upload 10/min   │  │                   │  │
│  └─────────────────┘  └─────────────────┘  └───────────────────┘  │
└────────────────────────────┬───────────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                RAG Agent 核心层 ★ P1 增量                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ chat_stream() 增强：                                          │  │
│  │  ① 意图识别 _classify_intent(question) → progress event       │  │
│  │  ② 历史上下文 _build_history(session_id) → 注入 LLM prompt    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│                 数据持久层 (已有，不变)                               │
│  PostgreSQL + pgvector │ Redis │ 本地文件存储                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. 数据流设计

### 3.1 多轮对话上下文注入流程

```
用户提问 "它有什么优点？"（session_id=xxx）
        │
        ▼
┌─ chat_stream() ──────────────────────────────────────────────┐
│ ① 校验/创建 session                                          │
│ ② 意图识别 → "knowledge_qa" → SSE progress(intent)           │
│ ③ Embedding(question)                                        │
│ ④ 向量检索 → top_k chunks                                    │
│ ⑤ 查询历史 Q&A (最近 N 条) ──────┐                           │
│ ⑥ 构建 prompt:                   │                           │
│    参考文档: [chunks]             │                           │
│    对话历史:                      │                           │
│      用户: 什么是RAG？  ←─────────┘                           │
│      助手: RAG是检索增强生成...                                │
│      用户: 它有什么优点？                                       │
│    请回答：                                                    │
│ ⑦ LLM 流式生成 → SSE token                                  │
│ ⑧ 保存 QA 记录                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 认证与限流中间件链

```
HTTP Request
    │
    ▼
┌─ CORS 中间件 (已有) ──────────────────┐
│  允许 origin: localhost:3000          │
└───────────────────────────────────────┘
    │
    ▼
┌─ Request Log 中间件 (已有) ───────────┐
│  log method/path/status/elapsed       │
└───────────────────────────────────────┘
    │
    ▼
┌─ API Key 鉴权 ★ P1 新增 ─────────────┐
│  Header: Authorization: Bearer <key> │
│  skip: /api/v1/health                │
│  401 if key mismatch                 │
└───────────────────────────────────────┘
    │
    ▼
┌─ 限流 ★ P1 新增 ─────────────────────┐
│  POST /chat      → 30/min per IP     │
│  POST /documents → 10/min per IP     │
│  429 if exceeded                     │
└───────────────────────────────────────┘
    │
    ▼
  Route Handler
```

---

## 4. 详细实现规格

### P1-1：多轮对话上下文

**文件**：`backend/app/services/chat_service.py`

**改动点**：
1. 新增常量 `MAX_HISTORY_TURNS = 5`（可通过环境变量覆盖）
2. 新增 `_classify_intent(question: str) -> str` 函数
3. 新增 `_build_history(db, session_internal_id: int) -> str` 异步函数
4. 修改 `chat_stream()` 中的 LLM prompt 拼接逻辑

**`_build_history()` 伪代码**：
```python
async def _build_history(db, session_id):
    rows = select(KbQaRecord).where(session_id=...).order_by(desc).limit(N)
    if not rows: return ""
    parts = ["\n## 对话历史\n"]
    for r in reversed(rows):  # 时间正序
        parts.append(f"用户: {r.question}\n助手: {r.answer}\n")
    return "\n".join(parts)
```

**Prompt 模板变化**：
```
# Before (P0)
参考文档：\{context}\n用户问题：\{question}\n请回答：

# After (P1)
参考文档：\{context}\n\{history}\n用户问题：\{question}\n请回答：
```

### P1-2：意图识别

**文件**：`backend/app/services/chat_service.py`

**方案**：轻量关键词匹配（不需要 ML 模型），三类意图：

| 意图 | 触发关键词 | 示例 |
|------|-----------|------|
| `knowledge_qa` | 什么是/如何/怎么/为什么/原理/架构/设计/区别/配置 | "什么是 pgvector" |
| `document_lookup` | 查找/搜索/列出/有哪些/找一下 | "找一下关于微服务的文档" |
| `chitchat` | 你好/谢谢/再见/帮助/你是谁 | "你好" |

**代码**：
```python
INTENT_PATTERNS = [
    (["什么是","如何","怎么","为什么","原理","架构"], "knowledge_qa"),
    (["查找","搜索","列出","有哪些","找一下"], "document_lookup"),
    (["你好","谢谢","再见","帮助","你是谁"], "chitchat"),
]

def _classify_intent(question: str) -> str:
    for keywords, intent in INTENT_PATTERNS:
        for kw in keywords:
            if kw in question:
                return intent
    return "knowledge_qa"  # default
```

**SSE progress 事件变化**：
```json
// Before
{"phase":"intent","message":"正在理解问题...","elapsed_ms":0}

// After
{"phase":"intent","message":"正在理解问题...","intent":"knowledge_qa","elapsed_ms":0}
```

### P1-3：API Key 鉴权

**文件**：
- `backend/app/api/deps.py` — 重写 `verify_api_key`（现在是 name-only，需改为实际校验）
- `backend/app/api/v1/router.py` — 注册依赖

**方案**：
- 修改 `verify_api_key` 为实际校验函数（当前只在校验 `APP_ENV == "production"` 时工作，且有 Header alias 问题）
- 使用 FastAPI 的 `Depends(verify_api_key)` 注入到 `api_router`
- Health check 路由单独注册（不经过 auth）

**依赖注入位置**：
```python
# router.py
api_router = APIRouter(prefix="/api/v1", dependencies=[Depends(verify_api_key)])
# health 路由独立注册，不加依赖
```

**校验逻辑**：
```python
async def verify_api_key(request: Request):
    if not settings.API_KEY or settings.API_KEY == "change-me-in-production":
        return  # 开发模式放行
    auth = request.headers.get("Authorization", "")
    token = auth.removeprefix("Bearer ").strip()
    if not token or token != settings.API_KEY:
        raise HTTPException(status_code=401)
```

### P1-4：限流

**文件**：
- `backend/app/core/middleware.py` — 移除 `default_limits`（改由路由注解精确控制）
- `backend/app/api/v1/chat.py` — `@limiter.limit("30/minute")`
- `backend/app/api/v1/documents.py` — `@limiter.limit("10/minute")`

**注意**：限流装饰器要求路由 handler 接收 `request: Request` 参数。

**配置开关**：`RATE_LIMIT_ENABLED`（config 新增字段）

### P1-5：日志轮转

**文件**：`backend/app/main.py`

**改动**：在 `create_app()` 之前调用 `_setup_logging()`，添加文件 sink：

```python
def _setup_logging():
    logger.remove()
    logger.add(sys.stderr, level=settings.LOG_LEVEL, ...)
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(parents=True, exist_ok=True)
    logger.add(
        log_dir / "mindvault_{time}.log",
        rotation="00:00",       # 每天午夜轮转
        retention=f"{settings.LOG_RETENTION} days",
        encoding="utf-8",
    )
```

### P1-6：知识卡片

**文件**：
- 新增 `src/components/chat/KnowledgeCard.tsx`
- 修改 `src/components/chat/ChatMessageList.tsx`（添加分享按钮）

**依赖**：`html2canvas`（npm）

**功能**：
1. 每条助手消息旁增加"分享"按钮（仅在消息长度 > 20 字符时显示）
2. 点击后弹出 Modal，展示知识卡片预览
3. 三种皮肤切换：高雅极简（米色）、暗黑科技（深色）、企业蓝（蓝色）
4. 卡片内容：问题 + 答案摘要 + 引用来源 + MindVault 水印 + 日期
5. 使用 `html2canvas` 导出为 PNG 下载

### P1-7：移动端响应式

**文件**：
- `src/components/layout/Sidebar.tsx` — 核心改动
- `src/app/globals.css` — iOS safe-area 工具类

**Sidebar 改动**：
1. 新增 `mobileOpen` 状态
2. 移动端（`<md`）：Sidebar 默认隐藏，显示固定位置的 hamburger 按钮
3. 点击 hamburger → Sidebar 以 `fixed` overlay 从左侧滑入 + 半透明背景遮罩
4. 点击遮罩 / 导航链接 / 对话项 → 关闭 Sidebar
5. 桌面端（`>=md`）：行为不变

**CSS 新增**：
```css
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### P1-8：环境变量完整性

**文件**：
- `backend/app/config.py` — 新增 `CORS_ORIGINS`、`RATE_LIMIT_ENABLED`
- `.env.example` — 补齐缺失字段

**新增字段**：
```
CORS_ORIGINS=http://localhost:3000,http://localhost  # 从硬编码提升为可配置
RATE_LIMIT_ENABLED=true                               # 限流开关
LOG_LEVEL=INFO                                        # 已定义但 .env.example 缺失
LOG_DIR=/app/logs                                     # 已定义但 .env.example 缺失
LOG_RETENTION=30                                      # 已定义但 .env.example 缺失
```

---

## 5. 文件变更清单

| 文件 | 操作 | 影响模块 |
|------|------|----------|
| `backend/app/services/chat_service.py` | 修改 | P1-1, P1-2 |
| `backend/app/api/deps.py` | 修改 | P1-3 |
| `backend/app/api/v1/router.py` | 修改 | P1-3 |
| `backend/app/api/v1/chat.py` | 修改 | P1-4 |
| `backend/app/api/v1/documents.py` | 修改 | P1-4 |
| `backend/app/core/middleware.py` | 修改 | P1-4 |
| `backend/app/main.py` | 修改 | P1-3, P1-4, P1-5 |
| `backend/app/config.py` | 修改 | P1-8 |
| `.env.example` | 修改 | P1-8 |
| `src/components/chat/KnowledgeCard.tsx` | **新增** | P1-6 |
| `src/components/chat/ChatMessageList.tsx` | 修改 | P1-6 |
| `src/components/layout/Sidebar.tsx` | 修改 | P1-7 |
| `src/app/globals.css` | 修改 | P1-7 |

共 **13 个文件**（2 新增，11 修改）。

---

## 6. 验收标准

| 编号 | 验收项 | 验证方式 |
|------|--------|----------|
| P1-1 | 连续提问"什么是RAG"→"它有什么优点"，LLM 理解"它"=RAG | 查看 SSE token 流，回答应包含上下文关联 |
| P1-2 | SSE progress 第一个事件包含 `intent` 字段 | `curl -N POST /chat` 检查第一条 `event:progress` |
| P1-3 | 无 Authorization 头 → 401；正确 Bearer token → 200 | `curl` 测试 |
| P1-4 | 1 分钟内 31 次 POST /chat → 第 31 次返回 429 | 脚本压测 |
| P1-5 | `backend/logs/` 目录有每日轮转日志文件 | `ls backend/logs/` |
| P1-6 | 点击"分享"→弹出卡片预览→切换皮肤→下载 PNG | 浏览器手动测试 |
| P1-7 | 浏览器宽度 < 768px → hamburger 出现，Sidebar 可滑入/滑出 | 浏览器 DevTools 响应式模式 |
| P1-8 | `python -c "from app.config import settings; print(settings.CORS_ORIGINS)"` 可正常读取 | CLI 测试 |

---

## 7. 实施顺序（按依赖关系）

```
Phase A（独立，可并行）
  ├── P1-5：日志轮转（不依赖任何其他任务）
  ├── P1-8：环境变量（不依赖任何其他任务）
  └── P1-7：移动端响应式（纯前端，独立）

Phase B（依赖 Phase A 的 config）
  ├── P1-3：API Key 鉴权（依赖 P1-8 的 CORS_ORIGINS 合理性）
  └── P1-4：限流（依赖 P1-3 的 limiter 清理 + P1-8 的 RATE_LIMIT_ENABLED）

Phase C（核心 RAG 逻辑）
  ├── P1-1：多轮对话上下文
  └── P1-2：意图识别
       （同一文件 chat_service.py，一起改）

Phase D（前端增强）
  └── P1-6：知识卡片
```

---

## 8. 风险与约束

- **不引入新的 Python 依赖**（限流用已有的 slowapi，日志用已有的 loguru，html2canvas 是唯一新增的 npm 包）
- **不修改数据库 schema**（P1 不涉及表结构变更）
- **不修改现有 API 契约**（只增强，不破坏兼容性）
- **所有 P0 测试必须继续通过**

---

> **下一步**：请确认此设计文档，确认后按 Phase A→B→C→D 顺序实施。
