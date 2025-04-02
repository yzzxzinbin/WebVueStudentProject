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
                <el-button type="success" icon="el-icon-plus" @click="openAddDialog"
                    class="action-button">添加</el-button>
                <el-button type="primary" icon="el-icon-upload2" @click="importData"
                    class="action-button">导入</el-button>
                <el-button type="warning" icon="el-icon-download" @click="exportData"
                    class="action-button">导出</el-button>
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
                        <el-button size="mini" type="danger" @click="deleteProduct(scope.row.id)">删除</el-button>
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
        <el-dialog title="修改商品信息" :visible.sync="editDialogVisible" width="650px" center>
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
            <div slot="footer" class="dialog-footer">
                <el-button @click="editDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveEdit">保存</el-button>
            </div>
        </el-dialog>
        <!-- 添加商品信息弹框 -->
        <el-dialog title="添加商品信息" :visible.sync="addDialogVisible" width="650px" modal-append-to-body>
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
        filteredProducts() {
            if (!this.selectedField || !this.searchQuery) {
                return this.products;
            }
            return this.products.filter(product =>
                product[this.selectedField]?.toString().includes(this.searchQuery)
            );
        },
        paginatedProducts() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.filteredProducts.slice(start, end);
        },
        totalFiltered() {
            return this.filteredProducts.length; // 动态计算筛选后的总记录数
        }
    },
    methods: {
        scrollToTop() {
            const tableWrapper = this.$refs.table.$el.querySelector('.el-table__body-wrapper');
            if (tableWrapper) {
                tableWrapper.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
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
                this.products.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
            } else if (order === 'descending') {
                this.products.sort((a, b) => (a[prop] < b[prop] ? 1 : -1));
            }
        },
        exportData() {
            const dataStr = JSON.stringify(this.products, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'products.json';
            link.click();
            URL.revokeObjectURL(url);
        },
        loadProducts() {
            const savedProducts = localStorage.getItem('products');
            this.products = savedProducts ? JSON.parse(savedProducts) : [];
            this.total = this.products.length;
        },
        saveProducts() {
            localStorage.setItem('products', JSON.stringify(this.products));
            this.total = this.products.length;
        },
        editProduct(product) {
            this.editForm = { ...product };
            this.editDialogVisible = true;
        },
        saveEdit() {
            const index = this.products.findIndex(product => product.id === this.editForm.id);
            if (index !== -1) {
                this.products.splice(index, 1, { ...this.editForm });
                this.saveProducts();
                this.$message.success('修改成功');
            }
            this.editDialogVisible = false;
        },
        deleteProduct(id) {
            this.products = this.products.filter(product => product.id !== id);
            this.saveProducts();
            this.$message.success('删除成功');
        },
        openAddDialog() {
            this.addForm = { id: '', name: '', features: '', price: '', type: '', supplier: '', createdAt: new Date().toISOString() };
            this.addDialogVisible = true;
        },
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
        importData() {
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
/* 主容器样式 */
.user {
    padding: 8px;
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
</style>