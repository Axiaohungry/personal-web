export const approvalMapWorkflowCase = {
  slug: 'approval-map-workflow',
  route: '/projects/approval-map-workflow',
  title: '政务审批地图工作流',
  subtitle: '把地图、表单和审批流收束到一条可执行、可追踪的业务链路里。',
  hero: {
    title: '政务审批不是“看图”，而是把空间信息真正变成可办事项。',
    summary:
      '这个案例围绕政务审批中的地图工作流展开，重点是把 MapGIS WebClient、GeoJSON 和审批流串成一套能落地的闭环，让业务人员能看懂，实施人员能交付，后续也方便继续扩展。',
    tags: ['MapGIS WebClient', 'GeoJSON', '审批流'],
    signals: [
      { label: '业务对象', value: '审批要素与空间图层联动' },
      { label: '实现方式', value: 'MapGIS WebClient + GeoJSON' },
      { label: '交付目标', value: '从原型到可运行闭环' },
    ],
  },
  process: [
    {
      key: 'discover',
      title: '发现',
      description: '梳理审批对象、角色关系、地图图层和审批节点，先把问题边界说清楚。',
    },
    {
      key: 'structure',
      title: '结构',
      description: '把空间数据、表单字段、状态迁移和权限控制组织成统一的信息结构。',
    },
    {
      key: 'collaboration',
      title: '协作',
      description: '让产品、实施和业务方在同一套流程语言里对齐，减少来回解释成本。',
    },
    {
      key: 'execution',
      title: '执行',
      description: '落到页面交互、数据流转和审批反馈，确保每一步都能被操作和追踪。',
    },
  ],
  outcomes: {
    capabilities: [
      '审批节点与地图要素的联动展示',
      'GeoJSON 驱动的业务空间表达',
      '状态变化与流转结果的清晰反馈',
    ],
    disclaimer: '页面中的百分比结果均为近似估算，不是可视化仪表盘指标。',
  },
  evidence: [
    {
      title: '图层和表单同步',
      detail: '把地图上的空间对象和审批表单绑定，减少审批时的上下文切换。',
    },
    {
      title: '状态链路可追踪',
      detail: '每次审批动作都会反映到可读的流程节点里，便于回溯和复盘。',
    },
  ],
}
