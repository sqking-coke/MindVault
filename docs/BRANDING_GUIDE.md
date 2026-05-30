# mindvaults 品牌视觉与多模态资产指南 (Brand & Visual Identity Guide)

本指南旨在规范 **mindvaults** 系统的视觉识别系统（Visual Identity, VI）和相关的多模态图文素材。
系统定位于 **Security-First AI RAG (隐私优先的安全 RAG 知识库问答系统)**，其视觉设计传达了**高智感 (Intelligence)** 与**高主权 (Absolute Sovereignty)** 的完美结合。

我们为您设计并生成了三套风格迥异、细节丰富且完全兼容 Web 端和公众号排版的 **SVG 矢量图徽标（Logo）选项**，全部存放于 `public/branding/` 下。

---

## 🎨 核心色彩规范 (Brand Colors)

系统主色调与 Next.js 前端应用、FastAPI 后端以及数据库完美契合，分为两大核心主题：

### 1. 守护之盾主题（Vault & Security）- 基础冷色系
主要用于系统背景、侧边栏、边框以及体现隐私保护的容器。
- **Cyber Indigo (赛博靛蓝)**: `#4f46e5` （前端主色）
- **Deep Slate (极客深黛)**: `#0f172a` (背景/暗黑卡片)
- **Royal Violet (皇家紫罗兰)**: `#7c3aed` (渐变强调色)

### 2. 智核共鸣主题（Mind & Cognitive）- 活跃高亮色
用于神经网络节点、知识检索高亮、引用指示器以及正在检索的流式波形。
- **Neon Cyan (霓虹青蓝)**: `#22d3ee` (智核外圈、网络连线)
- **Active Mint (活性薄荷绿)**: `#10b981` (中层检索、数据通畅)
- **Cyber Gold (赛博极光金)**: `#fbbf24` (主权盾牌、企业高信任)

---

## 🚀 图标设计变体 (Logo Variations)

我们提供了 3 种极具视觉表现力与差异化的矢量图标设计。所有图标均为 `256x256` 矢量格式，可在 Web 端、favicon 或移动端无损渲染：

| 图标选项 | 资源路径 | 视觉特点与设计隐喻 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **Option A (默认)<br/>Cyber RAG Vault** | `public/branding/logo_option_a.svg` | **赛博密码锁盘 + 双半球大脑神经网络 + 三层微光节点。**<br/>以靛蓝至紫罗兰渐变为主环，青绿至薄荷绿神经网络对称相连，底座点缀科技锁孔，彰显强烈的未来科技感和 RAG 认知检索特性。 | 前端 Web 默认 Logo、Favicon、GitHub 仓库 README、移动端 APP 图标。 |
| **Option B<br/>Minimalist Monogram** | `public/branding/logo_option_b.svg` | **极简折线 Monogram（M + V 融合）+ 二维向量空间。**<br/>几何极简丝带将 **M**ind 和 **V**ault 融合成一条无尽环，背景融入六角向量检索阵列，两点微光代表向量数据库中精准匹配的 K 临近检索点。 | 现代科技感主打页面、官网静态展示、高对比度暗黑模式专用、名片或极简印刷品。 |
| **Option C<br/>Enterprise Shield** | `public/branding/logo_option_c.svg` | **重装主权护盾 + 科技脑纹 + 赛博黄金锁芯。**<br/>完美的贝塞尔防守盾，左侧是深蓝科技脑纹，右侧是熠熠生辉的黄金密码锁盘，底部配有“数据主权”实体挂锁。传达军工级安全与坚不可摧的企业服务质量。 | 企业级专有部署、私有化售前 PPT 封面、商业白皮书插图、安全审计页面。 |

---

## 📸 预览与获取生成图片 (Image Assets Retrieval)

SVG（Scalable Vector Graphics）是 Web 发布的最佳格式。如果您需要将其转化为 PNG 格式或直接引用至您的宣传网站中，可以使用以下配套的生成方法与属性信息：

### 1. Web 页面与 Markdown 引用代码

#### Markdown 居中白底/黑底引用：
```markdown
<!-- 在 README 或网页中居中展示，自适应大小 -->
<p align="center">
  <img src="public/branding/logo_option_a.svg" alt="mindvaults Cyber RAG" width="160" />
</p>
```

#### HTML / React 前端直接使用：
```tsx
import Image from 'next/image';

// 在前端代码中直接渲染
export function Logo() {
  return (
    <Image 
      src="/branding/logo_option_a.svg" 
      alt="mindvaults brand logo" 
      width={128} 
      height={128}
      className="hover:scale-105 transition-transform duration-300"
    />
  );
}
```

### 2. 转换 SVG 至通用图片 (PNG / Favicon / Web App Icon)
在发布网站时，需要将 SVG 渲染为静态资源，可用本地命令行（如 `sharp` 或 `inkscape`）快速批量生成：

```bash
# 使用 CLI 工具将 SVG 渲染为不同尺寸的 PNG
# 1. 渲染 favicon (32x32)
npx rsvg-convert -w 32 -h 32 public/branding/logo_option_a.svg -o public/favicon.png

# 2. 渲染移动端 Web App 图标 (192x192)
npx rsvg-convert -w 192 -h 192 public/branding/logo_option_a.svg -o public/icon-192.png

# 3. 渲染企业白皮书高清封面图 (1024x1024)
npx rsvg-convert -w 1024 -h 1024 public/branding/logo_option_c.svg -o public/branding/enterprise_banner.png
```

---

## 📱 微信公众号排版与内容运营资产 (WeChat Asset Specifications)

本系统内置了高级的“微信公众号排版适配”功能（`/utils/wechatFormat.ts`）。为了让后续发布微信文章、运营网站配套图片更加完美，以下提供配套的图片比例与排版色系搭配规范：

### 1. 文章配图规范
- **首图 (Cover Banner - 16:9)**:
  - 推荐分辨率: `900px × 383px`
  - 视觉建议: 深色底，左侧放置大号的白字“mindvaults 智能问答知识库”，右侧放置 `logo_option_a.svg`（缩放到合适比例并开启外发光滤镜）。
- **次图/缩略图 (Square Cover - 1:1)**:
  - 推荐分辨率: `200px × 200px`
  - 视觉建议: 直接采用 `logo_option_b.svg` 或 `logo_option_a.svg`，背景直接填充为 `#0f172a`。

### 2. 微信排版安全调色板 (WeChat Native Inline Style CSS)
当使用 inline-CSS 转换器复制内容至公众号时，请严格遵守以下字体栈和文字颜色，保证在 Android 和 iOS 微信客户端均具有无缝、丝滑的阅读质感：
- **中文字体栈 (System Font Stack)**: 
  `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;`
- **正文行高 (Line Height)**: `1.75` (完美适配屏幕阅读)
- **主标题颜色**: `#1e293b` (深 Slate，极具现代纸张质感，避免纯黑造成的视觉疲劳)
- **强调边框色**: `border-left: 4px solid #4f46e5;` (利用靛蓝作为段落导流线，显得克制且专业)

---

## 🛠️ 下一步：Favicon 配置指引 (Next Action)

如果您需要为 MindVault 的客户端网站部署更新 favicon：
1. 编辑 `src/app/layout.tsx`。
2. 确保在 `head` 中包含引用：
   ```tsx
   export const metadata = {
     title: 'mindvaults - 私有 RAG 问答知识库',
     description: '数据归你所有，智能相伴左右。',
     icons: {
       icon: '/branding/logo_option_a.svg', // Next.js 14 支持直接用 SVG 作为 favicon！
     },
   }
   ```
3. 您可以随时复制本指南中的任何 SVG 文件覆盖 `public/logo.svg` 来快速完成全局图标更新。
