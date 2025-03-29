<template>
  <div class="operation">
    <el-card shadow="hover" class="form-card">
      <div class="form-header">
        <span class="form-title">操作申请</span>
      </div>
      <el-form :model="operationForm" label-width="100px" class="operation-form">
        <el-form-item label="操作类型">
          <el-select v-model="operationForm.type" placeholder="请选择操作类型" @change="handleTypeChange">
            <el-option label="入库" value="入库"></el-option>
            <el-option label="出库" value="出库"></el-option>
            <el-option label="转调" value="转调"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="商品ID">
          <el-input v-model="operationForm.productId" placeholder="请输入商品ID"></el-input>
        </el-form-item>
        <el-form-item label="源仓库" v-if="operationForm.type !== '入库'">
          <el-select v-model="operationForm.sourceWarehouse" placeholder="请选择源仓库">
            <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="目标仓库" v-if="operationForm.type !== '出库'">
          <el-select v-model="operationForm.targetWarehouse" placeholder="请选择目标仓库">
            <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id"></el-option>
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
        sourceWarehouse: '',
        targetWarehouse: ''
      },
      warehouses: [] // 仓库列表
    };
  },
  methods: {
    handleTypeChange() {
      if (this.operationForm.type === '入库') {
        this.operationForm.sourceWarehouse = '外部';
        this.operationForm.targetWarehouse = '';
      } else if (this.operationForm.type === '出库') {
        this.operationForm.sourceWarehouse = '';
        this.operationForm.targetWarehouse = '';
      } else {
        this.operationForm.sourceWarehouse = '';
        this.operationForm.targetWarehouse = '';
      }
    },
    submitOperation() {
      if (!this.operationForm.type || !this.operationForm.productId) {
        this.$message.error('请填写完整信息');
        return;
      }
      const operationData = { ...this.operationForm, timestamp: new Date().toISOString() };
      const operations = JSON.parse(localStorage.getItem('operations')) || [];
      operations.push(operationData);
      localStorage.setItem('operations', JSON.stringify(operations));
      this.$message.success('操作提交成功');
      this.resetForm();
    },
    resetForm() {
      this.operationForm = {
        type: '',
        productId: '',
        sourceWarehouse: '',
        targetWarehouse: ''
      };
    },
    loadWarehouses() {
      const savedWarehouses = localStorage.getItem('warehouses');
      this.warehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
    }
  },
  created() {
    this.loadWarehouses();
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