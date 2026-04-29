// 前端系统学习 — 完整数据（按需加载）
// 来源：docs/jd-study/07-frontend-systematic-study-plan.md
// 结构：3 周 → 天数 → 知识块，包含代码实例、大白话解析、面试 Q&A、手写题

export const frontendStudyDetail = {
  fundamentals: [
    {
      key: 'javascript-core',
      title: 'JavaScript 基础',
      dayRange: 'Day 1-2',
      conceptBlocks: [
        {
          title: '作用域链与闭包',
          points: [
            '闭包是指一个函数能够记住并访问它被创建时的词法作用域，即使外层函数已经执行完毕。',
            '作用域链是 JavaScript 引擎在当前作用域找不到变量时，向外层作用域逐级查找的机制。',
          ],
          codeExample: {
            language: 'javascript',
            caption: '项目实例：storage.js 中的闭包',
            code: `export function createStorageApi(storage = globalThis.localStorage) {
  return {
    loadLatest() {
      // 【闭包】：storage 来自外层函数，
      // 即使 createStorageApi 执行完毕，这里仍能访问。
      return parseJson(storage.getItem(LATEST_KEY), null)
    },
    saveLatest(payload) {
      storage.setItem(LATEST_KEY, JSON.stringify(payload))
    }
  }
}`,
          },
          plainExplanation: '闭包就像一个"背包"。当函数诞生时，它把外面的变量装进背包里。以后不管拿到哪里执行，拉开背包就能找到。这样做到了数据的私有化。',
        },
        {
          title: '纯函数',
          points: [
            '纯函数是指给定相同的输入，永远返回相同的输出，且在执行过程中不产生任何副作用。',
            '不修改外部变量，不操作 DOM，最容易写单元测试，也最不容易出 Bug。',
          ],
          codeExample: {
            language: 'javascript',
            caption: '项目实例：tdee.js 中的纯函数',
            code: `export function calculateTdee(input) {
  const bmr = calculateBmr(input)
  const stepCalories = calculateStepCalories(input)
  const occupationCalories = calculateOccupationCalories(input.occupation)
  return {
    bmr,
    stepCalories,
    occupationCalories,
    tdee: Math.round(bmr + stepCalories + occupationCalories)
  }
}`,
          },
          plainExplanation: '纯函数就像一台"无情的榨汁机"。只要塞进去的是同样的苹果，榨出来的永远是同一种苹果汁。它不会偷喝你杯子里的水（不修改全局变量），也不会弄脏厨房台面（不操作 DOM）。',
        },
        {
          title: '事件循环与异步',
          points: [
            'JavaScript 是单线程的。事件循环负责协调同步代码、微任务（Promise.then）和宏任务（setTimeout）。',
            'async/await 让异步代码看起来像同步代码的语法糖。',
          ],
          codeExample: {
            language: 'javascript',
            caption: '项目实例：AiNewsBrief.vue 中的竞态控制',
            code: `async function loadBrief() {
  const requestId = ++requestSequence.value
  loading.value = true
  try {
    const response = await fetch('/api/ai/news-brief', {
      headers: { Accept: 'application/json' }
    })
    // 【竞态控制】序号不匹配则丢弃过期结果
    if (requestId !== requestSequence.value) return
    if (!response.ok) throw new Error('Request failed.')
    const payload = await response.json()
    stories.value = payload.stories.slice(0, 3)
  } catch {
    error.value = '暂时无法加载最新动态，请稍后再试。'
  } finally {
    if (requestId === requestSequence.value) loading.value = false
  }
}`,
          },
          plainExplanation: 'await 就像点外卖。点完不会傻站着等（不阻塞线程），外卖到了再继续。requestId 则防止旧外卖比新外卖还晚到的竞态问题。',
        },
        {
          title: '深浅拷贝与数据清洗',
          points: [
            '浅拷贝只复制对象第一层属性，嵌套对象依然共享引用；深拷贝递归复制所有层级。',
            '数据清洗是在使用数据前将其兜底和格式化，防止 null/undefined 导致崩溃。',
          ],
          codeExample: {
            language: 'javascript',
            caption: '项目实例：FitnessView.vue 中的数据清洗',
            code: `function normalizeLatest(latest) {
  const safeLatest = latest && typeof latest === 'object' ? latest : {}
  return {
    sex: safeLatest.sex || defaultForm.sex,
    age: coerceNumber(safeLatest.age, defaultForm.age),
    heightCm: coerceNumber(safeLatest.heightCm, defaultForm.heightCm),
    weightKg: coerceNumber(safeLatest.weightKg, defaultForm.weightKg)
  }
}`,
          },
          plainExplanation: '"永远不要相信外部传来的数据"。数据清洗就像安检门，不管外面塞进来的对象有多脏，经过这个函数后都会变成带有默认值、类型安全的干净对象。',
        },
      ],
      interviewTakeaways: [
        '回答时先给结论，再补运行机制，最后举一个项目里的真实例子。',
        '涉及异步或闭包题时，优先描述执行顺序和为什么会这样。',
      ],
      interviewQA: [
        {
          question: '什么是闭包？在你的项目中哪里用到了？',
          answer: [
            {
              label: '结论',
              text: '闭包是函数在创建时记住外层词法作用域，并且在外层函数执行结束后仍然能访问这些变量的机制。',
            },
            {
              label: '机制',
              text: 'JavaScript 按词法作用域查找变量，内部函数会保留对外层环境的引用。它常用于封装私有状态、做工厂函数、保存异步回调里的上下文。',
            },
            {
              label: '项目例子',
              text: '在 createStorageApi(storage) 中，loadLatest 和 saveLatest 都不是直接操作全局 localStorage，而是通过闭包持续引用外层传入的 storage。这样测试时可以注入假的 storage，页面运行时再使用真实存储。',
            },
            {
              label: '追问准备',
              bullets: [
                '闭包不是“函数嵌套”本身，而是内部函数能访问外层作用域。',
                '风险是长期引用大对象可能造成内存不能及时释放，所以要避免无意义地持有 DOM 或大型数据。',
              ],
            },
          ],
        },
        {
          question: 'Event Loop 的运行机制是什么？',
          answer: [
            {
              label: '结论',
              text: 'Event Loop 是浏览器协调同步代码、微任务、宏任务和渲染更新的调度机制，用来让单线程 JavaScript 处理异步任务。',
            },
            {
              label: '机制',
              text: '一轮执行通常是先清空调用栈里的同步代码，再清空微任务队列，例如 Promise.then；随后取一个宏任务，例如 setTimeout 或网络回调，再进入下一轮。',
            },
            {
              label: '项目例子',
              text: 'AiNewsBrief.vue 的 loadBrief 使用 await 等待 fetch。await 后面的代码会在异步结果回来后继续执行，期间页面不会被阻塞，loading、error 和 stories 都能按状态变化重新渲染。',
            },
            {
              label: '追问准备',
              bullets: [
                'Promise.then 属于微任务，setTimeout 属于宏任务。',
                'async/await 是 Promise 的语法糖，不能把异步代码变成真正的同步阻塞。',
              ],
            },
          ],
        },
        {
          question: '如何解决前端竞态问题？',
          answer: [
            {
              label: '结论',
              text: '竞态问题的核心是“后发起的操作应该覆盖先发起的操作”，所以要给异步结果加身份校验，避免旧结果晚到后覆盖新状态。',
            },
            {
              label: '机制',
              text: '常见做法有请求序号、AbortController、时间戳或状态机。轻量页面可以用递增 requestId，复杂请求链路更适合取消旧请求或集中管理状态。',
            },
            {
              label: '项目例子',
              text: '新闻简报组件里每次 loadBrief 都会让 requestSequence 加一。await 返回后先判断 requestId 是否仍然等于当前序号，不一致就直接 return，避免过期新闻覆盖最新新闻。',
            },
            {
              label: '追问准备',
              bullets: [
                '如果请求本身很重，可以用 AbortController 主动取消旧请求。',
                '即使请求不能取消，也要在写入页面状态前做最新性判断。',
              ],
            },
          ],
        },
      ],
      projectExamples: [
        '在健身工具里用表单状态拆分和衍生计算避免联动逻辑失控。',
        '在案例页交互里区分即时输入状态和提交后状态，减少副作用混乱。',
      ],
    },
    {
      key: 'browser-network',
      title: '浏览器与网络',
      dayRange: 'Day 3-6',
      conceptBlocks: [
        {
          title: '事件冒泡、捕获与事件委托',
          points: [
            '事件触发后先从 DOM 树根节点向下（捕获阶段），再从目标节点向上（冒泡阶段）。',
            '事件委托利用冒泡机制，把子元素的监听统一绑在父元素上。',
          ],
          codeExample: {
            language: 'javascript',
            caption: '原生 JS 事件委托对比',
            code: `// ❌ 给 100 个 li 绑事件（耗内存，新增 li 没绑上）
document.querySelectorAll('li').forEach(li => li.onclick = function() {...})

// ✅ 事件委托（只给父元素 ul 绑一次）
document.querySelector('ul').onclick = function(e) {
  if (e.target.tagName === 'LI') {
    console.log('点击了 li', e.target.innerText)
  }
}`,
          },
          plainExplanation: '事件委托就像"收发室大爷"。一栋楼 100 个房间，与其每间都雇人盯着有没有快递，不如在楼下大门派一个大爷，看一眼快递单上的门牌号再分发。',
        },
        {
          title: '回流与重绘',
          points: [
            '回流是浏览器重新计算元素的几何属性（大小、位置）。重绘是外观改变但不影响布局。',
            '回流性能开销远大于重绘，前端性能优化常强调"避免频繁回流"。',
          ],
          codeExample: {
            language: 'javascript',
            caption: '性能对比：回流 vs transform',
            code: `// ❌ 频繁引发回流（Layout Thrashing）
for(let i = 0; i < 100; i++) {
  box.style.width = box.offsetWidth + 10 + 'px';
}

// ✅ 用 transform 走 GPU 硬件加速
box.style.transform = 'translateX(100px)';`,
          },
          plainExplanation: '回流就是"重新排座位"，所有人都要挪。重绘就是"换件衣服"，别人不用动。频繁改宽高或读 offsetWidth 都会严重拖慢性能。',
        },
        {
          title: '浏览器渲染路径',
          points: [
            'HTML → DOM 树 → CSS → CSSOM 树 → 渲染树 → Layout → Paint → Composite',
            '性能问题优先从阻塞资源、重排重绘和资源体积三个方向定位。',
          ],
          plainExplanation: '建房子：先看图纸（HTML）搭骨架（DOM），再看装修手册（CSS），合成施工蓝图（Render Tree），算尺寸（Layout），刷油漆（Paint），最后呈现。',
        },
        {
          title: 'HTTP 缓存与跨域',
          points: [
            '强缓存：浏览器直接读本地缓存，不发真实请求。受 Cache-Control: max-age 控制。',
            '协商缓存：强缓存过期后，带 ETag 问服务器"变了吗？"没变返回 304。',
            'CORS 是服务器通过响应头显式允许其他域名前端页面请求数据的机制。',
          ],
        },
      ],
      interviewTakeaways: [
        '面试里优先说明"用户会感知到什么问题"，再讲技术细节。',
        '缓存题要能说出强缓存、协商缓存和实际发布策略之间的关系。',
      ],
      interviewQA: [
        {
          question: '浏览器从输入 URL 到页面展示发生了什么？',
          answer: [
            {
              label: '结论',
              text: '这道题可以按“网络请求链路”和“浏览器渲染链路”两段回答，先拿到资源，再把资源解析成用户看到的页面。',
            },
            {
              label: '机制',
              bullets: [
                '网络侧：URL 解析、DNS 查询、建立连接、发送 HTTP 请求、服务器返回 HTML 和静态资源。',
                '渲染侧：解析 HTML 生成 DOM，解析 CSS 生成 CSSOM，合成渲染树，执行布局、绘制和合成。',
              ],
            },
            {
              label: '项目例子',
              text: '个人站通过路由懒加载减少首页初始 JS 体积，学习页、项目页和健身模块在访问对应路由时才下载，能缩短首屏进入成本。',
            },
            {
              label: '追问准备',
              bullets: [
                '遇到性能追问时，从资源体积、阻塞资源、缓存策略和运行时渲染成本展开。',
                '不要只背流程，要补一句“用户感知到的是白屏、卡顿或交互延迟”。',
              ],
            },
          ],
        },
        {
          question: '强缓存和协商缓存有什么区别？',
          answer: [
            {
              label: '结论',
              text: '强缓存是不请求服务器，协商缓存是向服务器确认资源有没有变化；两者目标都是减少重复下载，但命中路径不同。',
            },
            {
              label: '机制',
              text: '强缓存主要看 Cache-Control 的 max-age、immutable 等字段。协商缓存通常通过 ETag / If-None-Match 或 Last-Modified / If-Modified-Since 判断，资源未变时返回 304。',
            },
            {
              label: '项目例子',
              text: '个人站的页面代码适合通过构建产物 hash 做长期缓存，HTML 则应该保持较短缓存或走协商缓存，避免用户拿到旧入口却加载不到新资源。',
            },
            {
              label: '追问准备',
              bullets: [
                '带 hash 的静态资源可以缓存更久，因为文件名变化代表内容变化。',
                '接口数据不应盲目强缓存，要结合实时性、用户身份和业务容错来定。',
              ],
            },
          ],
        },
        {
          question: '开发环境下你们怎么解决跨域问题？',
          answer: [
            {
              label: '结论',
              text: '开发环境通常用 Vite proxy 把前端的 /api 请求转发到后端，让浏览器看到的是同源请求，从而绕开浏览器的 CORS 限制。',
            },
            {
              label: '机制',
              text: 'CORS 是浏览器安全策略，不是服务器之间不能通信。代理发生在开发服务器的 Node 层，浏览器请求本地同源地址，开发服务器再去请求真实后端。',
            },
            {
              label: '项目例子',
              text: '个人站的本地开发可以把 /api/ai/news-brief、/api/fitness/* 这类接口交给 Vite 或本地 Node 服务转发，页面代码仍然保持相对路径请求。',
            },
            {
              label: '追问准备',
              bullets: [
                '生产环境不应该依赖开发代理，而要由同域部署、网关或服务端 CORS 配置解决。',
                '如果涉及 Cookie，还要同时处理 credentials 和 SameSite 等配置。',
              ],
            },
          ],
        },
      ],
      projectExamples: [
        '把静态资源拆分和按路由加载结合起来，缩短首页可交互时间。',
        '为工具页规划稳定的数据请求和回退状态，保证移动端网络波动下也可用。',
      ],
    },
    {
      key: 'engineering-vue',
      title: '工程化与 Vue 实战',
      dayRange: 'Day 8-14',
      conceptBlocks: [
        {
          title: 'Vue 3 Proxy 响应式',
          points: [
            'Vue 3 用 ES6 Proxy 代理整个对象，拦截 get 时收集依赖，set 时触发更新。',
            '比 Object.defineProperty 更强：天生支持数组、新增属性的拦截。',
          ],
          codeExample: {
            language: 'javascript',
            caption: '项目实例：FitnessView.vue 状态分类',
            code: `// 1. 输入状态：reactive 保存表单原始输入
const form = reactive(normalizeLatest(storage.loadLatest()))

// 2. 派生状态：computed 纯计算，不污染源数据
const calculation = computed(() => calculateTdee(form))

// 3. 副作用：watch 监听变化，写 localStorage
watch(
  form,
  (value) => storage.saveLatest({ ...value }),
  { deep: true }
)`,
          },
          plainExplanation: 'Vue 3 写页面像经营工厂。form (reactive) 是原料，calculation (computed) 是加工出的果汁，watch 是门卫负责记账到本地硬盘。三件事职责分明。',
        },
        {
          title: '路由懒加载与动态导入',
          points: [
            '通过 () => import() 注册路由组件，Vite 打包时拆成独立 chunk。',
            '用户只有访问该路由时才下载对应 JS，实现"按需点餐"。',
          ],
          codeExample: {
            language: 'javascript',
            caption: '项目实例：router/index.js',
            code: `{
  path: '/fitness',
  name: 'fitness',
  component: () => import('@/views/FitnessView.vue'),
}`,
          },
          plainExplanation: '不做懒加载，用户首次打开要下载所有页面代码，白屏很久。用 () => import() 后变成"吃哪盘菜上哪盘菜"，页面打开快很多。',
        },
        {
          title: 'Vite 与 Webpack 的区别',
          points: [
            'Webpack 基于 Bundle 打包，启动前必须处理所有模块；Vite 基于浏览器原生 ES Modules 按需编译。',
            'Vite 将依赖用 esbuild 预构建，源码通过 ESM 按需提供。',
          ],
        },
      ],
      interviewTakeaways: [
        '描述工程化经验时，重点讲你如何降低维护成本和沟通成本。',
        'Vue 题不只讲 API，还要讲为什么这样拆更适合真实业务。',
      ],
      interviewQA: [
        {
          question: 'Vue 3 为什么要用 Proxy 替换 Object.defineProperty？',
          answer: [
            {
              label: '结论',
              text: 'Vue 3 使用 Proxy 是为了更完整地代理对象操作，减少 Vue 2 中新增属性、删除属性和数组变更需要特殊处理的问题。',
            },
            {
              label: '机制',
              text: 'Object.defineProperty 是给已有属性加 getter/setter，初始化时需要递归劫持。Proxy 代理的是整个对象，可以拦截 get、set、deleteProperty、has 等操作。',
            },
            {
              label: '项目例子',
              text: 'FitnessView.vue 用 reactive 保存表单输入，用 computed 派生 TDEE 计算结果。表单字段变化后，Vue 能自动追踪依赖并只更新相关展示，不需要手动同步 DOM。',
            },
            {
              label: '追问准备',
              bullets: [
                'Proxy 也不是“性能永远更快”，优势更多在能力完整和实现简化。',
                '响应式写法仍要注意状态边界，避免把所有东西都塞进一个巨大 reactive 对象。',
              ],
            },
          ],
        },
        {
          question: '你在项目中做了哪些前端性能优化？',
          answer: [
            {
              label: '结论',
              text: '我会把性能优化分成加载阶段、运行阶段和体验兜底三类讲，避免只堆技术名词。',
            },
            {
              label: '机制',
              bullets: [
                '加载阶段：路由懒加载、合理拆包、静态资源缓存，减少首次进入成本。',
                '运行阶段：把衍生计算放进 computed 或纯函数，必要时把重计算放到 worker，减少主线程压力。',
                '体验兜底：为接口加载、失败和空数据提供明确状态，降低用户对等待的焦虑。',
              ],
            },
            {
              label: '项目例子',
              text: '个人站路由用动态 import 拆分页面；健身工作台把 TDEE、宏量营养和场景方案拆成纯计算函数；新闻简报用 loading/error 状态保证网络波动时页面仍然可理解。',
            },
            {
              label: '追问准备',
              bullets: [
                '如果被问结果，要说指标：首屏时间、交互延迟、请求数、包体积或用户路径完成率。',
                '如果没有线上监控，也要诚实说明用构建体积、手动性能面板和用户操作路径验证。',
              ],
            },
          ],
        },
        {
          question: 'Vite 为什么那么快？',
          answer: [
            {
              label: '结论',
              text: 'Vite 快主要因为开发阶段不先整体打包，而是利用浏览器原生 ESM 按需加载源码，同时用 esbuild 预构建依赖。',
            },
            {
              label: '机制',
              text: '传统 Bundler 启动前要把项目依赖图处理成 bundle。Vite 启动时只启动开发服务器，浏览器请求哪个模块，Vite 再按需转换哪个模块；第三方依赖则提前用 esbuild 快速预构建。',
            },
            {
              label: '项目例子',
              text: '这个站点有首页、健身工作台、学习工作台和多个项目案例页。使用 Vite 后，开发时改某个 Vue 文件只触发对应模块的 HMR，不需要等待整站重新打包。',
            },
            {
              label: '追问准备',
              bullets: [
                '开发快不等于生产不打包，生产构建仍然会用 Rollup 做优化产物。',
                'Vite 的优势在中大型前端项目里更明显，尤其是页面和组件数量增长后。',
              ],
            },
          ],
        },
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
      key: 'handwriting-drills',
      title: '手写题（必背）',
      items: [
        '防抖 Debounce',
        '节流 Throttle',
        '深拷贝 Deep Clone',
        '事件总线 EventEmitter',
      ],
      codeExamples: [
        {
          language: 'javascript',
          caption: '防抖 — 搜索框连续输入，只算最后一次',
          code: `function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  }
}`,
        },
        {
          language: 'javascript',
          caption: '节流 — 保证每 X 毫秒最多执行一次',
          code: `function throttle(fn, delay) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  }
}`,
        },
        {
          language: 'javascript',
          caption: '深拷贝 — 避免编辑表单时污染原数据',
          code: `function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}`,
        },
        {
          language: 'javascript',
          caption: '事件总线 — 跨级组件通信',
          code: `class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(eventName, callback) {
    if (!this.events[eventName]) this.events[eventName] = [];
    this.events[eventName].push(callback);
  }
  emit(eventName, ...args) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(cb => cb(...args));
    }
  }
}`,
        },
      ],
    },
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
        '两数之和 — 用 Map 边遍历边存 target - current，O(N)',
        '无重复最长子串 — 滑动窗口，左右指针维护窗口',
        '反转链表 — 保存 next，更新 curr.next = prev',
        '爬楼梯 — dp[i] = dp[i-1] + dp[i-2]',
      ],
    },
  ],
}
