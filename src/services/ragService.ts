import type {
  KbDocument,
  DocumentRecord,
  Session,
  Conversation,
  Message,
  KnowledgeBase,
  DocumentUploadResponse,
  RetrievalTestResponse,
  RefChunk,
  Citation,
  ChatHistoryRecord,
} from "@/types/api";
import { refChunkToCitation } from "@/types/api";
import * as api from "./apiClient";

// ==================== 类型转换 ====================

export function kbDocumentToDocRecord(doc: KbDocument): DocumentRecord {
  return {
    id: String(doc.id),
    kbId: "kb-default",
    name: doc.doc_name,
    size: "—",
    chars: doc.chunk_count,
    status: doc.status === 1 ? "success" : "failed",
    progress: 100,
    uploadedAt: doc.created_at?.replace("T", " ").substring(0, 16) || "",
    type: doc.doc_type,
  };
}

export function sessionToConversation(session: Session): Conversation {
  return {
    id: session.session_id,
    title: session.title,
    messages: [],
    createdAt: session.created_at,
  };
}

export function historyRecordToMessage(record: ChatHistoryRecord, index: number): {
  user: Message;
  assistant: Message;
} {
  const baseTime = record.created_at;
  return {
    user: {
      id: `msg-user-${record.id}`,
      role: "user",
      content: record.question,
      timestamp: baseTime,
    },
    assistant: {
      id: `msg-assistant-${record.id}`,
      role: "assistant",
      content: record.answer,
      timestamp: baseTime,
      citations: record.ref_chunks?.map((c, i) => refChunkToCitation(c, i)) || [],
    },
  };
}

// ==================== 默认知识库 ====================

const DEFAULT_KNOWLEDGE_BASE: KnowledgeBase = {
  id: "kb-default",
  name: "默认知识库",
  description: "本地私有化 RAG 知识库，所有文档在此统一管理与检索。",
  docCount: 0,
  charCount: 0,
  createdAt: "",
};

export function getDefaultKnowledgeBase(): KnowledgeBase {
  return { ...DEFAULT_KNOWLEDGE_BASE };
}

// ==================== 文档 API ====================

export async function fetchDocuments(
  page = 1,
  pageSize = 50,
  signal?: AbortSignal,
): Promise<{ docs: DocumentRecord[]; total: number }> {
  const data = await api.get<{ items: KbDocument[]; total: number }>(
    `/api/v1/kb/documents?page=${page}&page_size=${pageSize}`,
    signal,
  );
  return {
    docs: data.items.map(kbDocumentToDocRecord),
    total: data.total,
  };
}

export async function uploadDocuments(
  files: File[],
  signal?: AbortSignal,
): Promise<DocumentUploadResponse> {
  return api.uploadFiles<DocumentUploadResponse>("/api/v1/kb/documents", files, signal);
}

export async function deleteDocument(docId: number, signal?: AbortSignal): Promise<void> {
  await api.del(`/api/v1/kb/documents/${docId}`, signal);
}

// ==================== 会话 API ====================

export async function fetchSessions(signal?: AbortSignal): Promise<Session[]> {
  const data = await api.get<{ sessions: Session[] }>("/api/v1/kb/chat/sessions", signal);
  return data.sessions;
}

export async function fetchChatHistory(
  sessionId: string,
  page = 1,
  pageSize = 50,
  signal?: AbortSignal,
): Promise<{ items: ChatHistoryRecord[]; total: number }> {
  const params = new URLSearchParams({ session_id: sessionId, page: String(page), page_size: String(pageSize) });
  return api.get<{ items: ChatHistoryRecord[]; total: number }>(
    `/api/v1/kb/chat/history?${params}`,
    signal,
  );
}

// ==================== 检索测试 API ====================

export async function testRetrieval(
  query: string,
  topK = 5,
  threshold = 0.5,
  signal?: AbortSignal,
): Promise<RetrievalTestResponse> {
  return api.post<RetrievalTestResponse>(
    "/api/v1/kb/retrieval/test",
    { query, top_k: topK, threshold },
    signal,
  );
}

// ==================== Chat SSE ====================

export { streamChat } from "./apiClient";
export type { SSEChatEvent } from "./apiClient";
