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
            <el-option v-for="item in authorizedWarehouses" :key="item.id" :label="item.name"
              :value="item.id"></el-option>
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
        <el-table-column prop="name" label="商品名称" width="260" sortable></el-table-column>
        <el-table-column prop="warehouseId" label="所属仓库" width="180" sortable>
          <template slot-scope="scope">
            {{ getWarehouseName(scope.row.warehouseId) }}
          </template>
        </el-table-column>
        <el-table-column prop="features" label="商品特性" width="320"></el-table-column>
        <el-table-column prop="price" label="商品价格" width="160" sortable></el-table-column>
        <el-table-column prop="quantity" label="库存数量" width="150" sortable>
          <template slot-scope="scope">
            <span style="font-weight: bold">{{ scope.row.quantity }}</span>
          </template>
        </el-table-column>
        <!-- 删除存放位置列，替换为查看详情按钮列 -->
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-button 
              type="text" 
              @click="showProductDetail(scope.row)" 
              class="detail-button"
              size="small">
              查看详情 <i class="el-icon-view"></i>
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
    
    <!-- 商品详情对话框 -->
    <el-dialog title="商品详情" :visible.sync="productDetailVisible" width="700px" center class="modern-dialog"
      top="8vh" style="overflow: hidden;">
      <div v-if="currentProduct" class="detail-dialog-content">
        <!-- 第一部分：商品基本信息 -->
        <div class="detail-section">
          <h3 class="section-title">商品信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">商品ID:</span>
              <span class="detail-value">{{ currentProduct.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">商品名称:</span>
              <span class="detail-value">{{ currentProduct.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">当前库存:</span>
              <span class="detail-value highlight">{{ currentProduct.quantity }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">商品类型:</span>
              <span class="detail-value">{{ getProductDetail(currentProduct.id, 'type') || '未知' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">供应商:</span>
              <span class="detail-value">{{ getProductDetail(currentProduct.id, 'supplier') || '未知' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">创建日期:</span>
              <span class="detail-value">{{ formatDate(getProductDetail(currentProduct.id, 'createdAt')) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 第二部分：仓库信息 -->
        <div class="detail-section">
          <h3 class="section-title">仓库信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">仓库ID:</span>
              <span class="detail-value">{{ currentProduct.warehouseId }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">仓库名称:</span>
              <span class="detail-value">{{ getWarehouseName(currentProduct.warehouseId) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">仓库状态:</span>
              <span class="detail-value">{{ getWarehouseDetail(currentProduct.warehouseId, 'status') || '未知' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">最大容量:</span>
              <span class="detail-value">{{ getWarehouseDetail(currentProduct.warehouseId, 'capacity') || '未知' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">仓库地点:</span>
              <span class="detail-value">{{ getWarehouseDetail(currentProduct.warehouseId, 'location') || '未知' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">负责人:</span>
              <span class="detail-value">{{ getWarehouseDetail(currentProduct.warehouseId, 'manager') || '未知' }}</span>
            </div>
          </div>
        </div>
        
        <!-- 第三部分：变更历史记录 -->
        <div class="detail-section history-section">
          <h3 class="section-title">变更历史</h3>
          <div class="history-content">
            <div class="current-stock">
              当前库存该商品: <span class="highlight">{{ currentProduct.quantity }}</span> 个
            </div>
            <div class="history-records" v-if="productHistory.length > 0">
              <div v-for="(record, index) in productHistory" :key="index" class="history-record">
                <span :class="getOperationClass(record.type)">
                  [{{ record.type }}]
                </span>
                <span class="change-text">{{ formatChange(record) }}</span>
                <span class="record-time">@{{ formatDateTime(record.timestamp) }}</span>
                <span class="record-person">by {{ record.applicant || record.operator || '未知用户' }}</span>
              </div>
            </div>
            <div v-else class="no-record">
              暂无变更记录
            </div>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="productDetailVisible = false">关闭</el-button>
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
      loading: false,
      authorizedWarehouses: [],
      productDetailVisible: false,
      currentProduct: null,
      productHistory: []
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
      // 首先应用权限过滤
      let result = this.$permission.filterAuthorizedWarehouseProducts(this.products);

      // 然后应用仓库筛选
      if (this.selectedWarehouse) {
        result = result.filter(item => item.warehouseId === this.selectedWarehouse);
      }

      // 最后应用搜索筛选
      if (this.selectedField && this.searchQuery) {
        result = result.filter(item =>
          String(item[this.selectedField]).toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }

      return result;
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
      if (!warehouseId) return '--';
      
      const warehouse = this.warehouses.find(w => w.id === warehouseId);
      return warehouse ? warehouse.name : warehouseId; // 如果找不到仓库名称，则显示仓库ID而不是空白
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
      const allWarehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
      this.warehouses = allWarehouses; // 加载所有仓库数据以便于显示名称
      this.authorizedWarehouses = this.$permission.filterAuthorizedWarehouses(allWarehouses);
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
    },

    /**
     * @Function_Para 查看商品详情
     *   @param {Object} product - 商品对象
     * @Function_Meth 显示商品详情对话框
     */
    viewProductDetail(product) {
      this.currentProduct = product;
      this.productDetailVisible = true;
    },

    /**
     * @Function_Para 导入数据
     *   无参数
     * @Function_Meth 检查权限并导入数据
     * @Function_API localStorage, Element UI Message
     * @Function_Caller 被导入按钮点击事件调用
     */
    importData() {
      if (!this.$permission.canCreateProduct()) {
        this.$message.error('您没有导入商品数据的权限');
        return;
      }

      // 导入数据逻辑

      // 确保在导入时过滤掉没有权限的仓库商品
      const authorizedWarehouseIds = this.$permission.getAuthorizedWarehouseIds();

      // 在导入后的处理中添加权限过滤
      if (Array.isArray(importedData)) {
        const filteredData = importedData.filter(item => {
          if (!authorizedWarehouseIds.includes(item.warehouseId)) {
            hasUnauthorized = true;
            return false;
          }
          return true;
        });

        if (hasUnauthorized) {
          this.$message.warning('部分商品因权限不足已被过滤');
        }

        // 使用过滤后的数据
        this.warehouseProducts = [...this.warehouseProducts, ...filteredData];
      }
    },

    /**
     * @Function_Para 导出数据
     *   无参数
     * @Function_Meth 检查权限并导出数据
     * @Function_API localStorage, Element UI Message
     * @Function_Caller 被导出按钮点击事件调用
     */
    exportData() {
      if (!this.$permission.isAdmin()) {
        this.$message.error('您没有导出仓库商品数据的权限');
        return;
      }

      // 导出数据逻辑

      // 导出时只导出有权限的仓库商品
      const authorizedProducts = this.$permission.filterAuthorizedWarehouseProducts(this.warehouseProducts);

      const dataStr = JSON.stringify(authorizedProducts, null, 2);
      // 其他导出逻辑...
    },

    /**
     * @Function_Para 显示商品详情
     * @param {Object} product - 商品对象
     * @Function_Meth 显示商品详情对话框并加载历史记录
     */
    showProductDetail(product) {
      this.currentProduct = product;
      this.loadProductHistory(product);
      this.productDetailVisible = true;
    },
    
    /**
     * @Function_Para 加载商品历史
     * @param {Object} product - 商品对象
     * @Function_Meth 从操作记录中筛选与当前商品和仓库相关的记录
     */
    loadProductHistory(product) {
      const operations = JSON.parse(localStorage.getItem('operations')) || [];
      
      // 筛选与当前商品和仓库相关的操作记录
      this.productHistory = operations.filter(op => {
        return op.productId === product.id && 
          (op.sourceWarehouse === product.warehouseId || 
           op.targetWarehouse === product.warehouseId);
      }).sort((a, b) => {
        // 按时间倒序排列
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    },
    
    /**
     * @Function_Para 获取商品详情
     * @param {string} productId - 商品ID
     * @param {string} field - 字段名称
     * @returns {any} 字段值
     * @Function_Meth 根据商品ID和字段名获取商品详情
     */
    getProductDetail(productId, field) {
      const product = this.allProducts.find(p => p.id === productId);
      return product ? product[field] : null;
    },
    
    /**
     * @Function_Para 获取仓库详情
     * @param {string} warehouseId - 仓库ID
     * @param {string} field - 字段名称
     * @returns {any} 字段值
     * @Function_Meth 根据仓库ID和字段名获取仓库详情
     */
    getWarehouseDetail(warehouseId, field) {
      const warehouse = this.warehouses.find(w => w.id === warehouseId);
      return warehouse ? warehouse[field] : null;
    },
    
    /**
     * @Function_Para 格式化操作记录
     * @param {Object} record - 操作记录
     * @returns {string} 格式化后的变更信息
     * @Function_Meth 根据操作类型格式化变更信息
     */
    formatChange(record) {
      if (record.type === '入库' && record.targetWarehouse === this.currentProduct.warehouseId) {
        // 入库操作且目标仓库是当前仓库
        return `数量增加 ${record.quantity}`;
      } else if (record.type === '出库' && record.sourceWarehouse === this.currentProduct.warehouseId) {
        // 出库操作且源仓库是当前仓库
        return `数量减少 ${record.quantity}`;
      } else if (record.type === '转调') {
        if (record.sourceWarehouse === this.currentProduct.warehouseId) {
          // 转出
          return `转出 ${record.quantity} 到 ${this.getWarehouseName(record.targetWarehouse)}`;
        } else if (record.targetWarehouse === this.currentProduct.warehouseId) {
          // 转入
          return `从 ${this.getWarehouseName(record.sourceWarehouse)} 转入 ${record.quantity}`;
        }
      }
      return `数量变更 ${record.quantity}`;
    },
    
    /**
     * @Function_Para 获取操作类型样式类
     * @param {string} type - 操作类型
     * @returns {string} CSS类名
     * @Function_Meth 根据操作类型返回对应的CSS类名
     */
    getOperationClass(type) {
      const classMap = {
        '入库': 'operation-in',
        '出库': 'operation-out',
        '转调': 'operation-transfer'
      };
      return classMap[type] || '';
    },
    
    /**
     * @Function_Para 格式化日期
     * @param {string} dateStr - 日期字符串
     * @returns {string} 格式化后的日期
     * @Function_Meth 将日期格式化为YYYY-MM-DD格式
     */
    formatDate(dateStr) {
      if (!dateStr) return '未知';
      try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      } catch (e) {
        return dateStr;
      }
    },
    
    /**
     * @Function_Para 格式化日期时间
     * @param {string} dateStr - 日期时间字符串
     * @returns {string} 格式化后的日期时间
     * @Function_Meth 将日期时间格式化为YYYY-MM-DD HH:mm:ss格式
     */
    formatDateTime(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } catch (e) {
        return dateStr;
      }
    }
  },
  created() {
    this.loadWarehouses();
    this.loadAllProducts();
    this.loadProducts();
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
  border-bottom: 1px solid #ebeef5;
}

.product-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: #909399;
}

.meta-value {
  font-size: 14px;
  color: #303133;
}

.product-detail-content {
  background-color: #f8f9fb;
  border-radius: 8px;
  padding: 16px;
  line-height: 1.6;
  font-size: 14px;
  color: #303133;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

.product-detail-content h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #606266;
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

/* 详情按钮样式 */
.detail-button {
  color: #409EFF;
  font-weight: 500;
  transition: all 0.3s;
}

.detail-button:hover {
  color: #66b1ff;
  transform: translateY(-2px);
}

.detail-button i {
  margin-left: 4px;
}

/* 详情对话框内容样式 */
.detail-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  background-color: #f9f9fb;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #409EFF;
  margin-top: 0;
  margin-bottom: 15px;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 16px;
  width: 4px;
  background-color: #409EFF;
  border-radius: 2px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #909399;
}

.detail-value {
  font-size: 14px;
  color: #303133;
}

.highlight {
  font-weight: bold;
  color: #409EFF;
}

/* 历史记录样式 */
.history-section {
  background-color: #f2f6fc;
}

.history-content {
  padding: 5px;
  font-size: 14px;
  line-height: 1.6;
}

.current-stock {
  font-weight: 500;
  color: #303133;
  padding: 8px;
  margin-bottom: 12px;
  border-bottom: 1px dashed #dcdfe6;
}

.history-records {
  max-height: 200px;
  overflow-y: auto;
}

.history-record {
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.operation-in {
  color: #67c23a;
  font-weight: bold;
}

.operation-out {
  color: #f56c6c;
  font-weight: bold;
}

.operation-transfer {
  color: #e6a23c;
  font-weight: bold;
}

.change-text {
  flex: 1;
  color: #303133;
}

.record-time {
  color: #909399;
  font-size: 12px;
}

.record-person {
  color: #606266;
  font-size: 12px;
  font-style: italic;
}

.no-record {
  color: #909399;
  text-align: center;
  padding: 20px;
}
</style>