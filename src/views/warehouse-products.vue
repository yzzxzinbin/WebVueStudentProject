<template>
  <!--
    @Template_Desc 仓库商品页面主体
      包含搜索筛选区域以及显示仓库商品列表的表格
    @Element_Desc .warehouse-product 最外层容器，对整个仓库商品页面进行包裹和布局
    @Element_Desc .search-card 搜索卡片，用于承载搜索表单组件
    @Element_Desc .search-group 用于水平排列筛选条件
    @Element_Desc .warehouse-select 仓库选择下拉框
    @Element_Desc .field-select 字段选择下拉框
    @Element_Desc .search-box 搜索输入框
    @Element_Desc .table-card 表格卡片，主要用于承载仓库商品列表的表格
    @Element_Desc .table-header 表格标题区域
    @Element_Desc .table-footer 表格底部区域，包含返回顶部按钮和分页组件
  -->
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
      <el-table ref="table" :data="paginatedProducts" height="calc(99vh - 400px)" stripe border highlight-current-row
        style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="商品ID" width="100" sortable align="center"></el-table-column>
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
    /**
     * @Function_Para 过滤商品数据
     *   无参数
     * @Function_Meth 根据搜索条件和选择的仓库筛选商品列表:
     *   - 如果未指定仓库, 则从所有仓库商品中收集
     *   - 如果未指定搜索字段或搜索内容, 直接返回全部
     *   - 根据指定字段或仓库名搜索匹配的商品
     * @Function_API 无外部API调用
     * @Function_Caller 被模板的computed属性或组件自身方法引用，用于动态获取筛选后的商品数组
     */
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

    /**
     * @Function_Para 分页处理商品数据
     *   无参数
     * @Function_Meth 根据当前页码和页大小截取商品数据
     * @Function_API 无外部API调用
     * @Function_Caller 被模板中表格的 :data 属性引用，用于显示当前分页后的数据
     */
    paginatedProducts() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredProducts.slice(start, end);
    },

    /**
     * @Function_Para 获取过滤后的总记录数
     *   无参数
     * @Function_Meth 返回过滤后的商品总数，用于在页面上显示记录个数
     * @Function_API 无外部API调用
     * @Function_Caller 被模板中的统计标签引用，用于显示总记录条数
     */
    totalFiltered() {
      return this.filteredProducts.length;
    }
  },
  methods: {
    /**
     * @Function_Para 获取仓库名称
     *   @param {string} warehouseId - 仓库ID
     * @Function_Meth 根据仓库ID查找并返回对应的仓库名称
     * @Function_API 无外部API调用
     * @Function_Caller 被表格中仓库名称显示所调用
     */
    getWarehouseName(warehouseId) {
      const warehouse = this.warehouses.find(w => w.id === warehouseId);
      return warehouse ? warehouse.name : '';
    },

    /**
     * @Function_Para 滚动表格到顶部
     *   无参数
     * @Function_Meth 平滑滚动表格视图到顶部
     * @Function_API DOM API
     * @Function_Caller 被“返回顶部”按钮的点击事件调用
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
     * @Function_Para 处理仓库选择变化
     *   无参数
     * @Function_Meth 当仓库选择器value改变时，重新加载商品数据
     * @Function_API 无外部API调用
     * @Function_Caller 被@change事件触发调用，在用户更改仓库时执行
     */
    handleWarehouseChange() {
      this.loadProducts();
    },

    /**
     * @Function_Para 处理搜索
     *   无参数
     * @Function_Meth 执行搜索并重置分页到第一页
     * @Function_API 无外部API调用
     * @Function_Caller 被搜索按钮点击或回车事件触发调用
     */
    handleSearch() {
      this.currentPage = 1;
    },

    /**
     * @Function_Para 处理页大小变化
     *   @param {number} size - 新的页大小
     * @Function_Meth 更新每页显示记录数, 并重置到第一页
     * @Function_API 无外部API调用
     * @Function_Caller 被分页组件@size-change事件调用
     */
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
    },

    /**
     * @Function_Para 处理页码变化
     *   @param {number} page - 新的页码
     * @Function_Meth 更新当前页码
     * @Function_API 无外部API调用
     * @Function_Caller 被分页组件@current-change事件调用
     */
    handleCurrentChange(page) {
      this.currentPage = page;
    },

    /**
     * @Function_Para 加载仓库数据
     *   无参数
     * @Function_Meth 从localStorage加载仓库数据并存入组件状态
     * @Function_API localStorage
     * @Function_Caller 被组件created生命周期调用
     */
    loadWarehouses() {
      const savedWarehouses = localStorage.getItem('warehouses');
      this.warehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
    },

    /**
     * @Function_Para 加载所有商品数据
     *   无参数
     * @Function_Meth 从localStorage加载所有商品信息
     * @Function_API localStorage
     * @Function_Caller 被组件created生命周期调用
     */
    loadAllProducts() {
      const savedProducts = localStorage.getItem('products');
      this.allProducts = savedProducts ? JSON.parse(savedProducts) : [];
    },

    /**
     * @Function_Para 加载仓库商品数据
     *   无参数
     * @Function_Meth 从localStorage加载商品在各仓库的库存信息
     * @Function_API localStorage
     * @Function_Caller 在仓库选择变更或页面初始化时被调用
     */
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

    /**
     * @Function_Para 保存仓库数据
     *   无参数
     * @Function_Meth 将仓库数据保存到localStorage
     * @Function_API localStorage
     * @Function_Caller 被编辑仓库对话框相关操作调用
     */
    saveWarehouses() {
      localStorage.setItem('warehouses', JSON.stringify(this.warehouses));
      this.total = this.warehouses.length;
    },

    /**
     * @Function_Para 编辑仓库
     *   @param {Object} warehouse - 要编辑的仓库对象
     * @Function_Meth 准备编辑仓库表单数据并显示对话框
     * @Function_API 无外部API调用
     * @Function_Caller 被表格操作列或列表中的编辑按钮所调用
     */
    editWarehouse(warehouse) {
      this.editForm = { ...warehouse };
      this.editDialogVisible = true;
    },

    /**
     * @Function_Para 保存编辑
     *   无参数
     * @Function_Meth 保存编辑后的仓库信息并更新数据
     * @Function_API localStorage, Element UI Message
     * @Function_Caller 被编辑对话框的保存按钮调用
     */
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
/* filepath: k:\test program\WebTech\HTML\ms\src\views\warehouse-products.vue */

/* 
  @Style_Desc 整体页面布局与配色 
  @Selector .warehouse-product 页面最外层容器
*/

/* 搜索区域样式 */
/* 
  @Style_Desc 搜索卡片的背景、圆角和间距 
  @Selector .search-card 包含搜索相关控件 
*/
.search-card {
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: rgb(245, 245, 250);
}

/* 搜索框组样式 */
/* 使用Flexbox设置搜索组件的水平排列和间距 */
.search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 搜索输入区样式 */
/* 设置所有搜索输入组件的Flex布局和间距 */
.search-inputs {
  display: flex;
  flex: 1;
  gap: 10px;
}

/* 仓库选择框样式 */
/* 设置仓库下拉选择框的固定宽度 */
.warehouse-select {
  width: 200px;
}

/* 字段选择框样式 */
/* 设置字段下拉选择框的固定宽度 */
.field-select {
  width: 150px;
}

/* 搜索框样式 */
/* 设置搜索输入框占据剩余空间 */
.search-box {
  flex: 1;
}

/* 表格卡片样式 */
/* 设置表格容器的背景、边距和圆角 */
.table-card {
  padding: 8px;
  padding-bottom: 0px;
  border-radius: 8px;
  overflow: hidden;
  background-color: rgb(245, 245, 250);
}

/* 表格头部样式 */
/* 设置表格标题区域的布局、背景和圆角 */
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
.table-title {
  font-size: 18px;
  font-weight: bold;
}

/* 表格主体样式 */
/* 设置表格的高度、边框和圆角 */
.el-table {
  width: 100%;
  flex: 1;
  height: calc(99vh - 400px);
  overflow-y: auto;
  border-radius: 0px 0px 8px 8px;
}

/* 表格底部样式 */
/* 设置表格底部分页和按钮区域的布局 */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 0 16px;
}

/* 返回顶部按钮样式 */
/* 设置返回顶部按钮的外观和悬停动画 */
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
.back-to-top:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
}

/* 分页控件样式 */
/* 重置分页控件的边距 */
.pagination {
  margin: 0;
  padding: 0;
}

/* 固定列样式 */
/* 调整固定在右侧的操作列的高度和圆角 */
.el-table__fixed-right {
  height: calc(100% - 2px) !important;
  border-radius: 0 8px 0 0;
}

.el-table__fixed-right::before {
  background-color: transparent !important;
}

/* 表格标题样式 */
/* 设置表格列标题的位置和文本处理 */
.el-table .el-table__header-wrapper th {
  position: relative;
}

.el-table .el-table__header-wrapper th .cell {
  white-space: nowrap;
}
</style>