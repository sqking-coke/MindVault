"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import CitationDrawer from "@/components/chat/CitationDrawer";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatInputArea from "@/components/chat/ChatInputArea";
import { usemindvaults } from "@/context/mindvaultsContext";
import { ShieldCheck } from "lucide-react";

export default function ChatPage() {
  const { 
    conversations, 
    activeConversationId, 
    knowledgeBases
  } = usemindvaults();

  const [input, setInput] = useState("");

  // Find active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="h-full flex bg-slate-50 overflow-hidden font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Chat Area Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Chat Page Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md pl-16 pr-6 md:px-6 flex items-center justify-between shrink-0 z-10 select-none">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <h1 className="font-semibold text-slate-800 text-sm truncate max-w-[200px] md:max-w-[400px]">
              {activeConversation ? activeConversation.title : "本地安全沙盒"}
            </h1>
            <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
              局域网物理隔离
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Connected KB Badge */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>关联 <b>{knowledgeBases.length}</b> 个本地知识库</span>
            </div>
            
            {/* Security Indicator */}
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-1 rounded-lg border border-emerald-100 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>数据不出域</span>
            </div>
          </div>
        </header>

        {/* Messages Scroll Zone */}
        <ChatMessageList onSelectTemplate={setInput} />

        {/* Input Bar panel */}
        <ChatInputArea input={input} setInput={setInput} />
      </div>

      {/* Slide-out Citation Source Details Panel */}
      <CitationDrawer />
    </div>
  );
}
