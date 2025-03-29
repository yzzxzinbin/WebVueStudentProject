<template>
  <div class="operation">
    <el-card shadow="hover" class="form-card">
      <div class="form-header">
        <span class="table-title">操作申请</span>
      </div>
      <div class="form-content">
        <div class="form-inputs">
          <el-form :model="operationForm" label-width="100px" class="operation-form" :rules="rules"
            ref="operationFormRef">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="操作类型" prop="type">
                  <el-select v-model="operationForm.type" placeholder="请选择操作类型" @change="handleTypeChange">
                    <el-option label="入库" value="入库"></el-option>
                    <el-option label="出库" value="出库"></el-option>
                    <el-option label="转调" value="转调"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="商品ID" prop="productId">
                  <el-autocomplete v-model="operationForm.productId" :fetch-suggestions="queryProduct"
                    placeholder="请输入商品ID" @select="handleProductSelect"
                    :disabled="!operationForm.type"></el-autocomplete>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="数量" prop="quantity">
                  <el-input-number v-model="operationForm.quantity" :min="1" :max="9999"
                    :disabled="!operationForm.productId"></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="24" v-if="operationForm.type !== '入库'">
                <el-form-item label="源仓库" prop="sourceWarehouse">
                  <el-select v-model="operationForm.sourceWarehouse" placeholder="请选择源仓库"
                    :disabled="!operationForm.productId">
                    <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name"
                      :value="warehouse.id"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24" v-if="operationForm.type !== '出库'">
                <el-form-item label="目标仓库" prop="targetWarehouse">
                  <el-select v-model="operationForm.targetWarehouse" placeholder="请选择目标仓库"
                    :disabled="!operationForm.productId">
                    <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name"
                      :value="warehouse.id"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
        <div class="divider"></div>
        <div class="form-actions">
          <el-button type="primary" @click="submitOperation">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button type="warning" @click="exportLogs">导出日志</el-button>
        </div>
      </div>
    </el-card>

    <!-- 日志数据表单 -->
    <el-card shadow="hover" class="table-card">
      <div class="table-header">
        <span class="table-title">操作日志</span>
        <el-tag type="info">共 {{ totalLogs }} 条记录</el-tag>
      </div>
      <el-table ref="logTable" :data="paginatedLogs" height="tableHeight" stripe border highlight-current-row
        style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="日志ID" width="200" sortable></el-table-column>
        <el-table-column prop="type" label="操作类型" width="120" sortable></el-table-column>
        <el-table-column prop="productId" label="商品ID" width="120" sortable></el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" sortable></el-table-column>
        <el-table-column prop="sourceWarehouse" label="源仓库" width="150"></el-table-column>
        <el-table-column prop="targetWarehouse" label="目标仓库" width="150"></el-table-column>
        <el-table-column prop="status" label="状态" width="100" sortable></el-table-column>
        <el-table-column prop="timestamp" label="时间" width="200" sortable></el-table-column>
      </el-table>
      <div class="table-footer">
        <el-button type="primary" plain size="mini" @click="scrollToTop('logTable')" class="back-to-top">
          <i class="el-icon-top"></i> 返回顶部
        </el-button>
        <el-pagination class="pagination" @size-change="handleLogSizeChange" @current-change="handleLogCurrentChange"
          :current-page="logCurrentPage" :page-sizes="[10, 20, 50, 100]" :page-size="logPageSize"
          layout="total, sizes, prev, pager, next, jumper" :total="totalLogs">
        </el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      operationForm: {
        type: '',
        productId: '',
        quantity: 1,
        sourceWarehouse: '',
        targetWarehouse: ''
      },
      warehouses: [], // 仓库列表
      products: [],   // 商品列表
      rules: {
        type: [{ required: true, message: '请选择操作类型', trigger: 'change' }],
        productId: [{ required: true, message: '请选择商品', trigger: 'blur' }],
        quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
        sourceWarehouse: [{ required: true, message: '请选择源仓库', trigger: 'change' }],
        targetWarehouse: [{ required: true, message: '请选择目标仓库', trigger: 'change' }]
      },
      logs: [], // 日志数据
      logCurrentPage: 1,
      logPageSize: 20,
      loading: false
    };
  },
  computed: {
    paginatedLogs() {
      const start = (this.logCurrentPage - 1) * this.logPageSize;
      const end = start + this.logPageSize;
      return this.logs.slice(start, end);
    },
    totalLogs() {
      return this.logs.length;
    }
  },
  methods: {
    // 加载仓库和商品数据
    loadWarehouses() {
      const savedWarehouses = localStorage.getItem('warehouses');
      this.warehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
    },
    loadProducts() {
      const savedProducts = localStorage.getItem('products');
      this.products = savedProducts ? JSON.parse(savedProducts) : [];
    },

    // 操作类型变化时重置相关字段
    handleTypeChange() {
      this.operationForm.sourceWarehouse = '';
      this.operationForm.targetWarehouse = '';

      if (this.operationForm.type === '入库') {
        this.operationForm.sourceWarehouse = 'external'; // 标记为外部来源
      }
    },

    // 商品搜索
    queryProduct(queryString, callback) {
      const results = this.products
        .filter(product =>
          product.id.includes(queryString) ||
          product.name.includes(queryString)
        )
        .map(product => ({
          value: product.id,
          label: `${product.id} - ${product.name}`
        }));
      callback(results);
    },

    // 商品选择
    handleProductSelect(item) {
      this.operationForm.productId = item.value;
    },

    // 提交操作
    submitOperation() {
      this.$refs.operationFormRef.validate(valid => {
        if (!valid) {
          this.$message.error('请填写完整信息');
          return;
        }

        // 检查商品合法性
        const product = this.products.find(p => p.id === this.operationForm.productId);
        if (!product) {
          this.logOperation('ERR', '未知商品，操作失败');
          this.$message.error('未知商品，操作失败');
          return;
        }

        // 检查出库合法性
        if (this.operationForm.type === '出库') {
          const warehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];
          const existingProduct = warehouseProducts.find(
            p => p.id === this.operationForm.productId &&
              p.warehouseId === this.operationForm.sourceWarehouse
          );
          if (!existingProduct || existingProduct.quantity < this.operationForm.quantity) {
            this.logOperation('ERR', '库存不足或商品不存在，操作失败');
            this.$message.error('库存不足或商品不存在，操作失败');
            return;
          }
        }

        // 更新库存数据
        const operationSuccess = this.updateStock();

        if (operationSuccess) {
          // 生成唯一操作ID
          const operationId = this.generateOperationId();

          // 保存操作记录
          const operationData = {
            id: operationId,
            ...this.operationForm,
            timestamp: new Date().toISOString(),
            status: 'SUC'
          };
          const operations = JSON.parse(localStorage.getItem('operations')) || [];
          operations.push(operationData);
          localStorage.setItem('operations', JSON.stringify(operations));

          this.$message.success('操作提交成功');
          this.resetForm();
        }
      });
    },

    // 生成唯一操作ID
    generateOperationId() {
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
      const warehouseCode = this.operationForm.type === '入库'
        ? this.operationForm.targetWarehouse
        : this.operationForm.sourceWarehouse;
      const operationType = this.operationForm.type === '入库' ? '01' : this.operationForm.type === '出库' ? '02' : '03';
      const baseString = `${timestamp}${warehouseCode}${operationType}`;
      const checksum = parseInt(baseString, 10) % 97;
      return `${baseString}${checksum.toString().padStart(2, '0')}`;
    },

    // 导出操作日志
    exportLogs() {
      const operations = JSON.parse(localStorage.getItem('operations')) || [];
      const dataStr = JSON.stringify(operations, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'operation_logs.json';
      link.click();
      URL.revokeObjectURL(url);
      this.$message.success('日志导出成功');
    },

    // 更新库存逻辑
    updateStock() {
      const warehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];
      let success = true;

      switch (this.operationForm.type) {
        case '入库':
          this.handleInbound(warehouseProducts);
          break;
        case '出库':
          success = this.handleOutbound(warehouseProducts);
          break;
        case '转调':
          success = this.handleTransfer(warehouseProducts);
          break;
      }

      if (success) {
        localStorage.setItem('warehouseProducts', JSON.stringify(warehouseProducts));
      }
      return success;
    },

    // 入库处理
    handleInbound(warehouseProducts) {
      const existingProduct = warehouseProducts.find(
        p => p.id === this.operationForm.productId &&
          p.warehouseId === this.operationForm.targetWarehouse
      );

      if (existingProduct) {
        existingProduct.quantity += this.operationForm.quantity;
      } else {
        const product = this.products.find(p => p.id === this.operationForm.productId);
        warehouseProducts.push({
          id: this.operationForm.productId,
          warehouseId: this.operationForm.targetWarehouse,
          name: product?.name || '未知商品',
          quantity: this.operationForm.quantity,
          location: '默认位置'
        });
      }
    },

    // 出库处理
    handleOutbound(warehouseProducts) {
      const existingProduct = warehouseProducts.find(
        p => p.id === this.operationForm.productId &&
          p.warehouseId === this.operationForm.sourceWarehouse
      );

      if (existingProduct) {
        if (existingProduct.quantity < this.operationForm.quantity) {
          this.$message.error('库存不足');
          return false;
        }
        existingProduct.quantity -= this.operationForm.quantity;

        // 如果库存为0，移除该记录
        if (existingProduct.quantity <= 0) {
          const index = warehouseProducts.indexOf(existingProduct);
          warehouseProducts.splice(index, 1);
        }
      } else {
        this.$message.error('该仓库没有此商品');
        return false;
      }
      return true;
    },

    // 转调处理
    handleTransfer(warehouseProducts) {
      // 检查源仓库是否有足够库存
      const sourceProduct = warehouseProducts.find(
        p => p.id === this.operationForm.productId &&
          p.warehouseId === this.operationForm.sourceWarehouse
      );

      if (!sourceProduct || sourceProduct.quantity < this.operationForm.quantity) {
        this.logOperation('ERR', '源仓库库存不足或商品不存在，转调失败');
        this.$message.error('源仓库库存不足或商品不存在，转调失败');
        return false;
      }

      // 减少源仓库库存
      sourceProduct.quantity -= this.operationForm.quantity;
      if (sourceProduct.quantity <= 0) {
        const index = warehouseProducts.indexOf(sourceProduct);
        warehouseProducts.splice(index, 1);
      }

      // 增加目标仓库库存
      const targetProduct = warehouseProducts.find(
        p => p.id === this.operationForm.productId &&
          p.warehouseId === this.operationForm.targetWarehouse
      );

      if (targetProduct) {
        targetProduct.quantity += this.operationForm.quantity;
      } else {
        const product = this.products.find(p => p.id === this.operationForm.productId);
        warehouseProducts.push({
          id: this.operationForm.productId,
          warehouseId: this.operationForm.targetWarehouse,
          name: product?.name || '未知商品',
          quantity: this.operationForm.quantity,
          location: '默认位置'
        });
      }

      return true;
    },

    // 记录操作日志
    logOperation(status, message) {
      const operationData = {
        id: this.generateOperationId(),
        ...this.operationForm,
        timestamp: new Date().toISOString(),
        status
      };
      const operations = JSON.parse(localStorage.getItem('operations')) || [];
      operations.push(operationData);
      localStorage.setItem('operations', JSON.stringify(operations));
      if (status === 'ERR') {
        this.$message.error(message);
      }
    },

    // 重置表单
    resetForm() {
      this.$refs.operationFormRef.resetFields();
      this.operationForm.quantity = 1;
    },

    loadLogs() {
      const savedLogs = localStorage.getItem('operations');
      this.logs = savedLogs ? JSON.parse(savedLogs) : [];
    },
    handleLogSizeChange(size) {
      this.logPageSize = size;
      this.logCurrentPage = 1;
    },
    handleLogCurrentChange(page) {
      this.logCurrentPage = page;
    },
    scrollToTop(refName) {
      const tableWrapper = this.$refs[refName]?.$el.querySelector('.el-table__body-wrapper');
      if (tableWrapper) {
        tableWrapper.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  },
  created() {
    this.loadWarehouses();
    this.loadProducts();
    this.loadLogs();
  }
};
</script>

<style scoped>
.operation {
  padding: 8px;
}

.form-card {
  border-radius: 8px;
  background-color: rgba(245, 245, 250, 0.5);
  backdrop-filter: blur(10px);
}

.form-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operation-form {
  max-width: 800px;
  margin: 0 auto;
}

.table-card {
  margin-top: 20px;
  /* 动态高度调整 */
  display: flex;
  flex-direction: column;
  background-color: rgba(245, 245, 250, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}

.el-table {
  flex: 1;
  height: calc(99vh - 650px);
  overflow-y: auto;
  border-radius: 16px;
}

.table-header {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 18px;
  font-weight: bold;
}

.table-footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-left: auto;
}

.form-content {
  display: flex;
  gap: 10px;
}

.form-inputs {
  flex: 3;
}

.form-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: flex-start;
  align-items: stretch;
  background-color: rgba(245, 245, 250, 0.5);
  /*  使子元素拉伸填充宽度 */
  padding-left: 30px;
  padding-right: 30px;
  padding-top: 50px;
  padding-bottom: 50px;
  border-radius: 8px;
}

.form-actions .el-button {
  width: 100%;
  /*  按钮宽度100%填充容器 */
  margin: 0;
  /*  移除默认外边距 */
  /*  添加左边距 */
  min-width: 150px;
  /*  设置最小宽度 */
}

.form-actions .el-button {
  width: 100%;
  /*  按钮宽度100%填充容器 */
  margin: 0;
  /*  移除默认外边距 */
}

.divider {
  width: 1px;
  background-color: #dcdcdc;
  height: auto;
}
</style>