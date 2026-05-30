# P2-04 - API 契约文档

> P2 阶段新增/修改的 API 接口契约，包含请求/响应格式和错误码。

## 1. 接口总览

| 方法 | 路径 | 说明 | 变更类型 |
|------|------|------|---------|
| PUT | `/api/v1/kb/documents/{id}/status` | 切换文档禁用/启用 | **NEW** |
| POST | `/api/v1/kb/documents/{id}/reindex` | 文档增量重索引 | **NEW** |
| GET | `/api/v1/kb/documents/{id}/chunks` | 获取文档所有切片列表 | **NEW** |
| PUT | `/api/v1/kb/chunks/{id}` | 编辑切片内容并重向量化 | **NEW** |
| DELETE | `/api/v1/kb/chunks/{id}` | 删除单个切片 | **NEW** |
| GET | `/api/v1/kb/stats/overview` | 知识库运维概览 | **NEW** |
| GET | `/api/v1/kb/stats/frequent-questions` | 高频问题统计 | **NEW** |
| GET | `/api/v1/kb/stats/unanswered` | 无答案问题列表 | **NEW** |
| POST | `/api/v1/kb/chunks/{id}/locate` | 切片定位（已有，增强页码） | **MODIFY** |

## 2. 文档运维管理

### 2.1 切换文档状态

```
PUT /api/v1/kb/documents/{id}/status
```

**Request:**
```json
{
  "status": "disabled"  // "disabled" | "enabled"
}
```

**Response (200):**
```json
{
  "code": 0,
  "data": {
    "id": 42,
    "doc_name": "系统架构设计手册.md",
    "status": 3,
    "status_label": "disabled",
    "updated_at": "2026-05-29T14:00:00Z"
  }
}
```

**错误码:**
| code | message |
|------|---------|
| 4001 | 文档不存在 |
| 4002 | 文档已软删除，无法操作 |
| 4003 | 无效的状态值 (仅支持 disabled/enabled) |

### 2.2 文档增量重索引

```
POST /api/v1/kb/documents/{id}/reindex
```

**Response (202):**
```json
{
  "code": 0,
  "data": {
    "doc_id": 42,
    "doc_name": "系统架构设计手册.md",
    "status": "processing",
    "message": "重索引已提交，后台处理中"
  }
}
```

**说明**: 
- 异步操作，返回 202
- 后台流程: 删除旧 chunks → 清除 Redis 缓存 → 重新解析 → 切片 → 向量化 → 更新状态
- 前端可通过轮询 `GET /api/v1/kb/documents/{id}` 的 `status` 字段确认完成

### 2.3 获取文档切片列表

```
GET /api/v1/kb/documents/{id}/chunks?page=1&page_size=20
```

**Response (200):**
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": 1001,
        "chunk_index": 0,
        "content": "微服务间通过 gRPC 进行同步通信...",
        "page": 3,
        "created_at": "2026-05-28T10:00:00Z"
      }
    ],
    "total": 42,
    "page": 1,
    "page_size": 20
  }
}
```

## 3. 切片管理

### 3.1 编辑切片内容

```
PUT /api/v1/kb/chunks/{id}
```

**Request:**
```json
{
  "content": "微服务间通过 gRPC 进行同步通信，通过 Kafka 进行异步事件发布。每个服务拥有独立的数据库。"
}
```

**Response (200):**
```json
{
  "code": 0,
  "data": {
    "id": 1001,
    "chunk_index": 0,
    "content": "微服务间通过 gRPC 进行同步通信，通过 Kafka 进行异步事件发布。每个服务拥有独立的数据库。",
    "page": 3,
    "updated_at": "2026-05-29T14:30:00Z"
  }
}
```

**说明**: 更新 content 后自动重新调用 embedding_service 生成新向量，写入 pgvector

### 3.2 删除切片

```
DELETE /api/v1/kb/chunks/{id}
```

**Response (200):**
```json
{
  "code": 0,
  "data": null
}
```

**说明**: 物理删除切片记录和向量。同时更新文档的 chunk_count -= 1

## 4. 问答复盘统计

### 4.1 知识库运维概览

```
GET /api/v1/kb/stats/overview
```

**Response (200):**
```json
{
  "code": 0,
  "data": {
    "total_documents": 15,
    "active_documents": 12,
    "disabled_documents": 3,
    "processing_documents": 0,
    "total_chunks": 1247,
    "total_qa_records": 328,
    "avg_similarity": 0.92,
    "total_storage_bytes": 524288000,
    "last_ingestion_at": "2026-05-29T13:00:00Z",
    "last_qa_at": "2026-05-29T14:32:00Z"
  }
}
```

### 4.2 高频问题统计

```
GET /api/v1/kb/stats/frequent-questions?top_n=10
```

**Response (200):**
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "rank": 1,
        "question": "微服务之间如何通信？",
        "count": 23,
        "last_asked_at": "2026-05-29T14:32:00Z"
      }
    ],
    "total_unique_questions": 42
  }
}
```

**说明**: 按 question 前 50 字符分组聚合，count 降序排列

### 4.3 无答案问题列表

```
GET /api/v1/kb/stats/unanswered?page=1&page_size=20
```

**Response (200):**
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": 2048,
        "question": "Kubernetes 中的 Service Mesh 如何配置？",
        "created_at": "2026-05-29T10:15:00Z",
        "session_id": "550e8400-e29b-41d4-a716-446655440000"
      }
    ],
    "total": 5,
    "page": 1,
    "page_size": 20
  }
}
```

**筛选逻辑**: `ref_chunks` 为空数组 `[]` 的 QA 记录

### 5. 增强: 切片定位（已有，页码增强）

```
POST /api/v1/kb/chunks/{id}/locate
```

**Response (200):** (增强 page 为真实 PDF 页码)
```json
{
  "code": 0,
  "data": {
    "chunk_id": 1001,
    "page": 3,
    "offset": 1024,
    "highlight_anchor": "微服务间通过 gRPC 进行同步通信，通过 Kafka 进行异步事件发布..."
  }
}
```

## 6. 错误码汇总

| Code | 类别 | 说明 |
|------|------|------|
| 0 | - | 成功 |
| 4001 | 文档 | 文档不存在或已删除 |
| 4002 | 文档 | 文档已软删除，无法操作 |
| 4003 | 文档 | 无效状态值 |
| 4004 | 切片 | 切片不存在 |
| 4005 | 文档 | 重索引失败（文档处于处理中状态） |
| 5001 | LLM | 大模型调用失败 |
| 5002 | Embedding | 向量生成失败 |
| 5003 | Redis | 缓存服务不可用（降级到直接查库） |

## 7. 鉴权与限流

所有 P2 新增接口统一使用现有鉴权限流策略:
- `Authorization: Bearer <API_KEY>` 头
- 运维类接口 (PUT/DELETE/POST reindex) 使用现有限流（10/min per IP）
- 统计查询接口 (GET) 不限流
