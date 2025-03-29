import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    component: () => import(/* webpackChunkName: "about" */ '../views/LoginView.vue')
  },
  {
    path: '/',
    redirect: '/list/products',
    component: () => import('../views/Layout.vue'),
    children: [
      {
        path: 'list/products',
        component: () => import('../views/ProductList.vue')
      },
      {
        path: 'list/warehouses',
        component: () => import('../views/Warehouse.vue')
      },
      {
        path: 'list/warehouse-products',
        component: () => import('../views/warehouse-products.vue')
      },
      {
        path: 'operation',
        component: () => import('../views/operation.vue')
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// beforeEach 是 Vue Router 提供的全局前置守卫，会在路由跳转之前被调用。
router.beforeEach((to,from,next)=>{
  // to: 即将要进入的目标路由对象 (Route 对象)
  // from: 当前导航正要离开的路由对象 (Route 对象)
  // next: 必须调用的函数，决定路由跳转行为

  // localStorage 是浏览器提供的一种 本地存储 机制，允许网页在用户的浏览器中存储 持久化数据（即使关闭浏览器后数据也不会丢失）。
  let token = localStorage.getItem('token')
  // 登录验证 - 访问除了登录之外的页面，需要token（凭证/令牌）
  if(to.path !== '/login' && !token){
    // 访问除了登录之外的页面 并且 没有token，重定向到登录页
    next({path: '/login'})
  }else{
    // 访问登录页 或者 有token，直接放行
    next()
  }
})

export default router
