# MindVault 前端架构重构与优化计划 (Refactor Plan)

在完成 **MindVault** 问答与知识库管理页面的高保真前端原型交付后，Gemini (ba028) 与 Claude (59f86) 针对当前前端实现的架构设计、代码健壮性以及交互细节进行了深度探讨。

双方一致认可当前原型在**引用溯源系统设计、视觉一致性以及丰富的静态交互细节**上的高水准表现，同时也梳理出了以下具有针对性的优化与重构方向，作为后续进入正式开发或代码演进的指导计划。

---

## 🎯 核心重构与优化任务列表

### 1. 📦 组件深度拆分，避免单文件臃肿 (Component Decomposition)
*   **当前问题**：核心文件体积过大，业务逻辑与视图混杂。`kb/page.tsx` 接近 800 行，`chat/page.tsx` 近 400 行，`MindVaultContext.tsx` 超过 600 行。
*   **重构方案**：
    *   将 `src/app/kb/page.tsx` 分拆为多个职责单一的子组件：
        *   `KBDashboard.tsx`：展示知识库总览和卡片网格。
        *   `DocumentTable.tsx`：管理文档列表及操作。
        *   `UploadZone.tsx`：负责文件拖拽上传交互。
        *   `RetrievalSandbox.tsx`：承载检索测试分屏交互。
    *   将 `src/app/chat/page.tsx` 拆分出：
        *   `ChatMessageList.tsx`：渲染对话消息流及打字机效果。
        *   `ChatInputArea.tsx`：输入框及快捷问答模板。
    *   将 `MindVaultContext.tsx` 瘦身：将 mock 数据和流式模拟逻辑抽离到专门的服务层 `src/services/mockRagService.ts` 中。

### 2. 🗺️ 意图路由与规则配置化 (Intent Routing)
*   **当前问题**：`sendMessage` 和 `executeRetrievalTest` 中使用长 `if/else` 链条进行关键字模糊匹配（如 `query.includes("架构")`），难以扩展。
*   **重构方案**：
    *   建立可配置的意图匹配路由表（Intent Route Table）。
    *   通过配置文件或数组映射将用户查询与特定的 Mock 响应、相关切片文档及引用片段进行关联，使其具备更好的维护性与向真实后端 RAG API 迁移的平滑度。

### 3. 💾 优化拖拽上传的 Mock 拟真度 (Realistic Mock Behavior)
*   **当前问题**：用户拖拽真实文件上传后，列表中出现的内容仍然是硬编码的 mock 文档，容易造成困惑。
*   **重构方案**：
    *   利用 `onDrop` 事件中捕获的真实 `File` 对象的属性（文件名、大小、类型），动态生成临时的文档条目加入状态列表，让模拟的解析进度条对用户拖拽的文件生效。
    *   同时，在上传开始或结束时给出明显的 Toast 友情提示，声明：“*当前为前端原型演示，文件解析与存储为本地模拟行为*”。

### 4. ⚡ 优化 React 副作用依赖 (Performance & Idiomatic React)
*   **当前问题**：`chat/page.tsx` 中用于控制消息流滚动底部的 `useEffect` 依赖不优雅：
    ```typescript
    useEffect(() => { ... }, [activeConversation?.messages?.length, activeConversation?.messages?.map(m => m.content).join(",")])
    ```
    每次渲染都会构造新数组并进行 `join` 拼接，这在频繁更新或长对话时会造成不必要的开销。
*   **重构方案**：
    *   简化依赖项，在仅需要滚动到最底部时，依赖 `activeConversation?.messages?.length`；或者为 messages 增加稳定的版本号/更新标志，保证依赖的轻量与高效。

### 5. 🚦 补充 Next.js 路由级加载与错误边界 (Routing Skeletons & Errors)
*   **当前问题**：目前页面主要采用 `use client`，尚未充分利用 Next.js App Router 的服务端与路由特性。
*   **重构方案**：
    *   在 `src/app/chat/` 和 `src/app/kb/` 目录下补充 `loading.tsx`（骨架屏占位）与 `error.tsx`（错误边界组件），提升静态原型向动态应用过渡时的加载体验与容错能力。

### 6. ♿ 提升无障碍访问性 (Accessibility / A11y)
*   **当前问题**：拖拽上传区、侧边栏折叠按钮、可点击的引用角标等交互元素缺少语义化标记，影响键盘导航或屏幕阅读器用户的体验。
*   **重构方案**：
    *   为所有纯图标按钮、可折叠控件增加 `aria-label`、`aria-expanded` 属性。
    *   确保拖拽上传和引用展开支持回车（Enter）或空格（Space）触发，提供更包容的 UX 交互。

---

## 📈 后续执行规划

1.  **第一阶段**：代码瘦身与规范整理（完成优化任务 4, 3, 6）。
2.  **第二阶段**：组件解耦与分拆（完成优化任务 1, Next.js 路由骨架 5）。
3.  **第三阶段**：意图路由配置化重构（完成优化任务 2，为后续联调真实后端打下完美基础）。
