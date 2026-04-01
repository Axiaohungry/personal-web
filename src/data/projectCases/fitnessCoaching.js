export const fitnessCoachingCase = {
  slug: 'fitness-coaching',
  route: '/projects/fitness-coaching',
  title: '健身教练服务页',
  subtitle: '把咨询、计划、跟踪和复盘收拢成一条安静而稳定的服务循环。',
  hero: {
    eyebrow: '健身服务案例',
    title: '把健身教练服务做成可持续交付的工作台。',
    subtitle: '围绕咨询、计划、执行、复盘，整理出一条更清楚的服务路径。',
    summary:
      '这个案例不想强调训练花样，而是把 5 位付费客户的持续服务收成一条更安静的路径。咨询、计划、跟踪和复盘都放在同一页里，用户知道下一步怎么做，教练也能稳定推进。',
    tags: ['私教服务产品化', '持续跟进', '复盘迭代', '双端可用'],
    signals: [
      { label: '付费客户', value: '5 位' },
      { label: '续费率', value: '80%' },
      { label: '服务状态', value: '持续进行中' },
    ],
  },
  problemSection: {
    eyebrow: '问题',
    title: '为什么这页要像服务台，而不是课程海报',
    intro: '健身服务最容易散掉的，不是动作本身，而是版本、提醒和复盘没有被放在同一条路上。',
  },
  userProblems: [
    '训练计划经常散在聊天记录里，用户很难判断自己执行的是哪一版。',
    '交付节奏依赖临时沟通，计划更新、提醒和回收信息容易丢上下文。',
    '复盘材料和执行记录分开，续费判断只能靠印象，缺少稳定依据。',
    '电脑和手机都要能看，表单输入、结果查看和后续提醒都不能太费力。',
  ],
  processSection: {
    eyebrow: '流程',
    title: '四步服务循环',
    intro: '我把这页整理成一条固定回路：先建档，再拆计划，随后跟踪执行，最后把复盘写回服务本身。',
    stepLabelPrefix: '第',
    stepLabelSuffix: '步',
  },
  process: [
    {
      key: 'discover',
      title: '初访建档',
      description: '先明确目标、限制条件和可投入时间，再把客户情况整理成能持续使用的基础档案。',
    },
    {
      key: 'structure',
      title: '拆成周计划',
      description: '把训练目标拆成每周可执行的动作、提醒和注意事项，避免计划停留在一次性的建议。',
    },
    {
      key: 'collaboration',
      title: '跟踪执行',
      description: '持续收集完成情况、体感和反馈，让教练能在同一套记录里判断偏差，而不是靠零散消息补课。',
    },
    {
      key: 'execution',
      title: '复盘迭代',
      description: '把阶段结果、调整理由和下一轮建议写回页面，让服务本身越做越稳，而不是每次都重来。',
    },
  ],
  evidenceSection: {
    eyebrow: '证据',
    title: '公开可替换的服务材料',
    intro: '先把流程、计划和跟踪的叙事位置固定下来，后续可以平滑替换成真实素材。',
  },
  evidence: [
    {
      title: '服务流程图',
      src: '/projects/fitness-coaching/service-flow.png',
      detail: '把咨询、计划、执行和复盘串成一条固定回路，服务逻辑一眼就能看懂。',
      note: '匿名安全占位图，后续可替换为真实服务流程素材。',
    },
    {
      title: '计划片段',
      src: '/projects/fitness-coaching/plan-fragment.png',
      detail: '用一页计划片段说明目标、动作安排和提醒，减少计划版本散落在聊天记录里的问题。',
      note: '匿名安全占位图，后续可替换为真实计划片段。',
    },
    {
      title: '跟踪片段',
      src: '/projects/fitness-coaching/tracking-fragment.png',
      detail: '把执行情况、体感和下一步调整放到同一页，方便持续跟进和判断续费节奏。',
      note: '匿名安全占位图，后续可替换为真实跟踪片段。',
    },
  ],
  outcomesSection: {
    eyebrow: '结果',
    title: '这页最后想留下什么',
    intro: '这不是一次性展示，而是一个能持续服务、持续跟进、持续迭代的工作方法。',
  },
  outcomes: {
    summary:
      '这页的重点不是把视觉做满，而是把健身服务做成可持续交付的方法。它既能帮助用户理解下一步怎么做，也能让教练在计划、跟踪和复盘之间保持稳定节奏，形成更可靠的服务感。',
    reflections: [
      '服务最重要的不是热闹感，而是让节奏和版本始终清楚。',
      '把计划、执行和复盘分开，才能持续迭代而不丢上下文。',
      '双端体验要同样克制，手机上也必须能快速看完并完成输入。',
    ],
    capabilities: ['服务产品化', '持续跟进', '复盘机制', '双端阅读'],
  },
  bridgeSection: {
    eyebrow: '桥接',
    title: '从案例页回到健身工作台',
    intro: '如果你想先看实际工具，可以直接去健身工作台。',
    copy:
      '这页讲的是方法，健身工作台讲的是落地体验。两者保持同一套气质，但一个负责说明思路，一个负责真正使用。',
  },
  bridgeCta: {
    label: '去健身工作台看看',
    href: '/fitness/',
  },
}
