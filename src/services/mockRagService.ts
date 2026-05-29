import type { Citation, Conversation, DocumentRecord, KnowledgeBase } from "@/types/api";
import { mockCitations, matchIntent } from "./intentRouter";

export function getInitialKnowledgeBases(): KnowledgeBase[] {
  return [
    {
      id: "kb-1",
      name: "MindVault 系统设计文档",
      description: "包含 MindVault 系统的核心架构、数据流、向量数据库选型及 RAG 管道规范。",
      docCount: 2,
      charCount: 58000,
      createdAt: "2026-05-20 10:24"
    },
    {
      id: "kb-2",
      name: "企业运营与人力资源手册",
      description: "包含公司考勤、福利、报销流程、晋升通道及日常运营行为规范指南。",
      docCount: 1,
      charCount: 125000,
      createdAt: "2026-05-22 14:15"
    },
    {
      id: "kb-3",
      name: "财务审计报告 2025",
      description: "2025 年度企业收支审计、纳税合规与固定资产管理台账汇总数据。",
      docCount: 0,
      charCount: 0,
      createdAt: "2026-05-25 09:30"
    },
    {
      id: "kb-4",
      name: "研发团队技术标准与核心规范",
      description: "包含开发团队协作流程、RESTful API 命名与设计规范、Git 工作流分支管理及安全生产红线。",
      docCount: 2,
      charCount: 32700,
      createdAt: "2026-05-24 11:40"
    },
    {
      id: "kb-5",
      name: "个人读书笔记与成长方法论",
      description: "整理自《卡片笔记写作法》、《原子习惯》等经典书籍，包含习惯重塑回路、双向链接知识沉淀及个人复盘。",
      docCount: 2,
      charCount: 24300,
      createdAt: "2026-05-26 16:15"
    }
  ];
}

export function getInitialDocuments(): DocumentRecord[] {
  return [
    {
      id: "doc-1",
      kbId: "kb-1",
      name: "mindvault-arch-v2.pdf",
      size: "2.4 MB",
      chars: 45200,
      status: "success",
      progress: 100,
      uploadedAt: "2026-05-20 10:24"
    },
    {
      id: "doc-2",
      kbId: "kb-1",
      name: "rag-pipeline-spec.docx",
      size: "820 KB",
      chars: 12800,
      status: "success",
      progress: 100,
      uploadedAt: "2026-05-20 10:35"
    },
    {
      id: "doc-3",
      kbId: "kb-2",
      name: "hr-policy-2026.pdf",
      size: "4.8 MB",
      chars: 125000,
      status: "success",
      progress: 100,
      uploadedAt: "2026-05-22 14:15"
    },
    {
      id: "doc-4",
      kbId: "kb-4",
      name: "api-design-spec-v3.pdf",
      size: "1.2 MB",
      chars: 24500,
      status: "success",
      progress: 100,
      uploadedAt: "2026-05-24 11:40"
    },
    {
      id: "doc-5",
      kbId: "kb-4",
      name: "team-git-workflow.md",
      size: "320 KB",
      chars: 8200,
      status: "success",
      progress: 100,
      uploadedAt: "2026-05-24 13:15"
    },
    {
      id: "doc-6",
      kbId: "kb-5",
      name: "reading-notes-atomic-habits.pdf",
      size: "1.5 MB",
      chars: 18900,
      status: "success",
      progress: 100,
      uploadedAt: "2026-05-26 16:15"
    },
    {
      id: "doc-7",
      kbId: "kb-5",
      name: "personal-monthly-review-2026.md",
      size: "210 KB",
      chars: 5400,
      status: "success",
      progress: 100,
      uploadedAt: "2026-05-27 09:20"
    }
  ];
}

export function getInitialConversations(): Conversation[] {
  return [
    {
      id: "conv-1",
      title: "本地私有化知识库架构 design",
      createdAt: "2026-05-28 14:00",
      messages: [
        {
          id: "msg-1-1",
          role: "user",
          content: "你好，请问 MindVault 的底层架构是怎么设计的？它是怎么保障私有数据的安全问答的？",
          timestamp: "14:00"
        },
        {
          id: "msg-1-2",
          role: "assistant",
          content: "您好！**MindVault** 是一款完全专注于本地私有化部署的 RAG (检索增强生成) 知识库系统。其架构设计完全围绕**数据不泄露、高精度检索与流畅人机交互**展开。\n\n具体而言，其核心架构包含以下三个维度：\n\n1. **全本地化 RAG 管道 [1]**：MindVault 在您的局域网/单机环境中运行，文档提取、文本切片、向量嵌入（Embedding）全部在本地 CPU/GPU 上计算完成，不依赖任何第三方云端 API。\n2. **多级检索与重排 [2]**：用户提问时，系统首先利用 HNSW 索引做向量相似度粗排，然后通过本地 Reranker 精排重构，过滤掉不相关的背景噪声，从而向大语言模型（LLM）提供高度相关的局部上下文。\n3. **溯源可视化与安全问答**：在回答您的提问时，系统会将检索到的切片来源清晰标注在回答文本中（如点击下方引用的文档卡片）。\n\n您可以通过在右侧知识库上传最新的架构文档来更新它的认知库！",
          timestamp: "14:01",
          citations: [mockCitations[0], mockCitations[1]]
        }
      ]
    },
    {
      id: "conv-2",
      title: "关于弹性工作制的假期询问",
      createdAt: "2026-05-28 14:15",
      messages: [
        {
          id: "msg-2-1",
          role: "user",
          content: "我想知道公司的考勤 and 假期规定，核心工作时间段是什么时候？年假有几天？",
          timestamp: "14:15"
        },
        {
          id: "msg-2-2",
          role: "assistant",
          content: "根据公司的官方制度，有关考勤与假期的核心规定如下：\n\n- **工作制度 [3]**：公司全员实行弹性工作制，没有死板的打卡限制，但每日核心工作时间为 **10:00 - 16:00**。请在此时间段内保持高效的协作沟通。\n- **年假额度 [3]**：员工年假额度为 **10 天起步**。该额度不是固定的，而是根据您入职公司的年限逐年递增。\n- **请假审批流 [3]**：所有的请假（包括病假、年假、事假等）均需提前在 OA 系统中发起，必须获得部门主管（Leader）以及 HR BP 的双重审批，审批通过后方能正式休假。\n\n如果有突发状况，建议提前在企业微信群中向团队进行知会，以保障工作顺畅交接。",
          timestamp: "14:16",
          citations: [mockCitations[2]]
        }
      ]
    }
  ];
}

export interface MockRagResponse {
  responseText: string;
  responseCitations: Citation[];
}

export function getMockRagResponse(content: string, kbCount: number): MockRagResponse {
  const matchedRoute = matchIntent(content);
  if (matchedRoute) {
    return {
      responseText: matchedRoute.mockResponse,
      responseCitations: matchedRoute.citations
    };
  }
  
  return {
    responseText: `收到您的消息："${content}"。\n\n作为一个本地私有化的 RAG 智能助理，我已成功关联了您当前的知识库。由于这是静态交互原型，我将为您模拟私有化知识库检索问答：\n\n- **检索状态**：已成功遍历关联的 **${kbCount} 个知识库**，检索相关文档。\n- **检索溯源 [1]**：已命中 MindVault 核心设计规范。本地推理引擎响应耗时 240ms。\n- **答案合成**：已剔除幻觉，在不触碰公网的情况下完成安全应答。\n\n您可以试着提问 “研发团队规范” 或 “原子习惯读书笔记” 来体验更丰富的溯源卡片！`,
    responseCitations: [mockCitations[0]]
  };
}

export function determineUploadSuccess(fileName: string, fileType?: string): { status: "success" | "failed"; chars: number } {
  const isSuccess = !fileName.toLowerCase().endsWith(".exe") && 
                    !fileName.toLowerCase().endsWith(".zip") &&
                    !(fileType && fileType.includes("x-msdownload")) &&
                    !(fileType && fileType.includes("zip"));
  const chars = isSuccess ? Math.floor(Math.random() * 50000) + 5000 : 0;
  return { status: isSuccess ? "success" : "failed", chars };
}

export function generateReparseChars(): number {
  return Math.floor(Math.random() * 40000) + 10000;
}

export interface MockRetrievalResult {
  answer: string;
  chunks: { docName: string; score: number; text: string; page?: number }[];
}

export function getMockRetrievalResponse(query: string, activeKbName: string): MockRetrievalResult {
  const matchedRoute = matchIntent(query);
  if (matchedRoute) {
    return {
      answer: matchedRoute.answer,
      chunks: matchedRoute.relatedChunks
    };
  }

  return {
    answer: `已在本地知识库 "${activeKbName}" 中搜索关键词 “${query}”。由于当前无更多语义切片匹配，系统为您反馈以下相似相关性最高的基础架构信息：\n\n- **推荐做法**：建议您试着在左侧输入框提问 **“弹性工作时间规定的考勤核心时间”** 或 **“系统向量存储底座”** 进行匹配。\n- **检索结论**：本地向量召回最高相似度小于阈值 0.5。以下匹配为底层 RAG 备选上下文。`,
    chunks: [
      {
        docName: "mindvault-arch-v2.pdf",
        score: 0.42,
        page: 1,
        text: "本地单机服务器或多物理主机部署环境下，MindVault 完全支持局域网离线独立运行，通过本地网络分发。本地 Embedding 及大模型推理不向任何云端上传数据，确保隐私无虞。"
      }
    ]
  };
}
