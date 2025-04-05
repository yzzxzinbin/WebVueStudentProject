<template>
    <!--
        @Template_Desc 商品列表页面
        提供搜索、分页、添加/编辑商品等功能
        @Element_Desc .user 页面最外层容器
        @Element_Desc .search-card 搜索区域卡片
        @Element_Desc .search-group 搜索输入与按钮的容器
        @Element_Desc .table-card 表格卡片
        @Element_Desc .table-header 表格标题区域
        @Element_Desc .table-footer 表格底部区域，包含返回顶部按钮和分页组件
        @Element_Desc el-dialog 添加商品信息、修改商品信息的弹窗
    -->
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
                <el-button type="success" icon="el-icon-plus" @click="openAddDialog" class="action-button" 
                    v-if="$permission.canCreateProduct()">添加</el-button>
                <el-button type="primary" icon="el-icon-upload2" @click="importData" class="action-button" 
                    v-if="$permission.canCreateProduct()">导入</el-button>
                <el-button type="warning" icon="el-icon-download" @click="exportData" class="action-button" 
                    v-if="$permission.canCreateProduct()">导出</el-button>
            </div>
        </el-card>

        <el-card shadow="hover" class="table-card">
            <div class="table-header">
                <span class="table-title">商品列表</span>
                <el-tag type="info">共 {{ totalFiltered }} 条记录</el-tag>
            </div>
            <el-table ref="table" :data="paginatedProducts" height=tableHeight stripe border highlight-current-row
                style="width: 100%" v-loading="loading" @sort-change="handleSortChange" :resizable="true">
                <el-table-column prop="id" label="商品ID" width="100" sortable></el-table-column>
                <el-table-column prop="name" label="商品名称" width="220" sortable></el-table-column>
                <el-table-column prop="features" label="商品特性" width="260"></el-table-column>
                <el-table-column prop="price" label="商品价格" width="120" sortable></el-table-column>
                <el-table-column prop="type" label="商品类型" width="120"></el-table-column>
                <el-table-column prop="supplier" label="供应商" width="150" sortable></el-table-column>
                <el-table-column prop="createdAt" label="创建日期" width="180" sortable></el-table-column>
                <el-table-column label="操作" width="180" fixed="right" align="center" header-align="center">
                    <template slot-scope="scope">
                        <el-button size="mini" type="primary" @click="editProduct(scope.row)">修改</el-button>
                        <el-button size="mini" type="danger" @click="deleteProduct(scope.row.id)" 
                            v-if="$permission.canDeleteProduct()">删除</el-button>
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
        <!-- 修改商品信息弹框 -->
        <el-dialog title="修改商品信息" :visible.sync="editDialogVisible" width="650px" center class="modern-dialog"
            top="15vh">
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="form-meta">
                        <el-form :model="editForm" label-width="80px">
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="商品ID">
                                        <el-input v-model="editForm.id" disabled></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="商品名称">
                                        <el-input v-model="editForm.name"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="商品特性">
                                        <el-input v-model="editForm.features"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="商品价格">
                                        <el-input v-model="editForm.price" type="number"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="商品类型">
                                        <el-input v-model="editForm.type"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="供应商">
                                        <el-input v-model="editForm.supplier"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="24">
                                    <el-form-item label="创建日期">
                                        <el-date-picker v-model="editForm.createdAt" type="datetime" placeholder="选择日期时间"
                                            value-format="yyyy-MM-dd HH:mm:ss"></el-date-picker>
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
        
        <!-- 添加商品信息弹框 -->
        <el-dialog title="添加商品信息" :visible.sync="addDialogVisible" width="650px" center class="modern-dialog"
            top="15vh">
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="form-meta">
                        <el-form :model="addForm" label-width="80px">
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="商品ID">
                                        <el-input v-model="addForm.id"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="商品名称">
                                        <el-input v-model="addForm.name"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="商品特性">
                                        <el-input v-model="addForm.features"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="商品价格">
                                        <el-input v-model="addForm.price" type="number"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20">
                                <el-col :span="12">
                                    <el-form-item label="商品类型">
                                        <el-input v-model="addForm.type"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="供应商">
                                        <el-input v-model="addForm.supplier"></el-input>
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
                { label: '商品名称', value: 'name' },
                { label: '商品特性', value: 'features' },
                { label: '商品价格', value: 'price' },
                { label: '商品类型', value: 'type' },
                { label: '供应商', value: 'supplier' },
                { label: '创建日期', value: 'createdAt' }
            ],
            products: [],
            editDialogVisible: false,
            editForm: {},
            addDialogVisible: false,
            addForm: { id: '', name: '', features: '', price: '', type: '', supplier: '', createdAt: '' },
            currentPage: 1,
            pageSize: 20,
            total: 0,
            loading: false
        };
    },
    computed: {
        /**
         * @Function_Para 过滤商品数据
         *   无参数
         * @Function_Meth 根据搜索条件筛选商品列表:
         *   - 如果未指定搜索字段或查询内容，返回全部商品
         *   - 否则返回指定字段包含查询内容的商品
         * @Function_API 无外部API调用
         * @Function_Caller 表格显示、总数统计会使用
         */
        filteredProducts() {
            if (!this.selectedField || !this.searchQuery) {
                return this.products;
            }
            return this.products.filter(product =>
                product[this.selectedField]?.toString().includes(this.searchQuery)
            );
        },

        /**
         * @Function_Para 分页处理商品数据
         *   无参数
         *   Template引用: 表格的:data属性
         * @Function_Meth 根据当前页码和页大小截取商品数据
         * @Function_API 无外部API调用
         * @Function_Caller 表格的:data属性，用于分页
         */
        paginatedProducts() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.filteredProducts.slice(start, end);
        },

        /**
         * @Function_Para 获取过滤后的总记录数
         *   无参数
         *   Template引用: 表格头部的记录数标签
         * @Function_Meth 返回过滤后的商品总数，用于分页显示
         * @Function_API 无外部API调用
         * @Function_Caller 分页组件显示总数
         */
        totalFiltered() {
            return this.filteredProducts.length; // 动态计算筛选后的总记录数
        }
    },
    methods: {
        /**
         * @Function_Para 滚动表格到顶部
         *   无参数
         *   Template引用: "返回顶部"按钮的点击事件
         * @Function_Meth 平滑滚动表格视图到顶部
         * @Function_API
         *   - DOM API: 获取表格滚动容器并执行滚动
         * @Function_Caller 被“返回顶部”按钮点击事件调用
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
         *   Template引用: 搜索框的@keyup.enter和搜索按钮的点击事件
         * @Function_Meth 执行搜索并重置分页到第一页
         * @Function_API 无外部API调用
         * @Function_Caller 被搜索框回车或搜索按钮点击时调用
         */
        handleSearch() {
            this.currentPage = 1;
        },

        /**
         * @Function_Para 处理页大小变化
         *   @param {number} size - 新的页大小
         *   Template引用: 分页控件的@size-change事件
         * @Function_Meth 更新每页显示记录数，并重置为第一页
         * @Function_API 无外部API调用
         * @Function_Caller 被分页组件@size-change调用
         */
        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
        },

        /**
         * @Function_Para 处理页码变化
         *   @param {number} page - 新的页码
         *   Template引用: 分页控件的@current-change事件
         * @Function_Meth 更新当前页码
         * @Function_API 无外部API调用
         * @Function_Caller 被分页组件@current-change调用
         */
        handleCurrentChange(page) {
            this.currentPage = page;
        },

        /**
         * @Function_Para 处理表格排序变化
         *   @param {Object} params - 排序参数，包含prop和order
         *   Template引用: 表格的@sort-change事件
         * @Function_Meth 根据排序字段和顺序对商品数据进行排序
         * @Function_API 无外部API调用
         * @Function_Caller 被@sort-change事件调用
         */
        handleSortChange({ prop, order }) {
            if (order === 'ascending') {
                this.products.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
            } else if (order === 'descending') {
                this.products.sort((a, b) => (a[prop] < b[prop] ? 1 : -1));
            }
        },

        /**
         * @Function_Para 导出数据
         *   无参数
         *   Template引用: "导出"按钮的点击事件
         * @Function_Meth 将商品数据导出为JSON文件:
         *   1. 将数据转换为JSON字符串
         *   2. 创建Blob对象和下载链接
         *   3. 触发文件下载
         * @Function_API
         *   - Blob API: 创建文件数据
         *   - URL API: 创建对象URL
         *   - DOM API: 创建下载链接
         * @Function_Caller 被“导出”按钮点击事件调用
         */
        exportData() {
            if (!this.$permission.canCreateProduct()) {
                this.$message.error('您没有导出商品数据的权限');
                return;
            }
            const dataStr = JSON.stringify(this.products, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'products.json';
            link.click();
            URL.revokeObjectURL(url);
        },

        /**
         * @Function_Para 加载商品数据
         *   无参数
         * @Function_Meth 从localStorage加载商品数据并存入组件状态
         * @Function_API
         *   - localStorage API: 读取商品数据
         * @Function_Caller 在组件created时调用
         */
        loadProducts() {
            const savedProducts = localStorage.getItem('products');
            this.products = savedProducts ? JSON.parse(savedProducts) : [];
            this.total = this.products.length;
        },

        /**
         * @Function_Para 保存商品数据
         *   无参数
         * @Function_Meth 将商品数据保存到localStorage并更新总数
         * @Function_API
         *   - localStorage API: 保存商品数据
         * @Function_Caller 在添加或编辑后调用
         */
        saveProducts() {
            localStorage.setItem('products', JSON.stringify(this.products));
            this.total = this.products.length;
        },

        /**
         * @Function_Para 编辑商品
         *   @param {Object} product - 要编辑的商品对象
         *   Template引用: 表格操作列的"修改"按钮
         * @Function_Meth 准备编辑商品的表单数据并显示编辑对话框
         * @Function_API 无外部API调用
         * @Function_Caller 表格中“修改”按钮点击事件
         */
        editProduct(product) {
            this.editForm = { ...product };
            this.editDialogVisible = true;
        },

        /**
         * @Function_Para 保存编辑
         *   无参数
         *   Template引用: 编辑对话框的"保存"按钮
         * @Function_Meth 保存编辑后的商品信息:
         *   1. 在商品数组中查找并更新对应商品
         *   2. 保存更新后的数据并显示成功消息
         * @Function_API
         *   - localStorage API: 通过saveProducts方法保存数据
         *   - Element UI Message: 显示操作结果
         * @Function_Caller 编辑对话框“保存”按钮点击事件
         */
        saveEdit() {
            const index = this.products.findIndex(product => product.id === this.editForm.id);
            if (index !== -1) {
                this.products.splice(index, 1, { ...this.editForm });
                this.saveProducts();
                this.$message.success('修改成功');
            }
            this.editDialogVisible = false;
        },

        /**
         * @Function_Para 删除商品
         *   @param {string} id - 要删除的商品ID
         *   Template引用: 表格操作列的"删除"按钮
         * @Function_Meth 从商品列表中删除指定商品并保存
         * @Function_API
         *   - localStorage API: 通过saveProducts方法保存数据
         *   - Element UI Message: 显示操作结果
         * @Function_Caller 表格中“删除”按钮点击事件
         */
        deleteProduct(id) {
            if (!this.$permission.canDeleteProduct()) {
                this.$message.error('您没有删除商品的权限');
                return;
            }
            this.$confirm('确定删除该商品吗？', '提示', {
                type: 'warning'
            }).then(() => {
                this.products = this.products.filter(product => product.id !== id);
                this.saveProducts();
                this.$message.success('删除成功');
            }).catch(() => {});
        },

        /**
         * @Function_Para 打开添加对话框
         *   无参数
         *   Template引用: "添加"按钮的点击事件
         * @Function_Meth 初始化添加表单并显示添加对话框
         * @Function_API
         *   - Date API: 生成当前时间作为创建时间
         * @Function_Caller “添加”按钮点击事件
         */
        openAddDialog() {
            if (!this.$permission.canCreateProduct()) {
                this.$message.error('您没有创建商品的权限');
                return;
            }
            this.addForm = { id: '', name: '', features: '', price: '', type: '', supplier: '', createdAt: new Date().toISOString() };
            this.addDialogVisible = true;
        },

        /**
         * @Function_Para 保存新增商品
         *   无参数
         *   Template引用: 添加对话框的"保存"按钮
         * @Function_Meth 验证并保存新增商品信息:
         *   1. 检查必填字段
         *   2. 将新商品添加到数组并保存
         * @Function_API
         *   - localStorage API: 通过saveProducts方法保存数据
         *   - Element UI Message: 显示操作结果
         * @Function_Caller 添加对话框“保存”按钮事件
         */
        saveAdd() {
            if (!this.addForm.id || !this.addForm.name) {
                this.$message.error('请填写完整信息');
                return;
            }
            this.products.push({ ...this.addForm });
            this.saveProducts();
            this.$message.success('添加成功');
            this.addDialogVisible = false;
        },

        /**
         * @Function_Para 导入数据
         *   无参数
         *   Template引用: "导入"按钮的点击事件
         * @Function_Meth 从JSON文件导入商品数据:
         *   1. 打开文件选择对话框
         *   2. 读取选择的JSON文件
         *   3. 解析数据并添加到商品列表
         * @Function_API
         *   - File API: 读取文件内容
         *   - Element UI Message: 显示操作结果
         * @Function_Caller “导入”按钮点击事件
         */
        importData() {
            if (!this.$permission.canCreateProduct()) {
                this.$message.error('您没有导入商品数据的权限');
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
                                this.products = [...this.products, ...importedData];
                                this.saveProducts();
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
        },

        /**
         * @Function_Para 格式化日期
         *   @param {string} dateString - 日期字符串
         * @Function_Meth 将日期字符串格式化为YYYY-MM-DD格式
         * @Function_API
         *   - Date API: 日期对象创建和格式化
         * @Function_Caller 可能在表格日期显示中被调用
         */
        formatDate(dateString) {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            } catch (e) {
                return dateString;
            }
        }
    },
    created() {
        this.loadProducts();
    }
};
</script>

<style scoped>
/* filepath: k:\test program\WebTech\HTML\ms\src\views\ProductList.vue */

/*
  @Style_Desc 整个商品列表页面的基本布局样式
  @Selector .user 页面外层容器
  @Selector .search-card, .search-group, .table-card, .table-header, .table-footer
             与搜索、表格整体布局功能相关
  @Selector .action-button 用于修饰添加、导入、导出按钮
*/
/* 主容器样式 */
/* 设置商品列表页面的基本内边距 */
.user {
    padding: 8px;
}

/* 搜索区域样式 */
/* 设置顶部搜索卡片的背景、圆角和间距 */
.search-card {
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 20px;
    background-color: rgb(245, 245, 250);
}

/* 搜索框组样式 */
/* 使用Flexbox布局组织搜索组件的水平排列和间距 */
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

/* 表格头部样式 */
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

/* 表格底部样式 */
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