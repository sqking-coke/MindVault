"use client";

import React, { useState } from "react";
import { useMindVault } from "@/context/MindVaultContext";
import { Upload } from "lucide-react";

interface UploadZoneProps {
  showToast: (message: string, type?: "info" | "success" | "warning") => void;
}

export default function UploadZone({ showToast }: UploadZoneProps) {
  const { 
    activeKbId, 
    uploadDocuments 
  } = useMindVault();

  const [isDragging, setIsDragging] = useState(false);

  // Drag & drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!activeKbId) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      uploadDocuments(activeKbId, droppedFiles);
      showToast(`正在上传 ${droppedFiles.length} 个文件到后端...`, "info");
    }
  };

  // Mock file buttons — demo only, no real upload
  const triggerMockUpload = () => {
    showToast("请拖放真实文件到此区域上传至后端，快捷按钮仅作演示。", "warning");
  };

  return (
    <div 
      role="button"
      tabIndex={0}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => triggerMockUpload()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerMockUpload();
        }
      }}
      aria-label="上传文档区域，拖放 PDF、DOCX、TXT 文件至此，或回车/空格点击以模拟文件上传"
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer select-none flex flex-col items-center justify-center space-y-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
        isDragging 
          ? "border-indigo-500 bg-indigo-50/50" 
          : "border-slate-300 hover:border-indigo-400 hover:bg-slate-100/30"
      }`}
    >
      <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
        <Upload className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">
          拖拽 PDF, DOCX, TXT 文件到此处上传
        </p>
        <p className="text-xs text-slate-400 mt-1">
          支持拖拽系统文件。直接点击此处模拟加载高保定研究报告或政策文档。
        </p>
      </div>
      
      {/* Shortcut Mock Upload files selection */}
      <div className="pt-2 flex flex-wrap justify-center gap-2" onClick={(e) => e.stopPropagation()}>
        <span className="text-[11px] text-slate-400 font-medium self-center">快捷添加样例:</span>
        <button
          onClick={() => triggerMockUpload()}
          className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 font-semibold px-2 py-1 rounded"
        >
          + 市场调研报告.pdf
        </button>
        <button
          onClick={() => triggerMockUpload()}
          className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 font-semibold px-2 py-1 rounded"
        >
          + 产品说明规格书.docx
        </button>
        <button
          onClick={() => triggerMockUpload()}
          className="text-[10px] bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 font-semibold px-2 py-1 rounded"
        >
          + 无法解析文件.exe
        </button>
      </div>
    </div>
  );
}
