export const approvalMapWorkflowCase = {
  slug: 'approval-map-workflow',
  route: '/projects/approval-map-workflow',
  title: '审批地图工作流',
  subtitle: '把审批对象、表单映射和状态回写收束成一条可交付链路。',
  hero: {
    eyebrow: '项目案例',
    title: '审批地图不是加一张图，而是把业务链路变成可交付的工作流。',
    subtitle: '围绕审批对象、表单映射、权限控制和状态回写，重做信息结构。',
    summary:
      '这个案例强调的是可交付，而不是可展示。我把空间对象、审批表单和结果回收放进同一条阅读路径，既方便招聘方判断产品思维，也方便普通用户理解下一步该怎么走。',
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
  complexity: [
    '审批对象、空间要素和表单字段必须共享一套可读的映射关系。',
    '地图交互、状态流转和权限控制之间存在强耦合，不能靠堆按钮解决。',
    '结果类数据只能做近似估算，需要明确边界，避免把展示页写成指标面板。',
    '页面必须同时服务业务理解和实施交付，叙事不能只照顾单一角色。',
  ],
  responsibilities: [
    '梳理审批节点、表单字段和地图元素之间的主键关系。',
    '把地图、表单、流程和结果拆成可独立阅读的区块。',
    '推动产品、实施和业务在同一条审批口径上对齐。',
    '落地状态回写、空态提示和后续扩展接口预留。',
  ],
  process: [
    {
      key: 'discover',
      title: '发现',
      description: '先拆开审批对象、角色、数据源和异常分支，明确页面到底在解释什么。',
    },
    {
      key: 'structure',
      title: '结构',
      description: '把地图、表单、流程和结果整理成统一信息架构，减少来回切换。',
    },
    {
      key: 'collaboration',
      title: '协作',
      description: '用同一套术语和口径对齐业务、产品与实施，避免“看懂了但做不了”。',
    },
    {
      key: 'execution',
      title: '执行',
      description: '把联动、回写和证据材料落成可交付页面，并保留可替换的资产位。',
    },
  ],
  evidence: [
    {
      title: '痛点流转图',
      src: '/projects/approval-map-workflow/painpoint-flow.png',
      detail: '把原始审批路径拆成节点、跳转和回传三层，方便快速看懂卡点。',
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
      detail: '把可验收的规则、边界和结果摘要放到同一屏，便于对齐交付标准。',
      note: '临时安全占位图，后续可替换为真实裁切图。',
    },
  ],
  outcomes: {
    summary:
      '这条工作流的价值不在于把界面做满，而在于把审批映射、状态回写与结果说明压成一页能沟通、能交付、能扩展的结构。',
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
