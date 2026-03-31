export const fitnessCoachingCase = {
  slug: 'fitness-coaching',
  route: '/projects/fitness-coaching',
  title: '健身私教顾问方案',
  subtitle: '把训练咨询整理成可持续交付的服务产品，而不是一次性建议。',
  hero: {
    title: '把私教经验产品化，让服务本身更稳定，也更容易被长期复用。',
    summary:
      '这个案例关注的是服务如何被整理成产品：从首轮咨询、训练建议、跟进反馈，到续费和长期服务，都要有清楚的结构和边界。',
    tags: ['服务产品化', '训练咨询', '长期陪跑'],
    signals: [
      { label: '付费客户', value: '5+ 位' },
      { label: '续费表现', value: '80%' },
      { label: '服务状态', value: '持续进行中' },
    ],
  },
  process: [
    {
      key: 'discover',
      title: '发现',
      description: '先了解客户目标、训练背景和限制条件，避免把通用方案直接套给所有人。',
    },
    {
      key: 'structure',
      title: '结构',
      description: '把评估、计划、执行和反馈整理成服务流程，形成稳定的交付节奏。',
    },
    {
      key: 'collaboration',
      title: '协作',
      description: '让沟通、调整和复盘都有固定入口，减少“临时问答式”服务的不确定性。',
    },
    {
      key: 'execution',
      title: '执行',
      description: '把建议真正落到训练与饮食日程里，并通过持续反馈推动长期执行。',
    },
  ],
  outcomes: {
    capabilities: [
      '把私教经验整理为可持续服务',
      '支持长期跟进和复购关系',
      '让建议更容易被执行和复盘',
    ],
    bridgeCta: {
      label: '进入健身工具',
      href: '/fitness/',
    },
  },
  evidence: [
    {
      title: '稳定客户基础',
      detail: '已经形成 5+ 位付费客户的服务记录，验证了产品化路径的可行性。',
    },
    {
      title: '续费与留存',
      detail: '续费率保持在 80% 左右，说明服务节奏和结果反馈有持续价值。',
    },
  ],
}
