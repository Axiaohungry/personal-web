import './assets/main.css'
import 'ant-design-vue/dist/reset.css'

import { createApp } from 'vue'
import {
  App as AntApp,
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  ConfigProvider,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  List,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'ant-design-vue'

import App from './App.vue'
import router from './router'

// 应用启动入口：
// 1. 先加载全局样式；
// 2. 创建 Vue 应用实例；
// 3. 把当前项目实际用到的 Ant Design Vue 组件逐个注册；
// 4. 挂载路由，再把应用挂到 #app。
const app = createApp(App)

;[
  AntApp,
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  ConfigProvider,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  List,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Timeline,
  Typography,
].forEach((component) => {
  // 这里使用按需注册，避免在模板里出现组件名时还需要每个页面手动 import。
  app.use(component)
})

app.use(router)
app.mount('#app')
