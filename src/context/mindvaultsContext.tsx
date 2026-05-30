"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type {
  Citation,
  Message,
  Conversation,
  KnowledgeBase,
  DocumentRecord,
} from "@/types/api";
import { refChunkToCitation } from "@/types/api";
import {
  getDefaultKnowledgeBase,
  fetchDocuments,
  uploadDocuments as apiUploadDocuments,
  deleteDocument as apiDeleteDocument,
  toggleDocumentStatus as apiToggleDocumentStatus,
  reindexDocument as apiReindexDocument,
  fetchSessions,
  fetchChatHistory,
  historyRecordToMessage,
  kbDocumentToDocRecord,
} from "@/services/ragService";
import { streamChat } from "@/services/apiClient";

export type { Citation, Message, Conversation, KnowledgeBase, DocumentRecord };

interface mindvaultsContextType {
  activeTab: "chat" | "kb";
  setActiveTab: (tab: "chat" | "kb") => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  addConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  sendMessage: (content: string) => void;
  isGenerating: boolean;
  knowledgeBases: KnowledgeBase[];
  activeKbId: string | null;
  setActiveKbId: (id: string | null) => void;
  addKnowledgeBase: (name: string, description: string) => void;
  deleteKnowledgeBase: (id: string) => void;
  documents: DocumentRecord[];
  uploadDocuments: (kbId: string, files: File[]) => void;
  deleteDocument: (docId: string) => void;
  reparseDocument: (docId: string) => void;
  toggleDocumentStatus: (docId: string, status: "disabled" | "enabled") => Promise<void>;
  reindexDocument: (docId: string) => Promise<void>;
  selectedCitation: Citation | null;
  setSelectedCitation: (citation: Citation | null) => void;
}

const mindvaultsContext = createContext<mindvaultsContextType | undefined>(undefined);

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const mindvaultsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<"chat" | "kb">("chat");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [activeKbId, setActiveKbId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  // ---- initial load from backend ----
  useEffect(() => {
    const defaultKb = getDefaultKnowledgeBase();
    setKnowledgeBases([defaultKb]);
    setActiveKbId(defaultKb.id);

    let cancelled = false;

    (async () => {
      try {
        const [docResult, sessions] = await Promise.all([
          fetchDocuments(1, 50),
          fetchSessions(),
        ]);
        if (cancelled) return;

        setDocuments(docResult.docs);

        const convs: Conversation[] = sessions.map((s) => ({
          id: s.session_id,
          title: s.title,
          messages: [],
          createdAt: s.created_at,
        }));
        if (convs.length > 0) {
          setConversations(convs);
          setActiveConversationId(convs[0].id);

          // load history for the first session
          try {
            const hist = await fetchChatHistory(convs[0].id);
            if (!cancelled) {
              const msgs: Message[] = [];
              hist.items.forEach((r, i) => {
                const { user, assistant } = historyRecordToMessage(r, i);
                msgs.push(user, assistant);
              });
              setConversations((prev) =>
                prev.map((c) => (c.id === convs[0].id ? { ...c, messages: msgs } : c)),
              );
            }
          } catch {
            // session history load failed — session may be empty
          }
        }
      } catch {
        // backend unavailable — start with empty state
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // load chat history when switching conversations
  useEffect(() => {
    if (!activeConversationId) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv || conv.messages.length > 0) return;

    let cancelled = false;
    (async () => {
      try {
        const hist = await fetchChatHistory(activeConversationId);
        if (cancelled) return;
        const msgs: Message[] = [];
        hist.items.forEach((r, i) => {
          const { user, assistant } = historyRecordToMessage(r, i);
          msgs.push(user, assistant);
        });
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, messages: msgs } : c)),
        );
      } catch {
        // empty history is ok
      }
    })();
    return () => { cancelled = true; };
  }, [activeConversationId]);

  const addConversation = useCallback(() => {
    const id = generateUUID();
    const newConv: Conversation = {
      id,
      title: "新建对话",
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(id);
    return id;
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (activeConversationId === id) {
          setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
        }
        return remaining;
      });
    },
    [activeConversationId],
  );

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: title.trim() || "未命名对话" } : c)),
    );
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeConversationId || !content.trim() || isGenerating) return;

      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const userMsg: Message = {
        id: `msg-user-${Date.now()}`,
        role: "user",
        content,
        timestamp,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            const title =
              c.title === "新建对话"
                ? content.substring(0, 15) + (content.length > 15 ? "..." : "")
                : c.title;
            return { ...c, title, messages: [...c.messages, userMsg] };
          }
          return c;
        }),
      );
      setIsGenerating(true);

      const assistantId = `msg-assistant-${Date.now()}`;
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp,
        citations: [],
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId ? { ...c, messages: [...c.messages, assistantMsg] } : c,
        ),
      );

      const abortController = new AbortController();

      (async () => {
        try {
          for await (const event of streamChat(
            "/api/v1/kb/chat",
            { question: content, session_id: activeConversationId },
            abortController.signal,
          )) {
            if (event.type === "token") {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === activeConversationId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantId
                            ? { ...m, content: m.content + event.data.content }
                            : m,
                        ),
                      }
                    : c,
                ),
              );
            } else if (event.type === "done") {
              const citations: Citation[] = (event.data.ref_chunks || []).map((rc, i) =>
                refChunkToCitation(rc, i),
              );
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === activeConversationId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantId ? { ...m, citations } : m,
                        ),
                      }
                    : c,
                ),
              );
            } else if (event.type === "error") {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === activeConversationId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantId
                            ? { ...m, content: `[错误] ${event.data.message}` }
                            : m,
                        ),
                      }
                    : c,
                ),
              );
            }
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "未知错误";
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: `[请求失败] ${msg}` }
                        : m,
                    ),
                  }
                : c,
            ),
          );
        } finally {
          setIsGenerating(false);
        }
      })();
    },
    [activeConversationId, isGenerating],
  );

  const addKnowledgeBase = useCallback((name: string, description: string) => {
    const id = `kb-${Date.now()}`;
    const newKb: KnowledgeBase = {
      id,
      name,
      description: description.trim() || "未提供描述信息。",
      docCount: 0,
      charCount: 0,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };
    setKnowledgeBases((prev) => [...prev, newKb]);
    setActiveKbId(id);
  }, []);

  const deleteKnowledgeBase = useCallback(
    (id: string) => {
      if (id === "kb-default") return; // cannot delete default KB
      setKnowledgeBases((prev) => prev.filter((kb) => kb.id !== id));
      setDocuments((prev) => prev.filter((doc) => doc.kbId !== id));
      if (activeKbId === id) {
        const remaining = knowledgeBases.filter((kb) => kb.id !== id);
        setActiveKbId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [activeKbId, knowledgeBases],
  );

  const uploadDocumentsHandler = useCallback(
    (kbId: string, files: File[]) => {
      if (files.length === 0) return;

      // add optimistic entries
      const now = new Date().toISOString().replace("T", " ").substring(0, 16);
      const tempDocs: DocumentRecord[] = files.map((f, i) => ({
        id: `doc-temp-${Date.now()}-${i}`,
        kbId,
        name: f.name,
        size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
        chars: 0,
        status: "uploading" as const,
        progress: 10,
        uploadedAt: now,
        type: f.type,
      }));
      setDocuments((prev) => [...tempDocs, ...prev]);

      apiUploadDocuments(files)
        .then((result) => {
          // replace temp docs with real ones from the response
          const uploaded = result.documents.map((d) => kbDocumentToDocRecord({
            id: d.id,
            doc_name: d.doc_name,
            doc_type: "txt" as const,
            doc_desc: null,
            file_path: "",
            status: d.status,
            chunk_count: d.chunk_count,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          setDocuments((prev) => {
            const withoutTemp = prev.filter((d) => !d.id.startsWith("doc-temp-"));
            return [...uploaded, ...withoutTemp];
          });
        })
        .catch(() => {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id.startsWith("doc-temp-") ? { ...d, status: "failed" as const } : d,
            ),
          );
        });

      try {
        // refresh the full document list
        fetchDocuments(1, 50).then((result) => {
          setDocuments(result.docs);
        });
      } catch {
        // refresh failed, keep optimistic state
      }
    },
    [],
  );

  const deleteDocumentHandler = useCallback(
    (docId: string) => {
      const doc = documents.find((d) => d.id === docId);
      if (!doc) return;

      setDocuments((prev) => prev.filter((d) => d.id !== docId));

      const numericId = Number(docId);
      if (!isNaN(numericId)) {
        apiDeleteDocument(numericId).catch(() => {
          // restore on failure? or just refresh
          fetchDocuments(1, 50)
            .then((result) => setDocuments(result.docs))
            .catch(() => {});
        });
      }
    },
    [documents],
  );

  const reparseDocument = useCallback(
    (docId: string) => {
      // reparse not directly supported by backend; refresh document list instead
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, status: "parsing" as const, progress: 0 } : d,
        ),
      );
      fetchDocuments(1, 50)
        .then((result) => setDocuments(result.docs))
        .catch(() => {});
    },
    [],
  );

  const toggleDocumentStatus = useCallback(
    async (docId: string, status: "disabled" | "enabled") => {
      const numericId = Number(docId);
      if (isNaN(numericId)) return;

      // Optimistic update
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: status === "disabled" ? "disabled" as const : "parsing" as const }
            : d,
        ),
      );

      try {
        const updated = await apiToggleDocumentStatus(numericId, status);
        // Map the response status back
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId ? kbDocumentToDocRecord(updated) : d,
          ),
        );
      } catch (err) {
        // Revert on error
        const result = await fetchDocuments(1, 50);
        setDocuments(result.docs);
        throw err;
      }
    },
    [],
  );

  const reindexDocumentHandler = useCallback(
    async (docId: string) => {
      const numericId = Number(docId);
      if (isNaN(numericId)) return;

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, status: "parsing" as const, progress: 0 } : d,
        ),
      );

      try {
        await apiReindexDocument(numericId);
        
        // Polling status or simply load again after delay
        const checkStatus = async () => {
          try {
            const result = await fetchDocuments(1, 50);
            const currentDoc = result.docs.find(d => d.id === docId);
            if (currentDoc) {
              setDocuments(result.docs);
              if (currentDoc.status === "parsing") {
                setTimeout(checkStatus, 3000); // Poll every 3 seconds if still parsing
              }
            }
          } catch {
            // Keep trying or stop on error
          }
        };
        setTimeout(checkStatus, 2000);
      } catch (err) {
        const result = await fetchDocuments(1, 50);
        setDocuments(result.docs);
        throw err;
      }
    },
    [],
  );

  return (
    <mindvaultsContext.Provider
      value={{
        activeTab,
        setActiveTab,
        conversations,
        activeConversationId,
        setActiveConversationId,
        addConversation,
        deleteConversation,
        renameConversation,
        sendMessage,
        isGenerating,
        knowledgeBases,
        activeKbId,
        setActiveKbId,
        addKnowledgeBase,
        deleteKnowledgeBase,
        documents,
        uploadDocuments: uploadDocumentsHandler,
        deleteDocument: deleteDocumentHandler,
        reparseDocument,
        toggleDocumentStatus,
        reindexDocument: reindexDocumentHandler,
        selectedCitation,
        setSelectedCitation,
      }}
    >
      {children}
    </mindvaultsContext.Provider>
  );
};

export const usemindvaults = () => {
  const context = useContext(mindvaultsContext);
  if (!context) throw new Error("usemindvaults must be used within a mindvaultsProvider");
  return context;
};
