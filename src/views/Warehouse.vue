<template>
    <!--
      @Template_Desc 仓库管理页面主体
        包含搜索区域、表格区域以及添加/编辑对话框
      @Element_Desc .user 页面最外层容器，对整个仓库管理页面进行包裹和布局
      @Element_Desc .search-card 搜索区域卡片，包含搜索框和操作按钮
      @Element_Desc .search-group 搜索框组，用于水平排列搜索条件
      @Element_Desc .field-select 字段选择下拉框
      @Element_Desc .search-box 搜索输入框
      @Element_Desc .action-buttons 操作按钮组，包含添加、导入、导出按钮
      @Element_Desc .table-card 表格区域卡片，包含仓库列表表格和分页控件
      @Element_Desc .table-header 表格头部，包含标题和记录数标签
      @Element_Desc .table-footer 表格底部，包含分页控件和返回顶部按钮
      @Element_Desc .dialog-footer 对话框底部，包含操作按钮
    -->
    <div class="user">
        <el-card shadow="hover" class="search-card">
            <div class="search-group">
                <div class="search-inputs">
                    <el-select v-model="selectedField" placeholder="选择字段" clearable class="field-select">
                        <el-option v-for="item in fields" :key="item.value" :label="item.label"
                            :value="item.value"></el-option>
                    </el-select>
                    <el-input v-model="searchQuery" placeholder="请输入搜索内容" class="search-box" clearable
                        @keyup.enter.native="handleSearch">
                        <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
                    </el-input>
                </div>
                <div class="divider"></div>
                <div class="action-buttons">
                    <el-button type="success" icon="el-icon-plus" @click="openAddDialog" class="action-button" 
                        v-if="$permission.canCreateWarehouse()">添加</el-button>
                    <el-button type="primary" icon="el-icon-upload2" @click="importData" class="action-button" 
                        v-if="$permission.canCreateWarehouse()">导入</el-button>
                    <el-button type="warning" icon="el-icon-download" @click="exportData"
                        class="action-button">导出</el-button>
                </div>
            </div>
        </el-card>

        <el-card shadow="hover" class="table-card">
            <div class="table-header">
                <span class="table-title">仓库列表</span>
                <el-tag type="info">共 {{ totalFiltered }} 条记录</el-tag>
            </div>
            <el-table ref="table" :data="paginatedWarehouses" height=tableHeight stripe border highlight-current-row
                style="width: 100%" v-loading="loading" @sort-change="handleSortChange" :resizable="true">
                <el-table-column prop="id" label="仓库ID" width="100" sortable></el-table-column>
                <el-table-column prop="name" label="仓库名称" width="220" sortable></el-table-column>
                <el-table-column prop="status" label="状态" width="120" sortable></el-table-column>
                <el-table-column prop="capacity" label="最大容量" width="120" sortable></el-table-column>
                <el-table-column prop="location" label="地点" width="200"></el-table-column>
                <el-table-column prop="manager" label="负责人" width="150"></el-table-column>
                <el-table-column label="操作" width="180" fixed="right" align="center" header-align="center">
                    <template slot-scope="scope">
                        <el-button size="mini" type="primary" @click="editWarehouse(scope.row)" 
                            v-if="$permission.canUpdateWarehouse(scope.row.id)">修改</el-button>
                        <el-button size="mini" type="danger" @click="deleteWarehouse(scope.row.id)" 
                            v-if="$permission.canDeleteWarehouse()">删除</el-button>
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
        <!-- 修改仓库信息弹框 -->
        <el-dialog title="修改仓库信息" :visible.sync="editDialogVisible" width="650px" center class="modern-dialog"
            top="15vh">
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="form-meta">
                        <el-form :model="editForm" label-width="80px">
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="仓库ID">
                                        <el-input v-model="editForm.id" disabled></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="仓库名称">
                                        <el-input v-model="editForm.name"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="状态">
                                        <el-select v-model="editForm.status" placeholder="选择状态">
                                            <el-option label="启用" value="启用"></el-option>
                                            <el-option label="停用" value="停用"></el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="最大容量">
                                        <el-input v-model="editForm.capacity" type="number"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="地点">
                                        <el-input v-model="editForm.location"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="负责人">
                                        <el-input v-model="editForm.manager"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-form>
                    </div>
                </div>
            </div>
            <div slot="footer" class="dialog-footer">
                <el-button @click="editDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveEdit">保存</el-button>
            </div>
        </el-dialog>
        
        <!-- 添加仓库信息弹框 -->
        <el-dialog title="添加仓库信息" :visible.sync="addDialogVisible" width="650px" center class="modern-dialog"
            top="15vh">
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="form-meta">
                        <el-form :model="addForm" label-width="80px">
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="仓库ID">
                                        <el-input v-model="addForm.id"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="仓库名称">
                                        <el-input v-model="addForm.name"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="状态">
                                        <el-select v-model="addForm.status" placeholder="选择状态">
                                            <el-option label="启用" value="启用"></el-option>
                                            <el-option label="停用" value="停用"></el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="最大容量">
                                        <el-input v-model="addForm.capacity" type="number"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="地点">
                                        <el-input v-model="addForm.location"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="负责人">
                                        <el-input v-model="addForm.manager"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-form>
                    </div>
                </div>
            </div>
            <div slot="footer" class="dialog-footer">
                <el-button @click="addDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveAdd">保存</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
export default {
    data() {
        return {
            searchQuery: '',
            selectedField: '',
            fields: [
                { label: '仓库名称', value: 'name' },
                { label: '状态', value: 'status' },
                { label: '最大容量', value: 'capacity' },
                { label: '地点', value: 'location' },
                { label: '负责人', value: 'manager' }
            ],
            warehouses: [],
            editDialogVisible: false,
            editForm: {},
            addDialogVisible: false,
            addForm: { id: '', name: '', status: '', capacity: '', location: '', manager: '' },
            currentPage: 1,
            pageSize: 20,
            total: 0,
            loading: false
        };
    },
    computed: {
        /**
         * @Function_Para 过滤仓库数据
         *   无参数
         * @Function_Meth 根据搜索条件过滤仓库列表:
         *   - 如果未指定搜索字段或查询内容，返回全部仓库
         *   - 否则返回指定字段包含查询内容的仓库
         *   - 然后应用权限过滤，确保操作员只能看到授权仓库
         * @Function_API 无外部API调用
         * @Function_Caller 被模板的computed属性或组件自身方法引用，用于动态获取筛选后的仓库数组
         */
        filteredWarehouses() {
            // 首先应用搜索过滤
            let result = this.warehouses;
            if (this.selectedField && this.searchQuery) {
                result = result.filter(warehouse =>
                    warehouse[this.selectedField]?.toString().toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            }
            
            // 然后应用权限过滤，确保操作员只能看到授权的仓库
            return this.$permission.filterAuthorizedWarehouses(result);
        },

        /**
         * @Function_Para 分页处理仓库数据
         *   无参数
         *   Template引用: 表格的:data属性
         * @Function_Meth 根据当前页码和页大小截取仓库数据
         * @Function_API 无外部API调用
         */
        paginatedWarehouses() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.filteredWarehouses.slice(start, end);
        },

        /**
         * @Function_Para 获取过滤后的总记录数
         *   无参数
         *   Template引用: 表格头部的记录数标签
         * @Function_Meth 返回过滤后的仓库总数
         * @Function_API 无外部API调用
         */
        totalFiltered() {
            return this.filteredWarehouses.length;
        }
    },
    methods: {
        /**
         * @Function_Para 滚动表格到顶部
         *   无参数
         * @Function_Caller 被模板中的"返回顶部"按钮的 @click 事件调用
         * @Function_Meth 平滑滚动表格视图到顶部
         * @Function_API
         *   - DOM API: 获取表格滚动容器并执行滚动
         */
        scrollToTop() {
            const tableWrapper = this.$refs.table.$el.querySelector('.el-table__body-wrapper');
            if (tableWrapper) {
                tableWrapper.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        },

        /**
         * @Function_Para 处理搜索
         *   无参数
         * @Function_Caller 被模板中的搜索框的 @keyup.enter 和搜索按钮的 @click 事件调用
         * @Function_Meth 执行搜索并重置分页到第一页
         * @Function_API 无外部API调用
         */
        handleSearch() {
            this.currentPage = 1;
        },

        /**
         * @Function_Para 处理页大小变化
         *   @param {number} size - 新的页大小
         * @Function_Caller 被模板中的分页控件的 @size-change 事件调用
         * @Function_Meth 更新每页显示记录数，并重置为第一页
         * @Function_API 无外部API调用
         */
        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
        },

        /**
         * @Function_Para 处理页码变化
         *   @param {number} page - 新的页码
         * @Function_Caller 被模板中的分页控件的 @current-change 事件调用
         * @Function_Meth 更新当前页码
         * @Function_API 无外部API调用
         */
        handleCurrentChange(page) {
            this.currentPage = page;
        },

        /**
         * @Function_Para 处理表格排序变化
         *   @param {Object} params - 排序参数，包含prop和order
         * @Function_Caller 被模板中的表格的 @sort-change 事件调用
         * @Function_Meth 根据排序字段和顺序对仓库数据进行排序
         * @Function_API 无外部API调用
         */
        handleSortChange({ prop, order }) {
            if (order === 'ascending') {
                this.warehouses.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
            } else if (order === 'descending') {
                this.warehouses.sort((a, b) => (a[prop] < b[prop] ? 1 : -1));
            }
        },

        /**
         * @Function_Para 导出数据
         *   无参数
         * @Function_Caller 被模板中的"导出"按钮的 @click 事件调用
         * @Function_Meth 将仓库数据导出为JSON文件
         * @Function_API
         *   - Blob API: 创建文件数据
         *   - URL API: 创建对象URL
         *   - DOM API: 创建下载链接
         */
        exportData() {
            if (!this.$permission.canCreateWarehouse()) {
                this.$message.error('您没有导出仓库数据的权限');
                return;
            }
            
            const dataStr = JSON.stringify(this.warehouses, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'warehouses.json';
            link.click();
            URL.revokeObjectURL(url);
        },

        /**
         * @Function_Para 加载仓库数据
         *   无参数
         * @Function_Caller 被组件的 created 生命周期钩子调用
         * @Function_Meth 从localStorage加载仓库数据
         * @Function_API
         *   - localStorage API: 读取仓库数据
         */
        loadWarehouses() {
            const savedWarehouses = localStorage.getItem('warehouses');
            const allWarehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
            this.warehouses = allWarehouses;
            this.total = this.filteredWarehouses.length;
        },

        /**
         * @Function_Para 保存仓库数据
         *   无参数
         * @Function_Caller 被 saveEdit 和 saveAdd 方法调用
         * @Function_Meth 将仓库数据保存到localStorage
         * @Function_API
         *   - localStorage API: 保存仓库数据
         */
        saveWarehouses() {
            const normalizedWarehouses = this.warehouses.map(warehouse => ({
                ...warehouse,
                capacity: parseInt(warehouse.capacity, 10) || 0 // 确保容量为整数
            }));
            localStorage.setItem('warehouses', JSON.stringify(normalizedWarehouses));
            this.total = this.warehouses.length;
        },

        /**
         * @Function_Para 编辑仓库
         *   @param {Object} warehouse - 要编辑的仓库对象
         * @Function_Caller 被模板中的表格操作列的"修改"按钮的 @click 事件调用
         * @Function_Meth 打开编辑对话框并填充仓库数据
         * @Function_API 无外部API调用
         */
        editWarehouse(warehouse) {
            if (!this.$permission.canUpdateWarehouse(warehouse.id)) {
                this.$message.error('您没有修改此仓库的权限');
                return;
            }
            
            this.editForm = { ...warehouse };
            this.editDialogVisible = true;
        },

        /**
         * @Function_Para 保存编辑
         *   无参数
         * @Function_Caller 被模板中的编辑对话框的"保存"按钮的 @click 事件调用
         * @Function_Meth 保存编辑后的仓库信息
         * @Function_API
         *   - Element UI Message: 显示操作结果
         */
        saveEdit() {
            const index = this.warehouses.findIndex(warehouse => warehouse.id === this.editForm.id);
            if (index !== -1) {
                this.warehouses.splice(index, 1, {
                    ...this.editForm,
                    capacity: parseInt(this.editForm.capacity, 10) || 0 // 确保容量为整数
                });
                this.saveWarehouses();
                this.$message.success('修改成功');
            }
            this.editDialogVisible = false;
        },

        /**
         * @Function_Para 删除仓库
         *   @param {string} id - 要删除的仓库ID
         * @Function_Caller 被模板中的表格操作列的"删除"按钮的 @click 事件调用
         * @Function_Meth 从仓库列表中删除指定仓库并保存
         * @Function_API
         *   - Element UI Message: 显示操作结果
         */
        deleteWarehouse(id) {
            if (!this.$permission.canDeleteWarehouse()) {
                this.$message.error('您没有删除仓库的权限');
                return;
            }
            
            this.$confirm('确定删除该仓库吗？', '提示', {
                type: 'warning'
            }).then(() => {
                this.warehouses = this.warehouses.filter(warehouse => warehouse.id !== id);
                this.saveWarehouses();
                this.$message.success('删除成功');
            }).catch(() => {});
        },

        /**
         * @Function_Para 打开添加对话框
         *   无参数
         * @Function_Caller 被模板中的"添加"按钮的 @click 事件调用
         * @Function_Meth 初始化添加表单并显示添加对话框
         * @Function_API 无外部API调用
         */
        openAddDialog() {
            if (!this.$permission.canCreateWarehouse()) {
                this.$message.error('您没有创建仓库的权限');
                return;
            }
            
            this.addForm = { id: '', name: '', status: '', capacity: '', location: '', manager: '' };
            this.addDialogVisible = true;
        },

        /**
         * @Function_Para 保存新增仓库
         *   无参数
         * @Function_Caller 被模板中的添加对话框的"保存"按钮的 @click 事件调用
         * @Function_Meth 验证并保存新增仓库信息
         * @Function_API
         *   - Element UI Message: 显示操作结果
         */
        saveAdd() {
            if (!this.addForm.id || !this.addForm.name) {
                this.$message.error('请填写完整信息');
                return;
            }
            this.warehouses.push({
                ...this.addForm,
                capacity: parseInt(this.addForm.capacity, 10) || 0 // 确保容量为整数
            });
            this.saveWarehouses();
            this.$message.success('添加成功');
            this.addDialogVisible = false;
        },

        /**
         * @Function_Para 导入数据
         *   无参数
         * @Function_Caller 被模板中的"导入"按钮的 @click 事件调用
         * @Function_Meth 从JSON文件导入仓库数据
         * @Function_API
         *   - File API: 读取文件内容
         *   - Element UI Message: 显示操作结果
         */
        importData() {
            if (!this.$permission.canCreateWarehouse()) {
                this.$message.error('您没有导入仓库数据的权限');
                return;
            }
            
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedData = JSON.parse(e.target.result);
                            if (Array.isArray(importedData)) {
                                this.warehouses = [...this.warehouses, ...importedData];
                                this.saveWarehouses();
                                this.$message.success('数据导入成功');
                            } else {
                                this.$message.error('文件格式错误');
                            }
                        } catch (error) {
                            this.$message.error('文件解析失败');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        }
    },
    created() {
        this.loadWarehouses();
    }
};
</script>

<style scoped>
/* 主容器样式 */
/* 
  @Style_Desc 页面最外层容器样式
  @Selector .user 页面最外层容器
*/
.user {
    padding: 8px;
}

/* 搜索区域样式 */
/* 
  @Style_Desc 搜索区域卡片的背景、圆角和间距
  @Selector .search-card 搜索区域卡片
*/
.search-card {
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 20px;
    background-color: rgb(245, 245, 250);
}

/* 搜索框组样式 */
/* 
  @Style_Desc 搜索框组的水平排列和间距
  @Selector .search-group 搜索框组
*/
.search-group {
    display: flex;
    align-items: center;
    gap: 10px;
    /* 元素间距 */
}

.search-inputs {
    display: flex;
    flex: 1;
    gap: 10px;
}

.divider {
    width: 1px;
    height: 40px;
    background-color: #dcdcdc;
}

.action-buttons {
    display: flex;
    gap: 10px;
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

/* 现代对话框样式 */
.modern-dialog>>>.el-dialog {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.modern-dialog>>>.el-dialog__header {
    background-color: #f5f7fa;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
}

.modern-dialog>>>.el-dialog__title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.modern-dialog>>>.el-dialog__body {
    padding: 20px;
}

.modern-dialog>>>.el-dialog__footer {
    padding: 12px 20px;
    border-top: 1px solid #ebeef5;
}

.dialog-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.dialog-header {
    padding-bottom: 16px;
}

.form-meta {
    width: 100%;
}

/* 对话框关闭按钮样式 */
.modern-dialog>>>.el-dialog__headerbtn {
    transition: all 0.3s;
    position: absolute;
    top: 16px;
    right: 16px;
    width: 30px;
    height: 28px;
    padding: 5px;
}

.modern-dialog>>>.el-dialog__headerbtn:hover {
    background-color: rgba(245, 108, 108, 0.8);
    border-radius: 4px;
}

.modern-dialog>>>.el-dialog__headerbtn:hover .el-dialog__close {
    color: #ffffff;
}

.modern-dialog>>>.el-dialog__headerbtn .el-dialog__close {
    transition: color 0.3s;
    font-size: 18px;
    transform: scale(1.2);
}

/* 美化表单样式 */
.modern-dialog .el-input__inner,
.modern-dialog .el-textarea__inner {
    border-radius: 6px;
    transition: all 0.3s;
}

.modern-dialog .el-input__inner:focus,
.modern-dialog .el-textarea__inner:focus {
    border-color: #409EFF;
    box-shadow: 0 0 5px rgba(64, 158, 255, 0.2);
}

/* 美化按钮样式 */
.modern-dialog .dialog-footer .el-button {
    padding: 10px 20px;
    border-radius: 6px;
    transition: all 0.3s;
}

.modern-dialog .dialog-footer .el-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>