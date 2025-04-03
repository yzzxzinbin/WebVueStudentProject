import Vue from 'vue'
import App from './App.vue'
import router from './router'

// 引入样式文件
import './assets/style/index.css'
// 引入第三方UI组件库
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import * as echarts from 'echarts';
// 引入事件总线
import eventBus from '@/utils/eventBus';

// 导入权限控制工具
import PermissionUtils from './utils/permissionUtils'

Vue.use(ElementUI);
Vue.config.productionTip = false
Vue.prototype.$eventBus = eventBus

// 添加权限控制工具到 Vue 原型
Vue.prototype.$permission = PermissionUtils

// 创建事件总线
Vue.prototype.$eventBus = new Vue()

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
