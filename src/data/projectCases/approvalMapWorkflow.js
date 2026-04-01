export const approvalMapWorkflowCase = {
  slug: 'approval-map-workflow',
  route: '/projects/approval-map-workflow',
  title: '审批地图工作流',
  subtitle: '把审批对象、表单映射和状态回写收成一条能交付的链路。',
  hero: {
    eyebrow: '项目案例',
    title: '审批地图不是再加一张图，而是把审批链路做成能交付的工作流。',
    subtitle: '围绕审批对象、表单映射、权限控制和状态回写，重新整理信息结构。',
    summary:
      '我没有把它写成演示页，而是把空间对象、审批表单和结果回写放进同一条阅读路径。这样业务方能看懂自己在审批什么，实施能知道页面该怎么接，普通用户也能顺着走到下一步。',
    tags: ['MapGIS WebClient', 'GeoJSON', '审批流程', '空间业务'],
    signals: [
      {
        label: '流程收敛',
        value: '审批步骤 -30%（近似）',
      },
      {
        label: '切换减负',
        value: '来回切换 -40%（近似）',
      },
      {
        label: '回写聚合',
        value: '状态回写收束为 1 个工作区（近似）',
      },
    ],
  },
  difficultySection: {
    eyebrow: '复杂度',
    title: '这个页面为什么不能一口气讲完',
    intro: '审批地图最难的不是把图画出来，而是把对象、表单和状态放进同一条可交付的逻辑里。',
  },
  complexity: [
    '审批对象、空间要素和表单字段必须对得上，不然页面再完整也只是表面整齐。',
    '地图交互、状态流转和权限控制彼此牵连，不能用一排按钮硬拆。',
    '结果类数据只能按近似口径表达，边界要先说清楚，免得页面看起来像仪表盘。',
    '这个页面既要帮人理解业务，也要方便实施交付，叙事不能只偏一边。',
  ],
  responsibilitySection: {
    eyebrow: '职责',
    title: '我在这个案例里负责什么',
    intro: '我负责的不是把功能堆满，而是把跨角色的理解收成一套能落地的页面结构。',
  },
  responsibilities: [
    '先把审批节点、表单字段和地图要素的对应关系理顺。',
    '把地图、表单、流程和结果拆成能单独阅读的区块。',
    '统一产品、实施和业务的审批口径，避免页面说的是一套，落地又是另一套。',
    '补上状态回写、空态提示和后续扩展预留。',
  ],
  processSection: {
    eyebrow: '流程',
    title: '四步工作法',
    intro: '从发现问题到交付结果，页面沿着同一条阅读路径展开。',
    stepLabelPrefix: '步骤',
    stepLabelSuffix: '',
  },
  process: [
    {
      key: 'discover',
      title: '发现',
      description: '先拆清审批对象、角色、数据源和异常分支，确认页面到底在解释什么。',
    },
    {
      key: 'structure',
      title: '结构',
      description: '把地图、表单、流程和结果整理成统一的信息架构，减少来回切换。',
    },
    {
      key: 'collaboration',
      title: '协作',
      description: '用同一套术语对齐业务、产品和实施，避免“看懂了但做不了”。',
    },
    {
      key: 'execution',
      title: '执行',
      description: '把联动、回写和证据材料落成可交付页面，并保留可替换的资产位。',
    },
  ],
  evidenceSection: {
    eyebrow: '证据',
    title: '可替换的公开证据',
    intro: '先把叙事位立住，后续再平滑替换成真实裁切图。',
  },
  evidence: [
    {
      title: '痛点流转图',
      src: '/projects/approval-map-workflow/painpoint-flow.png',
      detail: '把原始审批路径拆成节点、跳转和回传三层，先让人一眼看懂卡点。',
      note: '临时安全占位图，后续可替换为真实裁切图。',
    },
    {
      title: '表单-地图统一界面',
      src: '/projects/approval-map-workflow/form-map-unified-ui.png',
      detail: '把地图视图和审批表单并排组织，减少来回切换和上下文丢失。',
      note: '临时安全占位图，后续可替换为真实裁切图。',
    },
    {
      title: '验收片段',
      src: '/projects/approval-map-workflow/acceptance-fragment.png',
      detail: '把可验收的规则、边界和结果摘要放到同一屏，方便对齐交付标准。',
      note: '临时安全占位图，后续可替换为真实裁切图。',
    },
  ],
  outcomesSection: {
    eyebrow: '结果',
    title: '我希望招聘方读到什么',
    intro: '这不是功能堆叠，而是交付边界、语义统一和扩展空间是否站得住。',
  },
  outcomes: {
    summary:
      '这条工作流的价值不在于把页面做满，而在于让审批映射、状态回写和结果说明真的能被接手。',
    disclaimer: '页面中的百分比和效率改善均为近似估算，不是可视化仪表盘指标。',
    reflections: [
      '最关键的不是视觉元素本身，而是让审批对象、表单和结果有同一套语义。',
      '结果类数字保留近似估算的表达，避免把案例页写成仪表盘。',
      '把证据资产单独拆出来后，后续替换真实截图的成本会很低。',
    ],
    capabilities: [
      '审批节点与地图对象的联动展示',
      '表单映射与状态回写的统一阅读',
      '近似估算结果的明确边界说明',
      '面向实施交付的流程拆解与回收',
    ],
  },
}
