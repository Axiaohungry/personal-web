export const approvalMapWorkflowCase = {
  slug: 'approval-map-workflow',
  route: '/projects/approval-map-workflow',
  title: '审批地图工作流',
  subtitle: '把审批对象、页面信息和结果反馈整理成一套能交付的产品体验。',
  hero: {
    eyebrow: '项目案例',
    title: '审批地图不是多放一张图，而是把审批流程讲清、用顺、接得住。',
    subtitle: '围绕审批对象、表单填写、权限判断和结果同步，重新组织信息体验。',
    summary:
      '我没有把它做成一张演示地图，而是把审批对象、表单填写和结果反馈放进同一条体验路径。这样业务方更快看懂自己在处理什么，实施知道页面怎么接，最终用户也知道下一步该做什么。',
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
    intro: '审批地图最难的不是把图画出来，而是把对象、表单和结果反馈放进同一条能交付的体验里。',
  },
  complexity: [
    '审批对象、空间信息和表单内容必须一一对应，不然页面再完整，用户也会越看越乱。',
    '地图交互、流程进度和权限判断彼此牵动，不能靠堆按钮硬拼。',
    '结果类数字只能做谨慎估算，表达必须克制，避免把案例页写成“看起来很热闹”的仪表盘。',
    '这页既要帮助业务沟通，也要支撑实施落地，叙事和结构都得兼顾。',
  ],
  responsibilitySection: {
    eyebrow: '职责',
    title: '我在这个案例里负责什么',
    intro: '我负责的不是把功能塞满，而是把多方认知整理成一套能上线、能交付、也能继续扩展的页面结构。',
  },
  responsibilities: [
    '梳理审批节点、表单内容和地图对象之间的对应关系。',
    '把地图、表单、流程和结果拆成清楚的阅读层次。',
    '统一业务理解、产品表达和实施方案，减少“页面说一套，交付做一套”。',
    '补齐结果反馈、空状态提示和后续扩展位置。',
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
      description: '先看清审批对象、角色分工和异常场景，确认页面到底要帮谁解决什么问题。',
    },
    {
      key: 'structure',
      title: '结构',
      description: '把地图、表单、流程和结果整理成一套更顺的产品结构，减少来回切换。',
    },
    {
      key: 'collaboration',
      title: '协作',
      description: '用同一套表达方式和业务、产品、实施对齐，避免“大家都懂一点，但没人能真正推进”。',
    },
    {
      key: 'execution',
      title: '执行',
      description: '把联动逻辑、结果反馈和交付材料做成可上线页面，并预留后续替换空间。',
    },
  ],
  evidenceSection: {
    eyebrow: '证据',
    title: '公开证据位',
    intro: '先把关键信息位定下来，后续可以平滑替换成真实素材。',
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
    title: '我希望招聘方看到什么',
    intro: '我想让人看到的，不是页面堆了多少信息，而是我能不能把复杂流程整理成可交付、可接手、可扩展的产品。',
  },
  outcomes: {
    summary:
      '这个案例真正的价值，不是页面做得多满，而是把审批理解、结果反馈和交付方式整理成一套接得住的产品方案。',
    disclaimer: '页面中的百分比和效率改善均为近似估算，不是可视化仪表盘指标。',
    reflections: [
      '最关键的不是多做几个模块，而是让审批对象、表单信息和结果反馈说同一种语言。',
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
