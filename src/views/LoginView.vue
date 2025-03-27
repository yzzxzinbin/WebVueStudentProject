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
            isLoading: false
        };
    },
    methods: {
        handleLogin() {
            if (this.username && this.password) {
                this.isLoading = true;
                // 模拟登录逻辑
                setTimeout(() => {
                    this.isLoading = false;
                    if (this.username === "admin" && this.password === "123456") {
                        // 存储 token
                        localStorage.setItem("token", "mock-token");
                        if (this.rememberMe) {
                            localStorage.setItem("rememberMe", true);
                        }
                        this.$message.success("登录成功！");
                        this.$router.push({ path: "/" }); // 跳转到首页
                    } else {
                        this.$message.error("用户名或密码错误！");
                    }
                }, 1000);
            } else {
                this.$message.error("请输入用户名和密码！");
            }
        }
    },
};
</script>

<style>
/* 基础样式 */
:root {
    --primary-color: #4a6bff;
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

    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    color: var(--white);
    margin: 0%;
    padding: 0;
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
    background-image: url("../assets/a.png");
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
    /* color: var(--white); */
    letter-spacing: 1px;
}

.login-header .subtitle {
    font-size: 14px;
    /* color: var(--light-text); */
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
    /* color: var(--light-text); */
}

.input-wrapper {
    position: relative;
}

.input-field {
    width: 100%;
    padding: 14px 16px 14px 44px;
    font-size: 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: var(--transition);
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--white);
}

.input-field:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(74, 107, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.15);
}

.input-field::placeholder {
    color: rgba(255, 255, 255, 0.5);
}

.input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    /* color: var(--light-text); */
    transition: var(--transition);
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
    margin-right: 8px;
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

/* 社交登录 */
.social-login {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
}

.social-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    font-size: 14px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition: var(--transition);
    color: var(--white);
}

.social-button svg {
    margin-right: 8px;
}

.social-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.social-button.wechat {
    color: var(--wechat-green);
    border-color: rgba(7, 193, 96, 0.3);
}

.social-button.wechat:hover {
    background-color: rgba(7, 193, 96, 0.1);
}

.social-button.alipay {
    color: var(--alipay-blue);
    border-color: rgba(22, 119, 255, 0.3);
}

.social-button.alipay:hover {
    background-color: rgba(22, 119, 255, 0.1);
}

/* 注册链接 */
.signup-link {
    text-align: center;
    font-size: 14px;
    /* color: var(--light-text); */
}

.signup-link a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    transition: var(--transition);
}

.signup-link a:hover {
    text-decoration: underline;
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