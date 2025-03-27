<template>
  <div class="layout">
    <el-container>
      <!-- 系统头部 -->
      <el-header>
        <span>xxx管理系统</span>
        <!-- 搜索框 -->
        <el-input
          v-model="searchQuery"
          placeholder="请输入搜索内容"
          class="search-box"
          @input="handleSearch"
          clearable
        ></el-input>
        <!-- 退出 -->
        <div><i class="el-icon-switch-button" @click="logout"></i></div>
      </el-header>
      <el-container>
        <!-- 侧边导航 -->
        <el-aside width="200px">
          <el-menu
            :default-active="activeMenu"
            @select="selectHandle"
            class="el-menu-vertical-demo"
            :router="true"
          >
            <div v-for="(item,index) in menus" :key="index">
              <!-- 一级菜单 -->
              <el-menu-item v-if="!item.children || item.children.length == 0" :index="item.path">
                <i :class="item.icon"></i>
                <span>{{ item.title }}</span>
              </el-menu-item>
              <!-- 二级菜单 -->
              <el-submenu v-else :index="item.path">
                <template slot="title">
                  <i :class="item.icon"></i>
                  <span>{{ item.title }}</span>
                </template>
                <el-menu-item v-for="(it,i) in item.children" :key="i" :index="it.path">{{ it.title }}</el-menu-item>
              </el-submenu>
            </div>
          </el-menu>
        </el-aside>
        <!-- 显示区域 -->
        <el-main>
          <div>
            <router-view></router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
export default {
  data(){
    return {
      activeMenu: '',
      searchQuery: '', // 搜索框绑定的数据
      // 菜单数组
      menus: [
        { 
          // 一级菜单
          path: '/user',
          title: '用户管理',
          icon: 'el-icon-user',
          children: [
            // 二级菜单
            {
              path: '/user',
              title: '学生管理',
            },
            {
              path: '/staff',
              title: '教职工管理',
            }
          ]
        },{
          path: '/building',
          title: '楼栋管理',
          icon: 'el-icon-office-building',
          children: [
          ]
        }
      ]
    }
  },
  methods: {
    // 激活菜单
    selectHandle(index,indexPath){
      // console.log(index,indexPath)
      localStorage.setItem('selectMenu', index)
    },
    // 退出登录
    logout() {
      this.$router.push({
        path: "/login",
      });
      // 消息提示
      this.$message({
        message: '退出登录！',
        type: 'success'
      });
      localStorage.setItem("token", "");
      localStorage.setItem("selectMenu", "");
    },
    // 搜索框输入事件
    handleSearch() {
      console.log('搜索内容:', this.searchQuery);
      // 可在此处添加搜索逻辑
    }
  },
  created(){
    this.activeMenu = localStorage.getItem('selectMenu') ? localStorage.getItem('selectMenu') : this.menus[0].path
  }
};
</script>

<style scoped>
.layout {
  height: 100vh;
  background-image: url("../assets/images/3.png");
  background-size: 100% 100%;
}
.el-aside ul,
.el-aside,
.el-main {
  height: calc(100vh - 60px);
}
.el-header {
  background-color: #ffffff20;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.el-main {
  background-color: #f6f6f6d4;
}
.el-main>div {
  overflow-y: auto;
  height: 100%;
  background-color: #fff;
  border-radius: 4px;
}

.el-header {
  text-align: center;
  line-height: 60px;
  font-size: 2em;
  font-weight: 600;
}
.el-header div {
  float: right;
  height: 60px;
  cursor: pointer;
}
.search-box {
  width: 300px;
  margin-right: 20px;
}
</style>
