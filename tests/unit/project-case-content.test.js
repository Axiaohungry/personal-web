import test from 'node:test'
import assert from 'node:assert/strict'

import { approvalMapWorkflowCase } from '../../src/data/projectCases/approvalMapWorkflow.js'
import { campusCollaborationCase } from '../../src/data/projectCases/campusCollaboration.js'
import { fitnessCoachingCase } from '../../src/data/projectCases/fitnessCoaching.js'

function assertSection(section, expected) {
  assert.equal(typeof section, 'object')
  assert.equal(section.eyebrow, expected.eyebrow)
  assert.equal(section.title, expected.title)
  assert.equal(section.intro, expected.intro)

  if (expected.extra) {
    for (const [key, value] of Object.entries(expected.extra)) {
      assert.equal(section[key], value)
    }
  }
}

function assertSharedCaseContract(page) {
  assert.equal(typeof page.route, 'string')
  assert.equal(typeof page.title, 'string')
  assert.equal(typeof page.subtitle, 'string')
  assert.equal(typeof page.hero?.title, 'string')
  assert.equal(typeof page.hero?.summary, 'string')
  assert.equal(page.hero?.signals.length, 3)
  assert.deepEqual(page.process.map((item) => item.key), ['discover', 'structure', 'collaboration', 'execution'])

  for (const item of page.process) {
    assert.equal(typeof item.key, 'string')
    assert.equal(typeof item.title, 'string')
    assert.equal(typeof item.description, 'string')
  }

  for (const signal of page.hero.signals) {
    assert.equal(typeof signal.label, 'string')
    assert.equal(typeof signal.value, 'string')
  }

  assert.ok(page.outcomes.capabilities.length >= 3)
  for (const capability of page.outcomes.capabilities) {
    assert.equal(typeof capability, 'string')
  }

  assert.ok(page.evidence.length >= 2)
  for (const item of page.evidence) {
    assert.equal(typeof item.title, 'string')
    assert.equal(typeof item.src, 'string')
    assert.equal(typeof item.note, 'string')
    assert.ok(typeof item.detail === 'string' || typeof item.caption === 'string')
  }
}

for (const page of [approvalMapWorkflowCase, campusCollaborationCase, fitnessCoachingCase]) {
  test(`${page.slug} exposes the shared case-study contract`, () => {
    assertSharedCaseContract(page)
  })
}

test('approval case exposes explicit section metadata', () => {
  assert.deepEqual(approvalMapWorkflowCase.complexity, [
    '审批对象、空间要素和表单字段必须对得上，不然页面再完整也只是表面整齐。',
    '地图交互、状态流转和权限控制彼此牵连，不能用一排按钮硬拆。',
    '结果类数据只能按近似口径表达，边界要先说清楚，免得页面看起来像仪表盘。',
    '这个页面既要帮人理解业务，也要方便实施交付，叙事不能只偏一边。',
  ])
  assert.deepEqual(approvalMapWorkflowCase.responsibilities, [
    '先把审批节点、表单字段和地图要素的对应关系理顺。',
    '把地图、表单、流程和结果拆成能单独阅读的区块。',
    '统一产品、实施和业务的审批口径，避免页面说的是一套，落地又是另一套。',
    '补上状态回写、空态提示和后续扩展预留。',
  ])
  assertSection(approvalMapWorkflowCase.difficultySection, {
    eyebrow: '复杂度',
    title: '这个页面为什么不能一口气讲完',
    intro: '审批地图最难的不是把图画出来，而是把对象、表单和状态放进同一条可交付的逻辑里。',
  })
  assertSection(approvalMapWorkflowCase.responsibilitySection, {
    eyebrow: '职责',
    title: '我在这个案例里负责什么',
    intro: '我负责的不是把功能堆满，而是把跨角色的理解收成一套能落地的页面结构。',
  })
  assertSection(approvalMapWorkflowCase.processSection, {
    eyebrow: '流程',
    title: '四步工作法',
    intro: '从发现问题到交付结果，页面沿着同一条阅读路径展开。',
    extra: {
      stepLabelPrefix: '步骤',
      stepLabelSuffix: '',
    },
  })
  assertSection(approvalMapWorkflowCase.evidenceSection, {
    eyebrow: '证据',
    title: '可替换的公开证据',
    intro: '先把叙事位立住，后续再平滑替换成真实裁切图。',
  })
  assertSection(approvalMapWorkflowCase.outcomesSection, {
    eyebrow: '结果',
    title: '我希望招聘方读到什么',
    intro: '这不是功能堆叠，而是交付边界、语义统一和扩展空间是否站得住。',
  })
  assert.equal(
    approvalMapWorkflowCase.outcomes.summary,
    '这条工作流的价值不在于把页面做满，而在于让审批映射、状态回写和结果说明真的能被接手。',
  )
  assert.equal(
    approvalMapWorkflowCase.outcomes.reflections[0],
    '最关键的不是视觉元素本身，而是让审批对象、表单和结果有同一套语义。',
  )
})

test('campus case exposes organizer-oriented section metadata', () => {
  assert.equal(campusCollaborationCase.leadCase.title, '“活力柚子”篮球新生杯')
  assertSection(campusCollaborationCase.positioningSection, {
    eyebrow: '定位',
    title: '为什么这不是“办活动”',
    intro: '校园项目最容易被看成一次性事件，但真正该留下的是组织方式。',
  })
  assertSection(campusCollaborationCase.complexitySection, {
    eyebrow: '复杂度',
    title: '为什么这场校园活动不能只按一次活动来理解',
    intro: '表面上是一场活动，实际牵涉报名、筛选、物料、场地、传播和复盘六条并行链路。',
  })
  assertSection(campusCollaborationCase.leadCaseSection, {
    eyebrow: '主案',
    title: '主案例怎么把机制跑起来',
    intro: '主案不是单独的一场活动，而是把协作节奏跑顺的那条线。',
    extra: {
      methodLabel: '主线方法',
      perspectiveLabel: '页面视角',
    },
  })
  assert.equal(
    campusCollaborationCase.leadCaseSection.perspectiveCopy,
    '我希望招聘方看到的不是“做过一场比赛”，而是我能把多人协作拆成清楚的步骤、角色和产物，并在结束后继续把经验变成可复用的资产。',
  )
  assert.equal(
    campusCollaborationCase.leadCase.summary,
    '以篮球新生杯为主线，我把报名收口、角色分工、赛程同步、现场执行和赛后复盘放进同一套节奏里，尽量让这场校园活动像一个项目，而不是一串临时动作。',
  )
  assert.deepEqual(
    campusCollaborationCase.supportingCases.map((item) => item.summary),
    [
      '把报名信息、分组规则和通知时间统一管理，减少重复追问和漏发。',
      '把赛程、签到、物料和场地安排对齐到同一个执行视图里。',
      '把执行问题、观察结论和下一轮优化点整理成可复用清单。',
    ],
  )
  assertSection(campusCollaborationCase.processSection, {
    eyebrow: '机制',
    title: '协作机制怎么跑起来',
    intro: '从发现边界到沉淀复用，四步把一个校园项目从现场型工作变成可交付机制。',
    extra: {
      stepLabelPrefix: '第',
      stepLabelSuffix: '步',
    },
  })
  assertSection(campusCollaborationCase.supportingSection, {
    eyebrow: '支撑案例',
    title: '支持主案的协作证明',
    intro: '这些不是附带照片，而是验证协作机制是否真的跑通的三个侧面。',
  })
  assertSection(campusCollaborationCase.evidenceSection, {
    eyebrow: '证据',
    title: '公开可替换的证据材料',
    intro: '证据区保留了后续替换真实素材的空间，方便把现在的占位图换成最终版本。',
  })
  assertSection(campusCollaborationCase.outcomesSection, {
    eyebrow: '结果',
    title: '结果、反思与可迁移能力',
    intro: '项目真正留下来的，不是热闹本身，而是下次还能直接复用的组织方法。',
  })
  assert.equal(
    campusCollaborationCase.outcomes.summary,
    '这个案例的价值在于把一次校园活动变成了可描述、可接手、可复用的协作机制。它让主案有了明确主线，也让支持性工作不再散落在聊天记录里。',
  )
  assert.equal(
    campusCollaborationCase.outcomes.reflections[0],
    '协作的关键不是增加更多动作，而是减少角色之间对同一件事的不同理解。',
  )
  assert.ok(Array.isArray(campusCollaborationCase.supportingCases))
  assert.ok(campusCollaborationCase.supportingCases.length >= 2)
  for (const item of campusCollaborationCase.supportingCases) {
    assert.equal(typeof item.title, 'string')
    assert.equal(typeof item.detail, 'string')
  }
})

test('approval case preserves the approximate-result disclaimer', () => {
  assert.ok(approvalMapWorkflowCase.outcomes.disclaimer.includes('近似估算'))
  assert.ok(approvalMapWorkflowCase.outcomes.disclaimer.includes('不是可视化仪表盘指标'))
})

test('fitness case exposes calm service-section metadata and a bridge CTA', () => {
  assert.deepEqual(fitnessCoachingCase.userProblems, [
    '训练计划经常散在聊天记录里，用户很难判断自己执行的是哪一版。',
    '交付节奏依赖临时沟通，计划更新、提醒和回收信息容易丢上下文。',
    '复盘材料和执行记录分开，续费判断只能靠印象，缺少稳定依据。',
    '电脑和手机都要能看，表单输入、结果查看和后续提醒都不能太费力。',
  ])
  assertSection(fitnessCoachingCase.problemSection, {
    eyebrow: '问题',
    title: '为什么这页要像服务台，而不是课程海报',
    intro: '健身服务最容易散掉的，不是动作本身，而是版本、提醒和复盘没有被放在同一条路上。',
  })
  assertSection(fitnessCoachingCase.processSection, {
    eyebrow: '流程',
    title: '四步服务循环',
    intro: '我把这页整理成一条固定回路：先建档，再拆计划，随后跟踪执行，最后把复盘写回服务本身。',
    extra: {
      stepLabelPrefix: '第',
      stepLabelSuffix: '步',
    },
  })
  assertSection(fitnessCoachingCase.evidenceSection, {
    eyebrow: '证据',
    title: '公开可替换的服务材料',
    intro: '先把流程、计划和跟踪的叙事位置固定下来，后续可以平滑替换成真实素材。',
  })
  assertSection(fitnessCoachingCase.outcomesSection, {
    eyebrow: '结果',
    title: '这页最后想留下什么',
    intro: '这不是一次性展示，而是一个能持续服务、持续跟进、持续迭代的工作方法。',
  })
  assert.equal(
    fitnessCoachingCase.outcomes.summary,
    '这页的重点不是把视觉做满，而是把健身服务做成可持续交付的方法。它既能帮助用户理解下一步怎么做，也能让教练在计划、跟踪和复盘之间保持稳定节奏，形成更可靠的服务感。',
  )
  assert.equal(
    fitnessCoachingCase.outcomes.reflections[0],
    '服务最重要的不是热闹感，而是让节奏和版本始终清楚。',
  )
  assertSection(fitnessCoachingCase.bridgeSection, {
    eyebrow: '桥接',
    title: '从案例页回到健身工作台',
    intro: '如果你想先看实际工具，可以直接去健身工作台。',
  })
  assert.equal(fitnessCoachingCase.bridgeSection.copy, '这页讲的是方法，健身工作台讲的是落地体验。两者保持同一套气质，但一个负责说明思路，一个负责真正使用。')
  assert.equal(fitnessCoachingCase.bridgeCta?.href, '/fitness/')
  assert.equal(typeof fitnessCoachingCase.bridgeCta?.label, 'string')
})
