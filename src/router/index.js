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
        meta: { roles: ['admin', 'manager', 'operator'] } // 添加 operator 权限
      },
      {
        path: 'list/warehouse-products',
        component: () => import('../views/Warehouse-products.vue'),
        meta: { roles: ['admin', 'manager', 'operator'] }
      },
      // 将原本的operation路由修改为warehouse/operation
      {
        path: 'warehouse/operation',
        component: () => import('../views/Operation.vue'),
        meta: { roles: ['admin', 'manager', 'operator'] }
      },
      // 添加新的越权申请页面路由
      {
        path: 'warehouse/override',
        component: () => import('../views/OverrideOperation.vue'),
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
      return '/warehouse/operation'; // 修改默认路由为新的路径
    default:
      return '/list/products';
  }
}

// 添加检查用户仓库权限的函数
function checkWarehousePermissions(to, user) {
  // 管理员和经理有默认路由
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }

  // 对于操作员，检查是否有任何授权的仓库
  const authorizedWarehouses = user.authorizedWarehouses || [];
  if (authorizedWarehouses.length === 0) {
    // 没有任何授权仓库的操作员只能访问个人主页
    return to.path === '/system/profile';
  }

  return true;
}

router.beforeEach((to, from, next) => {
  // 获取本地存储中的 token 和 user,若没有则从sessionStorage中获取
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
    
    // 添加仓库权限检查
    if (!checkWarehousePermissions(to, user)) {
      next({ path: '/system/profile', replace: true });
      return;
    }
  }

  next();
});

export default router