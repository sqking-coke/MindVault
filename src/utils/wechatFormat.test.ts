import assert from "assert";
import { 
  translateTailwindToInline, 
  parseMarkdownToHTML, 
  generateFullWechatHTML,
  TAILWIND_MAP 
} from "./wechatFormat";
import type { Citation } from "../types/api";

console.log("🚀 Starting Wechat Format Utility Unit Tests...\n");

try {
  // ==================== Test 1: translateTailwindToInline ====================
  console.log("⏳ Test 1: Verification of Tailwind Class to Inline CSS Translation...");
  
  const rawHtml = '<div className="font-sans text-base text-slate-800 bg-white mb-4 p-4 rounded-xl">Test</div>';
  const inlinedHtml = translateTailwindToInline(rawHtml);
  
  assert.ok(inlinedHtml.includes('style="'), "Inlined HTML should contain style attributes");
  assert.ok(inlinedHtml.includes(TAILWIND_MAP["font-sans"]), "Inlined HTML should contain font-sans CSS styles");
  assert.ok(inlinedHtml.includes(TAILWIND_MAP["text-base"]), "Inlined HTML should contain text-base CSS styles");
  assert.ok(inlinedHtml.includes(TAILWIND_MAP["text-slate-800"]), "Inlined HTML should contain text-slate-800 CSS styles");
  assert.ok(inlinedHtml.includes(TAILWIND_MAP["bg-white"]), "Inlined HTML should contain bg-white CSS styles");
  assert.ok(inlinedHtml.includes(TAILWIND_MAP["mb-4"]), "Inlined HTML should contain mb-4 CSS styles");
  assert.ok(inlinedHtml.includes(TAILWIND_MAP["p-4"]), "Inlined HTML should contain p-4 CSS styles");
  assert.ok(inlinedHtml.includes(TAILWIND_MAP["rounded-xl"]), "Inlined HTML should contain rounded-xl CSS styles");
  
  console.log("✅ Test 1 Passed!\n");

  // ==================== Test 2: parseMarkdownToHTML ====================
  console.log("⏳ Test 2: Verification of Markdown to HTML Parsing...");
  
  const markdownText = `# Header 1
## Header 2
### Header 3

This is a **bold** paragraph with *italic* text and some \`inline code\`.

> This is a blockquote line 1
> This is a blockquote line 2

- Bullet item 1
- Bullet item 2

1. Numbered item 1
2. Numbered item 2

---

[1] and [2] citations inside.`;

  const parsedHtml = parseMarkdownToHTML(markdownText);
  
  // Headers
  assert.ok(parsedHtml.includes('<h1'), "Should parse Header 1");
  assert.ok(parsedHtml.includes('Header 1'), "Should contain Header 1 content");
  assert.ok(parsedHtml.includes('<h2'), "Should parse Header 2");
  assert.ok(parsedHtml.includes('<h3'), "Should parse Header 3");
  
  // Inline formatting
  assert.ok(parsedHtml.includes('<strong'), "Should parse Bold markdown to strong tag");
  assert.ok(parsedHtml.includes('<em'), "Should parse Italic markdown to em tag");
  assert.ok(parsedHtml.includes('<code'), "Should parse inline code markdown");
  
  // Blockquote
  assert.ok(parsedHtml.includes('<blockquote'), "Should parse Blockquotes");
  assert.ok(parsedHtml.includes('blockquote line 1'), "Should contain blockquote content");
  
  // Lists
  assert.ok(parsedHtml.includes('<ul'), "Should group unordered lists");
  assert.ok(parsedHtml.includes('<ol'), "Should group ordered lists");
  assert.ok(parsedHtml.includes('<li'), "Should render list items");
  
  // Citations [1]
  assert.ok(parsedHtml.includes('<span'), "Should parse citations to styled spans");
  assert.ok(parsedHtml.includes('[1]'), "Should contain citation numbers");
  
  // HR divider
  assert.ok(parsedHtml.includes('border-t border-slate-200'), "Should render HR divider");
  
  console.log("✅ Test 2 Passed!\n");

  // ==================== Test 3: generateFullWechatHTML ====================
  console.log("⏳ Test 3: Verification of WeChat Full Article HTML Generation...");
  
  const testQuestion = "什么是 mindvaults?";
  const testAnswer = "mindvaults 是一个**私有智能知识库**。它拥有高水平的安全屏障。";
  const testCitations: Citation[] = [
    {
      id: "cit-1",
      index: 1,
      docName: "安全设计文档.pdf",
      snippet: "mindvaults 保证所有企业机密本地加密。",
      score: 0.95,
      page: 4
    }
  ];
  
  const fullHtml = generateFullWechatHTML(testQuestion, testAnswer, testCitations);
  
  // Check wrapping container and fonts
  assert.ok(fullHtml.includes('font-family: system-ui'), "Should include the required system font stack");
  
  // Check question title and border style
  assert.ok(fullHtml.includes(testQuestion), "Should render the question");
  assert.ok(fullHtml.includes('border-left: 4px solid #1a6fc4'), "Should render the custom primary color bar border style");
  
  // Check citations
  assert.ok(fullHtml.includes('安全设计文档.pdf'), "Should include reference document names");
  assert.ok(fullHtml.includes('第 4 页'), "Should mention the correct citation pages");
  assert.ok(fullHtml.includes('相似度 95%'), "Should mention reference scores");
  
  // Check safe colors presence
  assert.ok(fullHtml.includes('color: #333333'), "Should use primary text color #333");
  assert.ok(fullHtml.includes('color: #555555'), "Should use body text color #555");
  assert.ok(fullHtml.includes('color: #666666') || fullHtml.includes('color: #888888'), "Should use secondary/caption colors");
  assert.ok(fullHtml.includes('color: #1a6fc4'), "Should use highlight/link color #1a6fc4");
  
  console.log("✅ Test 3 Passed!\n");

  console.log("🎉 All WeChat format unit tests passed successfully!");
} catch (error) {
  console.error("❌ Unit tests failed:");
  console.error(error);
  process.exit(1);
}
