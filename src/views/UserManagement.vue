<template>
    <div class="user">
        <el-card shadow="hover" class="search-card">
            <div class="search-group">
                <el-select v-model="selectedField" placeholder="选择字段" clearable class="field-select">
                    <el-option v-for="item in fields" :key="item.value" :label="item.label"
                        :value="item.value"></el-option>
                </el-select>
                <el-input v-model="searchQuery" placeholder="请输入搜索内容" class="search-box" clearable
                    @keyup.enter.native="handleSearch">
                    <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
                </el-input>
                <el-button type="primary" icon="el-icon-plus" @click="showAddDialog"
                    class="action-button">新增用户</el-button>
            </div>
        </el-card>

        <el-card shadow="hover" class="table-card">
            <div class="table-header">
                <span class="table-title">用户管理</span>
                <el-tag type="info">共 {{ totalFiltered }} 条记录</el-tag>
            </div>
            <el-table :data="paginatedUsers" height="tableHeight" stripe border highlight-current-row
                style="width: 100%" v-loading="loading" @sort-change="handleSortChange" :resizable="true">
                <el-table-column prop="username" label="用户名" width="150" sortable></el-table-column>
                <el-table-column prop="name" label="姓名" width="120" sortable></el-table-column>
                <el-table-column prop="role" label="角色" width="120" sortable>
                    <template slot-scope="scope">
                        <el-tag :type="getRoleTagType(scope.row.role)">
                            {{ scope.row.role === 'admin' ? '管理员' :
                                scope.row.role === 'manager' ? '经理' : '操作员' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                    <template slot-scope="scope">
                        <el-switch v-model="scope.row.status" active-value="active" inactive-value="disabled"
                            active-color="#13ce66" inactive-color="#ff4949" @change="updateUserStatus(scope.row)">
                        </el-switch>
                    </template>
                </el-table-column>
                <el-table-column prop="email" label="邮箱" width="200"></el-table-column>
                <el-table-column prop="department" label="部门" width="150"></el-table-column>
                <el-table-column prop="lastLogin" label="最后登录" width="180" sortable></el-table-column>
                <el-table-column label="操作" width="300" fixed="right" align="center" header-align="center">
                    <template slot-scope="scope">
                        <el-button size="mini" type="primary" @click="editUser(scope.row)">编辑</el-button>
                        <el-button size="mini" type="danger" @click="deleteUser(scope.row.id)">删除</el-button>
                        <el-button size="mini" type="info" @click="viewUserProfile(scope.row)">主页</el-button>
                        <el-button size="mini" type="warning" @click="authorizeWarehouse(scope.row)"
                            class="authorize-button">
                            <i class="el-icon-key"></i> 授权
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="table-footer">
                <el-button type="primary" plain size="mini" @click="scrollToTop" class="back-to-top">
                    <i class="el-icon-top"></i> 返回顶部
                </el-button>
                <el-pagination class="pagination" @size-change="handleSizeChange" @current-change="handleCurrentChange"
                    :current-page="currentPage" :page-sizes="[10, 20, 50, 100]" :page-size="pageSize"
                    layout="total, sizes, prev, pager, next, jumper" :total="totalFiltered">
                </el-pagination>
            </div>
        </el-card>

        <!-- 添加/编辑用户对话框 -->
        <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="50%" center>
            <el-form :model="currentUser" :rules="userRules" ref="userForm" label-width="80px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="用户名" prop="username">
                            <el-input v-model="currentUser.username" :disabled="isEdit"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="姓名" prop="name">
                            <el-input v-model="currentUser.name"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="角色" prop="role">
                            <el-select v-model="currentUser.role" style="width:100%">
                                <el-option label="管理员" value="admin"></el-option>
                                <el-option label="经理" value="manager"></el-option>
                                <el-option label="操作员" value="operator"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="状态">
                            <el-switch v-model="currentUser.status" active-value="active" inactive-value="disabled"
                                active-text="启用" inactive-text="禁用">
                            </el-switch>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="邮箱" prop="email">
                            <el-input v-model="currentUser.email"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="电话" prop="phone">
                            <el-input v-model="currentUser.phone"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="部门" prop="department">
                            <el-input v-model="currentUser.department"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" v-if="!isEdit">
                        <el-form-item label="密码" prop="password">
                            <el-input type="password" v-model="currentUser.password"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveUser">保存</el-button>
            </span>
        </el-dialog>
        <el-dialog title="授权仓库管理" :visible.sync="warehouseDialogVisible" width="60%">
            <el-table :data="warehouses" ref="warehouseTable" style="width: 100%" border stripe
                @selection-change="handleWarehouseSelectionChange">
                <el-table-column type="selection" width="55">
                </el-table-column>
                <el-table-column prop="id" label="仓库ID" width="120">
                </el-table-column>
                <el-table-column prop="name" label="仓库名称">
                </el-table-column>
                <el-table-column prop="location" label="仓库位置">
                </el-table-column>
            </el-table>
            <span slot="footer" class="dialog-footer">
                <el-button @click="warehouseDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveWarehouseAuthorization">确认授权</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
export default {
    data() {
        return {
            warehouseDialogVisible: false,
            warehouses: [], // 所有仓库列表
            selectedWarehouses: [], // 当前选中的仓库
            currentAuthUser: null, // 当前正在设置授权的用户
            users: [],
            searchQuery: '',
            selectedField: '',
            fields: [
                { label: '用户名', value: 'username' },
                { label: '姓名', value: 'name' },
                { label: '角色', value: 'role' },
                { label: '部门', value: 'department' },
                { label: '邮箱', value: 'email' }
            ],
            dialogVisible: false,
            isEdit: false,
            currentUser: this.getDefaultUser(),
            userRules: {
                username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
                name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
                role: [{ required: true, message: '请选择角色', trigger: 'change' }],
                password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
            },
            currentPage: 1,
            pageSize: 20,
            loading: false
        };
    },
    computed: {
        dialogTitle() {
            return this.isEdit ? '编辑用户' : '新增用户';
        },
        filteredUsers() {
            if (!this.selectedField || !this.searchQuery) {
                return this.users;
            }
            return this.users.filter(user =>
                user[this.selectedField]?.toString().toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        },
        paginatedUsers() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.filteredUsers.slice(start, end);
        },
        totalFiltered() {
            return this.filteredUsers.length;
        }
    },
    created() {
        this.loadUsers();
        this.initAdminUser();
        this.initWarehouses();

    },
    methods: {
        initWarehouses() {
            let warehouses = JSON.parse(localStorage.getItem('warehouses')) || [];
        },
        viewUserProfile(user) {
            // 使用特殊路由参数跳转到用户主页
            this.$router.push({
                path: '/system/profile',
                query: { userId: user.id }
            });
        },
        loadUsers() {
            this.users = JSON.parse(localStorage.getItem('users')) || [];
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

        getDefaultUser() {
            return {
                id: '',
                username: '',
                password: '',
                name: '',
                role: 'operator',
                email: '',
                phone: '',
                department: '',
                status: 'active'
            };
        },

        showAddDialog() {
            this.currentUser = this.getDefaultUser();
            this.isEdit = false;
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.$refs.userForm?.clearValidate();
            });
        },

        editUser(user) {
            this.currentUser = { ...user, password: '' };
            this.isEdit = true;
            this.dialogVisible = true;
        },

        saveUser() {
            this.$refs.userForm.validate(valid => {
                if (valid) {
                    let users = JSON.parse(localStorage.getItem('users')) || [];

                    if (this.isEdit) {
                        // 更新用户
                        const index = users.findIndex(u => u.id === this.currentUser.id);
                        if (index !== -1) {
                            // 保留原密码（如果不修改密码）
                            if (!this.currentUser.password) {
                                const originalUser = users[index];
                                this.currentUser.password = originalUser.password;
                            } else {
                                this.currentUser.password = this.hashPassword(this.currentUser.password);
                            }
                            users[index] = this.currentUser;
                        }
                    } else {
                        // 新增用户
                        const newUser = {
                            ...this.currentUser,
                            id: this.generateId(),
                            password: this.hashPassword(this.currentUser.password),
                            createdAt: new Date().toISOString(),
                            lastLogin: null
                        };
                        users.push(newUser);
                    }

                    localStorage.setItem('users', JSON.stringify(users));
                    this.loadUsers();
                    this.dialogVisible = false;
                    this.$message.success('保存成功');
                }
            });
        },

        deleteUser(userId) {
            this.$confirm('确定删除该用户吗？', '提示', {
                type: 'warning'
            }).then(() => {
                let users = JSON.parse(localStorage.getItem('users')) || [];
                users = users.filter(u => u.id !== userId);
                localStorage.setItem('users', JSON.stringify(users));
                this.loadUsers();
                this.$message.success('删除成功');
            }).catch(() => { });
        },

        updateUserStatus(user) {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const index = users.findIndex(u => u.id === user.id);
            if (index !== -1) {
                users[index].status = user.status;
                localStorage.setItem('users', JSON.stringify(users));
                this.$message.success(`用户状态已${user.status === 'active' ? '启用' : '禁用'}`);
            }
        },

        getRoleTagType(role) {
            return role === 'admin' ? 'danger' :
                role === 'manager' ? 'warning' : 'success';
        },

        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },

        hashPassword(password) {
            // 简单示例哈希，实际项目应使用更安全的算法
            return password.split('').reverse().join('') + password.length;
        },

        handleSearch() {
            this.currentPage = 1;
        },

        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
        },

        handleCurrentChange(page) {
            this.currentPage = page;
        },

        handleSortChange({ prop, order }) {
            if (order === 'ascending') {
                this.users.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
            } else if (order === 'descending') {
                this.users.sort((a, b) => (a[prop] < b[prop] ? 1 : -1));
            }
        },

        scrollToTop() {
            const tableWrapper = this.$refs.table?.$el.querySelector('.el-table__body-wrapper');
            if (tableWrapper) {
                tableWrapper.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        },
        authorizeWarehouse(user) {
            if (!this.isCurrentUserAdmin()) {
                this.$notify({
                    title: '权限不足',
                    message: '只有管理员可以设置仓库授权',
                    type: 'warning',
                    iconClass: 'el-icon-warning-outline'
                });
                return;
            }

            this.currentAuthUser = user;
            this.loadWarehouses();
            this.warehouseDialogVisible = true;
        },

        // 加载仓库列表
        loadWarehouses() {
            // 从localStorage获取仓库数据
            this.warehouses = JSON.parse(localStorage.getItem('warehouses')) || [];

            // 设置当前用户已授权的仓库
            this.$nextTick(() => {
                if (this.currentAuthUser.authorizedWarehouses) {
                    this.currentAuthUser.authorizedWarehouses.forEach(warehouseId => {
                        const warehouse = this.warehouses.find(w => w.id === warehouseId);
                        if (warehouse) {
                            this.$refs.warehouseTable.toggleRowSelection(warehouse, true);
                        }
                    });
                }
            });
        },

        // 处理仓库选择变化
        handleWarehouseSelectionChange(selection) {
            this.selectedWarehouses = selection;
        },

        // 保存授权设置
        saveWarehouseAuthorization() {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === this.currentAuthUser.id);

            if (userIndex !== -1) {
                users[userIndex].authorizedWarehouses = this.selectedWarehouses.map(w => w.id);
                localStorage.setItem('users', JSON.stringify(users));

                this.$notify({
                    title: '授权成功',
                    message: `${this.currentAuthUser.name}的仓库授权已更新`,
                    type: 'success',
                    iconClass: 'el-icon-success'
                });

                this.loadUsers(); // 刷新用户列表
                this.warehouseDialogVisible = false;
            }
        },

        // 检查当前用户是否是管理员
        isCurrentUserAdmin() {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            return currentUser && currentUser.role === 'admin';
        },

        // 修改getDefaultUser方法
        getDefaultUser() {
            return {
                id: '',
                username: '',
                password: '',
                name: '',
                role: 'operator',
                email: '',
                phone: '',
                department: '',
                status: 'active',
                authorizedWarehouses: [] // 新增字段
            };
        }

    }
};
</script>

<style scoped>
/* 主容器样式 */
.user {
    padding: 8px;
    border-radius: 20% !important;
}

/* 搜索区域样式 */
.search-card {
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 20px;
    background-color: rgb(245, 245, 250);
}

/* 搜索框组样式 - 包含选择框、输入框和操作按钮 */
.search-group {
    display: flex;
    align-items: center;
    gap: 10px;
    /* 元素间距 */
}

.field-select {
    width: 150px;
    /* 字段选择框固定宽度 */
}

.search-box {
    flex: 1;
    /* 搜索框占据剩余空间 */
}

.action-button {
    white-space: nowrap;
    /* 按钮文字不换行 */
}

/* 表格容器样式 */
.table-card {
    padding: 8px;
    padding-bottom: 0px;
    border-radius: 8px;
    overflow: hidden;
    background-color: rgb(245, 245, 250);
}

/* 表格头部样式 - 包含标题和统计标签 */
.table-header {
    padding: 16px;
    background: rgb(250, 250, 250);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 8px 8px 0 0;
}

.table-title {
    font-size: 18px;
    font-weight: bold;
}

/* 表格主体样式 */
.el-table {
    width: 100%;
    flex: 1;
    height: calc(99vh - 400px);
    overflow-y: auto;
    border-radius: 0px 0px 8px 8px;
}

/* 表格底部样式 - 包含分页和返回顶部按钮 */
.table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding: 0 16px;
}

/* 返回顶部按钮样式 */
.back-to-top {
    padding: 7px 12px;
    border-radius: 4px;
    transition: all 0.3s;
    background-color: rgb(225, 225, 230);
    border-color: rgb(205, 205, 210);
    color: rgb(99, 85, 85);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-to-top:hover {
    border-color: #409EFF;
    transform: translateY(-2px);
}

/* 分页样式调整 */
.pagination {
    margin: 0;
    padding: 0;
}

/* 固定列特殊样式处理 */
.el-table__fixed-right {
    height: calc(100% - 2px) !important;
    border-radius: 0 8px 0 0;
}

.el-table__fixed-right::before {
    background-color: transparent !important;
}

/* 表格列可调整宽度样式 */
.el-table .el-table__header-wrapper th {
    position: relative;
}

.el-table .el-table__header-wrapper th .cell {
    white-space: nowrap;
}

/* 授权按钮样式  */
.authorize-button {
    margin-left: 10px;
}
</style>