"use client";

import React from "react";
import { useMindVault } from "@/context/MindVaultContext";
import { 
  FileText, 
  Clock, 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  CheckCircle 
} from "lucide-react";

export default function DocumentTable() {
  const { 
    documents, 
    activeKbId, 
    reparseDocument, 
    deleteDocument 
  } = useMindVault();

  // Filter docs for active KB
  const activeKbDocs = documents.filter(doc => doc.kbId === activeKbId);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between select-none">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
          <FileText className="h-4.5 w-4.5 text-indigo-500" />
          当前文档库 ({activeKbDocs.length} 个文件)
        </h3>
        <div className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 font-bold uppercase">
          向量引擎在线
        </div>
      </div>

      <div className="overflow-x-auto">
        {activeKbDocs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 select-none space-y-2">
            <FileText className="h-10 w-10 text-slate-300 mx-auto animate-pulse-subtle" />
            <p className="text-xs font-semibold">此知识库中暂未关联任何物理文档</p>
            <p className="text-[11px] max-w-xs mx-auto text-slate-400">
              请在上方拖放或快捷添加模拟文档，让本地 Parser 完成文本高保真提取。
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-semibold select-none">
                <th className="px-6 py-3.5">文档名称</th>
                <th className="px-6 py-3.5">文件大小</th>
                <th className="px-6 py-3.5">解析字符数</th>
                <th className="px-6 py-3.5">当前状态</th>
                <th className="px-6 py-3.5">上传时间</th>
                <th className="px-6 py-3.5 text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeKbDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 max-w-[200px] truncate">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono select-all">{doc.size}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono font-medium">
                    {doc.status === "success" ? `${doc.chars.toLocaleString()} 字符` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {doc.status === "uploading" && (
                      <div className="flex flex-col w-28 space-y-1 select-none">
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400 animate-spin" />
                          正在物理上传 {doc.progress}%
                        </span>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full transition-all duration-150" style={{ width: `${doc.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {doc.status === "parsing" && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50/50 px-2.5 py-0.5 rounded-full border border-indigo-100 select-none">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        本地大纲拆解中...
                      </div>
                    )}
                    {doc.status === "success" && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-150 select-none">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        高保真已解析
                      </div>
                    )}
                    {doc.status === "failed" && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-150 select-none" title="格式不支持或文本过长损坏">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        解析失败
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{doc.uploadedAt}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      {doc.status !== "uploading" && (
                        <button
                          onClick={() => reparseDocument(doc.id)}
                          disabled={doc.status === "parsing"}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-40 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          title="重新解析此文件并重构向量树"
                          aria-label={`重新解析文件: ${doc.name}`}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${doc.status === "parsing" ? "animate-spin" : ""}`} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                        title="物理删除切片"
                        aria-label={`物理删除文件: ${doc.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
