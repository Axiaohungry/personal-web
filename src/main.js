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
  app.use(component)
})

app.use(router)
app.mount('#app')
