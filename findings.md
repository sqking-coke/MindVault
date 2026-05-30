# P2 研究发现与代码审查结果

> 记录 P2 阶段代码审查发现、技术决策依据和外部参考。

## 1. 代码审查发现

### 1.1 已就绪的基础设施

- **KbChunk.page 字段**：已在模型中定义 (`backend/app/models/chunk.py:19`)，类型 `Optional[int]`，但 PDF 解析时 `ingestion_service.py` 未填充此字段
- **Redis URL**：已在 `config.py` 中配置 (`REDIS_URL: str = "redis://localhost:6379"`)，但全代码库无任何 Redis 客户端代码
- **软删除**：`document_service.soft_delete_document()` 已实现，通过设置 `deleted_at` 时间戳。检索时已过滤软删除文档 (`KbDocument.deleted_at.is_(None)`)
- **chunk_locate API**：`GET /api/v1/kb/chunks/{id}/preview` 和 `POST /api/v1/kb/chunks/{id}/locate` 已实现，但 PDF 页面信息缺失导致 locate 返回 `page: 0`
- **Q&A 记录完整**：`KbQaRecord` 存储 question/answer/ref_chunks/model_name/created_at，具备统计分析的数据基础

### 1.2 待补齐的能力

| 缺失能力 | 影响范围 | 紧急度 |
|---------|---------|--------|
| 文档启用/禁用 (status toggle) | kb_documents.status 只有 0/1/2 (failed/processing/completed)，缺少"人工禁用"语义 | 高 |
| Redis 客户端封装 | 无缓存，高频检索每次查询 pgvector | 中 |
| PDF 页码提取 | PyPDF2 解析时未保留 page_number 元信息 | 中 |
| 增量重索引 | 文档更新后需手动删除再上传，无 re-ingest API | 中 |
| 切片手动编辑 | 无 API 支持编辑单个切片内容 | 低 |
| 问答统计聚合 | Q&A 数据已有但无聚合查询 API | 中 |

### 1.3 Model 层扩展需求

当前 `KbDocument.status` 使用 int 常量：
- `DOC_STATUS_FAILED = 0`
- `DOC_STATUS_PROCESSING = 1`
- `DOC_STATUS_COMPLETED = 2`

P2 需要新增：
- `DOC_STATUS_DISABLED = 3` （人工禁用，已有切片保留但检索跳过）

### 1.4 需要新增的数据库表

- `kb_qa_feedback`：问答反馈表（可选，P3 再做）
- 不需要新表，现有表结构足够支撑 P2 需求

## 2. 技术决策

### 2.1 Redis 缓存策略

- **方案**：缓存 query_embedding → retrieval_results 映射
- **Key 设计**：`retrieval:{md5(query_embedding_bytes)}`（embedding 列表 hash 后做 key）
- **TTL**：1 小时（环境变量 `REDIS_CACHE_TTL` 可配）
- **库选择**：`redis-py` (官方，async support via `redis.asyncio`)

### 2.2 PDF 页码提取

- **PyPDF2**：当前解析器使用，需改造为逐页读取 + 保留页码
- **pdfplumber**：备选方案，页码提取更可靠但速度较慢
- **决策**：优先增强 PyPDF2 解析逻辑（最小改动），pdfplumber 作为 fallback

### 2.3 增量向量更新策略

- 文档重索引 API：`POST /api/v1/kb/documents/{id}/reindex`
- 流程：删除旧 chunks → 重新解析 → 重新切片 → 重新向量化 → 写入新 chunks
- 事务保护：在单个事务中完成删除+写入，失败回滚

### 2.4 问答统计实现

- 利用现有 `kb_qa_records` + `kb_sessions` 表做聚合查询
- 高频问题：按 question 文本相似度聚类（简单方案：按 question 前缀 50 字符 group by）
- 无答案问题：ref_chunks 为空或 similarity 低于阈值的记录

## 3. 参考资源

- 设计文档 v1.1 §6.5 知识库运维管理模块设计
- 设计文档 v1.1 §8.2 智能问答接口（SSE 进度事件）
- 设计文档 v1.1 §9.2 引用溯源交互（P2 双屏联动 PDF 高亮）
- [redis-py async docs](https://redis-py.readthedocs.io/en/stable/)
- [PyPDF2 page extraction](https://pypdf2.readthedocs.io/)
