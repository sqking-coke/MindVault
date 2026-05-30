import type { Citation } from "../types/api";

// ==================== WeChat Safe Tailwind To Inline CSS Adapter ====================
export const TAILWIND_MAP: Record<string, string> = {
  // Fonts
  "font-sans": "font-family: system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif;",
  "font-mono": "font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;",
  
  // Font sizes
  "text-[10px]": "font-size: 10px;",
  "text-[11px]": "font-size: 11px;",
  "text-xs": "font-size: 12px;",
  "text-sm": "font-size: 14px;",
  "text-base": "font-size: 15px;", // 15px is optimal for WeChat mobile body text
  "text-lg": "font-size: 17px;",
  "text-xl": "font-size: 19px;",
  "text-2xl": "font-size: 22px;",
  
  // Font weights
  "font-normal": "font-weight: normal;",
  "font-medium": "font-weight: 500;",
  "font-semibold": "font-weight: 600;",
  "font-bold": "font-weight: bold;",
  
  // Colors (WeChat Safe Color Palette)
  "text-slate-800": "color: #333333;",
  "text-gray-800": "color: #333333;",
  "text-slate-700": "color: #555555;",
  "text-slate-600": "color: #555555;",
  "text-gray-600": "color: #555555;",
  "text-slate-500": "color: #888888;",
  "text-slate-400": "color: #888888;",
  "text-gray-400": "color: #888888;",
  "text-indigo-600": "color: #1a6fc4;",
  "text-blue-600": "color: #1a6fc4;",
  "text-emerald-600": "color: #07c160;", // WeChat Green
  "text-emerald-700": "color: #06ad56;",
  
  // Backgrounds
  "bg-white": "background-color: #ffffff;",
  "bg-slate-50": "background-color: #fcfcfc;",
  "bg-gray-50": "background-color: #fcfcfc;",
  "bg-slate-100": "background-color: #f5f5f5;",
  "bg-indigo-50": "background-color: #f0f7ff;",
  "bg-emerald-50": "background-color: #f0fbf5;",
  
  // Line Heights
  "leading-normal": "line-height: 1.5;",
  "leading-relaxed": "line-height: 1.75;", // 1.75 is perfect for mobile readability
  "leading-loose": "line-height: 2.0;",
  
  // Margins
  "m-0": "margin: 0;",
  "mb-1": "margin-bottom: 4px;",
  "mb-2": "margin-bottom: 8px;",
  "mb-3": "margin-bottom: 12px;",
  "mb-4": "margin-bottom: 16px;",
  "mb-5": "margin-bottom: 20px;",
  "mb-6": "margin-bottom: 24px;",
  "mt-2": "margin-top: 8px;",
  "mt-4": "margin-top: 16px;",
  "mt-6": "margin-top: 24px;",
  "my-4": "margin-top: 16px; margin-bottom: 16px;",
  "mx-2": "margin-left: 8px; margin-right: 8px;",
  
  // Paddings
  "p-2": "padding: 8px;",
  "p-3": "padding: 12px;",
  "p-4": "padding: 16px;",
  "p-5": "padding: 20px;",
  "px-2.5": "padding-left: 10px; padding-right: 10px;",
  "px-3": "padding-left: 12px; padding-right: 12px;",
  "px-4": "padding-left: 16px; padding-right: 16px;",
  "py-1": "padding-top: 4px; padding-bottom: 4px;",
  "py-2": "padding-top: 8px; padding-bottom: 8px;",
  "py-3": "padding-top: 12px; padding-bottom: 12px;",
  "pl-3": "padding-left: 12px;",
  "pl-5": "padding-left: 20px;",
  
  // Borders
  "border": "border: 1px solid #e2e8f0;",
  "border-t": "border-top: 1px solid #e8e8e8;",
  "border-b": "border-bottom: 1px solid #e8e8e8;",
  "border-l-4": "border-left: 4px solid #e2e8f0;",
  "border-slate-200": "border-color: #e2e8f0;",
  "border-emerald-200": "border-color: #a7f3d0;",
  "border-indigo-600": "border-left: 4px solid #1a6fc4;", // Used for H3 accent
  
  // Radius
  "rounded": "border-radius: 4px;",
  "rounded-md": "border-radius: 6px;",
  "rounded-lg": "border-radius: 8px;",
  "rounded-xl": "border-radius: 12px;",
  "rounded-2xl": "border-radius: 16px;",
  
  // Lists
  "list-disc": "list-style-type: disc;",
  "list-decimal": "list-style-type: decimal;",
  "list-none": "list-style-type: none;",
  
  // Layout (Use clean basic display properties)
  "flex": "display: flex;",
  "items-center": "align-items: center;",
  "justify-between": "justify-content: space-between;",
  "gap-1": "gap: 4px;",
  "gap-2": "gap: 8px;",
  "gap-3": "gap: 12px;",
  "shrink-0": "flex-shrink: 0;",
  "italic": "font-style: italic;",
  "block": "display: block;",
  "inline-block": "display: inline-block;",
  "inline": "display: inline;",
  "w-full": "width: 100%;",
  "box-border": "box-sizing: border-box;",
};

/**
 * Translates Tailwind utility class names to WeChat-compliant inline CSS style blocks.
 */
export function translateTailwindToInline(html: string): string {
  return html.replace(/className="([^"]*)"/g, (match, classStr) => {
    const classes = classStr.split(/\s+/).filter(Boolean);
    const styles = classes
      .map((cls: string) => TAILWIND_MAP[cls] || "")
      .filter(Boolean)
      .join(" ");
    return styles ? `style="${styles}"` : "";
  });
}

/**
 * Parses markdown to a clean HTML string using the same Tailwind structure.
 */
export function parseMarkdownToHTML(markdown: string): string {
  const lines = markdown.split("\n");
  let html = "";
  let inList: "ul" | "ol" | null = null;
  let inQuote = false;
  let quoteLines: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  const flushList = () => {
    if (inList) {
      html += `</${inList}>`;
      inList = null;
    }
  };

  const flushQuote = () => {
    if (inQuote) {
      const quoteText = quoteLines.join("\n");
      const processed = parseInline(quoteText);
      html += `<blockquote className="bg-slate-50 border-l-4 border-indigo-600 p-3 italic text-slate-600 my-4 rounded-r-lg">${processed}</blockquote>`;
      quoteLines = [];
      inQuote = false;
    }
  };

  const flushCode = () => {
    if (inCode) {
      const codeText = codeLines
        .join("\n")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      html += `<pre className="bg-slate-100 p-4 rounded-lg overflow-x-auto my-4 border border-slate-200"><code className="font-mono text-xs text-slate-700 block">${codeText}</code></pre>`;
      codeLines = [];
      inCode = false;
    }
  };

  const parseInline = (text: string): string => {
    let res = text;
    // Bold **text**
    res = res.replace(/\*\*(.*?)\*\*/g, '<strong className="font-bold text-indigo-600">$1</strong>');
    // Italic *text*
    res = res.replace(/\*(.*?)\*/g, '<em className="italic text-slate-800">$1</em>');
    // Inline code `code`
    res = res.replace(/`(.*?)`/g, '<code className="font-mono bg-slate-100 text-xs px-1.5 py-0.5 rounded text-indigo-600">$1</code>');
    // Citations [1], [2]
    res = res.replace(/\[(\d+)\]/g, '<span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mx-0.5 inline-block">[$1]</span>');
    return res;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Fenced Code Block
    if (trimmed.startsWith("```")) {
      if (inCode) {
        flushCode();
      } else {
        flushList();
        flushQuote();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      flushList();
      if (!inQuote) {
        inQuote = true;
      }
      const content = line.substring(line.indexOf(">") + 1).trim();
      quoteLines.push(content);
      continue;
    } else {
      flushQuote();
    }

    // Headers
    if (trimmed.startsWith("#")) {
      flushList();
      let level = 0;
      while (trimmed[level] === "#") level++;
      const content = trimmed.substring(level).trim();
      const processed = parseInline(content);
      if (level === 1) {
        html += `<h1 className="text-xl font-bold text-slate-800 mt-6 mb-3">${processed}</h1>`;
      } else if (level === 2) {
        html += `<h2 className="text-lg font-bold text-slate-800 mt-4 mb-2">${processed}</h2>`;
      } else {
        html += `<h3 className="text-base font-bold text-slate-800 mt-4 mb-2">${processed}</h3>`;
      }
      continue;
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList();
      html += `<div className="border-t border-slate-200 my-4"></div>`;
      continue;
    }

    // Unordered List
    const ulMatch = line.match(/^(\s*)[*\-•]\s+(.*)/);
    if (ulMatch) {
      if (inList !== "ul") {
        flushList();
        inList = "ul";
        html += `<ul className="list-disc pl-5 mb-4 text-base leading-relaxed text-slate-700">`;
      }
      const itemContent = parseInline(ulMatch[2]);
      html += `<li className="mb-2 text-slate-700">${itemContent}</li>`;
      continue;
    }

    // Ordered List
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (olMatch) {
      if (inList !== "ol") {
        flushList();
        inList = "ol";
        html += `<ol className="list-decimal pl-5 mb-4 text-base leading-relaxed text-slate-700">`;
      }
      const itemContent = parseInline(olMatch[2]);
      html += `<li className="mb-2 text-slate-700">${itemContent}</li>`;
      continue;
    }

    // Empty line
    if (trimmed === "") {
      flushList();
      continue;
    }

    // Normal Paragraph
    flushList();
    const processed = parseInline(line);
    html += `<p className="mb-4 text-base leading-relaxed text-slate-700">${processed}</p>`;
  }

  // Flush remaining blocks
  flushList();
  flushQuote();
  flushCode();

  return html;
}

/**
 * Builds the complete reference citation list styled for WeChat Official Account layout.
 */
export function generateCitationsHTML(citations: Citation[]): string {
  if (!citations || citations.length === 0) return "";
  
  const citationsList = citations
    .map(
      (c) => `
    <li className="mb-1 text-slate-500 text-xs leading-relaxed">
      <span className="font-bold text-indigo-600 font-mono">[${c.index}]</span> ${c.docName} 
      <span className="text-slate-400 font-mono">(第 ${c.page || 1} 页 • 相似度 ${(c.score * 100).toFixed(0)}%)</span>
    </li>`
    )
    .join("");

  return `
    <div className="mt-6 pt-4 border-t border-slate-200">
      <h4 className="text-xs font-bold text-indigo-600 mb-2">📎 引用来源 (${citations.length})</h4>
      <ol className="list-none pl-0 m-0">
        ${citationsList}
      </ol>
    </div>
  `;
}

/**
 * Main helper to output full ready-to-paste WeChat compatible HTML layout.
 */
export function generateFullWechatHTML(question: string, answer: string, citations: Citation[]): string {
  const answerHtml = parseMarkdownToHTML(answer);
  const citationsHtml = generateCitationsHTML(citations);
  const dateStr = new Date().toLocaleDateString("zh-CN");
  
  const rawHtml = `
    <div className="font-sans leading-relaxed text-slate-800 p-5 bg-white border border-slate-200 rounded-2xl w-full box-border mb-6">
      <!-- Header -->
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg py-1 px-2.5 flex items-center justify-center shrink-0">
          <span className="text-emerald-700 font-bold text-xs">mindvaults 智能卡片</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">WECHAT COMPATIBLE LAYOUT</span>
      </div>
      
      <!-- Question Title -->
      <h3 className="text-lg font-bold text-slate-800 mb-4 pl-3 border-indigo-600 leading-normal">
        ${question}
      </h3>
      
      <!-- Divider -->
      <div className="border-t border-slate-200 my-4"></div>
      
      <!-- Answer Content Body -->
      <div className="text-base leading-relaxed text-slate-700">
        ${answerHtml}
      </div>
      
      <!-- Reference Citations -->
      ${citationsHtml}
      
      <!-- Footer Attribution -->
      <div className="border-t border-slate-200 mt-6 pt-4 flex justify-between items-center text-[10px] text-slate-400">
        <span>由 mindvaults 智能知识库自动排版生成</span>
        <span className="font-mono">${dateStr}</span>
      </div>
    </div>
  `;
  
  return translateTailwindToInline(rawHtml);
}
