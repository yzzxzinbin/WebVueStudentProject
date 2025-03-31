<template>
  <div class="layout">
    <el-container>
      <!-- 系统头部 -->
      <el-header>
        <div class="logo-container" @click="toggleAside">
          <svg t="1743168874987" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            p-id="3196" xmlns:xlink="http://www.w3.org/1999/xlink" width="42" height="42">
            <path class="light-fill"
              d="M944.768 697.6h-368c-8.384 0-15.168-9.856-15.168-22.016v-51.84c0-12.096 6.784-22.016 15.168-22.016h368c8.448 0 15.232 9.92 15.232 22.016v51.904c0 12.096-6.784 21.952-15.232 21.952z m0 131.264h-368c-8.384 0-15.168-9.856-15.168-22.016v-51.904c0-12.224 6.784-22.016 15.168-22.016h368c8.448 0 15.232 9.856 15.232 22.016v51.904c0 12.16-6.784 22.016-15.232 22.016z m0 131.136h-368c-8.384 0-15.168-9.856-15.168-22.016v-51.904c0-12.096 6.784-22.016 15.168-22.016h368c8.448 0 15.232 9.856 15.232 22.016v51.904c0 12.16-6.784 22.016-15.232 22.016zM550.016 544.064h65.536a120.32 120.32 0 0 0 4.416-32 122.496 122.496 0 0 0-136.32-121.6 122.88 122.88 0 0 0-107.584 107.648 122.56 122.56 0 0 0 121.6 136.384v-37.888a52.352 52.352 0 0 1 52.352-52.544z"
              fill="#f2f5f4" p-id="3197"></path>
            <path class="dark-fill"
              d="M310.208 512.064a187.648 187.648 0 0 1 187.392-187.456 187.712 187.712 0 0 1 184.64 219.456h172.672a338.432 338.432 0 0 0-1.344-75.52l52.416-40.64a54.912 54.912 0 0 0 17.728-73.6l-76.48-132.544a54.976 54.976 0 0 0-72.704-21.44l-61.184 25.024a356.288 356.288 0 0 0-75.392-43.392l-8.96-65.664A54.784 54.784 0 0 0 574.208 64H420.992a54.592 54.592 0 0 0-54.784 52.288l-9.024 65.664a361.088 361.088 0 0 0-75.392 43.392l-61.312-25.024a54.784 54.784 0 0 0-72.576 21.44L71.36 354.496a54.848 54.848 0 0 0 17.984 73.472l52.224 40.64a348.544 348.544 0 0 0 0 87.04l-52.352 40.448a54.784 54.784 0 0 0-17.792 73.6l76.48 132.608c7.424 12.608 19.2 21.76 33.408 25.6a54.208 54.208 0 0 0 39.232-4.352l61.248-25.024c23.04 17.344 48.384 31.872 75.392 43.392l9.024 65.728a54.72 54.72 0 0 0 54.784 52.352h76.48v-260.48a187.584 187.584 0 0 1-187.264-187.456z"
              fill="#8A7CBF" p-id="3198"></path>
          </svg>
          <span class="system-name">&nbsp; &lt;Warehouse System&gt; </span>
        </div>
        <el-input v-model="searchQuery" placeholder="请输入搜索内容" class="search-box" @input="handleSearch" clearable>
        </el-input>
        <div class="user-info-container">
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-info" @click.stop>
              <el-avatar :size="36" :src="userInfo.avatar || require('@/assets/default-avatar.svg')"></el-avatar>
              <span class="username">{{ userInfo.name || userInfo.username }}</span>
              <i class="el-icon-arrow-down"></i>
            </div>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="info">
                <div class="dropdown-item-content">
                  <i class="el-icon-user"></i>
                  <span>个人中心</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <div class="dropdown-item-content">
                  <i class="el-icon-switch-button"></i>
                  <span>退出登录</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>
      <el-container>
        <!-- 侧边导航 -->
        <el-aside :width="isCollapse ? '64px' : '200px'" style="transition: width 0.3s;">
          <el-menu :default-active="activeMenu" @select="selectHandle" class="el-menu-vertical-demo" :router="true"
            :collapse="isCollapse" :collapse-transition="false">
            <div v-for="(item, index) in menus" :key="index">
              <!-- 一级菜单 -->
              <el-menu-item v-if="!item.children || item.children.length == 0" :index="item.path"
                class="my-parent-memu-item">
                <i :class="item.icon"></i>
                <span slot="title">{{ item.title }}</span>
              </el-menu-item>

              <!-- 二级菜单 -->
              <el-submenu v-else :index="item.path" class="my-parent-memu-item">
                <template slot="title">
                  <i :class="item.icon"></i>
                  <span slot="title">{{ item.title }}</span>
                </template>
                <el-menu-item v-for="(it, i) in item.children" :key="i" :index="it.path" class="my-child-memu-item">
                  {{ it.title }}
                </el-menu-item>
              </el-submenu>
            </div>
          </el-menu>
        </el-aside>
        <!-- 显示区域 -->
        <el-main>
          <div>
            <transition name="fade-transform" mode="out-in">
              <router-view v-if="!isLoading" key="content"></router-view>
              <div v-else key="loading" class="loading-container">
                <i class="el-icon-loading"></i>
              </div>
            </transition>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isCollapse: false, // 侧边栏是否折叠
      activeMenu: '', // 当前激活的菜单项
      searchQuery: '', // 搜索框内容
      isLoading: false, // 是否显示加载状态
      userMenuVisible: false, // 用户菜单是否可见
      menus: [ // 菜单配置
        {
          path: '/list',
          title: '列表管理',
          icon: 'el-icon-menu',
          children: [
            {
              path: '/list/products',
              title: '商品列表',
            },
            {
              path: '/list/warehouses',
              title: '仓库列表',
            },
            {
              path: '/list/warehouse-products',
              title: '仓库商品列表',
            }
          ]
        },
        {
          path: '/system',
          title: '系统管理',
          icon: 'el-icon-setting',
          children: [
            {
              path: '/system/users',
              title: '用户管理'
            },
            {
              path: '/system/profile',
              title: '个人中心'
            }
          ]
        },
        {
          path: '/operation',
          title: '操作申请',
          icon: 'el-icon-s-operation',
          children: []
        },
        {
          path: '/visualization',
          title: '仓库可视化',
          icon: 'el-icon-s-data'
        },
      ],
      userInfo: JSON.parse(localStorage.getItem('user')) || {},
      userDialogVisible: false,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordRules: {
        oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度至少6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认新密码', trigger: 'blur' },
          { validator: this.validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    handleUserCommand(command) {
      if (command === 'info') {
        // 检查当前是否已经在个人中心页面
        if (this.$route.path !== '/system/profile') {
          this.$router.replace('/system/profile');
        }
      } else if (command === 'logout') {
        this.logout();
      }
    },


    // 登陆
    showUserInfo() {
      this.userDialogVisible = true;
    },
    showUserMenu() {
      this.userMenuVisible = !this.userMenuVisible;
    },

    validateConfirmPassword(rule, value, callback) {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    },

    updatePassword() {
      this.$refs.passwordForm.validate(valid => {
        if (valid) {
          const users = JSON.parse(localStorage.getItem('users')) || [];
          const userIndex = users.findIndex(u => u.id === this.userInfo.id);

          if (userIndex === -1) {
            this.$message.error('用户不存在');
            return;
          }

          // 验证原密码
          const hashedOldPassword = this.hashPassword(this.passwordForm.oldPassword);
          if (users[userIndex].password !== hashedOldPassword) {
            this.$message.error('原密码错误');
            return;
          }

          // 更新密码
          users[userIndex].password = this.hashPassword(this.passwordForm.newPassword);
          localStorage.setItem('users', JSON.stringify(users));

          this.$message.success('密码修改成功');
          this.userDialogVisible = false;
          this.passwordForm = {
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
        }
      });
    },
    /**
     * 切换侧边栏折叠状态
     */
    toggleAside() {
      this.isCollapse = !this.isCollapse;
    },

    /**
     * 菜单项选择处理
     * @param {string} index 选中的菜单路径
     */
    // 修改 selectHandle 方法
    selectHandle(index) {
      // 如果当前路径已经是目标路径，则不进行导航
      if (this.$route.path === index) {
        return;
      }

      // 存储当前选择的菜单
      localStorage.setItem('selectMenu', index);

      // 使用 replace 而不是 push 来避免导航历史问题
      this.$router.replace(index).catch(err => {
        // 忽略重复导航错误
        if (err.name !== 'NavigationDuplicated') {
          console.error('导航错误:', err);
        }
      });
    },

    /**
     * 退出登录
     */
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('username');
      localStorage.removeItem('selectMenu');
      this.$router.replace('/login').catch(() => { });
      this.$message.success('退出登录成功');
    },

    /**
     * 搜索处理
     */
    handleSearch() {
      console.log('搜索内容:', this.searchQuery);
    }
  },
  created() {
    // 初始化时从本地存储获取当前激活菜单，默认为第一个菜单项
    const savedPath = localStorage.getItem('selectMenu');
    const defaultPath = this.menus[0].children?.length ? this.menus[0].children[0].path : this.menus[0].path;

    // 确保 activeMenu 与当前路由匹配
    this.activeMenu = this.$route.path || savedPath || defaultPath;

    // 如果当前路由路径与激活菜单不匹配，则更新
    if (this.$route.path !== this.activeMenu) {
      this.$router.replace(this.activeMenu).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error('初始化导航错误:', err);
        }
      });
    }
  },

  watch: {
    // 监听路由变化更新激活菜单
    '$route'(to) {
      this.activeMenu = to.path;
      localStorage.setItem('selectMenu', to.path);

      // 路由变化时显示加载状态
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
      }, 300);
    }
  }
};
</script>

<style>
/* ========== 全局变量 ========== */
:root {
  --primary-color: #409EFF;
  --primary-dark: rgba(250, 218, 219, 0.9);
  --text-color: #303133;
  --text-light: #ffffff;
  --bg-color: #f5f7fa;
  --border-color: #dcdfe6;
}
</style>

<style scoped>
/* ========== 布局样式 ========== */
.layout {
  height: 100vh;
  background-image: url("../assets/images/b.png");
  background-size: 100% 100%;
}

body {
  overflow: hidden;
  height: 100vh;
}

/* ========== 头部样式 ========== */
.el-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.5);
  z-index: 10;
}

/* 标志容器 */
.logo-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 15px;
  height: 100%;
  transition: all 0.5s;
}

.logo-container:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 标志图标颜色过渡效果 */
.light-fill,
.dark-fill {
  transition: fill 0.5s ease-in-out;
}

.logo-container:hover .light-fill {
  fill: #8A7CBF;
}

.logo-container:hover .dark-fill {
  fill: #f2f5f4;
}

/* 系统名称样式 */
.system-name {
  font-family: 'Courier New', monospace;
  font-size: 35px;
  font-weight: bold;
  color: var(--text-light);
  letter-spacing: 1px;
  transition: all 0.6s;
  user-select: none;
}

.logo-container:hover .system-name {
  color: #8A7CBF;
}

/* 搜索框样式 */
.search-box {
  width: 300px;
  margin: 0 20px;
}

.search-box /deep/ .el-input__inner {
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.8);
}

/* ========== 侧边栏样式 ========== */
.el-aside {
  box-shadow: 3px 0 6px rgba(0, 0, 0, 0.2);
  transition: width 0.3s;
  overflow: hidden !important;
}

.el-aside ul,
.el-aside,
.el-main {
  height: calc(100vh - 60px);
}

/* 菜单样式 */
.el-menu {
  border-right: none;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
}

/* 折叠状态下菜单样式 */
.el-menu--collapse .el-menu-item i,
.el-menu--collapse .el-submenu__title i {
  margin-left: 4px;
}

.el-menu--collapse .el-submenu__title span,
.el-menu--collapse .el-menu-item span {
  display: none;
}

.el-menu--collapse .el-submenu__icon-arrow {
  display: none;
}

/* 菜单项文本样式 */
span {
  font-size: 16px;
  font-weight: bold;
}

.el-menu-item {
  font-size: 15px;
}

/* 一级菜单项样式 */
.my-parent-memu-item {
  background: linear-gradient(135deg, rgba(250, 218, 219, 1), rgba(110, 180, 254, 0.5));
}

/* 二级菜单项样式 */
.my-child-memu-item {
  background-color: rgb(250, 250, 250);
  padding-left: 50px !important;
}

.my-child-memu-item:hover {
  background-color: rgb(242, 243, 244);
}

/* ========== 主内容区样式 ========== */
.el-main {
  background-color: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.el-main>div {
  overflow-y: auto;
  height: 100%;
  border-radius: 4px;
  scrollbar-color: rgba(255, 255, 255, 0.6) transparent;
}

/* 自定义滚动条 */
.el-main>div::-webkit-scrollbar {
  width: 15px;
}

.el-main>div::-webkit-scrollbar-track {
  background: transparent;
}

.el-main>div::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 3px;
  backdrop-filter: blur(10px);
}

.el-main>div::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.8);
}

/* ========== 过渡动画 ========== */
/* 页面切换动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
}

/* 加载动画 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.el-icon-loading {
  font-size: 36px;
  color: var(--primary-color);
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.user-info-container {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 10px;
  height: 60px;
  transition: all 0.3s;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.username {
  margin: 0 8px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 下拉菜单样式调整 */
.el-dropdown-menu {
  margin-top: 5px !important;
  padding: 5px 0;
  min-width: 140px;
  /* 增加最小宽度 */
  border-radius: 4px;
}

.el-dropdown-menu__item {
  display: flex;
  align-items: center;
  padding: 0 15px;
  height: 36px;
  line-height: 36px;
  font-size: 14px;
  color: #606266;
}

.el-dropdown-menu__item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.el-dropdown-menu__item i {
  margin-right: 10px;
  width: 16px;
  text-align: center;
  font-size: 16px;
}

/* 调整分割线样式 */
.el-dropdown-menu__item--divided:before {
  margin: 0 15px;
  background-color: #cbeee5;
  content: none !important;

}

/* 确保所有菜单项内容对齐 */
.dropdown-menu-item {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>