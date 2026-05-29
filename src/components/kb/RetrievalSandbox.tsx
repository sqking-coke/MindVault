"use client";

import React, { useState } from "react";
import { testRetrieval } from "@/services/ragService";
import type { RefChunk } from "@/types/api";
import {
  Compass,
  Search,
  RefreshCw,
  Play,
  FileText
} from "lucide-react";

export default function RetrievalSandbox() {
  // Search testing states
  const [testQuery, setTestQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    chunks: RefChunk[];
    elapsedMs: number;
  } | null>(null);

  // Search Playground Executor
  const executeRetrievalTest = (queryText?: string) => {
    const q = queryText || testQuery;
    if (!q.trim()) return;

    setIsSearching(true);
    setSearchSubmitted(true);

    testRetrieval(q)
      .then((res) => {
        setSearchResults({ chunks: res.results, elapsedMs: res.elapsed_ms });
        setIsSearching(false);
      })
      .catch((err: Error) => {
        setSearchResults({ chunks: [], elapsedMs: 0 });
        setIsSearching(false);
        console.error("检索失败:", err.message);
      });
  };

  const handleTestPreset = (text: string) => {
    setTestQuery(text);
    executeRetrievalTest(text);
  };

  return (
    <div id="kb-tab-test-content" role="tabpanel" aria-labelledby="kb-tab-test" className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-50 border-t border-slate-150">
      {/* Left Side: Query Input Column */}
      <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-6 overflow-y-auto flex flex-col shrink-0">
        <div className="space-y-4 flex-1">
          <div className="space-y-1 select-none">
            <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-indigo-500" />
              向量混合检索
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              直接在此验证本地召回的切片精度。检索调用嵌入模型对问题进行向量化，秒级匹配最契合的文档分片。
            </p>
          </div>

          {/* Preset testing keywords */}
          <div className="space-y-2 select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">常用高命中测试词</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleTestPreset("考勤与核心工作时间")}
                className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg font-medium transition-all"
              >
                弹性工作制
              </button>
              <button
                onClick={() => handleTestPreset("底层架构和向量数据库选型")}
                className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg font-medium transition-all"
              >
                RAG 核心组件
              </button>
              <button
                onClick={() => handleTestPreset("年假审批 OA 流程")}
                className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg font-medium transition-all"
              >
                年假审批流
              </button>
              <button
                onClick={() => handleTestPreset("研发团队 API 接口设计与规范标准")}
                className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg font-medium transition-all"
              >
                研发接口标准
              </button>
              <button
                onClick={() => handleTestPreset("原子习惯个人成长与读书笔记")}
                className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-lg font-medium transition-all"
              >
                个人原子习惯
              </button>
            </div>
          </div>

          {/* Query block input */}
          <div className="space-y-2">
            <label htmlFor="kb-test-query-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">检索 Query 问题</label>
            <div className="relative">
              <input
                id="kb-test-query-input"
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && executeRetrievalTest()}
                placeholder="例如：弹性工作制几点到几点？"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-150 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none"
              />
              <button
                onClick={() => executeRetrievalTest()}
                disabled={!testQuery.trim() || isSearching}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-indigo-600 disabled:opacity-40 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-lg p-0.5"
                aria-label="提交检索"
              >
                <Search className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-150 select-none">
          <button
            onClick={() => executeRetrievalTest()}
            disabled={!testQuery.trim() || isSearching}
            className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-40 text-white font-medium py-2.5 px-4 rounded-xl shadow flex items-center justify-center gap-2 text-xs transition-colors"
          >
            {isSearching ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                正在重排检索中...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400" />
                触发混合检索测试
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Side: Search Results Column */}
      <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col">
        {!searchSubmitted ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-400 select-none py-12">
            <Compass className="h-10 w-10 text-slate-300 mb-3 animate-pulse-subtle" />
            <p className="text-xs font-semibold text-slate-600">等待提交检索问题</p>
            <p className="text-[11px] max-w-[240px] mt-1 leading-normal">
              请在左侧面板中输入或选择测试关键词并点击“开始检索”，结果将实时呈现于此。
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Retrieved Chunks Card list */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between select-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  相似度命中分片 (Sorted by Score)
                </span>
                {searchResults && (
                  <span className="text-[10px] text-slate-400">
                    耗时 <b>{searchResults.elapsedMs}ms</b>
                  </span>
                )}
              </div>

              {isSearching ? (
                <div className="space-y-3 select-none">
                  <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
                  <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
                </div>
              ) : searchResults && searchResults.chunks.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.chunks.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-sm relative overflow-hidden transition-all duration-150"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />

                      <div className="flex items-center justify-between select-none mb-2 border-b border-slate-50 pb-1.5">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          {chunk.doc_name}
                          <span className="text-[9px] font-medium text-slate-400 font-mono">
                            {chunk.page ? `第 ${chunk.page} 页` : ""}
                          </span>
                        </span>

                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-bold font-mono">
                          相关度: {(chunk.similarity * 100).toFixed(0)}%
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-mono leading-relaxed select-text bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 select-none bg-white border border-slate-200 rounded-xl">
                  无匹配切片。
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
