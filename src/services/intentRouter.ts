import type { Citation } from "@/types/api";

// Initial Mock Citations
export const mockCitations: Citation[] = [
  {
    id: "cit-1",
    index: 1,
    docName: "mindvault-arch-v2.pdf",
    snippet: "MindVault 核心采用 Local RAG (Retrieval-Augmented Generation) 架构。文档在上传后会通过高精度 Parser 提取文本，经过 Chunking 策略（默认 500 tokens，重叠 10%）切分，并调用本地 Embedding 模型（如 bge-small-zh-v1.5）转化为 384 维向量，最后存入 HNSW 索引的高性能本地向量数据库中。",
    score: 0.94,
    page: 2
  },
  {
    id: "cit-2",
    index: 2,
    docName: "rag-pipeline-spec.docx",
    snippet: "检索检索测试与重排 (Reranking) 机制：当用户输入提问时，系统首先进行相似度检索召回 Top-10 候选切片，随后通过本地 Reranker 模型（如 bce-reranker-base_v1）进行精排，筛选出相关性评分大于 0.6 的 Top-3 切片作为上下文送入 LLM，从而保障回答的准确率与减少幻觉。",
    score: 0.88,
    page: 5
  },
  {
    id: "cit-3",
    index: 3,
    docName: "hr-policy-2026.pdf",
    snippet: "第四章 考勤与假期管理规定：公司全员实行弹性工作制，每日核心工作时间为 10:00 - 16:00。员工年假额度为 10 天起步，根据入职年限逐年递增。所有请假均需通过 OA 系统提交并获得部门 Leader 与 HR BP 的双重审批方可生效。",
    score: 0.91,
    page: 12
  },
  {
    id: "cit-4",
    index: 4,
    docName: "api-design-spec-v3.pdf",
    snippet: "研发团队 API 设计规范：所有 RESTful API 接口和命名路径一律采用小写和连字符（kebab-case）风格。为了规避网络超时等重试引发的副作用，所有的状态变更请求必须强制在 Header 中携带唯一且幂等的 X-Idempotency-Key 头字段。异常响应结构须统一包含 code、message 和 trace_id，便于追踪定位。",
    score: 0.95,
    page: 4
  },
  {
    id: "cit-5",
    index: 5,
    docName: "reading-notes-atomic-habits.pdf",
    snippet: "个人《原子习惯》读书笔记：行为重塑和习惯培养核心由四个阶段构成，即“提示 (Cue) -> 渴望 (Craving) -> 反应 (Response) -> 奖赏 (Reward)”。要想养成一个好的长期习惯，应当从“让提示显而易见、让渴望有吸引力、让反应简单易行、让奖赏令人愉悦”这四个维度系统化构建个人工作环境与反馈环。",
    score: 0.92,
    page: 2
  }
];

export interface IntentRoute {
  intent: string;
  patterns: string[];
  priority: number; // Configurable priority: larger value matches first
  mockResponse: string;
  answer: string;
  relatedChunks: {
    docName: string;
    score: number;
    text: string;
    page?: number;
  }[];
  citations: Citation[];
}

export const intentRoutes: IntentRoute[] = [
  {
    intent: "hr_policy",
    patterns: ["工作", "考勤", "年假", "假期", "休假"],
    priority: 10,
    mockResponse: "根据您的询问，关于公司考勤与请假规范为您进行解答：\n\n1. **核心工作时间 [3]**：公司全体实行弹性工时，每日核心在线协作时间为 **10:00 - 16:00**，其他时间可弹性安排。\n2. **年假政策 [3]**：年假自入职起即享有 **10 天** 起算，随司龄递增。休假需提前在 OA 系统完成 Leader 和 HR 双审批。\n3. **其他福利**：支持弹性午休、远程办公应急申请。如需请假，请提前做好交接并关联相应项目负责人。",
    answer: "关于弹性工作制考勤、年假以及假期审批相关的文档切片如下：\n\n- **弹性工时规定 [3]**：公司全员实行弹性工作制，每日协作核心工作时间为 **10:00 - 16:00**。员工年假从 **10 天**（10天）起步，并随司龄递增。\n- **审批流规定 [3]**：所有请假类型均须提前通过 OA 系统线上申报，必须经过直接主管以及 HR BP 线上审批双重签字确认通过后，才能享受带薪年假或休假待遇。",
    relatedChunks: [
      {
        docName: "hr-policy-2026.pdf",
        score: 0.91,
        page: 12,
        text: "第四章 考勤与假期管理规定：公司全员实行弹性工作制，每日核心工作时间为 10:00 - 16:00。员工年假额度为 10 天起步，根据入职年限逐年递增。所有请假均需通过 OA 系统提交并获得部门 Leader 与 HR BP 的双重审批方可生效。"
      }
    ],
    citations: [mockCitations[2]]
  },
  {
    intent: "architecture",
    patterns: ["架构", "设计", "安全", "向量", "db", "embedding"],
    priority: 20,
    mockResponse: "MindVault 本地化架构的核心是实现极速的混合检索和端到端数据加密。\n\n- **本地嵌入与 HNSW 索引 [1]**：系统内部运行了 BGE 模型，无需公网即可实时提取文档的高维向量特征，并在本地向量数据库中建立高效的 HNSW (Hierarchical Navigable Small World) 近邻图，保证在万级文档切片中实现毫秒级向量召回。\n- **精排 Reranking [2]**：粗排后，使用 BCE Reranker 深度比对用户问题与文档切片，丢弃相关度低于阈值的块，从而实现超凡的答案精准度并消除幻觉。\n\n该流程保障了数据不出域的前提下，回答质量仍比肩公网 RAG 平台。",
    answer: "MindVault 本地知识库的物理架构主要通过以下模块保障数据隔离与高准确召回：\n\n1. **高精度 Parser**：支持多文档自动格式抽取并过滤多余空格、排版噪声。\n2. **向量检索层 [1]**：文档分割（Chunking）后调用本地 BGE-Small-ZH 模型，该模型将文档块转化为稠密空间向量，存储在本地 HNSW 向量树上，实现亚毫秒级高并发检索召回。\n3. **混合过滤精排重构 [2]**：使用 Reranker 重排器进行精排，剔除无用文本，有效保障送入本地大语言模型的上下文信息纯净度，最大程度消除幻觉。",
    relatedChunks: [
      {
        docName: "mindvault-arch-v2.pdf",
        score: 0.94,
        page: 2,
        text: "MindVault 核心采用 Local RAG (Retrieval-Augmented Generation) 架构。文档在上传后会通过高精度 Parser 提取文本，经过 Chunking 策略（默认 500 tokens，重叠 10%）切分，并调用本地 Embedding 模型（如 bge-small-zh-v1.5）转化为 384 维向量，最后存入 HNSW 索引的高性能本地向量数据库中。"
      },
      {
        docName: "rag-pipeline-spec.docx",
        score: 0.88,
        page: 5,
        text: "检索检索测试与重排 (Reranking) 机制：当用户输入提问时，系统首先进行相似度检索召回 Top-10 候选切片，随后通过本地 Reranker 模型（如 bce-reranker-base_v1）进行精排，筛选出相关性评分大于 0.6 的 Top-3 切片作为上下文送入 LLM，从而保障回答的准确率与减少幻觉。"
      }
    ],
    citations: [mockCitations[0], mockCitations[1]]
  },
  {
    intent: "dev_specs",
    patterns: ["研发", "规范", "团队", "api", "接口", "git"],
    priority: 30,
    mockResponse: "针对您关于研发团队规范与接口标准的提问，已在 “研发团队技术标准与核心规范” 知识库中为您匹配并解答如下：\n\n1. **RESTful API 命名设计 [4]**：所有外部/内部接口路径均要求统一使用小写和连字符 `kebab-case`。状态变更型接口（如 `POST` / `PUT`）需在请求头强制包含唯一幂等键 `X-Idempotency-Key` 以确保安全幂等性。\n2. **错误处理与链路追踪 [4]**：异常响应的结构必须规范化输出（统一包含 `code`、`message`、`trace_id`）。\n3. **代码合并分支规范**：基于开发分支 `develop` 自主拉取 `feature/`，提请合并时必须通过团队 Code Review 与 CI 静态语法扫描自动化门槛。",
    answer: "在“研发团队技术标准与核心规范”中检索到以下有关 API 设计及开发协同的切片：\n\n1. **API 设计统一规范 [4]**：所有 RESTful 接口路径一律采用小写和连字符 `kebab-case`。为了规避网络超时等重试引发的副作用，所有的状态变更请求必须强制在 Header 中携带唯一且幂等的 `X-Idempotency-Key` 头字段。\n2. **Git 工作流协同**：团队分支协同采用 Git Flow。任何提请合并的分支都需通过预设的 ESLint/TypeScript 扫描门槛，并指派至少一位高级工程师执行 Code Review 确认，方可合入 `develop` 分支。",
    relatedChunks: [
      {
        docName: "api-design-spec-v3.pdf",
        score: 0.95,
        page: 4,
        text: "研发团队 API 设计规范：所有 RESTful API 均需遵循统一命名风格，路径一律采用小写和连字符（kebab-case）。对于状态变更接口，必须在 Header 中携带 X-Idempotency-Key 以实现幂等性校验。错误响应体必须包含统一的 code、message 以及 trace_id。"
      },
      {
        docName: "team-git-workflow.md",
        score: 0.81,
        page: 1,
        text: "Git 分支管理流程：项目开发统一以 develop 分支为基准。开发者拉取 feature/ 分支完成本地验证后发起 Pull Request，触发 GitHub Actions 流水线运行自动化测试，并指派至少一位高级工程师执行 Code Review 确认，方可合入分支。"
      }
    ],
    citations: [mockCitations[3]]
  },
  {
    intent: "personal_growth",
    patterns: ["习惯", "读书", "个人", "成长", "笔记"],
    priority: 40,
    mockResponse: "关于个人成长和优秀习惯的构建，已为您在 “个人读书笔记与成长方法论” 知识库中检索到以下深度洞察：\n\n1. **原子习惯的重塑回路 [5]**：通过 system 的 “提示 (Cue) -> 渴望 (Craving) -> 反应 (Response) -> 奖赏 (Reward)” 四步环路，构建您的日常反馈机制。例如，通过将办公桌面重新规划（让提示显而易见）并把复杂目标拆碎到 2 分钟内（让反应简单易行），来快速根治拖延、重塑高效微习惯。\n2. **卡片式笔记连接法**：抛弃传统的单一线性大纲，使用微卡片进行日常碎片阅读总结，通过高密度的双向链接（Bi-directional Links）让知识自下而上地自我组合，沉淀出长期成长认知底座。",
    answer: "已为您定位到“个人读书笔记与成长方法论”下的核心切片，内容摘要如下：\n\n1. **习惯回路模型 [5]**：习惯的核心流程由“提示 (Cue)”、“渴望 (Craving)”、“反应 (Response)”和“奖赏 (Reward)”四个步骤周而复始构成。重塑微习惯的黄金法则是让提示显而易见，让反应简单易行。\n2. **卡片写作双向链接**：读书应重在建立想法之间的神经关联。用一事一卡的方式记录，通过索引和多重标注建立双向链接，能够促进知识卡片的自组织 and 涌现，沉淀出长期成长认知底座。",
    relatedChunks: [
      {
        docName: "reading-notes-atomic-habits.pdf",
        score: 0.92,
        page: 2,
        text: "个人《原子习惯》读书笔记：习惯的建立包含四个核心步骤：提示（Cue）、渴望（Craving）、反应（Response）和奖赏（Reward）。通过构建“显而易见、有吸引力、简单易行、令人愉悦”的环境反馈，我们可以更轻松地养成微小的日常好习惯，实现个人能力的复利式增长。"
      },
      {
        docName: "personal-monthly-review-2026.md",
        score: 0.78,
        page: 1,
        text: "个人月度及年度复盘模版：通过结构化三问（做得好的事、可以改善的事、下一步的具体行动）进行深度自省。配合每日卡片习惯追踪打卡，通过数字化可视记录对个人微习惯回路形成正向反馈 and 奖赏。"
      }
    ],
    citations: [mockCitations[4]]
  }
];

export function matchIntent(query: string): IntentRoute | null {
  const queryLower = query.toLowerCase();
  
  // Sort routes by priority descending
  const sortedRoutes = [...intentRoutes].sort((a, b) => b.priority - a.priority);
  
  for (const route of sortedRoutes) {
    // Check if query matches any of the patterns
    const matches = route.patterns.some(pattern => queryLower.includes(pattern.toLowerCase()));
    if (matches) {
      return route;
    }
  }
  
  return null;
}
