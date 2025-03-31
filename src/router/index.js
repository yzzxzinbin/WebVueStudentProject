import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/',
    redirect: '/list/products',
    component: () => import('../views/Layout.vue'),
    children: [
      {
        path: 'list/products',
        component: () => import('../views/ProductList.vue'),
        meta: { roles: ['admin', 'manager', 'operator'] }
      },
      {
        path: 'list/warehouses',
        component: () => import('../views/Warehouse.vue'),
        meta: { roles: ['admin', 'manager'] }
      },
      {
        path: 'list/warehouse-products',
        component: () => import('../views/warehouse-products.vue'),
        meta: { roles: ['admin', 'manager', 'operator'] }
      },
      {
        path: 'operation',
        component: () => import('../views/operation.vue'),
        meta: { roles: ['admin', 'manager', 'operator'] }
      },
      {
        path: 'visualization',
        component: () => import('../views/WarehouseVisualization.vue'),
        meta: { roles: ['admin', 'manager'] }
      },
      {
        path: 'system/users',
        component: () => import('../views/UserManagement.vue'),
        meta: { roles: ['admin'] }
      },
      {
        path: 'system/profile',
        component: () => import('../views/UserProfile.vue'),
        meta: { roles: ['admin', 'manager', 'operator'] }
      }
    ]
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 添加获取用户默认路由的方法
function getDefaultRouteForUser(user) {
  if (!user) return '/list/products';

  // 根据用户角色返回默认路由
  switch (user.role) {
    case 'admin':
      return '/system/users';
    case 'manager':
      return '/list/warehouses';
    case 'operator':
      return '/operation';
    default:
      return '/list/products';
  }
}

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // 未登录且访问非登录页
  if (to.path !== '/login' && !token) {
    next({ path: '/login' });
    return;
  }

  // 已登录但访问登录页
  if (to.path === '/login' && token) {
    const defaultRoute = getDefaultRouteForUser(user);
    next({ path: defaultRoute, replace: true });
    return;
  }

  // 权限检查
  if (to.meta?.roles && user) {
    if (!to.meta.roles.includes(user.role)) {
      const defaultRoute = getDefaultRouteForUser(user);
      next({ path: defaultRoute, replace: true });
      return;
    }
  }

  next();
});

export default router