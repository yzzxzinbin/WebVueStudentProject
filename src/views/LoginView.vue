<template>
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
                        <input type="text" id="username" v-model="username" placeholder="请输入用户名" required
                            class="input-field" />
                        <span class="input-icon">
                            <i class="el-icon-user"></i>
                        </span>
                    </div>
                </div>

                <div class="form-group">
                    <label for="password">密码</label>
                    <div class="input-wrapper">
                        <input type="password" id="password" v-model="password" placeholder="请输入密码" required
                            class="input-field" />
                        <span class="input-icon">
                            <i class="el-icon-lock"></i>
                        </span>
                    </div>
                </div>

                <div class="form-options">
                    <label class="remember-me">
                        <el-checkbox v-model="rememberMe"></el-checkbox>
                        <span>保持登录状态</span>
                    </label>
                    <a href="#" class="forgot-password">忘记密码?</a>
                </div>

                <button type="submit" class="login-button">
                    <span v-if="!isLoading">登 录</span>
                    <span v-else class="loading-spinner"></span>
                </button>
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
        // 添加设备信息格式化方法
        getDeviceInfo() {
            const ua = navigator.userAgent;
            if (ua.match(/Android/i)) return 'Android';
            if (ua.match(/iPhone|iPad|iPod/i)) return 'iOS';
            if (ua.match(/Windows/i)) return 'Windows';
            if (ua.match(/Macintosh/i)) return 'Mac';
            if (ua.match(/Linux/i)) return 'Linux';
            return 'Unknown Device';
        },

        // 用户认证方法
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
                        resolve(null);
                    }
                }, 300);
            });
        },

        // 简单的密码哈希函数
        hashPassword(password) {
            // 简单示例哈希，实际项目应使用更安全的算法
            return password.split('').reverse().join('') + password.length;
        },

        // 生成简单token
        generateToken(user) {
            return btoa(`${user.id}:${user.username}:${Date.now()}`);
        },
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
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* 背景层 */
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

.background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(201, 205, 221, 0.3);
    z-index: 0;
}

/* 磨砂玻璃效果 */
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

/* 登录头部 */
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

/* 登录表单 */
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

.input-field:-webkit-autofill {
    -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.1) inset;
    /* 强制背景色为白色 */
    transition: background-color 50000s ease-in-out 0s;
    /* 防止浏览器重新渲染背景色 */
}

.input-field {
    width: 100%;
    padding: 14px 16px 14px 44px;
    font-size: 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: var(--transition);
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(0, 0, 0, 0.4);
}

.input-field:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px rgba(74, 107, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.15);
    color: black;
    transition:
        border-color 0.3s ease,
        box-shadow 0.3s ease,
        background-color 0.3s ease,
        color 0.3s ease;
}

.input-field::placeholder {
    color: rgba(0, 0, 0, 0.4);
    transition: all 0.5s ease;
}

.input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--shadow);
    transition: var(--transition);
    transition: all 0.5s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.input-field:focus+.input-icon {
    color: var(--primary-color);
}

/* 表单选项 */
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

/* 登录按钮 */
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

/* 加载动画 */
.loading-spinner {
    width: 22px;
    height: 22px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: var(--white);
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

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