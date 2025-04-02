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
        /**
         * @Function_Para 初始化仓库数据
         *   无参数
         * @Function_Meth 加载仓库数据为授权功能作准备
         * @Function_Orgi 在组件created生命周期中自动调用
         * @Function_API
         *   - localStorage API: 读取仓库数据
         */
        initWarehouses() {
            let warehouses = JSON.parse(localStorage.getItem('warehouses')) || [];
        },

        /**
         * @Function_Para 查看用户主页
         *   @param {Object} user - 要查看的用户对象
         * @Function_Meth 跳转到指定用户的个人主页
         * @Function_Orgi Template引用: 表格操作列的"主页"按钮点击事件
         * @Function_API
         *   - Vue Router: 导航到用户主页并传递参数
         */
        viewUserProfile(user) {
            // 使用特殊路由参数跳转到用户主页
            this.$router.push({
                path: '/system/profile',
                query: { userId: user.id }
            });
        },

        /**
         * @Function_Para 加载用户数据
         *   无参数
         * @Function_Meth 从localStorage加载用户数据
         * @Function_Orgi 在组件created生命周期中自动调用
         * @Function_API
         *   - localStorage API: 读取用户数据
         */
        loadUsers() {
            this.users = JSON.parse(localStorage.getItem('users')) || [];
        },

        /**
         * @Function_Para 初始化管理员用户
         *   无参数
         * @Function_Meth 确保系统中存在默认的管理员账户
         * @Function_Orgi 在组件created生命周期中自动调用
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
         * @Function_Para 获取默认用户对象
         *   无参数
         * @Function_Meth 返回初始化的用户对象模板
         * @Function_Orgi 被showAddDialog方法调用，创建新用户时使用
         * @Function_API 无外部API调用
         */
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
        },

        /**
         * @Function_Para 显示添加用户对话框
         *   无参数
         * @Function_Meth 初始化新用户表单并显示添加对话框
         * @Function_Orgi Template引用: "新增用户"按钮的点击事件
         * @Function_API
         *   - Vue nextTick: 等待DOM更新后清除验证
         */
        showAddDialog() {
            this.currentUser = this.getDefaultUser();
            this.isEdit = false;
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.$refs.userForm?.clearValidate();
            });
        },

        /**
         * @Function_Para 编辑用户
         *   @param {Object} user - 要编辑的用户对象
         * @Function_Meth 准备编辑用户的表单数据并显示编辑对话框
         * @Function_Orgi Template引用: 表格操作列的"编辑"按钮点击事件
         * @Function_API 无外部API调用
         */
        editUser(user) {
            this.currentUser = { ...user, password: '' };
            this.isEdit = true;
            this.dialogVisible = true;
        },

        /**
         * @Function_Para 保存用户
         *   无参数
         * @Function_Meth 验证并保存用户信息:
         *   1. 验证表单数据
         *   2. 根据操作类型（新增/编辑）更新用户数据
         *   3. 保存到localStorage并刷新列表
         * @Function_Orgi Template引用: 用户对话框的"保存"按钮点击事件
         * @Function_API
         *   - localStorage API: 读写用户数据
         *   - Element UI Message: 显示操作结果
         */
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

        /**
         * @Function_Para 删除用户
         *   @param {string} userId - 要删除的用户ID
         * @Function_Meth 确认并删除指定用户
         * @Function_Orgi Template引用: 表格操作列的"删除"按钮点击事件
         * @Function_API
         *   - Element UI MessageBox: 显示确认对话框
         *   - localStorage API: 读写用户数据
         *   - Element UI Message: 显示操作结果
         */
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

        /**
         * @Function_Para 更新用户状态
         *   @param {Object} user - 用户对象，包含更新后的状态
         * @Function_Meth 更新用户的启用/禁用状态
         * @Function_Orgi Template引用: 状态列的el-switch @change事件
         * @Function_API
         *   - localStorage API: 读写用户数据
         *   - Element UI Message: 显示操作结果
         */
        updateUserStatus(user) {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const index = users.findIndex(u => u.id === user.id);
            if (index !== -1) {
                users[index].status = user.status;
                localStorage.setItem('users', JSON.stringify(users));
                this.$message.success(`用户状态已${user.status === 'active' ? '启用' : '禁用'}`);
            }
        },

        /**
         * @Function_Para 获取角色标签类型
         *   @param {string} role - 用户角色
         * @Function_Meth 根据用户角色返回对应的标签样式类型
         * @Function_Orgi Template引用: 用户角色列的el-tag :type属性
         * @Function_API 无外部API调用
         */
        getRoleTagType(role) {
            return role === 'admin' ? 'danger' :
                role === 'manager' ? 'warning' : 'success';
        },

        /**
         * @Function_Para 生成唯一ID
         *   无参数
         * @Function_Meth 生成基于时间戳和随机数的唯一标识符
         * @Function_Orgi 被saveUser方法调用，创建新用户时使用
         * @Function_API
         *   - Date API: 获取当前时间戳
         *   - Math.random: 生成随机数
         */
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },

        /**
         * @Function_Para 密码哈希处理
         *   @param {string} password - 原始密码
         * @Function_Meth 执行简单的密码哈希处理
         * @Function_Orgi 被saveUser和initAdminUser方法调用，处理密码时使用
         * @Function_API 仅使用JavaScript字符串操作
         */
        hashPassword(password) {
            // 简单示例哈希，实际项目应使用更安全的算法
            return password.split('').reverse().join('') + password.length;
        },

        /**
         * @Function_Para 处理搜索
         *   无参数
         * @Function_Meth 执行搜索并重置分页到第一页
         * @Function_Orgi Template引用: 搜索框的@keyup.enter和搜索按钮的点击事件
         * @Function_API 无外部API调用
         */
        handleSearch() {
            this.currentPage = 1;
        },

        /**
         * @Function_Para 处理页大小变化
         *   @param {number} size - 新的页大小
         * @Function_Meth 更新每页显示记录数，并重置为第一页
         * @Function_Orgi Template引用: 分页控件的@size-change事件
         * @Function_API 无外部API调用
         */
        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
        },

        /**
         * @Function_Para 处理页码变化
         *   @param {number} page - 新的页码
         * @Function_Meth 更新当前页码
         * @Function_Orgi Template引用: 分页控件的@current-change事件
         * @Function_API 无外部API调用
         */
        handleCurrentChange(page) {
            this.currentPage = page;
        },

        /**
         * @Function_Para 处理表格排序变化
         *   @param {Object} params - 排序参数，包含prop和order
         * @Function_Meth 根据排序字段和顺序对用户数据进行排序
         * @Function_Orgi Template引用: 表格的@sort-change事件
         * @Function_API 无外部API调用
         */
        handleSortChange({ prop, order }) {
            if (order === 'ascending') {
                this.users.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
            } else if (order === 'descending') {
                this.users.sort((a, b) => (a[prop] < b[prop] ? 1 : -1));
            }
        },

        /**
         * @Function_Para 滚动表格到顶部
         *   无参数
         * @Function_Meth 平滑滚动表格视图到顶部
         * @Function_Orgi Template引用: "返回顶部"按钮的点击事件
         * @Function_API
         *   - DOM API: 获取表格滚动容器并执行滚动
         */
        scrollToTop() {
            const tableWrapper = this.$refs.table?.$el.querySelector('.el-table__body-wrapper');
            if (tableWrapper) {
                tableWrapper.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        },

        /**
         * @Function_Para 授权仓库管理
         *   @param {Object} user - 要授权的用户对象
         * @Function_Meth 打开仓库授权对话框，设置用户的仓库访问权限
         * @Function_Orgi Template引用: 表格操作列的"授权"按钮点击事件
         * @Function_API
         *   - Element UI Notify: 显示权限不足通知
         */
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

        /**
         * @Function_Para 加载仓库列表
         *   无参数
         * @Function_Meth 加载所有仓库数据，并设置当前用户已授权的仓库选中状态
         * @Function_Orgi 被authorizeWarehouse方法调用，打开授权对话框时使用
         * @Function_API
         *   - localStorage API: 读取仓库数据
         *   - Element UI Table: 设置表格行选中状态
         */
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

        /**
         * @Function_Para 处理仓库选择变化
         *   @param {Array} selection - 当前选中的仓库数组
         * @Function_Meth 更新当前选中的仓库列表
         * @Function_Orgi Template引用: 仓库表格的@selection-change事件
         * @Function_API 无外部API调用
         */
        handleWarehouseSelectionChange(selection) {
            this.selectedWarehouses = selection;
        },

        /**
         * @Function_Para 保存授权设置
         *   无参数
         * @Function_Meth 将选中的仓库ID保存到用户的authorizedWarehouses属性中
         * @Function_Orgi Template引用: 授权对话框的"确认授权"按钮点击事件
         * @Function_API
         *   - localStorage API: 读写用户数据
         *   - Element UI Notify: 显示授权成功通知
         */
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

        /**
         * @Function_Para 检查当前用户是否是管理员
         *   无参数
         * @Function_Meth 验证当前登录用户是否具有管理员角色
         * @Function_Orgi 被authorizeWarehouse方法调用，验证权限时使用
         * @Function_API
         *   - localStorage API: 读取当前用户数据
         */
        isCurrentUserAdmin() {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            return currentUser && currentUser.role === 'admin';
        }
    }
};
</script>

<style scoped>
/* 主容器样式 */
/* 设置用户管理页面的基本内边距 */
/* 应用于整个组件的最外层div，class="user" */
.user {
    padding: 8px;
}

/* 搜索区域样式 */
/* 设置顶部搜索卡片的背景、圆角和间距 */
/* 应用于搜索区域的el-card组件，class="search-card" */
.search-card {
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 20px;
    background-color: rgb(245, 245, 250);
}

/* 搜索框组样式 */
/* 使用Flexbox布局组织搜索组件的水平排列和间距 */
/* 应用于包含搜索控件的容器div，class="search-group" */
.search-group {
    display: flex;
    align-items: center;
    gap: 10px;
    /* 元素间距 */
}

/* 字段选择框样式 */
/* 设置字段下拉选择框的固定宽度 */
/* 应用于搜索字段选择的el-select组件，class="field-select" */
.field-select {
    width: 150px;
    /* 字段选择框固定宽度 */
}

/* 搜索框样式 */
/* 设置搜索输入框占据剩余空间 */
/* 应用于搜索输入的el-input组件，class="search-box" */
.search-box {
    flex: 1;
    /* 搜索框占据剩余空间 */
}

/* 操作按钮样式 */
/* 确保按钮文字不会换行 */
/* 应用于"新增用户"按钮的el-button组件，class="action-button" */
.action-button {
    white-space: nowrap;
    /* 按钮文字不换行 */
}

/* 表格容器样式 */
/* 设置表格容器的背景、边距和圆角 */
/* 应用于包含表格的el-card组件，class="table-card" */
.table-card {
    padding: 8px;
    padding-bottom: 0px;
    border-radius: 8px;
    overflow: hidden;
    background-color: rgb(245, 245, 250);
}

/* 表格头部样式 */
/* 设置表格标题区域的布局、背景和圆角 */
/* 应用于表格上方的标题区域div，class="table-header" */
.table-header {
    padding: 16px;
    background: rgb(250, 250, 250);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 8px 8px 0 0;
}

/* 表格标题文本样式 */
/* 设置表格标题的字体大小和粗细 */
/* 应用于表格标题文本span，class="table-title" */
.table-title {
    font-size: 18px;
    font-weight: bold;
}

/* 表格主体样式 */
/* 设置表格的高度、边框和圆角 */
/* 应用于用户列表的el-table组件 */
.el-table {
    width: 100%;
    flex: 1;
    height: calc(99vh - 400px);
    overflow-y: auto;
    border-radius: 0px 0px 8px 8px;
}

/* 表格底部样式 */
/* 设置表格底部分页和按钮区域的布局 */
/* 应用于表格底部的控制区域div，class="table-footer" */
.table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding: 0 16px;
}

/* 返回顶部按钮样式 */
/* 设置返回顶部按钮的外观和过渡效果 */
/* 应用于"返回顶部"按钮的el-button组件，class="back-to-top" */
.back-to-top {
    padding: 7px 12px;
    border-radius: 4px;
    transition: all 0.3s;
    background-color: rgb(225, 225, 230);
    border-color: rgb(205, 205, 210);
    color: rgb(99, 85, 85);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 返回顶部按钮悬停效果 */
/* 设置返回顶部按钮鼠标悬停时的边框颜色和上移动画 */
/* 应用于"返回顶部"按钮的悬停状态 */
.back-to-top:hover {
    border-color: #409EFF;
    transform: translateY(-2px);
}

/* 分页控件样式 */
/* 重置分页控件的边距 */
/* 应用于分页控件的el-pagination组件，class="pagination" */
.pagination {
    margin: 0;
    padding: 0;
}

/* 固定列样式 */
/* 调整固定在右侧的操作列的高度和圆角 */
/* 应用于表格的固定右侧列容器 */
.el-table__fixed-right {
    height: calc(100% - 2px) !important;
    border-radius: 0 8px 0 0;
}

/* 固定列边框移除 */
/* 移除固定列底部的边框线 */
/* 应用于固定列的伪元素 */
.el-table__fixed-right::before {
    background-color: transparent !important;
}

/* 表格列标题样式 */
/* 设置表格列标题单元格的定位 */
/* 应用于表格列标题th元素 */
.el-table .el-table__header-wrapper th {
    position: relative;
}

/* 表格列标题内容样式 */
/* 设置表格列标题的文本不换行 */
/* 应用于表格列标题内的cell元素 */
.el-table .el-table__header-wrapper th .cell {
    white-space: nowrap;
}

/* 授权按钮样式 */
/* 设置授权按钮的左侧边距 */
/* 应用于仓库授权的el-button组件，class="authorize-button" */
.authorize-button {
    margin-left: 10px;
}
</style>