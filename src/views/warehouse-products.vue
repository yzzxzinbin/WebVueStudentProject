<template>
  <div class="warehouse-product">
    <el-card shadow="hover" class="search-card">
      <div class="search-group">
        <div class="search-inputs">
          <el-select v-model="selectedWarehouse" placeholder="选择仓库" clearable class="warehouse-select"
            @change="handleWarehouseChange">
            <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name"
              :value="warehouse.id"></el-option>
          </el-select>
          <el-select v-model="selectedField" placeholder="选择字段" clearable class="field-select">
            <el-option v-for="item in fields" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
          <el-input v-model="searchQuery" placeholder="请输入搜索内容" class="search-box" clearable
            @keyup.enter.native="handleSearch">
            <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
          </el-input>
        </div>
      </div>
    </el-card>

    <el-card shadow="hover" class="table-card">
      <div class="table-header">
        <span class="table-title">仓库商品列表</span>
        <el-tag type="info">共 {{ totalFiltered }} 条记录</el-tag>
      </div>
      <el-table ref="table" :data="paginatedProducts" height="tableHeight" stripe border highlight-current-row
        style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="商品ID" width="150" sortable></el-table-column>
        <el-table-column prop="name" label="商品名称" width="250" sortable></el-table-column>
        <el-table-column prop="warehouseId" label="所属仓库" width="180" sortable>
          <template slot-scope="scope">
            {{ getWarehouseName(scope.row.warehouseId) || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="features" label="商品特性" width="300"></el-table-column>
        <el-table-column prop="price" label="商品价格" width="160" sortable></el-table-column>
        <el-table-column prop="quantity" label="库存数量" width="150" sortable>
          <template slot-scope="scope">
            <span style="font-weight: bold">{{ scope.row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" min-width="100">
          <template slot-scope="scope">
            <span>{{ scope.row.location || '--' }}</span>
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
    <el-dialog title="修改仓库信息" :visible.sync="editDialogVisible" width="650px" center>
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
      <div slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedWarehouse: '', // 当前选择的仓库ID
      searchQuery: '',
      selectedField: '',
      fields: [
        { label: '商品名称', value: 'name' },
        { label: '商品特性', value: 'features' },
        { label: '商品价格', value: 'price' },
        { label: '库存数量', value: 'quantity' },
        { label: '存放位置', value: 'location' },
        { label: '所属仓库', value: 'warehouseId' }
      ],
      warehouses: [], // 仓库列表
      products: [], // 当前仓库的商品列表
      allProducts: [], // 所有商品数据
      editDialogVisible: false,
      editForm: {},
      currentPage: 1,
      pageSize: 20,
      total: 0,
      loading: false
    };
  },
  computed: {
    filteredProducts() {
      let productsToFilter = this.products;

      if (!this.selectedWarehouse) {
        const allWarehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];
        productsToFilter = allWarehouseProducts.map(product => {
          const productInfo = this.allProducts.find(p => p.id === product.id) || {};
          return {
            ...product,
            features: productInfo.features || '',
            price: productInfo.price || 0,
            warehouseId: product.warehouseId
          };
        });
      }

      if (!this.selectedField || !this.searchQuery) {
        return productsToFilter;
      }

      // 添加对仓库字段的搜索支持
      if (this.selectedField === 'warehouseId') {
        return productsToFilter.filter(product =>
          this.getWarehouseName(product.warehouseId).includes(this.searchQuery)
        );
      }

      return productsToFilter.filter(product =>
        product[this.selectedField]?.toString().includes(this.searchQuery)
      );
    },
    paginatedProducts() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredProducts.slice(start, end);
    },
    totalFiltered() {
      return this.filteredProducts.length;
    }
  },
  methods: {
    // 获取仓库名称
    getWarehouseName(warehouseId) {
      const warehouse = this.warehouses.find(w => w.id === warehouseId);
      return warehouse ? warehouse.name : '';
    },
    // 滚动到顶部
    scrollToTop() {
      const tableWrapper = this.$refs.table.$el.querySelector('.el-table__body-wrapper');
      if (tableWrapper) {
        tableWrapper.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    },
    handleWarehouseChange() {
      this.loadProducts();
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
        this.warehouses.sort((a, b) => (a[prop] > b[prop] ? 1 : -1));
      } else if (order === 'descending') {
        this.warehouses.sort((a, b) => (a[prop] < b[prop] ? 1 : -1));
      }
    },
    loadWarehouses() {
      const savedWarehouses = localStorage.getItem('warehouses');
      this.warehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
      this.total = this.warehouses.length;
    },
    loadAllProducts() {
      const savedProducts = localStorage.getItem('products');
      this.allProducts = savedProducts ? JSON.parse(savedProducts) : [];
    },
    loadProducts() {
      const allWarehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];

      if (!this.selectedWarehouse) {
        this.products = allWarehouseProducts.map(product => {
          const productInfo = this.allProducts.find(p => p.id === product.id) || {};
          return {
            ...product,
            features: productInfo.features || '',
            price: productInfo.price || 0,
            warehouseId: product.warehouseId // 确保包含仓库ID
          };
        });
      } else {
        const warehouseProducts = allWarehouseProducts.filter(
          product => product.warehouseId === this.selectedWarehouse
        );

        this.products = warehouseProducts.map(product => {
          const productInfo = this.allProducts.find(p => p.id === product.id) || {};
          return {
            ...product,
            features: productInfo.features || '',
            price: productInfo.price || 0,
            warehouseId: product.warehouseId // 确保包含仓库ID
          };
        });
      }

      this.total = this.products.length;
    },
    saveWarehouses() {
      localStorage.setItem('warehouses', JSON.stringify(this.warehouses));
      this.total = this.warehouses.length;
    },
    editWarehouse(warehouse) {
      this.editForm = { ...warehouse };
      this.editDialogVisible = true;
    },
    saveEdit() {
      const index = this.warehouses.findIndex(warehouse => warehouse.id === this.editForm.id);
      if (index !== -1) {
        this.warehouses.splice(index, 1, { ...this.editForm });
        this.saveWarehouses();
        this.$message.success('修改成功');
      }
      this.editDialogVisible = false;
    }
  },
  created() {
    this.loadWarehouses();
    this.loadAllProducts();
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
}

/* 搜索框组输入框样式 */
.search-inputs {
  display: flex;
  flex: 1;
  gap: 10px;
}

.warehouse-select {
  width: 200px;
}

.field-select {
  width: 150px;
}

.search-box {
  flex: 1;
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