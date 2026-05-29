"use client";

import React, { useRef, useEffect, useState } from "react";
import { useMindVault, Message, Citation } from "@/context/MindVaultContext";
import { 
  Sparkles, 
  ChevronRight, 
  CheckCircle,
  HelpCircle,
  Clock,
  User,
  Bot,
  Share2
} from "lucide-react";
import KnowledgeCard from "./KnowledgeCard";

interface ChatMessageListProps {
  onSelectTemplate: (text: string) => void;
}

export default function ChatMessageList({ onSelectTemplate }: ChatMessageListProps) {
  const { 
    conversations, 
    activeConversationId, 
    isGenerating, 
    setSelectedCitation 
  } = useMindVault();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sharingCard, setSharingCard] = useState<{
    question: string;
    answer: string;
    citations: Citation[];
  } | null>(null);

  // Find active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Auto-scroll to bottom of messages
  const lastMessageContentLength = activeConversation?.messages?.[activeConversation.messages.length - 1]?.content?.length || 0;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages?.length, lastMessageContentLength]);

  // Pre-configured prompt templates
  const promptTemplates = [
    {
      label: "系统架构提问",
      text: "请问 MindVault 的底层架构是怎么设计的？它是怎么保障私有数据的安全问答的？",
      icon: "⚡"
    },
    {
      label: "弹性考勤查询",
      text: "我想知道公司的考勤和假期规定，核心工作时间段是什么时候？年假有几天？",
      icon: "📅"
    },
    {
      label: "混合向量检索",
      text: "解释一下 MindVault 的向量嵌入 Embedding 与重排 Reranking 检索过滤原理。",
      icon: "🔍"
    },
    {
      label: "研发接口标准",
      text: "研发团队对于 RESTful API 接口的命名路径、异常响应体以及幂等性设计有什么具体规范要求？",
      icon: "💻"
    },
    {
      label: "个人原子习惯",
      text: "在个人工作习惯重建中，如何具体运用原子习惯的四个核心环路，并结合卡片笔记来沉淀认知？",
      icon: "📝"
    }
  ];

  // Helper: Parse message text to find citation numbers like [1] or [2] and render them as interactive tags
  const renderMessageContent = (content: string, citations?: Citation[]) => {
    if (!citations || citations.length === 0) {
      return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
    }

    // Match [1], [2], [3]...
    const parts = content.split(/(\[\d+\])/g);
    return (
      <div className="whitespace-pre-wrap leading-relaxed select-text">
        {parts.map((part, index) => {
          const match = part.match(/^\[(\d+)\]$/);
          if (match) {
            const citIndex = parseInt(match[1], 10);
            const citation = citations.find(c => c.index === citIndex);
            
            if (citation) {
              return (
                <button
                  key={index}
                  onClick={() => setSelectedCitation(citation)}
                  className="mx-0.5 inline-flex items-center justify-center h-5 px-1.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-600 font-mono text-[10px] font-bold hover:bg-indigo-100 hover:border-indigo-300 hover:text-indigo-700 transition-colors align-middle focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  title={`点击查看溯源: ${citation.docName}`}
                  aria-label={`查看第 ${citation.page || 1} 页的引用溯源: ${citation.docName}`}
                >
                  [{citIndex}]
                </button>
              );
            }
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 bg-slate-50/50">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {!activeConversation || activeConversation.messages.length === 0 ? (
          /* Welcome Page / No conversations */
          <div className="py-8 md:py-12 space-y-8 animate-fade-in select-none">
            <div className="text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">MindVault 智能问答沙盒</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                本地离线大语言模型驱动，安全解析您的文档资产。支持多格式解析、高精度向量相似度定位与引用溯源展示。
              </p>
            </div>

            {/* Suggested Prompts Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                建议开始的提问模板
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {promptTemplates.map((tmpl, idx) => (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => !isGenerating && onSelectTemplate(tmpl.text)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !isGenerating) {
                        e.preventDefault();
                        onSelectTemplate(tmpl.text);
                      }
                    }}
                    aria-label={`一键填充提问模板: ${tmpl.label}`}
                    className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/5 cursor-pointer p-4 rounded-xl transition-all duration-200 text-left group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  >
                    <div>
                      <span className="text-lg mb-2 block">{tmpl.icon}</span>
                      <h4 className="font-semibold text-slate-800 text-xs group-hover:text-indigo-600 transition-colors">
                        {tmpl.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-3">
                        "{tmpl.text}"
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-end text-[10px] text-indigo-500 font-bold group-hover:translate-x-1 transition-transform">
                      一键填充 <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Micro instructions */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 bg-white border border-slate-150 p-4 rounded-xl shadow-sm max-w-xl mx-auto">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                BGE Embedding
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                HNSW 向量库
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                BCE Reranker
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                本地 LLM 推理
              </span>
            </div>
          </div>
        ) : (
          /* Message List rendering */
          <div className="space-y-6">
            {activeConversation.messages.map((msg, idx) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 md:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {/* Left Avatar for Assistant */}
                  {!isUser && (
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow shadow-indigo-500/10 shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] space-y-2.5 ${isUser ? "order-1" : "order-2"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isUser
                          ? "bg-indigo-600 text-white font-medium rounded-tr-none"
                          : "bg-white border border-slate-150 text-slate-800 rounded-tl-none leading-relaxed"
                      }`}
                    >
                      {/* Rich parsing and inline citation rendering */}
                      {isUser ? (
                        <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                      ) : (
                        renderMessageContent(msg.content, msg.citations)
                      )}
                    </div>

                    {/* Citation Source list Cards (At the bottom of Assistant responses) */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="space-y-1.5 pl-1.5 animate-fade-in select-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          参考引用来源 ({msg.citations.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((cit) => (
                            <div
                              key={cit.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedCitation(cit)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedCitation(cit);
                                }
                              }}
                              className="bg-white border border-slate-150 hover:border-indigo-300 hover:bg-slate-50/50 cursor-pointer p-2 rounded-lg flex items-center gap-2 max-w-xs transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                              title="点击查看此溯源切片原文"
                              aria-label={`查看引用来源 [${cit.index}]: ${cit.docName}`}
                            >
                              <div className="h-6 w-6 rounded bg-indigo-50 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-indigo-600 font-mono">[{cit.index}]</span>
                              </div>
                              <div className="overflow-hidden pr-1">
                                <span className="text-[11px] font-semibold text-slate-700 block truncate group-hover:text-indigo-600 transition-colors">
                                  {cit.docName}
                                </span>
                                <span className="text-[9px] text-slate-400 block font-mono">
                                  第 {cit.page || 1} 页 • 相似度 {(cit.score * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamp underlay */}
                    <div className={`flex items-center gap-3 text-[10px] text-slate-400 ${isUser ? "justify-end pr-1" : "pl-1.5"}`}>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{msg.timestamp}</span>
                      </div>
                      {!isUser && msg.content.length > 20 && (
                        <button
                          onClick={() => {
                            const prevMsg = activeConversation.messages[idx - 1];
                            const questionText = prevMsg && prevMsg.role === "user" ? prevMsg.content : "关于 MindVault 的提问";
                            setSharingCard({
                              question: questionText,
                              answer: msg.content,
                              citations: msg.citations || [],
                            });
                          }}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer select-none border-none bg-transparent p-0"
                          title="生成分享知识卡片"
                          aria-label="生成分享知识卡片"
                        >
                          <Share2 className="h-3 w-3 text-indigo-500" />
                          <span>分享卡片</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Avatar for User */}
                  {isUser && (
                    <div className="h-9 w-9 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0 shadow-sm">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Simulated Loading Indicator for typing streaming */}
            {isGenerating && (
              <div className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow shadow-indigo-500/10 shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="bg-white border border-slate-150 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-800 shadow-sm min-w-[80px] flex items-center justify-center gap-1.5 select-none">
                    <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" />
                  </div>
                  <span className="text-[10px] text-slate-400 animate-pulse pl-1.5 block">本地模型正在检索并组织语言...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}

      </div>

      {sharingCard && (
        <KnowledgeCard
          question={sharingCard.question}
          answer={sharingCard.answer}
          citations={sharingCard.citations}
          onClose={() => setSharingCard(null)}
        />
      )}
    </div>
  );
}
