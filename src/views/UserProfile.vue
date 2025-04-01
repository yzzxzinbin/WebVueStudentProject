<template>
    <div class="user-profile">
        <!-- 用户信息卡片 - 优化后的布局 -->
        <el-card shadow="hover" class="profile-card">
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
            }
        }
    },
    async created() {
        await this.initAvatarDB() // 确保数据库初始化完成
        await this.loadUserInfo() // 再加载用户信息
        this.loadActivityData()
        this.cleanupOldAvatars()
    },

    methods: {


        // 初始化头像专用数据库
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

        // 保存头像到IndexedDB
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

        // 从IndexedDB读取头像
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

        // 修改后的头像上传方法
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
                        this.$eventBus.$emit('avatar-updated', avatarData) // 触发事件
                        this.userInfo.avatar = avatarData
                        this.profileForm.avatar = avatarData
                    }
                } catch (error) {
                    console.error('头像更新全过程失败:', error)
                }
            }
            reader.readAsDataURL(file.raw)
        },
        async loadUserInfo() {
            // 1. 从localStorage加载基本信息
            const user = JSON.parse(localStorage.getItem('user')) || {}

            // 2. 设置基本信息（不包含头像）
            this.userInfo = { ...user, avatar: null }
            this.profileForm = { ...user, avatar: null }

            // 3. 确保数据库已初始化
            if (!this.db) {
                console.warn('IndexedDB 尚未初始化')
                return
            }

            // 4. 从IndexedDB加载头像
            if (user.id) {
                try {
                    const avatar = await this.getAvatarFromDB(user.id)
                    if (avatar) {
                        this.userInfo.avatar = avatar
                        this.profileForm.avatar = avatar
                        return
                    }
                } catch (error) {
                    console.error('从IndexedDB加载头像失败:', error)
                }
            }

            // 5. 最终回退逻辑
            this.userInfo.avatar = user.avatar || require('@/assets/default-avatar.svg')
            this.profileForm.avatar = user.avatar || require('@/assets/default-avatar.svg')
        },

        loadActivityData() {
            this.loading = true
            // 模拟加载数据
            setTimeout(() => {
                if (this.activeTab === 'login') {
                    this.activityData = [
                        { timestamp: new Date(), ip: '192.168.1.100', device: 'Windows 10 / Chrome' },
                        { timestamp: new Date(Date.now() - 86400000), ip: '192.168.1.101', device: 'Mac OS / Safari' },
                        { timestamp: new Date(Date.now() - 172800000), ip: '192.168.1.100', device: 'Windows 10 / Chrome' }
                    ]
                } else {
                    // 从本地存储获取操作记录
                    const operations = JSON.parse(localStorage.getItem('operations')) || []
                    this.activityData = operations
                        .filter(op => op.operator === this.userInfo.username)
                        .map(op => ({
                            timestamp: op.timestamp,
                            type: op.type,
                            details: `${op.type}商品 ${op.productId} (数量: ${op.quantity})`,
                            warehouse: op.sourceWarehouse || op.targetWarehouse || 'N/A'
                        }))
                        .slice(0, 20) // 只显示最近的20条
                }
                this.loading = false
            }, 500)
        },

        handleTabChange() {
            this.loadActivityData()
        },

        formatTime(row, column, cellValue) {
            if (!cellValue) return 'N/A';
            try {
                return format(new Date(cellValue), 'yyyy-MM-dd HH:mm:ss');
            } catch (e) {
                return 'Invalid Date';
            }
        },

        getRoleTagType(role) {
            return role === 'admin' ? 'danger' :
                role === 'manager' ? 'warning' : 'success'
        },

        formatRole(role) {
            return role === 'admin' ? '管理员' :
                role === 'manager' ? '经理' : '操作员'
        },

        getOperationTagType(type) {
            const typeMap = {
                '入库': 'success',
                '出库': 'danger',
                '转调': 'warning'
            }
            return typeMap[type] || 'info'
        },

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

        showProfileDialog() {
            this.profileDialogVisible = true
        },

        editField(field) {
            this.editFieldName = field
            this.fieldForm.value = this.userInfo[field] || ''
            this.fieldDialogVisible = true
        },

        saveField() {
            this.userInfo[this.editFieldName] = this.fieldForm.value
            this.profileForm[this.editFieldName] = this.fieldForm.value
            this.updateProfile()
            this.fieldDialogVisible = false
        },

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

        updateProfile() {
            const users = JSON.parse(localStorage.getItem('users')) || []
            const userIndex = users.findIndex(u => u.id === this.userInfo.id)

            if (userIndex !== -1) {
                // 1. 更新users数组（不含头像）
                const userWithoutAvatar = { ...this.profileForm }
                delete userWithoutAvatar.avatar // 不保存头像到localStorage

                users[userIndex] = { ...users[userIndex], ...userWithoutAvatar }
                localStorage.setItem('users', JSON.stringify(users))

                // 2. 更新user数据（也不含头像）
                const userData = { ...this.profileForm }
                delete userData.avatar
                localStorage.setItem('user', JSON.stringify(userData))

                // 3. 更新界面状态（保留头像）
                this.userInfo = { ...this.profileForm } // 保持头像数据
                this.$message.success('个人档案更新成功')
            }

            this.profileDialogVisible = false
        },
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
        // 简单的密码哈希函数（与系统其他部分一致）
        hashPassword(password) {
            return password.split('').reverse().join('') + password.length
        }
    }
}
</script>

<style scoped>
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

.avatar {
    margin-bottom: 16px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
    gap: 16px 24px;
}

.info-item {
    display: flex;
    align-items: center;
    min-height: 40px;
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
    max-height: calc(99vh - 625px);
    overflow: auto;
    scrollbar-color: rgba(240, 249, 235, 0.4) transparent;
}

.compact-table::before {
    display: none;
}
</style>