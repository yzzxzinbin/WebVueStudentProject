<template>
  <div class="operation">
    <el-card shadow="hover" class="form-card">
      <div class="form-header">
        <span class="form-title">操作申请</span>
      </div>
      <el-form :model="operationForm" label-width="100px" class="operation-form" :rules="rules" ref="operationFormRef">
        <el-form-item label="操作类型" prop="type">
          <el-select v-model="operationForm.type" placeholder="请选择操作类型" @change="handleTypeChange">
            <el-option label="入库" value="入库"></el-option>
            <el-option label="出库" value="出库"></el-option>
            <el-option label="转调" value="转调"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="商品ID" prop="productId">
          <el-autocomplete v-model="operationForm.productId" :fetch-suggestions="queryProduct" placeholder="请输入商品ID"
            @select="handleProductSelect" :disabled="!operationForm.type"></el-autocomplete>
        </el-form-item>

        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="operationForm.quantity" :min="1" :max="9999"
            :disabled="!operationForm.productId"></el-input-number>
        </el-form-item>

        <el-form-item label="源仓库" prop="sourceWarehouse" v-if="operationForm.type !== '入库'">
          <el-select v-model="operationForm.sourceWarehouse" placeholder="请选择源仓库" :disabled="!operationForm.productId">
            <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name"
              :value="warehouse.id"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="目标仓库" prop="targetWarehouse" v-if="operationForm.type !== '出库'">
          <el-select v-model="operationForm.targetWarehouse" placeholder="请选择目标仓库" :disabled="!operationForm.productId">
            <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name"
              :value="warehouse.id"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitOperation">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
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
      }
    };
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

        // 1. 保存操作记录
        const operationData = {
          ...this.operationForm,
          timestamp: new Date().toISOString()
        };
        const operations = JSON.parse(localStorage.getItem('operations')) || [];
        operations.push(operationData);
        localStorage.setItem('operations', JSON.stringify(operations));

        // 2. 更新库存数据
        this.updateStock();

        this.$message.success('操作提交成功');
        this.resetForm();
      });
    },

    // 更新库存逻辑
    updateStock() {
      const warehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];

      switch (this.operationForm.type) {
        case '入库':
          this.handleInbound(warehouseProducts);
          break;
        case '出库':
          this.handleOutbound(warehouseProducts);
          break;
        case '转调':
          this.handleTransfer(warehouseProducts);
          break;
      }

      localStorage.setItem('warehouseProducts', JSON.stringify(warehouseProducts));
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
          return;
        }
        existingProduct.quantity -= this.operationForm.quantity;

        // 如果库存为0，移除该记录
        if (existingProduct.quantity <= 0) {
          const index = warehouseProducts.indexOf(existingProduct);
          warehouseProducts.splice(index, 1);
        }
      } else {
        this.$message.error('该仓库没有此商品');
      }
    },

    // 转调处理
    handleTransfer(warehouseProducts) {
      // 先出库
      this.handleOutbound(warehouseProducts);

      // 再入库
      const originalTarget = this.operationForm.targetWarehouse;
      this.operationForm.targetWarehouse = this.operationForm.sourceWarehouse;
      this.operationForm.sourceWarehouse = originalTarget;
      this.handleInbound(warehouseProducts);
    },

    // 重置表单
    resetForm() {
      this.$refs.operationFormRef.resetFields();
      this.operationForm.quantity = 1;
    }
  },
  created() {
    this.loadWarehouses();
    this.loadProducts();
  }
};
</script>

<style scoped>
.operation {
  padding: 8px;
}

.form-card {
  padding: 16px;
  border-radius: 8px;
  background-color: rgb(245, 245, 250);
}

.form-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-title {
  font-size: 18px;
  font-weight: bold;
}

.operation-form {
  max-width: 600px;
  margin: 0 auto;
}
</style>