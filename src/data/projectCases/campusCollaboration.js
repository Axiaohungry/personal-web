export const campusCollaborationCase = {
  slug: 'campus-collaboration',
  route: '/projects/campus-collaboration',
  title: '校园协作项目机制',
  subtitle: '把校园里的活动、协作和复盘整理成一套能反复使用的组织方法。',
  hero: {
    eyebrow: '校园协作案例',
    title: '把多人协作做成项目机制，而不只是办一次活动',
    subtitle: '围绕报名、分工、现场、复盘，把跨部门协作沉淀成可复用的组织模板。',
    summary:
      '这个页面不是活动影集，而是一次把学生组织、场地、物料、传播和现场执行串成稳定机制的实践。它强调的不是热闹程度，而是协作是否能被理解、接手和复制。',
    tags: ['校园运营', '协作机制', '复盘沉淀', '学生组织'],
    signals: [
      { label: '覆盖范围', value: '3000+ 用户' },
      { label: '协作跨度', value: '5+ 部门' },
      { label: '核心团队', value: '16 人' },
    ],
  },
  leadCase: {
    title: '“活力柚子”篮球新生杯',
    role: '主导案例 / 机制整合',
    summary:
      '以篮球新生杯为主线，我把报名收口、角色分工、赛程同步、现场执行和赛后复盘放进同一套协作节奏里，让一场校园活动具备项目化交付的能力。',
    highlights: [
      '统一报名入口与通知节奏',
      '把现场执行拆成可交接节点',
      '把复盘结果沉淀进模板库',
    ],
  },
  complexity: [
    '活动看起来是一个比赛，实际上牵涉报名、筛选、物料、场地、传播和复盘六条并行链路。',
    '如果没有共同的状态定义，部门之间很容易各说各话，最后把协作成本转嫁给现场。',
    '校园项目常常依赖口头沟通，我希望把它们整理成更容易接手的机制和文档。',
    '真正的结果不是一场顺利结束，而是下一次项目可以更快启动、更少返工。',
  ],
  process: [
    {
      key: 'discover',
      title: '发现边界',
      description: '先拆清楚目标、参与角色和协作边界，避免一开始就把活动做成堆功能的拼盘。',
    },
    {
      key: 'structure',
      title: '搭建机制',
      description: '把报名、分组、通知、物料和现场执行统一到一张协作板上，减少信息在群聊里丢失。',
    },
    {
      key: 'collaboration',
      title: '对齐协作',
      description: '用同一套节奏同步学生团队、老师和场地方，确保每个节点都知道自己该接什么。',
    },
    {
      key: 'execution',
      title: '沉淀复用',
      description: '把现场反馈、问题清单和可改进项整理成复盘材料，方便后续项目直接复用。',
    },
  ],
  supportingCases: [
    {
      title: '报名与分组',
      summary: '把报名信息、分组规则和通知时间统一管理，减少重复追问和漏发。',
      detail: '对应主案的前端入口，确保信息收口后还能继续分发到不同角色。',
    },
    {
      title: '场地与现场联动',
      summary: '把赛程、签到、物料和场地安排对齐到同一个执行视图里。',
      detail: '避免现场出现“人到了但信息没到”的断层。',
    },
    {
      title: '复盘与模板化',
      summary: '把执行问题、观察结论和下一轮优化点整理成可复用清单。',
      detail: '让项目结束之后还能继续服务下一次协作。',
    },
  ],
  evidence: [
    {
      title: '主案协作板',
      src: '/projects/campus-collaboration/lead-case-board.png',
      detail: '把报名、分工、时间轴和现场任务放进同一块板里，方便大家快速看懂项目状态。',
      note: '公开安全的占位图，后续可替换为真实协作板截图。',
    },
    {
      title: '角色拆分图',
      src: '/projects/campus-collaboration/role-split.png',
      detail: '展示核心团队如何按职责拆分，避免“所有人都在管，但没人真正接手”。',
      note: '公开安全的占位图，后续可替换为真实分工图。',
    },
    {
      title: '现场执行记录',
      src: '/projects/campus-collaboration/on-site-photo.jpg',
      detail: '现场照片更像组织状态的证据，而不是单纯的活动留影。',
      note: '公开安全的占位图，后续可替换为真实现场照片。',
    },
    {
      title: '复盘片段',
      src: '/projects/campus-collaboration/retrospective-fragment.png',
      detail: '将问题、收获和改进方向压缩成一页，帮助下一轮项目快速上手。',
      note: '公开安全的占位图，后续可替换为真实复盘素材。',
    },
  ],
  outcomes: {
    summary:
      '这个案例的价值在于把一次校园活动变成了可描述、可接手、可复用的协作机制。它让主案有了明确主线，也让支持性工作不再散落在聊天记录里。',
    reflections: [
      '协作的关键不是增加更多动作，而是减少角色之间对同一件事的不同理解。',
      '页面和文档都应该支持“接手”而不是只支持“展示”。',
      '把复盘做成模板，能显著降低下一次项目启动的阻力。',
    ],
    capabilities: [
      '项目机制拆解',
      '跨角色协作对齐',
      '校园场景信息结构化',
      '复盘与模板沉淀',
    ],
  },
}
