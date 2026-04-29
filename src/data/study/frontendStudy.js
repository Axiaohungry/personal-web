export const frontendStudyCategories = [
  {
    key: 'fundamentals',
    label: '基础总览',
    title: '把底层原理和项目经验放在同一张学习地图上',
    href: '/study/frontend/fundamentals/',
    summary: '按知识块整理概念、面试说法和项目映射，方便持续复习。',
  },
  {
    key: 'interview',
    label: '面试表达',
    title: '把“知道”整理成“能说清楚”',
    href: '/study/frontend/interview/',
    summary: '沉淀常见问法、回答骨架和高频追问，强化表达稳定性。',
  },
  {
    key: 'coding',
    label: '编码训练',
    title: '把知识点转回动手能力',
    href: '/study/frontend/coding/',
    summary: '用小题、组件练习和 API 设计题巩固基础与实现手感。',
  },
]

export const frontendStudySections = {
  fundamentals: [
    {
      key: 'javascript-core',
      title: 'JavaScript 基础',
      conceptBlocks: [
        {
          title: '语言机制',
          points: [
            '作用域、闭包、原型链和 this 绑定需要能连成一条解释链。',
            '异步模型要同时理解事件循环、微任务和错误传播。',
          ],
        },
        {
          title: '数据与状态',
          points: [
            '值与引用、不可变更新和对象拷贝是组件状态稳定性的基础。',
            '数组与对象的常见变换要能直接映射到真实页面交互。',
          ],
        },
      ],
      interviewTakeaways: [
        '回答时先给结论，再补运行机制，最后举一个项目里的真实例子。',
        '涉及异步或闭包题时，优先描述执行顺序和为什么会这样。',
      ],
      projectExamples: [
        '在健身工具里用表单状态拆分和衍生计算避免联动逻辑失控。',
        '在案例页交互里区分即时输入状态和提交后状态，减少副作用混乱。',
      ],
    },
    {
      key: 'browser-network',
      title: '浏览器与网络',
      conceptBlocks: [
        {
          title: '页面渲染',
          points: [
            '理解从 HTML 解析到 CSSOM、渲染树、布局和绘制的关键链路。',
            '性能问题优先从阻塞资源、重排重绘和资源体积三个方向定位。',
          ],
        },
        {
          title: '请求与缓存',
          points: [
            '把 HTTP 缓存、状态码、跨域和鉴权流程放在同一张图里理解。',
            '知道什么时候适合前端缓存，什么时候要交给服务端或 CDN。',
          ],
        },
      ],
      interviewTakeaways: [
        '面试里优先说明“用户会感知到什么问题”，再讲技术细节。',
        '缓存题要能说出强缓存、协商缓存和实际发布策略之间的关系。',
      ],
      projectExamples: [
        '把静态资源拆分和按路由加载结合起来，缩短首页可交互时间。',
        '为工具页规划稳定的数据请求和回退状态，保证移动端网络波动下也可用。',
      ],
    },
    {
      key: 'engineering-vue',
      title: '工程化与 Vue 实战',
      conceptBlocks: [
        {
          title: '组件设计',
          points: [
            '组件边界要围绕职责、复用性和数据流，而不是围绕视觉切片。',
            '可维护的组件需要稳定的 props 语义、明确的状态归属和可预测的渲染。',
          ],
        },
        {
          title: '工程质量',
          points: [
            '路由、构建、测试和数据模块的组织方式决定后续扩展成本。',
            '数据结构先稳定，再做页面壳层，能减少后续联调反复。',
          ],
        },
      ],
      interviewTakeaways: [
        '描述工程化经验时，重点讲你如何降低维护成本和沟通成本。',
        'Vue 题不只讲 API，还要讲为什么这样拆更适合真实业务。',
      ],
      projectExamples: [
        '为 study 数据层先约定模块边界，再让页面按稳定 schema 消费。',
        '在个人站里保持内容数据和展示组件分离，降低页面迭代摩擦。',
      ],
    },
  ],
  interview: [
    {
      key: 'answer-framework',
      title: '高频问答框架',
      prompts: [
        '如何解释一次性能优化的思路和结果？',
        '如何讲清一个复杂页面的状态设计？',
        '如何把技术实现和业务目标关联起来？',
      ],
      guidance: [
        '先讲问题背景和约束，再讲取舍，最后给结果和反思。',
        '尽量把回答锚定在自己做过的页面、组件或工具上。',
      ],
    },
    {
      key: 'follow-up-bank',
      title: '追问准备',
      prompts: [
        '为什么不用更复杂的方案？',
        '如果数据量翻倍或团队扩张，原方案会怎么演进？',
        '你怎么验证这不是拍脑袋的优化？',
      ],
      guidance: [
        '准备 trade-off 解释，而不是只准备唯一正确答案。',
        '把验证方式说具体，比如监控指标、用户路径或维护成本变化。',
      ],
    },
  ],
  coding: [
    {
      key: 'component-drills',
      title: '组件练习',
      items: [
        '表单状态同步与校验',
        '卡片列表筛选与排序',
        '主题切换与持久化',
      ],
    },
    {
      key: 'algorithm-drills',
      title: '基础题感',
      items: [
        '数组去重与分组',
        '树与扁平结构互转',
        '节流、防抖与异步队列控制',
      ],
    },
  ],
}

/**
 * 按需加载前端学习的完整详情（含代码实例、面试 Q&A、手写题）。
 * @param {string} sectionKey — 'fundamentals' | 'interview' | 'coding'
 * @returns {Promise<Array>} 对应 section 的完整数据
 */
export async function loadFrontendStudyDetail(sectionKey) {
  const { frontendStudyDetail } = await import('./generated/frontendStudyDetail.js')
  return frontendStudyDetail[sectionKey] ?? null
}
