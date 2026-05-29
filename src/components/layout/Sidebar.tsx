"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMindVault } from "@/context/MindVaultContext";
import { 
  MessageSquare, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Cpu, 
  HardDrive, 
  Layers,
  ChevronLeft,
  Menu
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversationId, 
    addConversation, 
    deleteConversation, 
    renameConversation,
    isGenerating
  } = useMindVault();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    renameConversation(id, editingTitle);
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm("确定要删除此对话吗？")) {
      deleteConversation(id);
    }
  };

  const handleNewChat = () => {
    const newId = addConversation();
    router.push("/chat");
  };

  const isChatActive = pathname.startsWith("/chat");
  const isKbActive = pathname.startsWith("/kb");

  return (
    <div 
      className={`h-full bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 border-r border-slate-800 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 select-none shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">MindVault</span>
              <span className="block text-[10px] text-indigo-400 font-medium tracking-wider">v1.0.0 PROTOTYPE</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-md">
            <Layers className="h-5 w-5 text-white" />
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
          aria-expanded={!isCollapsed}
          className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-1 rounded-lg transition-colors hidden md:block focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Action - New Chat */}
      {!isCollapsed && (
        <div className="px-3 pt-4 pb-2 shrink-0">
          <button
            onClick={handleNewChat}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl shadow-md shadow-indigo-600/10 transition-all duration-200 group text-sm"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            新建对话
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="px-3 py-2 space-y-1 shrink-0">
        <Link
          href="/chat"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            isChatActive 
              ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <MessageSquare className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>对话沙盒 (Chat)</span>}
        </Link>
        <Link
          href="/kb"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            isKbActive 
              ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          <Database className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>知识中心 (KB)</span>}
        </Link>
      </div>

      {/* Conversation List (Only shown if Chat path is active) */}
      {isChatActive && !isCollapsed && (
        <div className="flex-1 overflow-y-auto px-2 py-2 border-t border-slate-800/60 flex flex-col min-h-0">
          <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            历史对话
          </div>
          <div className="space-y-1 overflow-y-auto flex-1 pr-1">
            {conversations.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-600 select-none">
                无历史对话记录
              </div>
            ) : (
              conversations.map(conv => {
                const isActive = activeConversationId === conv.id;
                const isEditing = editingId === conv.id;

                return (
                  <div
                    key={conv.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => !isEditing && setActiveConversationId(conv.id)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !isEditing) {
                        e.preventDefault();
                        setActiveConversationId(conv.id);
                      }
                    }}
                    aria-current={isActive ? "true" : "false"}
                    aria-label={`切换到对话: ${conv.title}`}
                    className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium cursor-pointer transition-all duration-150 border border-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isActive 
                        ? "bg-slate-800 text-white border-slate-700 shadow-sm" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden w-full pr-6">
                      <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                      
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename(conv.id, e as any);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-slate-700 text-white px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full font-sans text-xs"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate pr-2">{conv.title}</span>
                      )}
                    </div>

                    {/* Action buttons on Hover */}
                    {!isEditing && (
                      <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-gradient-to-l from-slate-900 group-hover:from-slate-800 pl-4 py-1 rounded-r-xl">
                        <button
                          onClick={(e) => startRename(conv.id, conv.title, e)}
                          className="text-slate-500 hover:text-slate-300 p-0.5 rounded hover:bg-slate-700 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
                          title="重命名"
                          aria-label="重命名此对话"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(conv.id, e)}
                          className="text-slate-500 hover:text-red-400 p-0.5 rounded hover:bg-slate-700 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400"
                          title="删除对话"
                          aria-label="删除此对话"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {isEditing && (
                      <div className="absolute right-2 flex items-center gap-0.5 bg-slate-800 pl-2">
                        <button
                          onClick={(e) => saveRename(conv.id, e)}
                          className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          aria-label="保存修改后的名称"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => cancelRename(e)}
                          className="text-slate-400 hover:text-slate-300 p-0.5 rounded hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          aria-label="取消重命名"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Conversation List Placeholder if KB is active */}
      {isKbActive && !isCollapsed && (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 border-t border-slate-800/60 text-center select-none text-slate-600">
          <Database className="h-10 w-10 text-slate-700 mb-3 animate-pulse-subtle" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            知识管理中
          </p>
          <p className="text-[11px] leading-relaxed max-w-[180px]">
            在右侧视图中切换或建立新的本地知识库文件。
          </p>
        </div>
      )}

      {/* System Diagnostics / Metrics Dashboard */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0 select-none">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            本地系统状态
          </div>
          
          <div className="space-y-2 text-[11px] text-slate-400">
            {/* Compute core */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-indigo-500 shrink-0" />
                计算设备
              </span>
              <span className="text-slate-200 font-mono">Apple M3 Max</span>
            </div>
            {/* Memory indicator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="h-3 w-3 text-indigo-500 shrink-0" />
                  本地内存
                </span>
                <span className="text-slate-200 font-mono">14.2 GB / 32 GB</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full w-[44%]" />
              </div>
            </div>
            {/* Model Name */}
            <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-800 mt-2">
              <span className="block text-[10px] text-indigo-400 font-bold mb-0.5">本地大模型推理引擎</span>
              <span className="text-slate-100 font-mono font-medium truncate block">Qwen-2.5-7B-Instruct</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed view status bulb */}
      {isCollapsed && (
        <div className="p-3 border-t border-slate-800 flex justify-center items-center shrink-0">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="推理就绪" />
        </div>
      )}
    </div>
  );
}
