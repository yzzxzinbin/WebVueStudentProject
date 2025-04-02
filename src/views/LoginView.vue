<template>
    <!--
      @Template_Desc 登录页面主体
        包含背景叠加层、登录表单容器以及登录表单
      @Element_Desc .login-view 页面最外层容器，对整个登录页面进行包裹和布局
      @Element_Desc .background-overlay 背景叠加层，用于增加视觉效果
      @Element_Desc .login-container 登录表单容器，承载登录表单和相关内容
      @Element_Desc .login-header 登录表单头部，包含标题和副标题
      @Element_Desc .login-form 登录表单，包含用户名、密码输入框及登录按钮
      @Element_Desc .form-group 表单分组容器，用于包裹每个输入框及其标签
      @Element_Desc .form-options 表单选项区域，包含“保持登录状态”复选框和“忘记密码”链接
      @Element_Desc .login-button 登录按钮，用于提交登录表单
    -->
    <div class="login-view">
        <div class="background-overlay"></div>
        <div class="login-container mosaic-glass">
            <div class="login-header">
                <h1>欢迎登录</h1>
                <p class="subtitle">请使用您的账户凭证登录系统</p>
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <div class="input-wrapper">
                        <el-input
                            id="username"
                            v-model="username"
                            placeholder="请输入用户名"
                            prefix-icon="el-icon-user"
                            class="input-field"
                            clearable
                        />
                    </div>
                </div>

                <div class="form-group">
                    <label for="password">密码</label>
                    <div class="input-wrapper">
                        <el-input
                            id="password"
                            v-model="password"
                            placeholder="请输入密码"
                            prefix-icon="el-icon-lock"
                            show-password
                            class="input-field"
                        />
                    </div>
                </div>

                <div class="form-options">
                    <label class="remember-me">
                        <el-checkbox v-model="rememberMe"></el-checkbox>
                        <span>保持登录状态</span>
                    </label>
                    <a href="#" class="forgot-password">忘记密码?</a>
                </div>

                <el-button
                    type="primary"
                    class="login-button"
                    :loading="isLoading"
                    native-type="submit"
                >
                    登 录
                </el-button>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    name: "LoginView",
    data() {
        return {
            username: "",
            password: "",
            rememberMe: false,
            isLoading: false,
            ipAddress: '',
        };
    },
    methods: {
        /**
         * @Function_Para 处理登录表单提交
         *   由登录按钮点击或表单提交触发 (@submit.prevent="handleLogin")
         * @Function_Caller 被模板中的登录表单的 @submit.prevent 事件调用
         * @Function_Meth 执行用户登录流程:
         *   - 验证用户名和密码是否填写
         *   - 调用认证方法验证用户凭据
         *   - 获取用户IP地址并记录登录历史
         *   - 更新用户最后登录时间
         *   - 根据"记住我"选项保存登录状态
         *   - 登录成功后显示欢迎信息并跳转到主页
         * @Function_API 
         *   - localStorage API: 存储登录历史和用户信息
         *   - fetch API: 获取IP地址信息
         *   - Vue Router: 页面跳转
         *   - Element UI Message: 显示提示信息
         */
        async handleLogin() {
            if (!this.username || !this.password) {
                this.$message.error('请输入用户名和密码');
                return;
            }

            this.isLoading = true;

            try {
                const user = await this.authenticateUser(this.username, this.password);
                const ip = await this.getIPAddress();

                if (user) {
                    // 保存登录历史
                    const loginHistory = JSON.parse(localStorage.getItem('loginHistory')) || [];
                    const currentLogin = {
                        timestamp: new Date().toISOString(),
                        ip: ip,
                        device: this.getDeviceInfo(),
                        userId: user.id
                    };
                    loginHistory.push(currentLogin);
                    localStorage.setItem('loginHistory', JSON.stringify(loginHistory.slice(-50)));

                    // 更新用户最后登录时间
                    user.lastLogin = new Date().toISOString();
                    localStorage.setItem("user", JSON.stringify(user));

                    if (this.rememberMe) {
                        localStorage.setItem("token", this.generateToken(user));
                    }else {
                        sessionStorage.setItem("token", this.generateToken(user));
                    }

                    this.$message.success(`欢迎回来，${user.name || user.username}`);

                    // 根据用户角色重定向
                    let redirectPath = '/list/products'; // 默认路由
                    if (user.role === 'admin') {
                        redirectPath = '/system/users';
                    } else if (user.role === 'manager') {
                        redirectPath = '/list/warehouses';
                    } else if (user.role === 'operator') {
                        redirectPath = '/operation';
                    }

                    this.$router.push(redirectPath).catch(err => {
                        if (err.name !== 'NavigationDuplicated') {
                            throw err;
                        }
                    });
                } else {
                    // 这里不再显示错误信息，因为已经在authenticateUser中处理了
                }
            } catch (error) {
                this.$message.error("登录失败：" + error.message);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * @Function_Para 获取用户IP地址
         *   无参数，由handleLogin方法内部调用
         * @Function_Caller 被 handleLogin 方法调用，用于记录登录历史
         * @Function_Meth 通过外部API获取用户的IP地址
         *   - 发送请求到ipapi.co服务
         *   - 解析返回的JSON数据
         *   - 提取并返回IP地址
         * @Function_API
         *   - fetch API: 发送网络请求获取IP信息
         */
        async getIPAddress() {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                this.ipAddress = data.ip; // 更新组件数据（可选）
                return data.ip; // 直接返回IP字符串
            } catch (error) {
                console.error('获取IP失败:', error);
                return 'Unknown'; // 返回默认值
            }
        },

        /**
         * @Function_Para 获取设备信息
         *   无参数，由handleLogin使用
         * @Function_Caller 被 handleLogin 方法调用，用于记录登录历史
         * @Function_Meth 分析用户代理字符串识别用户设备类型
         * @Function_API
         *   - navigator.userAgent: 获取浏览器用户代理信息
         */
        getDeviceInfo() {
            const ua = navigator.userAgent;
            if (ua.match(/Android/i)) return 'Android';
            if (ua.match(/iPhone|iPad|iPod/i)) return 'iOS';
            if (ua.match(/Windows/i)) return 'Windows';
            if (ua.match(/Macintosh/i)) return 'Mac';
            if (ua.match(/Linux/i)) return 'Linux';
            return 'Unknown Device';
        },

        /**
         * @Function_Para 用户认证方法
         *   @param {string} username - 用户输入的用户名
         *   @param {string} password - 用户输入的密码
         * @Function_Caller 被 handleLogin 方法调用，用于验证用户凭据
         * @Function_Meth 验证用户凭据:
         *   - 从localStorage获取用户数据
         *   - 对输入的密码进行哈希处理
         *   - 检查用户名和密码是否匹配
         * @Function_API
         *   - localStorage API: 读取用户数据
         *   - Promise API: 提供异步处理能力
         */
        authenticateUser(username, password) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const users = JSON.parse(localStorage.getItem('users')) || [];
                    console.log('存储的用户列表:', users); // 调试

                    const user = users.find(u => u.username === username);
                    console.log('找到的用户:', user); // 调试

                    if (!user) {
                        console.log('用户不存在');
                        resolve(null);
                        return;
                    }

                    // 检查用户状态
                    if (user.status === 'disabled') {
                        console.log('账户已被禁用');
                        this.$message.error('您的账户已被禁用，请联系管理员');
                        resolve(null);
                        return;
                    }

                    const inputHash = this.hashPassword(password);
                    console.log('输入密码哈希:', inputHash);
                    console.log('存储密码哈希:', user.password);

                    if (user.password === inputHash) {
                        console.log('密码匹配成功');
                        user.lastLogin = new Date().toISOString();
                        localStorage.setItem('users', JSON.stringify(users));
                        resolve(user);
                    } else {
                        console.log('密码不匹配');
                        this.$message.error('用户名或密码错误');
                        resolve(null);
                    }
                }, 300);
            });
        },

        /**
         * @Function_Para 密码哈希处理
         *   @param {string} password - 原始密码
         * @Function_Caller 被 authenticateUser 和 initAdminUser 方法调用，用于加密密码
         * @Function_Meth 执行简单的密码哈希处理
         *   - 将密码字符串反转并附加长度值
         * @Function_API 仅使用JavaScript字符串操作
         */
        hashPassword(password) {
            // 简单示例哈希，实际项目应使用更安全的算法
            return password.split('').reverse().join('') + password.length;
        },

        /**
         * @Function_Para 生成用户令牌
         *   @param {Object} user - 用户对象
         * @Function_Caller 被 handleLogin 方法调用，用于生成认证令牌
         * @Function_Meth 创建简单的认证令牌，用于"记住我"功能
         * @Function_API
         *   - btoa(): 进行Base64编码
         */
        generateToken(user) {
            return btoa(`${user.id}:${user.username}:${Date.now()}`);
        },

        /**
         * @Function_Para 初始化管理员用户
         *   无参数，在组件创建时自动调用
         * @Function_Caller 被组件的 created 生命周期钩子调用，用于初始化系统管理员账户
         * @Function_Meth 确保系统中至少有一个管理员账户:
         *   - 检查是否存在admin用户
         *   - 如果不存在，创建默认管理员账户
         * @Function_API
         *   - localStorage API: 读写用户数据
         */
        initAdminUser() {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const adminExists = users.some(u => u.username === 'admin');

            if (!adminExists) {
                const adminUser = {
                    id: this.generateId(),
                    username: 'admin',
                    password: this.hashPassword('123456'),
                    name: '系统管理员',
                    role: 'admin',
                    email: 'admin@example.com',
                    phone: '',
                    department: '系统管理部',
                    createdAt: new Date().toISOString(),
                    lastLogin: null,
                    status: 'active'
                };
                users.push(adminUser);
                localStorage.setItem('users', JSON.stringify(users));
                console.log('默认管理员账户已创建');
            }
        },

        /**
         * @Function_Para 生成唯一ID
         *   无参数
         * @Function_Caller 被 initAdminUser 方法调用，用于生成用户ID
         * @Function_Meth 生成基于时间戳和随机数的唯一标识符
         * @Function_API
         *   - Date.now(): 获取当前时间戳
         *   - Math.random(): 生成随机数
         */
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
    },

    created() {
        this.initAdminUser();
        this.getIPAddress();

    }

};
</script>

<style>
/* 基础样式 */
/* 定义全局CSS变量，用于颜色和过渡效果的统一管理 */
:root {
    --primary-color: #409EFF;
    --primary-hover: #3a56d4;
    --text-color: #2b2d42;
    --light-text: rgba(255, 255, 255, 0.8);
    --border-color: rgba(255, 255, 255, 0.3);
    --background-color: #1e2130;
    --white: #ffffff;
    --wechat-green: #07C160;
    --alipay-blue: #1677FF;
    --shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    --transition: all 0.3s ease;
}

body {

    .login-title {
        font-size: 24px;
    }

    padding: 0;
}

/* Element UI组件样式覆盖 */
/* 自定义复选框样式，确保与登录页面设计风格一致 */
.el-checkbox__inner {
    transform: translateY(2px);
    border-width: 2px !important;
    border-color: rgba(0, 0, 0, 0.3) !important;
    background-color: rgba(255, 255, 255, 0.1) !important;
    margin-right: 6px;
}

.el-checkbox__inner::after {
    border-color: var(--primary-color) !important;
    border-width: 2px;
}
</style>


<style scoped>
/* 基础重置样式 */
/* 重置所有元素的盒模型为border-box并清除默认边距 */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* 背景样式 */
/* 设置登录页面的全屏背景及叠加层 */
.login-view {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    padding: 0%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
    background-image: url("../assets/images/a.png");
    background-size: cover;
    position: relative;
}

/* 背景叠加层，增加对比度和视觉效果 */
.background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(201, 205, 221, 0.3);
    z-index: 0;
}

/* 磨砂玻璃效果容器 */
/* 为登录卡片应用磨砂玻璃效果，提升现代感 */
.mosaic-glass {
    background-color: rgba(255, 255, 255, 0.4);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    /* border: 1px solid var(--border-color); */
    border-radius: 16px;
    width: 100%;
    max-width: 420px;
    overflow: hidden;
    transition: var(--transition);
    z-index: 1;
    box-shadow: var(--shadow);
}

/* 登录页头部 */
/* 包含标题和副标题的顶部区域样式 */
.login-header {
    padding: 36px 32px 28px;
    text-align: center;
    border-bottom: 1px solid var(--border-color);
    background-color: rgba(211, 57, 57, 0.3);
}

.login-header h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
    letter-spacing: 1px;
}

.login-header .subtitle {
    font-size: 14px;
    opacity: 0.9;
}

/* 登录表单样式 */
/* 设置表单容器、输入字段和按钮的样式 */
.login-form {
    padding: 32px;
    /* background-color: rgba(255, 255, 255, 0.3); */
}

.form-group {
    margin-bottom: 24px;
}

.form-group label {
    display: block;
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 500;

}

.input-wrapper {
    position: relative;
}



.input-field {
    width: 100%;
    transition: var(--transition);
}

/* 输入框样式 */
/* 自定义Element UI输入框的外观，包括聚焦和图标状态 */
.el-input /deep/ .el-input__inner {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 14px 16px 14px 44px;
    font-size: 15px;
    color: rgba(0, 0, 0, 0.4);
    transition: all 0.3s ease;
}

.el-input /deep/ .el-input__inner:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px rgba(74, 107, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.15);
    color: black;
}

.el-input /deep/ .el-input__prefix {
    left: 14px;
    color: var(--shadow);
}

.el-input.is-focus /deep/ .el-input__prefix {
    color: var(--primary-color);
}

/* 表单选项区域 */
/* "记住我"选项和"忘记密码"链接的布局 */
.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    font-size: 13px;
}

.remember-me {
    display: flex;
    align-items: center;
    cursor: pointer;
    /* color: var(--light-text); */
}

.remember-me input {
    margin-right: 12px;
    cursor: pointer;
    accent-color: var(--primary-color);
}



.forgot-password {
    color: var(--primary-color);
    text-decoration: none;
    transition: var(--transition);
}

.forgot-password:hover {
    color: var(--primary-color);
    text-decoration: underline;
}

/* 登录按钮样式 */
/* 主要登录按钮的外观和悬停效果 */
.login-button {
    width: 100%;
    padding: 16px;
    font-size: 16px;
    font-weight: 500;
    color: var(--white);
    /* background-color: var(--primary-color); */
    background-color: rgba(74, 107, 255, 0.8);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: var(--transition);
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    letter-spacing: 1px;
    backdrop-filter: blur(10px);
}

.login-button:hover {
    background-color: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 107, 255, 0.4);
}

/* 加载动画不再需要，Element UI 按钮有内置加载状态 */

/* 分隔线 */
.divider {
    position: relative;
    margin: 28px 0;
    text-align: center;
    color: var(--light-text);
    font-size: 13px;
}

.divider::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: var(--border-color);
    z-index: 1;
}

.divider span {
    position: relative;
    padding: 0 12px;
    background-color: transparent;
    z-index: 2;
}


/* 响应式设计 */
/* 在小屏幕设备上调整布局和元素大小 */
@media (max-width: 480px) {
    .login-container {
        border-radius: 0;
        max-width: 100%;
    }

    .login-header,
    .login-form {
        padding: 24px;
    }

    .social-login {
        grid-template-columns: 1fr;
    }
}
</style>