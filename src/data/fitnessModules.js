// 健身工作台里的模块会同时被前端页面、嵌入式模块容器、以及服务端助手引用。
// 这里把“模块标题 / 路由 / 推荐顺序”集中到一个注册表里，避免同一份信息散落在多个文件中。
export const fitnessModules = [
  {
    key: 'carb-cycling',
    routeName: 'fitness-carb-cycling',
    routePath: '/fitness/modules/carb-cycling',
    title: '碳循环',
    summary: '把高碳、中碳、低碳安排进训练节奏里，兼顾表现和热量控制。',
  },
  {
    key: 'carb-taper',
    routeName: 'fitness-carb-taper',
    routePath: '/fitness/modules/carb-taper',
    title: '碳水渐降',
    summary: '按阶段慢慢下调，不靠极端低碳硬撑减脂。',
  },
  {
    key: 'five-two-fasting',
    routeName: 'fitness-five-two-fasting',
    routePath: '/fitness/modules/five-two-fasting',
    title: '5+2 轻断食',
    summary: '如果你不想天天算得很紧，5 天正常吃、2 天轻一点，往往更容易坚持。',
  },
  {
    key: 'sixteen-eight-fasting',
    routeName: 'fitness-sixteen-eight-fasting',
    routePath: '/fitness/modules/sixteen-eight-fasting',
    title: '16+8 轻断食',
    summary: '把吃饭时间收得整齐一点，有时候比一味靠意志力更省心。',
  },
  {
    key: 'food-library',
    routeName: 'fitness-food-library',
    routePath: '/fitness/modules/food-library',
    title: '食物库',
    summary: '用更直观的方式看常见食物和外部食品数据。',
  },
  {
    key: 'lean-gain-calorie-logic',
    routeName: 'fitness-lean-gain-calorie-logic',
    routePath: '/fitness/modules/lean-gain-calorie-logic',
    title: '增肌底层热量逻辑',
    summary: '从 BMR、TDEE、体脂和增肌目标出发，拆出可重载的热量决策入口。',
  },
  {
    key: 'fenjue-training-system',
    routeName: 'fitness-fenjue-training-system',
    routePath: '/fitness/modules/fenjue-training-system',
    title: '谭成义焚诀训练体系',
    summary: '把原则、热身、分部位训练、风险修正和新手四周计划收成一套更容易进入的训练地图。',
  },
  {
    key: 'supplement-library',
    routeName: 'fitness-supplement-library',
    routePath: '/fitness/modules/supplement-library',
    title: '补剂库',
    summary: '把补剂、优先级、剂量和证据放到一页里看清楚。',
  },
]

// 助手推荐模块时，不只是看“有哪些模块”，还要看“在当前语境下先推哪几个”。
// 这里显式维护推荐顺序，避免服务端和前端各自写一套 if/else。
const assistantTopicModuleKeys = {
  training: ['fenjue-training-system', 'lean-gain-calorie-logic', 'food-library', 'supplement-library'],
  diet: ['lean-gain-calorie-logic', 'food-library', 'supplement-library', 'fenjue-training-system'],
  recovery: ['fenjue-training-system', 'supplement-library', 'food-library', 'lean-gain-calorie-logic'],
  supplements: ['supplement-library', 'food-library', 'lean-gain-calorie-logic', 'fenjue-training-system'],
  habits: ['fenjue-training-system', 'food-library', 'lean-gain-calorie-logic', 'supplement-library'],
  general: ['fenjue-training-system', 'food-library', 'lean-gain-calorie-logic', 'supplement-library'],
}

const fitnessModuleByKey = new Map(fitnessModules.map((module) => [module.key, module]))
const fitnessModuleByRoutePath = new Map(fitnessModules.map((module) => [module.routePath, module]))

export function getFitnessModuleByKey(key) {
  return fitnessModuleByKey.get(String(key || '')) || null
}

export function getFitnessModuleByRoutePath(routePath) {
  return fitnessModuleByRoutePath.get(String(routePath || '')) || null
}

// 工作台 Tab 只关心展示信息和跳转链接，所以这里提供一个更轻量的卡片构造器。
// `resolveHref` 留成可注入函数，方便在 Vue Router 环境里生成带 base 的 href，
// 也方便在测试里直接返回原始 path。
export function buildFitnessModuleCards(resolveHref = (routePath) => routePath) {
  return fitnessModules.map((module) => ({
    title: module.title,
    summary: module.summary,
    routePath: module.routePath,
    href: resolveHref(module.routePath),
  }))
}

export function pickFitnessModulesByAssistantTopic(topic = 'general') {
  const normalizedTopic = Object.prototype.hasOwnProperty.call(assistantTopicModuleKeys, topic)
    ? topic
    : 'general'

  return assistantTopicModuleKeys[normalizedTopic]
    .map((key) => getFitnessModuleByKey(key))
    .filter(Boolean)
}
