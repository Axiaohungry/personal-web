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
          answer: '闭包是函数记住了其声明时的词法作用域。在我的项目中，我通过工厂函数 createStorageApi(storage) 来封装本地存储逻辑。返回的对象内的方法形成闭包，持续引用传入的 storage 参数。这实现了数据的私有化封装。',
        },
        {
          question: 'Event Loop 的运行机制是什么？',
          answer: 'Event Loop 控制 JS 单线程的执行顺序。先执行调用栈里的同步代码，清空微任务队列（如 Promise），然后再从宏任务队列（如 setTimeout）取出一个任务执行，循环往复。',
        },
        {
          question: '如何解决前端竞态问题？',
          answer: '在新闻简报组件中，我通过维护一个局部闭包变量 requestSequence 来解决。每次发请求前序号 +1，在 await 返回后检查序号是否一致。不一致则丢弃过期结果。',
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
          answer: '1.DNS 解析得到 IP；2.建立 TCP 连接；3.发起 HTTP 请求；4.服务器返回 HTML；5.解析 HTML 构建 DOM，解析 CSS 构建 CSSOM，合并成渲染树；6.布局计算；7.绘制像素；8.合成显示。',
        },
        {
          question: '强缓存和协商缓存有什么区别？',
          answer: '强缓存完全不经过服务器，受 Cache-Control: max-age 控制。协商缓存在强缓存失效后带 ETag 或 Last-Modified 向服务器确认，未变返回 304，节省下行传输。',
        },
        {
          question: '开发环境下你们怎么解决跨域问题？',
          answer: '在 Vite 中配置 proxy 中间件拦截 /api/* 请求，开发服务器在 Node 层代理转发，前端向同源服务器发请求，自然规避浏览器的跨域拦截。',
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
          answer: 'Object.defineProperty 只能劫持现有属性，新增/删除属性无能为力。Proxy 是引擎层面代理整个对象，天生支持数组和新增属性的拦截，性能更好代码更简洁。',
        },
        {
          question: '你在项目中做了哪些前端性能优化？',
          answer: '加载层面：路由懒加载 + manualChunks 拆分 vendor。运行时：重计算逻辑放 Web Worker，局部组件抽离确保表单更新只重渲染局部。',
        },
        {
          question: 'Vite 为什么那么快？',
          answer: 'Vite 开发模式不做整体打包。依赖用 esbuild 预构建，源码通过浏览器原生 ESM 按需编译返回。',
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
