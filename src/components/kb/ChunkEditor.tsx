"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Sparkles, AlertTriangle } from "lucide-react";

interface ChunkEditorProps {
  isOpen: boolean;
  onClose: () => void;
  chunk: { id: number; content: string; page: number | null; chunk_index?: number } | null;
  onSave: (id: number, content: string) => Promise<void>;
}

export default function ChunkEditor({ isOpen, onClose, chunk, onSave }: ChunkEditorProps) {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chunk) {
      setContent(chunk.content);
      setError(null);
    }
  }, [chunk]);

  if (!isOpen || !chunk) return null;

  const handleSave = async () => {
    if (!content.trim()) {
      setError("切片内容不能为空");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(chunk.id, content);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存切片失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h3 id="modal-title" className="font-semibold text-slate-800 text-sm">
                编辑知识切片 #{chunk.chunk_index ?? chunk.id}
              </h3>
              {chunk.page !== null && (
                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-medium mt-0.5 inline-block">
                  PDF 来源: 第 {chunk.page} 页
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="关闭窗口"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-150 p-3.5 rounded-xl leading-relaxed flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">温馨提示：</span>
              修改切片内容会触发本地向量引擎自动调用 Embedding 模型进行
              <span className="font-semibold text-indigo-600"> 异步重向量化</span>
              ，更新后的向量会写入 pgvector 索引，使问答检索更加精准。
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="chunk-content-textarea" className="text-xs font-semibold text-slate-600">
              切片文本内容
            </label>
            <textarea
              id="chunk-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-72 p-4 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed text-slate-700"
              placeholder="请输入切片内容..."
              disabled={isSaving}
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 px-1 select-none">
              <span>支持 Markdown 格式文本</span>
              <span>共 {content.length} 个字符</span>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-150 px-4 py-3 rounded-xl flex items-center gap-1.5">
              <span className="font-bold">保存失败：</span> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-150 flex items-center justify-end gap-3 bg-slate-50 select-none">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                正在重构向量...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                保存并重向量化
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}