<template>
    <!--
        @Template_Desc 用户个人中心页面
        包含用户信息展示、活动记录、修改密码、编辑个人档案等功能
        @Element_Desc .user-profile 页面最外层容器
        @Element_Desc .profile-card 用户信息卡片
        @Element_Desc .activity-card 用户活动记录卡片
        @Element_Desc .avatar-section 用户头像区域
        @Element_Desc .info-section 用户信息区域
        @Element_Desc .action-buttons 操作按钮区域
        @Element_Desc .activity-table 活动记录表格
        @Element_Desc el-dialog 修改密码、编辑个人档案、编辑单个字段的弹窗
    -->
    <div class="user-profile">
        <!-- 用户信息卡片 - 优化后的布局 -->
        <el-card shadow="hover" class="profile-card">
            <div v-if="isViewingOtherUser" class="viewing-notice">
                <el-alert title="您正在查看其他用户的主页" type="info" show-icon :closable="false">
                    <template #title>
                        <div class="alert-title-content">
                            <span>您正在查看其他用户的主页</span>
                            <el-button type="primary" size="mini" @click="$router.push('/system/profile')">
                                返回我的主页
                            </el-button>
                        </div>
                    </template>
                </el-alert>
            </div>
            <div class="profile-header">
                <h2>个人中心</h2>
            </div>
            <hr class="custom-hr">
            <div class="profile-content">
                <div class="avatar-section">
                    <el-avatar :size="120" :src="userInfo.avatar || require('@/assets/default-avatar.svg')"
                        class="avatar"></el-avatar>
                    <el-upload class="avatar-uploader" action="#" :show-file-list="false" :auto-upload="false"
                        :on-change="handleAvatarChange">
                        <el-button size="small" type="primary" plain round>更换头像</el-button>
                    </el-upload>
                </div>
                <div class="info-section">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">用户名：</span>
                            <span class="info-value">{{ userInfo.username }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">姓名：</span>
                            <div class="info-value-edit">
                                <span>{{ userInfo.name || '未设置' }}</span>
                                <el-button size="mini" type="text" icon="el-icon-edit"
                                    @click="editField('name')"></el-button>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">角色：</span>
                            <el-tag :type="getRoleTagType(userInfo.role)" size="small" effect="dark">
                                {{ formatRole(userInfo.role) }}
                            </el-tag>
                        </div>
                        <div class="info-item">
                            <span class="info-label">电话：</span>
                            <div class="info-value-edit">
                                <span>{{ userInfo.phone || '未设置' }}</span>
                                <el-button size="mini" type="text" icon="el-icon-edit"
                                    @click="editField('phone')"></el-button>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">邮箱：</span>
                            <div class="info-value-edit">
                                <span>{{ userInfo.email || '未设置' }}</span>
                                <el-button size="mini" type="text" icon="el-icon-edit"
                                    @click="editField('email')"></el-button>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">部门：</span>
                            <div class="info-value-edit">
                                <span>{{ userInfo.department || '未设置' }}</span>
                                <el-button size="mini" type="text" icon="el-icon-edit"
                                    @click="editField('department')"></el-button>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">职位：</span>
                            <div class="info-value-edit">
                                <span>{{ userInfo.position || '未设置' }}</span>
                                <el-button size="mini" type="text" icon="el-icon-edit"
                                    @click="editField('position')"></el-button>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">最后登录：</span>
                            <span class="info-value">{{ formatTime(userInfo.lastLogin) }}</span>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <el-button type="primary" size="small" @click="showPasswordDialog"
                            icon="el-icon-lock">修改密码</el-button>
                        <el-button type="warning" size="small" @click="showProfileDialog"
                            icon="el-icon-edit">编辑完整档案</el-button>
                    </div>
                </div>
            </div>
        </el-card>

        <!-- 用户活动记录 - 优化后的布局 -->
        <el-card shadow="hover" class="activity-card">
            <div class="activity-header">
                <el-tabs v-model="activeTab" @tab-click="handleTabChange" class="compact-tabs">
                    <el-tab-pane label="登录历史" name="login"></el-tab-pane>
                    <el-tab-pane label="操作记录" name="operations"></el-tab-pane>
                    <el-tab-pane label="授权仓库" name="warehouses"></el-tab-pane>
                </el-tabs>
            </div>
            <div class="activity-table">
                <el-table :data="activityData" stripe border v-loading="loading" style="width: 100%"
                    :header-cell-style="{ background: '#f5f7fa', color: '#606266' }" class="compact-table">
                    <el-table-column v-if="activeTab === 'login'" prop="timestamp" label="登录时间" width="180"
                        :formatter="formatTime">
                    </el-table-column>
                    <el-table-column v-if="activeTab === 'login'" prop="ip" label="IP地址" width="150">
                    </el-table-column>
                    <el-table-column v-if="activeTab === 'login'" prop="device" label="设备信息">
                    </el-table-column>

                    <el-table-column v-if="activeTab === 'operations'" prop="timestamp" label="操作时间" width="180"
                        :formatter="formatTime">
                    </el-table-column>
                    <el-table-column v-if="activeTab === 'operations'" prop="type" label="操作类型" width="120">
                        <template slot-scope="{row}">
                            <el-tag :type="getOperationTagType(row.type)" size="small" effect="light">
                                {{ row.type }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column v-if="activeTab === 'operations'" prop="details" label="操作详情">
                    </el-table-column>
                    <el-table-column v-if="activeTab === 'operations'" prop="warehouse" label="相关仓库" width="150">
                    </el-table-column>
                    <el-table-column v-if="activeTab === 'warehouses'" prop="name" label="仓库名称" width="180">
                    </el-table-column>
                    <el-table-column v-if="activeTab === 'warehouses'" prop="location" label="仓库位置">
                    </el-table-column>
                    <el-table-column v-if="activeTab === 'warehouses'" label="授权状态" width="120">
                        <template slot-scope="{row}">
                            <el-tag type="success" size="small" effect="light">
                                已授权
                            </el-tag>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-card>

        <!-- 修改密码对话框 -->
        <el-dialog title="修改密码" :visible.sync="passwordDialogVisible" width="500px">
            <el-form :model="passwordForm" :rules="passwordRules" ref="passwordForm" label-width="100px">
                <el-form-item label="原密码" prop="oldPassword">
                    <el-input type="password" v-model="passwordForm.oldPassword" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                    <el-input type="password" v-model="passwordForm.newPassword" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                    <el-input type="password" v-model="passwordForm.confirmPassword" autocomplete="off"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="passwordDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="updatePassword">确定</el-button>
            </span>
        </el-dialog>

        <!-- 编辑个人档案对话框 -->
        <el-dialog title="编辑个人档案" :visible.sync="profileDialogVisible" width="600px">
            <el-form :model="profileForm" label-width="100px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="用户名">
                            <el-input v-model="profileForm.username" disabled></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="姓名">
                            <el-input v-model="profileForm.name"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="邮箱">
                            <el-input v-model="profileForm.email"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="电话">
                            <el-input v-model="profileForm.phone"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="部门">
                            <el-input v-model="profileForm.department"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="职位">
                            <el-input v-model="profileForm.position"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="profileDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="updateProfile">保存</el-button>
            </span>
        </el-dialog>

        <!-- 编辑单个字段对话框 -->
        <el-dialog :title="'编辑' + fieldLabels[editFieldName]" :visible.sync="fieldDialogVisible" width="400px">
            <el-form :model="fieldForm" label-width="80px">
                <el-form-item :label="fieldLabels[editFieldName]">
                    <el-input v-model="fieldForm.value"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="fieldDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveField">保存</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { format } from 'date-fns'

export default {
    name: 'UserProfile',
    data() {
        /**
         * @Function_Para 密码确认验证函数
         *   @param {Object} rule - 验证规则对象
         *   @param {string} value - 输入的确认密码值
         *   @param {Function} callback - 验证回调函数
         * @Function_Meth 验证确认密码是否与新密码一致
         * @Function_API 无外部API调用
         */
        const validatePassword = (rule, value, callback) => {
            if (value !== this.passwordForm.newPassword) {
                callback(new Error('两次输入的密码不一致'))
            } else {
                callback()
            }
        }

        return {
            db: null,
            userInfo: {},
            activeTab: 'login',
            loading: false,
            activityData: [],
            passwordDialogVisible: false,
            profileDialogVisible: false,
            fieldDialogVisible: false,
            // 添加一个标志位表示是否查看他人主页
            isViewingOtherUser: false,
            // 添加一个字段存储目标用户ID
            targetUserId: null,
            passwordForm: {
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            },
            profileForm: {},
            fieldForm: {
                value: ''
            },
            editFieldName: '',
            fieldLabels: {
                name: '姓名',
                email: '邮箱',
                department: '部门'
            },
            passwordRules: {
                oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
                newPassword: [
                    { required: true, message: '请输入新密码', trigger: 'blur' },
                    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
                ],
                confirmPassword: [
                    { required: true, message: '请确认新密码', trigger: 'blur' },
                    { validator: validatePassword, trigger: 'blur' }
                ]
            },
            fieldLabels: {
                name: '姓名',
                phone: '电话',
                email: '邮箱',
                department: '部门',
                position: '职位'
            }
        }
    },
    
    /**
     * @Function_Para 组件创建生命周期钩子
     * @Function_Meth 初始化组件:
     *   1. 检查路由参数，确定是否查看他人主页
     *   2. 初始化IndexedDB
     *   3. 加载用户信息和活动数据
     *   4. 清理旧头像数据
     * @Function_API
     *   - Vue Router: 获取路由参数
     *   - localStorage: 获取用户数据
     *   - IndexedDB: 初始化数据库
     */
    async created() {
        // 检查路由参数中是否有 userId
        this.targetUserId = this.$route.query.userId;
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        this.isViewingOtherUser = this.targetUserId && this.targetUserId !== currentUser.id;

        await this.initAvatarDB(); // 确保数据库初始化完成
        await this.loadUserInfo(); // 再加载用户信息
        this.loadActivityData();
        this.cleanupOldAvatars();
    },

    methods: {
        /**
         * @Function_Para 初始化头像数据库
         *   无参数
         * @Function_Meth 创建和初始化用于存储用户头像的IndexedDB数据库
         * @Function_API
         *   - IndexedDB API: 创建/打开数据库和对象存储
         *   - Promise API: 提供异步处理能力
         * @Function_Caller 被组件created生命周期调用
         */
        initAvatarDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('AvatarDB', 1)

                request.onupgradeneeded = (event) => {
                    const db = event.target.result
                    if (!db.objectStoreNames.contains('avatars')) {
                        db.createObjectStore('avatars', { keyPath: 'userId' })
                    }
                }

                request.onsuccess = (event) => {
                    this.db = event.target.result
                    resolve() // 明确标记初始化完成
                }

                request.onerror = (event) => {
                    console.error('数据库初始化失败:', event.target.error)
                    reject(event.target.error)
                }
            })
        },

        /**
         * @Function_Para 保存头像到数据库
         *   @param {string} userId - 用户ID
         *   @param {string} avatarData - Base64编码的头像数据
         * @Function_Meth 将头像数据保存到IndexedDB
         * @Function_API
         *   - IndexedDB API: 事务处理和数据存储
         * @Function_Caller 被handleAvatarChange方法调用
         */
        async saveAvatarToDB(userId, avatarData) {
            if (!this.db) return false

            return new Promise((resolve) => {
                const transaction = this.db.transaction(['avatars'], 'readwrite')
                const store = transaction.objectStore('avatars')

                const request = store.put({ userId, avatarData })

                request.onsuccess = () => resolve(true)
                request.onerror = () => resolve(false)
            })
        },

        /**
         * @Function_Para 从数据库读取头像
         *   @param {string} userId - 用户ID
         * @Function_Meth 从IndexedDB检索指定用户的头像数据
         * @Function_API
         *   - IndexedDB API: 事务处理和数据读取
         * @Function_Caller 被loadUserInfo方法调用
         */
        async getAvatarFromDB(userId) {
            if (!this.db) return null

            return new Promise((resolve) => {
                const transaction = this.db.transaction(['avatars'], 'readonly')
                const store = transaction.objectStore('avatars')

                const request = store.get(userId)

                request.onsuccess = () => resolve(request.result?.avatarData || null)
                request.onerror = () => resolve(null)
            })
        },

        /**
         * @Function_Para 处理头像上传变更
         *   @param {Object} file - 文件对象
         *   Template引用: el-upload组件的:on-change事件
         * @Function_Meth 处理用户头像更新:
         *   1. 读取选择的图片文件
         *   2. 转换为Base64编码
         *   3. 保存到IndexedDB
         *   4. 更新界面显示和通知其他组件
         * @Function_API
         *   - FileReader API: 读取文件内容
         *   - IndexedDB API: 保存头像数据
         *   - Vue事件总线: 通知头像更新
         * @Function_Caller 被头像上传组件的:on-change事件调用
         */
        async handleAvatarChange(file) {
            const reader = new FileReader()
            reader.onload = async (e) => {
                const avatarData = e.target.result
                try {
                    // 调试：打印即将存储的数据
                    console.log('准备存储的头像数据:', avatarData.slice(0, 50) + '...')
                    const success = await this.saveAvatarToDB(this.userInfo.id, avatarData)

                    if (success) {
                        console.log('IndexedDB存储确认')
                        // 立即验证存储结果
                        const storedData = await this.getAvatarFromDB(this.userInfo.id)
                        console.log('读取已存储的头像:', storedData?.slice(0, 50) + '...')
                        this.$eventBus.$emit(`avatar-updated-${this.userInfo.id}`, avatarData) // 触发事件
                        this.userInfo.avatar = avatarData
                        this.profileForm.avatar = avatarData
                    }
                } catch (error) {
                    console.error('头像更新全过程失败:', error)
                }
            }
            reader.readAsDataURL(file.raw)
        },

        /**
         * @Function_Para 加载用户信息
         *   无参数
         * @Function_Meth 获取并组装用户信息:
         *   1. 从localStorage获取基本信息
         *   2. 根据查看模式(自己/他人)获取相应用户数据
         *   3. 从IndexedDB加载用户头像
         * @Function_API
         *   - localStorage API: 读取用户数据
         *   - IndexedDB API: 读取头像数据
         *   - Vue Router: 处理路由重定向
         * @Function_Caller 被组件created生命周期和路由监听器调用
         */
        async loadUserInfo() {
            // 1. 从localStorage加载当前用户基本信息
            const currentUserData = JSON.parse(localStorage.getItem('user')) || {};

            // 2. 从users数组中获取要显示的用户信息
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userToDisplay = this.isViewingOtherUser
                ? users.find(u => u.id === this.targetUserId)
                : users.find(u => u.id === currentUserData.id);

            if (!userToDisplay) {
                this.$message.error('用户不存在');
                this.$router.replace('/system/profile');
                return;
            }

            // 3. 合并数据
            this.userInfo = {
                ...userToDisplay,
                avatar: null,
                lastLogin: userToDisplay.lastLogin || 'N/A'
            };

            this.profileForm = { ...this.userInfo };

            // 4. 加载头像
            if (this.db && this.userInfo.id) {
                try {
                    const avatar = await this.getAvatarFromDB(this.userInfo.id);
                    if (avatar) {
                        this.userInfo.avatar = avatar;
                        this.profileForm.avatar = avatar;
                        return;
                    }
                } catch (error) {
                    console.error('从IndexedDB加载头像失败:', error);
                }
            }

            // 回退逻辑
            this.userInfo.avatar = require('@/assets/default-avatar.svg');
            this.profileForm.avatar = require('@/assets/default-avatar.svg');
        },

        /**
         * @Function_Para 更新用户资料
         *   无参数，通过this.profileForm获取表单数据
         *   Template引用: 编辑个人档案对话框的保存按钮点击事件
         * @Function_Meth 保存用户资料更新:
         *   1. 验证权限(自己的资料或管理员)
         *   2. 更新localStorage中的用户数据
         *   3. 如果是当前用户，同步更新当前登录会话信息
         * @Function_API
         *   - localStorage API: 读写用户数据
         *   - Element UI Message: 显示操作结果
         * @Function_Caller 被编辑个人档案对话框的保存按钮调用
         */
        updateProfile() {
            if (this.isViewingOtherUser && !this.isAdmin()) {
                this.$message.warning('您没有权限修改其他用户信息');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === this.userInfo.id);

            if (userIndex !== -1) {
                // 更新users数组
                const updatedUser = {
                    ...users[userIndex],
                    ...this.profileForm
                };
                delete updatedUser.avatar;

                users[userIndex] = updatedUser;
                localStorage.setItem('users', JSON.stringify(users));

                // 如果是当前用户，则更新localStorage中的user信息
                const currentUser = JSON.parse(localStorage.getItem('user')) || {};
                if (currentUser.id === this.userInfo.id) {
                    const userData = { ...this.profileForm };
                    delete userData.avatar;
                    localStorage.setItem('user', JSON.stringify({
                        ...userData,
                        id: this.userInfo.id,
                        username: this.userInfo.username,
                        role: this.userInfo.role
                    }));
                }

                this.$message.success('个人档案更新成功');
            }

            this.profileDialogVisible = false;
        },

        /**
         * @Function_Para 检查当前用户是否管理员
         *   无参数
         * @Function_Meth 验证当前登录用户是否为管理员角色
         * @Function_API
         *   - localStorage API: 读取用户角色信息
         */
        isAdmin() {
            const currentUser = JSON.parse(localStorage.getItem('user')) || {};
            return currentUser.role === 'admin';
        },

        /**
         * @Function_Para 格式化时间
         *   多态函数，可接受:
         *   1. 单参数形式: formatTime(timestamp)
         *   2. 表格列格式化器形式: formatTime(row, column, cellValue)
         *   Template引用: el-table-column的:formatter属性
         * @Function_Meth 统一格式化日期时间显示
         * @Function_API
         *   - date-fns format: 格式化日期
         */
        formatTime(row, column, cellValue) {
            // 处理直接调用的情况（如 formatTime(userInfo.lastLogin)）
            if (arguments.length === 1) {
                cellValue = row;
            }

            if (!cellValue || cellValue === 'N/A') return 'N/A';

            try {
                // 处理可能是字符串或Date对象的情况
                const date = cellValue instanceof Date ? cellValue : new Date(cellValue);
                // 检查日期是否有效
                if (isNaN(date.getTime())) {
                    console.error('无效的日期:', cellValue);
                    return 'N/A';
                }
                return format(date, 'yyyy-MM-dd HH:mm:ss');
            } catch (e) {
                console.error('日期格式化错误:', e, '原始值:', cellValue);
                return 'N/A';
            }
        },

        /**
         * @Function_Para 加载活动数据
         *   无参数
         * @Function_Meth 根据当前选择的标签页加载对应的活动数据:
         *   - 登录历史
         *   - 操作记录
         *   - 授权仓库
         * @Function_API
         *   - localStorage API: 读取各类活动数据
         */
        loadActivityData() {
            this.loading = true;
            // 预先设置空数据避免表格高度变化
            this.activityData = [];

            // 使用 setTimeout 模拟异步加载
            setTimeout(() => {
                if (this.activeTab === 'login') {
                    const loginHistory = JSON.parse(localStorage.getItem('loginHistory')) || [];
                    const currentUserId = this.userInfo.id;
                    const userLoginHistory = loginHistory.filter(login => login.userId === currentUserId);

                    this.activityData = userLoginHistory
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .map(item => ({
                            ...item,
                            timestamp: item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp)
                        }));
                } else if (this.activeTab === 'operations') {
                    const operations = JSON.parse(localStorage.getItem('operations')) || [];
                    const userOperations = operations.filter(op => op.operator === this.userInfo.username);

                    this.activityData = userOperations
                        .map(op => ({
                            timestamp: op.timestamp,
                            type: op.type,
                            details: `${op.type}商品 ${op.productId} (数量: ${op.quantity})`,
                            warehouse: op.sourceWarehouse || op.targetWarehouse || 'N/A'
                        }))
                        .slice(0, 20);
                } else if (this.activeTab === 'warehouses') {
                    // 只加载用户已授权的仓库
                    const allWarehouses = JSON.parse(localStorage.getItem('warehouses')) || [];
                    const authorizedIds = this.userInfo.authorizedWarehouses || [];

                    // 只显示已授权的仓库
                    this.activityData = allWarehouses.filter(warehouse =>
                        authorizedIds.includes(warehouse.id)
                    ).map(warehouse => ({
                        ...warehouse,
                        status: '已授权' // 添加状态字段
                    }));
                }

                this.loading = false;

                // 强制表格重新渲染
                this.$nextTick(() => {
                    const table = this.$refs.activityTable;
                    if (table) {
                        table.doLayout();
                    }
                });
            }, 500); // 缩短加载时间
        },

        /**
         * @Function_Para 获取设备信息
         *   无参数
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
         * @Function_Para 处理标签页切换
         *   无参数
         *   Template引用: el-tabs的@tab-click事件
         * @Function_Meth 切换活动标签页时重新加载对应数据
         * @Function_API 无外部API调用
         */
        handleTabChange() {
            this.loadActivityData()
        },

        /**
         * @Function_Para 获取角色标签类型
         *   @param {string} role - 用户角色
         *   Template引用: 个人信息卡片中的el-tag的:type属性
         * @Function_Meth 根据用户角色返回对应的标签样式类型
         * @Function_API 无外部API调用
         */
        getRoleTagType(role) {
            return role === 'admin' ? 'danger' :
                role === 'manager' ? 'warning' : 'success'
        },

        /**
         * @Function_Para 格式化角色显示
         *   @param {string} role - 用户角色
         *   Template引用: 个人信息卡片中的角色显示
         * @Function_Meth 将英文角色名转换为中文显示
         * @Function_API 无外部API调用
         */
        formatRole(role) {
            return role === 'admin' ? '管理员' :
                role === 'manager' ? '经理' : '操作员'
        },

        /**
         * @Function_Para 获取操作类型标签样式
         *   @param {string} type - 操作类型
         *   Template引用: 操作记录表格中的操作类型标签
         * @Function_Meth 根据操作类型返回对应的标签样式
         * @Function_API 无外部API调用
         */
        getOperationTagType(type) {
            const typeMap = {
                '入库': 'success',
                '出库': 'danger',
                '转调': 'warning'
            }
            return typeMap[type] || 'info'
        },

        /**
         * @Function_Para 显示密码修改对话框
         *   无参数
         *   Template引用: "修改密码"按钮的点击事件
         * @Function_Meth 初始化并显示密码修改对话框
         * @Function_API
         *   - Vue Refs: 访问表单实例清除验证
         * @Function_Caller 被"修改密码"按钮点击事件调用
         */
        showPasswordDialog() {
            this.passwordForm = {
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            }
            this.passwordDialogVisible = true
            this.$nextTick(() => {
                this.$refs.passwordForm?.clearValidate()
            })
        },

        /**
         * @Function_Para 显示个人资料编辑对话框
         *   无参数
         *   Template引用: "编辑完整档案"按钮的点击事件
         * @Function_Meth 显示编辑个人档案的对话框
         * @Function_API 无外部API调用
         * @Function_Caller 被"编辑完整档案"按钮点击事件调用
         */
        showProfileDialog() {
            this.profileDialogVisible = true
        },

        /**
         * @Function_Para 编辑单个字段
         *   @param {string} field - 要编辑的字段名
         *   Template引用: 各信息项的编辑按钮
         * @Function_Meth 初始化并显示单字段编辑对话框
         * @Function_API 无外部API调用
         * @Function_Caller 被各信息项的编辑按钮点击事件调用
         */
        editField(field) {
            this.editFieldName = field
            this.fieldForm.value = this.userInfo[field] || ''
            this.fieldDialogVisible = true
        },

        /**
         * @Function_Para 保存编辑的字段
         *   无参数
         *   Template引用: 字段编辑对话框的保存按钮
         * @Function_Meth 保存单个字段的编辑并更新用户资料
         * @Function_API 无外部API调用
         * @Function_Caller 被字段编辑对话框的保存按钮调用
         */
        saveField() {
            this.userInfo[this.editFieldName] = this.fieldForm.value
            this.profileForm[this.editFieldName] = this.fieldForm.value
            this.updateProfile()
            this.fieldDialogVisible = false
        },

        /**
         * @Function_Para 更新密码
         *   无参数
         *   Template引用: 密码修改对话框的确定按钮
         * @Function_Meth 验证并更新用户密码:
         *   1. 验证表单数据
         *   2. 验证原密码是否正确
         *   3. 更新密码并保存
         * @Function_API
         *   - localStorage API: 读写用户数据
         *   - Element UI Message: 显示操作结果
         * @Function_Caller 被密码修改对话框的确定按钮调用
         */
        updatePassword() {
            this.$refs.passwordForm.validate(valid => {
                if (valid) {
                    const users = JSON.parse(localStorage.getItem('users')) || []
                    const userIndex = users.findIndex(u => u.id === this.userInfo.id)

                    if (userIndex === -1) {
                        this.$message.error('用户不存在')
                        return
                    }

                    // 验证原密码
                    const hashedOldPassword = this.hashPassword(this.passwordForm.oldPassword)
                    if (users[userIndex].password !== hashedOldPassword) {
                        this.$message.error('原密码错误')
                        return
                    }

                    // 更新密码
                    users[userIndex].password = this.hashPassword(this.passwordForm.newPassword)
                    localStorage.setItem('users', JSON.stringify(users))

                    this.$message.success('密码修改成功')
                    this.passwordDialogVisible = false
                }
            })
        },

        /**
         * @Function_Para 清理旧头像数据
         *   无参数
         * @Function_Meth 从localStorage中移除旧的头像数据,
         *   迁移到IndexedDB后的清理工作
         * @Function_API
         *   - localStorage API: 读写用户数据
         */
        async cleanupOldAvatars() {
            // 从localStorage移除头像
            const user = JSON.parse(localStorage.getItem('user')) || {}
            if (user.avatar) {
                delete user.avatar
                localStorage.setItem('user', JSON.stringify(user))
            }

            // 从users数组移除头像
            const users = JSON.parse(localStorage.getItem('users')) || []
            if (users.length > 0) {
                const updatedUsers = users.map(u => {
                    if (u.avatar) delete u.avatar
                    return u
                })
                localStorage.setItem('users', JSON.stringify(updatedUsers))
            }
        },

        /**
         * @Function_Para 密码哈希处理
         *   @param {string} password - 原始密码
         * @Function_Meth 执行简单的密码哈希处理
         * @Function_API 仅使用JavaScript字符串操作
         */
        hashPassword(password) {
            return password.split('').reverse().join('') + password.length
        }
    },
    
    /**
     * @Function_Para 监听路由变化
     * @Function_Meth 当路由参数变化时更新页面内容:
     *   1. 更新目标用户ID
     *   2. 重新判断是否查看他人主页
     *   3. 重新加载用户信息
     * @Function_API
     *   - Vue Router: 监听路由变化
     *   - localStorage: 获取当前用户信息
     */
    watch: {
        // 监听路由变化
        '$route'(to) {
            this.targetUserId = to.query.userId;
            const currentUser = JSON.parse(localStorage.getItem('user')) || {};
            this.isViewingOtherUser = this.targetUserId && this.targetUserId !== currentUser.id;
            this.loadUserInfo();
        }
    }
}
</script>
<style scoped>
/* 穿透到 el-avatar 内部的 img */
::v-deep .avatar img {
    margin-bottom: 16px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    width: 100%;
    height: 100%;
    object-fit: cover !important;
    object-position: center !important;
}

.user-profile {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

/* 卡片样式优化 */
.profile-card,
.activity-card {
    border-radius: 12px;
    margin-bottom: 24px;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

}

.profile-card:hover,
.activity-card:hover {
    box-shadow: 0 16px 20px rgba(0, 0, 0, 0.12);
    transform: translateY(-8px);
    transform: translateX(-1px);
}

/* 头部样式优化 */
.profile-header,
.activity-header {
    padding: 1px 24px;
    padding-bottom: 6px;
}

.profile-header h2,
.activity-header h3 {
    margin: 0;
    color: #303133;
    font-weight: 600;
    font-size: 18px;
}

/* 内容区域优化 */
.profile-content {
    display: flex;
    padding: 24px;
    align-items: flex-start;
}

.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 80px;
    flex-shrink: 0;
}



.avatar-uploader {
    margin-top: 12px;
    border-radius: 8px;
}


.info-section {
    flex: 1;
}

/* 网格布局优化 */
.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px 16px;
    /* 减小行间距和列间距 */
}

.info-item {
    min-height: 32px;
    /* 减小高度 */
    display: flex;
    align-items: center;
}


.info-label {
    width: 80px;
    font-weight: 500;
    color: #606266;
    font-size: 16px;
}

.info-value {
    color: #303133;
    font-size: 16px;
}

.info-value-edit {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 操作按钮优化 */
.action-buttons {
    margin-top: 24px;
    display: flex;
    gap: 12px;
}

/* 响应式布局 */
@media (max-width: 768px) {
    .profile-content {
        flex-direction: column;
    }

    .avatar-section {
        margin-right: 0;
        margin-bottom: 24px;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }

    .action-buttons {
        justify-content: center;
    }
}

/* ------------------ */
/* 卡片样式优化 */
.profile-card,
.activity-card {
    border-radius: 12px;
    margin-bottom: 24px;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
}

.activity-card {
    max-height: calc(99vh - 450px);
    overflow-y: hidden;
    margin-bottom: 0px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}


.activity-table {
    padding: 0 16px 16px;
    height: auto;
}

/* 活动记录表格优化 */
.compact-tabs {
    margin-top: 12px;
}

.compact-table {
    border-width: 2px;
    border-color: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    flex-direction: column;
    max-height: calc(99vh - 635px);
    overflow: auto;
    scrollbar-color: rgba(240, 249, 235, 0.4) transparent;
}

.compact-table::before {
    display: none;
}

.viewing-notice {
    margin-bottom: 16px;
    /* 可选，调整间距 */
}

.alert-title-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-right: 10px;

}

/* 可选：调整按钮与文字的对齐方式 */
.alert-title-content span {
    margin-right: 10px;

    /* 确保文字和按钮之间有空隙 */
}

/* 设置el-card 子容器 el-alert 样式 */
.el-card .el-alert {
    background-color: rgba(240, 2, 2, 0.1);
}
</style>