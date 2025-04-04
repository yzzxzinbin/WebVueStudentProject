<template>
  <!--
    @Template_Desc 系统布局页面主体
      包含头部、侧边栏和主内容区域
    @Element_Desc .layout 页面最外层容器，对整个布局页面进行包裹和布局
    @Element_Desc .el-header 系统头部，包含系统标志、搜索框和用户信息
    @Element_Desc .logo-container 标志容器，包含系统标志和名称
    @Element_Desc .el-aside 侧边导航栏，用于显示系统菜单
    @Element_Desc .el-main 主内容区域，用于显示路由视图内容
    @Element_Desc .user-info-container 用户信息容器，包含用户头像和下拉菜单
    @Element_Desc .loading-container 加载动画容器，用于显示加载状态
  -->
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
          <div class="divider"></div>
          <span class="system-name">&nbsp;仓库管理系统</span>
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
import { Divider } from 'element-ui';

export default {
  data() {
    return {
      db: null, // IndexedDB数据库实例
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
          path: '/warehouse',
          title: '仓库操作',
          icon: 'el-icon-s-operation',
          children: [
            {
              path: '/warehouse/operation',
              title: '操作申请',
            },
            {
              path: '/warehouse/override',
              title: '越权申请',
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

    /**
     * @Function_Para 初始化头像专用数据库
     *   无参数
     * @Function_Caller 被组件的 created 生命周期钩子调用，用于初始化用户头像数据库
     * @Function_Meth 创建和初始化用于存储用户头像的IndexedDB数据库
     * @Function_API
     *   - IndexedDB API: 创建/打开数据库和对象存储
     *   - Promise API: 提供异步处理能力
     */
    initAvatarDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('AvatarDB', 1);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('avatars')) {
            db.createObjectStore('avatars', { keyPath: 'userId' });
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve();
        };

        request.onerror = (event) => {
          console.error('数据库初始化失败:', event.target.error);
          reject(event.target.error);
        };
      });
    },

    /**
     * @Function_Para 从数据库读取头像
     *   @param {string} userId - 用户ID
     * @Function_Caller 被 loadUserInfo 方法调用，用于加载用户头像
     * @Function_Meth 从IndexedDB检索指定用户的头像数据
     * @Function_API
     *   - IndexedDB API: 事务处理和数据读取
     */
    async getAvatarFromDB(userId) {
      if (!this.db) return null;

      return new Promise((resolve) => {
        const transaction = this.db.transaction(['avatars'], 'readonly');
        const store = transaction.objectStore('avatars');

        const request = store.get(userId);

        request.onsuccess = () => resolve(request.result?.avatarData || null);
        request.onerror = () => resolve(null);
      });
    },

    /**
     * @Function_Para 加载用户信息
     *   无参数
     * @Function_Caller 被组件的 created 生命周期钩子调用，用于初始化用户信息
     * @Function_Meth 加载当前登录用户的基本信息和头像:
     *   1. 从localStorage加载基本用户数据
     *   2. 从IndexedDB加载用户头像
     *   3. 配置后备头像
     * @Function_API
     *   - localStorage API: 读取用户数据
     *   - IndexedDB API: 读取头像数据
     */
    async loadUserInfo() {
      // 1. 从localStorage加载基本信息
      const user = JSON.parse(localStorage.getItem('user')) || {};

      // 2. 设置基本信息（不包含头像）
      this.userInfo = { ...user, avatar: null };

      // 3. 确保数据库已初始化
      if (!this.db) {
        console.warn('IndexedDB 尚未初始化');
        return;
      }

      // 4. 从IndexedDB加载头像
      if (user.id) {
        try {
          const avatar = await this.getAvatarFromDB(user.id);
          if (avatar) {
            this.userInfo.avatar = avatar;
            return;
          }
        } catch (error) {
          console.error('从IndexedDB加载头像失败:', error);
        }
      }

      // 5. 最终回退逻辑
      this.userInfo.avatar = user.avatar || require('@/assets/default-avatar.svg');
    },

    /**
     * @Function_Para 处理用户菜单命令
     *   @param {string} command - 菜单项命令
     * @Function_Caller 被模板中的用户下拉菜单的 @command 事件调用
     * @Function_Meth 处理用户菜单选择:
     *   - info: 跳转到个人中心
     *   - logout: 执行退出登录
     * @Function_API
     *   - Vue Router: 导航到个人中心
     */
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

    /**
     * @Function_Para 显示用户信息
     *   无参数
     * @Function_Meth 显示用户信息对话框
     * @Function_API 无外部API调用
     */
    showUserInfo() {
      this.userDialogVisible = true;
    },

    /**
     * @Function_Para 切换用户菜单显示
     *   无参数
     * @Function_Meth 切换用户下拉菜单的显示状态
     * @Function_API 无外部API调用
     */
    showUserMenu() {
      this.userMenuVisible = !this.userMenuVisible;
    },

    /**
     * @Function_Para 验证确认密码
     *   @param {Object} rule - 验证规则对象
     *   @param {string} value - 输入的确认密码值
     *   @param {Function} callback - 验证回调函数
     * @Function_Meth 验证确认密码是否与新密码一致
     * @Function_API 无外部API调用
     */
    validateConfirmPassword(rule, value, callback) {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    },

    /**
     * @Function_Para 更新密码
     *   无参数
     * @Function_Meth 验证并更新用户密码:
     *   1. 验证表单数据
     *   2. 验证原密码是否正确
     *   3. 更新密码并保存
     * @Function_API
     *   - localStorage API: 读写用户数据
     *   - Element UI Message: 显示操作结果
     */
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
     * @Function_Para 切换侧边栏折叠状态
     *   无参数
     * @Function_Caller 被模板中的标志容器的 @click 事件调用
     * @Function_Meth 切换侧边栏的展开/折叠状态
     * @Function_API 无外部API调用
     */
    toggleAside() {
      this.isCollapse = !this.isCollapse;
    },

    /**
     * @Function_Para 菜单项选择处理
     *   @param {string} index 选中的菜单路径
     * @Function_Caller 被模板中的菜单的 @select 事件调用
     * @Function_Meth 处理菜单选择:
     *   1. 检查是否需要导航
     *   2. 存储选中的菜单项
     *   3. 执行路由导航
     * @Function_API
     *   - localStorage API: 存储选中菜单
     *   - Vue Router: 执行页面导航
     */
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
     * @Function_Para 退出登录
     *   无参数
     *   由handleUserCommand方法调用
     * @Function_Meth 执行退出登录流程:
     *   1. 清除所有本地存储的用户数据和令牌
     *   2. 导航到登录页面
     *   3. 显示退出成功提示
     * @Function_API
     *   - localStorage/sessionStorage API: 清除用户数据
     *   - Vue Router: 导航到登录页面
     *   - Element UI Message: 显示操作结果
     */
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('username');
      localStorage.removeItem('selectMenu');
      sessionStorage.removeItem('token');

      this.$router.replace('/login').catch(() => { });
      this.$message.success('退出登录成功');
    },

    /**
     * @Function_Para 搜索处理
     *   无参数
     * @Function_Caller 被模板中的搜索框的 @input 事件调用
     * @Function_Meth 处理顶部搜索框输入
     * @Function_API
     *   - console API: 输出调试信息
     */
    handleSearch() {
      console.log('搜索内容:', this.searchQuery);
    },

    /**
     * @Function_Para 密码哈希处理
     *   @param {string} password - 原始密码
     * @Function_Meth 执行简单的密码哈希处理
     * @Function_API 仅使用JavaScript字符串操作
     */
    hashPassword(password) {
      return password.split('').reverse().join('') + password.length;
    },
  },
  
  /**
   * @Function_Para 组件创建生命周期钩子
   * @Function_Meth 组件创建时初始化数据:
   *   1. 初始化IndexedDB
   *   2. 加载用户信息
   *   3. 设置头像更新监听
   *   4. 初始化激活菜单
   * @Function_API
   *   - localStorage API: 读取用户数据和菜单状态
   *   - Vue Router: 处理路由导航
   */
  async created() {
    //初始化IndexedDB
    await this.initAvatarDB();
    await this.loadUserInfo();

    //监听头像更新事件
    const currentUserId = this.userInfo.id
    this.$eventBus.$on(`avatar-updated-${currentUserId}`, (newAvatar) => {
      this.userInfo.avatar = newAvatar
    })
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

  /**
   * @Function_Para 路由监听
   * @Function_Meth 监听路由变化，更新激活菜单和加载状态
   * @Function_API
   *   - localStorage API: 保存选中菜单
   */
  watch: {
    '$route'(to) {
      this.activeMenu = to.path.split('?')[0]; // 忽略查询参数
      localStorage.setItem('selectMenu', this.activeMenu);

      // 路由变化时显示加载状态
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
      }, 100);
    }
  },
  
  /**
   * @Function_Para 组件销毁前钩子
   * @Function_Meth 组件销毁前清理事件监听
   * @Function_API
   *   - Vue eventBus: 移除事件监听
   */
  beforeDestroy() {
    // 确保所有事件监听都被正确清理
    if (this.userInfo && this.userInfo.id) {
      this.$eventBus.$off(`avatar-updated-${this.userInfo.id}`);
    }
  }
};
</script>

<style>
/* ========== 全局变量 ========== */
/* 定义全局CSS变量，用于颜色和主题统一管理 */
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
/* 布局容器样式 */
/* 设置整体布局的背景图和高度 */
/* 应用于整个页面布局的最外层div，class="layout" */
.layout {
  height: 100vh;
  background-image: url("../assets/images/b.png");
  background-size: 100% 100%;
}

/* 页面滚动控制 */
/* 禁止页面滚动和设置视口高度 */
/* 应用于整个页面的body元素 */
body {
  overflow: hidden;
  height: 100vh;
}

/* 头部样式 */
/* 设置页面顶部导航栏的渐变背景、布局和阴影 */
/* 应用于页面顶部的el-header组件 */
.el-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.5);
  z-index: 10;
  height: 55px !important;
}

/* 标志容器样式 */
/* 设置左侧标志和系统名称的布局和鼠标悬停效果 */
/* 应用于页面左上角的logo区域div，class="logo-container" */
.logo-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 15px;
  height: 90%;
  transition: all 0.5s;
}

/* logo容器悬停效果 */
/* 鼠标悬停在logo容器上时的背景变化 */
/* 应用于logo容器的悬停状态 */
.logo-container:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 标志图标颜色过渡效果 */
/* 设置标志图标的颜色过渡动画 */
/* 应用于SVG图标中的填充路径，class="light-fill"和"dark-fill" */
.light-fill,
.dark-fill {
  transition: fill 0.5s ease-in-out;
}

/* 标志悬停效果 - 图标变色 */
/* 鼠标悬停在标志上时的图标颜色变化 */
/* 应用于悬停状态下的浅色填充路径 */
.logo-container:hover .light-fill {
  fill: #8A7CBF;
}

/* 标志悬停效果 - 图标变色 */
/* 鼠标悬停在标志上时的图标颜色变化 */
/* 应用于悬停状态下的深色填充路径 */
.logo-container:hover .dark-fill {
  fill: #f2f5f4;
}

/* 系统名称样式 */
/* 设置系统名称的字体、大小和过渡效果 */
/* 应用于系统名称文本span，class="system-name" */
.system-name {
  font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
  /* 优先使用微软雅黑 */
  ;
  font-size: 24px;
  font-weight: bold;
  color: var(--text-light);
  letter-spacing: 1px;
  transition: all 0.5s;
  user-select: none;
  margin-left: 10px;
}

/* 系统名称悬停效果 */
/* 鼠标悬停在标志上时系统名称的颜色变化 */
/* 应用于悬停状态下的系统名称 */
.logo-container:hover .system-name {
  color: #8A7CBF;
}

/* 搜索框样式 */
/* 设置顶部搜索框的宽度和边距 */
/* 应用于顶部搜索的el-input组件，class="search-box" */
.search-box {
  width: 300px;
  margin: 0 20px;
}

/* 搜索框内部样式 */
/* 自定义搜索框输入区域的背景和圆角 */
/* 应用于搜索框的输入区域，使用深度选择器修改Element UI内部样式 */
.search-box /deep/ .el-input__inner {
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.8);
}

/* 侧边栏样式 */
/* 设置侧边栏的阴影和过渡效果 */
/* 应用于侧边栏的el-aside组件 */
.el-aside {
  box-shadow: 3px 0 6px rgba(0, 0, 0, 0.2);
  transition: width 0.3s;
  overflow: hidden !important;
}

/* 侧边栏高度控制 */
/* 确保侧边栏和内容区域占满剩余高度 */
/* 应用于侧边栏内的菜单、侧边栏本身和主内容区 */
.el-aside ul,
.el-aside,
.el-main {
  height: calc(100vh - 60px);
  overflow-x: hidden;
}

/* 菜单基础样式 */
/* 设置侧边菜单的背景和模糊效果 */
/* 应用于侧边栏菜单的el-menu组件 */
.el-menu {
  border-right: none;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
}

/* 折叠菜单图标样式 */
/* 调整折叠状态下菜单图标的边距 */
/* 应用于折叠状态下的菜单项图标 */
.el-menu--collapse .el-menu-item i,
.el-menu--collapse .el-submenu__title i {
  margin-left: 4px;
}

/* 折叠菜单文本隐藏 */
/* 隐藏折叠状态下的菜单文本 */
/* 应用于折叠状态下的菜单项和子菜单标题的文本 */
.el-menu--collapse .el-submenu__title span,
.el-menu--collapse .el-menu-item span {
  display: none;
}

/* 折叠菜单箭头隐藏 */
/* 隐藏折叠状态下的子菜单箭头 */
/* 应用于折叠状态下的子菜单箭头图标 */
.el-menu--collapse .el-submenu__icon-arrow {
  display: none;
}

/* 菜单文本样式 */
/* 设置菜单文本的字体大小和粗细 */
/* 应用于菜单中的所有文本span元素 */
span {
  font-size: 16px;
  font-weight: bold;
}

/* 菜单项文本样式 */
/* 设置菜单项的字体大小 */
/* 应用于菜单项的el-menu-item组件 */
.el-menu-item {
  font-size: 15px;
}

/* 一级菜单背景样式 */
/* 设置一级菜单项的渐变背景 */
/* 应用于一级菜单项，class="my-parent-memu-item" */
.my-parent-memu-item {
  background: linear-gradient(135deg, rgba(250, 218, 219, 1), rgba(110, 180, 254, 0.5));
}

/* 二级菜单样式 */
/* 设置二级菜单项的背景和内边距 */
/* 应用于二级菜单项，class="my-child-memu-item" */
.my-child-memu-item {
  background-color: rgb(250, 250, 250);
  padding-left: 50px !important;
}

/* 二级菜单悬停效果 */
/* 设置二级菜单项悬停时的背景色 */
/* 应用于二级菜单项的悬停状态 */
.my-child-memu-item:hover {
  background-color: rgb(242, 243, 244);
}

/* 主内容区样式 */
/* 设置主内容区的背景和边框 */
/* 应用于主内容区的el-main组件 */
.el-main {
  background-color: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 内容滚动区域样式 */
/* 设置内容区域的滚动行为和圆角 */
/* 应用于主内容区内部的div容器 */
.el-main>div {
  overflow-y: auto;
  height: 100%;
  border-radius: 4px;
  scrollbar-color: rgba(255, 255, 255, 0.6) transparent;
}

/* 自定义滚动条样式 */
/* 设置内容区域滚动条的宽度 */
/* 应用于主内容区内部的div容器的滚动条 */
.el-main>div::-webkit-scrollbar {
  width: 15px;
}

/* 滚动条轨道样式 */
/* 设置滚动条轨道的背景 */
/* 应用于滚动条轨道 */
.el-main>div::-webkit-scrollbar-track {
  background: transparent;
}

/* 滚动条滑块样式 */
/* 设置滚动条滑块的背景、圆角和模糊效果 */
/* 应用于滚动条滑块 */
.el-main>div::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 3px;
  backdrop-filter: blur(10px);
}

/* 滚动条滑块悬停效果 */
/* 设置滚动条滑块悬停时的背景色 */
/* 应用于滚动条滑块的悬停状态 */
.el-main>div::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.8);
}

/* 页面切换动画 */
/* 设置路由视图切换的过渡效果 */
/* 应用于路由视图的进入和离开过渡 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.2s;
}

/* 页面进入动画 */
/* 设置路由视图进入时的动画效果 */
/* 应用于路由视图的进入状态 */
.fade-transform-enter {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

/* 页面离开动画 */
/* 设置路由视图离开时的动画效果 */
/* 应用于路由视图的离开状态 */
.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
}

/* 加载动画容器 */
/* 设置加载动画的居中显示 */
/* 应用于加载状态的容器div，class="loading-container" */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 加载图标样式 */
/* 设置加载图标的大小、颜色和旋转动画 */
/* 应用于加载图标的el-icon-loading元素 */
.el-icon-loading {
  font-size: 36px;
  color: var(--primary-color);
  animation: rotating 2s linear infinite;
}

/* 加载旋转动画 */
/* 定义加载图标的旋转关键帧动画 */
/* 应用于加载图标的动画效果 */
@keyframes rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 用户信息容器样式 */
/* 设置顶部用户信息区域的布局 */
/* 应用于用户信息区域div，class="user-info-container" */
.user-info-container {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

/* 用户信息样式 */
/* 设置用户头像和用户名的布局和悬停效果 */
/* 应用于用户信息div，class="user-info" */
.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 10px;
  height: 55px;
  transition: all 0.3s;
}

/* 用户信息悬停效果 */
/* 设置用户信息区域悬停时的背景 */
/* 应用于用户信息div的悬停状态 */
.user-info:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 用户名样式 */
/* 设置用户名的外观和溢出处理 */
/* 应用于用户名文本span，class="username" */
.username {
  margin: 0 8px;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 下拉菜单样式 */
/* 调整用户下拉菜单的位置和宽度 */
/* 应用于用户下拉菜单的el-dropdown-menu组件 */
.el-dropdown-menu {
  margin-top: 5px !important;
  padding: 5px 0;
  min-width: 140px;
  /* 增加最小宽度 */
  border-radius: 4px;
}

/* 下拉菜单项样式 */
/* 设置下拉菜单项的布局和颜色 */
/* 应用于下拉菜单项的el-dropdown-menu__item元素 */
.el-dropdown-menu__item {
  display: flex;
  align-items: center;
  padding: 0 15px;
  height: 36px;
  line-height: 36px;
  font-size: 14px;
  color: #606266;
}

/* 下拉菜单项悬停效果 */
/* 设置下拉菜单项悬停时的背景和颜色 */
/* 应用于下拉菜单项的悬停状态 */
.el-dropdown-menu__item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

/* 下拉菜单图标样式 */
/* 设置下拉菜单项中图标的宽度和对齐 */
/* 应用于下拉菜单项中的图标元素 */
.el-dropdown-menu__item i {
  margin-right: 10px;
  width: 16px;
  text-align: center;
  font-size: 16px;
}

/* 头像样式 */
/* 设置用户头像的阴影和内容填充 */
/* 应用于用户头像中的图片，使用深度选择器修改Element UI内部样式 */
::v-deep .el-avatar img {
  margin-bottom: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100%;
  object-fit: cover !important;
  object-position: center !important;
}

/* 下拉菜单分割线样式 */
/* 自定义下拉菜单中分割线的边距和颜色 */
/* 应用于下拉菜单中的分割线元素 */
.el-dropdown-menu__item--divided:before {
  margin: 0 15px;
  background-color: #cbeee5;
  content: none !important;

}

/* 下拉菜单项内容对齐 */
/* 确保下拉菜单项内容垂直居中 */
/* 应用于下拉菜单项内容div，class="dropdown-menu-item" */
.dropdown-menu-item {
  display: flex;
  align-items: center;
  width: 100%;
}

/* 标志分隔线样式 */
/* 设置标志和系统名称之间的垂直分隔线 */
/* 应用于标志容器中的分隔线div，class="divider" */
.divider {
  width: 2px;
  height: 50%;
  transform: translateY(+10%);
  background-color: #dcdcdc;
  margin-left: 18px;
}

/* 菜单项高度统一样式 */
/* 统一设置菜单项的高度和行高 */
/* 应用于所有菜单项和子菜单标题 */
.el-menu-item, .el-submenu__title {
  height: 56px;
  line-height: 56px;
}
</style>