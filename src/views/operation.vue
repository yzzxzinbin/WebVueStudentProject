<template>
  <div class="operation">
    <el-card shadow="hover" class="form-card">
      <div class="form-header">
        <span class="table-title">操作申请</span>
      </div>
      <hr class="custom-hr">
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
                  <el-autocomplete v-model="operationForm.productId" @clear="operationForm.productId = ''"
                    :fetch-suggestions="queryProduct" placeholder="请输入商品ID" @select="handleProductSelect"
                    :disabled="!operationForm.type">
                  </el-autocomplete>
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
                    :disabled="!operationForm.productId" filterable clearable>
                    <el-option v-for="warehouse in filteredSourceWarehouses" :key="warehouse.id" :label="warehouse.name"
                      :value="warehouse.id"></el-option>
                    <el-option v-if="filteredSourceWarehouses.length === 0 && operationForm.productId" disabled value=""
                      label=""></el-option>
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
    <el-card ref="logTableCard" shadow="hover" class="table-card">
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
        <el-table-column prop="applicant" label="申请人" width="120"></el-table-column>
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
        targetWarehouse: '',
        applicant: '' // 修改字段名：从 operator 改为 applicant
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
    /**
     * @Function_Para 过滤源仓库列表
     *   无参数
     *   Template引用: 源仓库选择器的:options
     * @Function_Meth 根据当前选择的商品筛选可用的源仓库:
     *   1. 检查是否已选择商品
     *   2. 从warehouseProducts中查找包含该商品且有库存的仓库
     *   3. 返回匹配的仓库列表
     * @Function_API
     *   - localStorage API: 读取仓库商品数据
     */
    filteredSourceWarehouses() {
      if (!this.operationForm.productId) return [];

      const warehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];
      // 获取包含当前商品且有库存的仓库ID列表
      let availableWarehouseIds = warehouseProducts
        .filter(p => p.id === this.operationForm.productId && p.quantity > 0)
        .map(p => p.warehouseId);
      
      // 添加权限过滤
      const authorizedWarehouseIds = this.$permission.getAuthorizedWarehouseIds();
      availableWarehouseIds = availableWarehouseIds.filter(id => authorizedWarehouseIds.includes(id));

      // 返回匹配的仓库
      return this.warehouses.filter(warehouse =>
        availableWarehouseIds.includes(warehouse.id)
      );
    },

    /**
     * @Function_Para 分页处理日志数据
     *   无参数
     *   Template引用: 日志表格的:data属性
     * @Function_Meth 根据当前页码和页大小截取日志数据
     * @Function_API 无外部API调用
     */
    paginatedLogs() {
      const start = (this.logCurrentPage - 1) * this.logPageSize;
      const end = start + this.logPageSize;
      return this.logs.slice(start, end);
    },

    /**
     * @Function_Para 获取日志总数
     *   无参数
     *   Template引用: 日志标题区域的总数显示
     * @Function_Meth 返回日志记录总数
     * @Function_API 无外部API调用
     */
    totalLogs() {
      return this.logs.length;
    }
  },
  methods: {

    /**
     * @Function_Para 加载仓库数据
     *   无参数
     * @Function_Meth 从localStorage加载仓库数据并存入组件状态
     * @Function_Orgi 在组件created生命周期中自动调用
     * @Function_API
     *   - localStorage API: 读取仓库数据
     */
    loadWarehouses() {
      const savedWarehouses = localStorage.getItem('warehouses');
      const allWarehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
      this.warehouses = this.$permission.filterAuthorizedWarehouses(allWarehouses);
    },

    /**
     * @Function_Para 加载商品数据
     *   无参数
     * @Function_Meth 从localStorage加载商品数据并存入组件状态
     * @Function_Orgi 在组件created生命周期中自动调用
     * @Function_API
     *   - localStorage API: 读取商品数据
     */
    loadProducts() {
      const savedProducts = localStorage.getItem('products');
      this.products = savedProducts ? JSON.parse(savedProducts) : [];
    },

    /**
     * @Function_Para 处理操作类型变化
     *   无参数
     * @Function_Meth 根据操作类型重置相关字段:
     *   1. 重置源仓库和目标仓库
     *   2. 清空商品ID
     *   3. 对入库操作设置特殊的源仓库标记为"External"
     *   4. 对出库操作设置特殊的目标仓库标记为"External"
     * @Function_Orgi Template引用: 操作类型选择器的@change事件
     * @Function_API 无外部API调用
     */
    handleTypeChange() {
      this.operationForm.sourceWarehouse = '';
      this.operationForm.targetWarehouse = '';
      this.operationForm.productId = ''; // 清空商品ID以便重新选择
      
      if (this.operationForm.type === '入库') {
        this.operationForm.sourceWarehouse = 'External'; // 标记为外部来源，修改为大写E
      } else if (this.operationForm.type === '出库') {
        this.operationForm.targetWarehouse = 'External'; // 出库时设置目标仓库为External
      }
    },

    /**
     * @Function_Para 商品搜索
     *   @param {string} queryString - 搜索关键字
     *   @param {Function} callback - 回调函数，用于返回结果
     * @Function_Meth 根据输入查询匹配商品:
     *   1. 创建商品映射确保ID唯一
     *   2. 同时匹配ID和名称
     *   3. 结果按ID匹配优先排序
     *   4. 返回格式化的建议列表
     * @Function_Orgi Template引用: 商品ID输入框的:fetch-suggestions属性
     * @Function_API
     *   - JavaScript Map: 用于商品去重
     */
    queryProduct(queryString, callback) {
      // 使用 Map 去重，确保每个ID只出现一次
      const productMap = new Map();
      this.products.forEach(product => {
        if (!productMap.has(product.id)) {
          productMap.set(product.id, product);
        }
      });

      const query = queryString.toLowerCase(); // 转为小写方便比较
      const results = Array.from(productMap.values())
        .filter(product => {
          // 同时匹配ID和名称
          const idMatch = product.id.toLowerCase().includes(query);
          const nameMatch = product.name.toLowerCase().includes(query);
          return idMatch || nameMatch;
        })
        .sort((a, b) => {
          // 优先显示ID匹配的结果
          const aIdStarts = a.id.toLowerCase().startsWith(query);
          const bIdStarts = b.id.toLowerCase().startsWith(query);
          if (aIdStarts && !bIdStarts) return -1;
          if (!aIdStarts && bIdStarts) return 1;
          return 0;
        })
        .map(product => ({
          value: product.id,
          label: `${product.id} - ${product.name}`
        }));

      callback(results);
    },

    /**
     * @Function_Para 处理商品选择
     *   @param {Object} item - 选中的商品项
     * @Function_Meth 选择商品后更新表单并清除验证错误
     * @Function_Orgi Template引用: 商品ID输入框的@select事件
     * @Function_API
     *   - Vue nextTick: 等待DOM更新后清除验证
     */
    handleProductSelect(item) {
      this.operationForm.productId = item.value;
      this.$nextTick(() => {
        this.$refs.operationFormRef.clearValidate('productId');
      });
    },

    /**
     * @Function_Para 提交操作
     *   无参数
     * @Function_Meth 处理商品入库/出库/转调操作:
     *   1. 验证表单数据
     *   2. 检查商品合法性
     *   3. 设置申请人信息
     *   4. 针对出库，验证库存是否足够
     *   5. 更新库存数据
     *   6. 生成操作记录
     * @Function_Orgi Template引用: 提交按钮的点击事件
     * @Function_API
     *   - localStorage API: 读写商品库存和操作记录
     *   - Element UI Message: 显示操作结果
     */
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

        // 检查仓库权限
        if (this.operationForm.sourceWarehouse && 
            this.operationForm.sourceWarehouse !== 'External' && 
            !this.$permission.canOperateWarehouse(this.operationForm.sourceWarehouse)) {
          this.logOperation('ERR', '您没有操作此源仓库的权限');
          this.$message.error('您没有操作此源仓库的权限');
          return;
        }

        if (this.operationForm.targetWarehouse && 
            this.operationForm.targetWarehouse !== 'External' && 
            !this.$permission.canOperateWarehouse(this.operationForm.targetWarehouse)) {
          this.logOperation('ERR', '您没有操作此目标仓库的权限');
          this.$message.error('您没有操作此目标仓库的权限');
          return;
        }

        // 设置申请人 - 修复用户名称问题
        const user = JSON.parse(localStorage.getItem('user')) || {};
        this.operationForm.applicant = user.username || '未知用户';

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
          // 生成唯一操作ID并记录成功日志，仅调用一次logOperation
          const operationData = {
            status: 'SUC',
            message: '操作成功'
          };
          this.logOperation('SUC', '操作成功'); // 成功时只记录一次日志
          
          this.$message.success('操作提交成功');
          this.resetForm();
          this.loadLogs(); // 重新加载日志以更新显示
        }
      });
    },

    /**
     * @Function_Para 生成操作ID
     *   无参数
     * @Function_Meth 生成唯一的操作记录ID:
     *   1. 结合时间戳、仓库代码和操作类型
     *   2. 添加校验位
     * @Function_Orgi 被submitOperation方法调用，创建操作记录时使用
     * @Function_API
     *   - Date API: 生成时间戳
     */
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

    /**
     * @Function_Para 导出操作日志
     *   无参数
     * @Function_Meth 将操作记录导出为JSON文件:
     *   1. 从localStorage获取操作记录
     *   2. 转换为JSON并创建下载链接
     * @Function_Orgi Template引用: "导出日志"按钮的点击事件
     * @Function_API
     *   - localStorage API: 读取操作记录
     *   - Blob API: 创建文件数据
     *   - URL API: 创建对象URL
     *   - DOM API: 创建下载链接
     */
    exportLogs() {
      if (!this.$permission.isAdmin()) {
        this.$message.error('您没有导出日志的权限');
        return;
      }
      
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

    /**
     * @Function_Para 更新库存
     *   无参数
     * @Function_Meth 根据操作类型更新商品库存:
     *   1. 获取当前库存数据
     *   2. 根据操作类型分发到不同的处理方法
     *   3. 保存更新后的库存数据
     * @Function_Orgi 被submitOperation方法调用，执行库存更新操作
     * @Function_API
     *   - localStorage API: 读写仓库商品数据
     */
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

    /**
     * @Function_Para 处理入库
     *   @param {Array} warehouseProducts - 仓库商品数据
     * @Function_Meth 处理商品入库操作:
     *   1. 检查目标仓库是否已有该商品
     *   2. 如果有，增加数量
     *   3. 如果没有，添加新记录
     * @Function_Orgi 被updateStock方法调用，处理入库类型操作
     * @Function_API 无外部API调用
     */
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

    /**
     * @Function_Para 处理出库
     *   @param {Array} warehouseProducts - 仓库商品数据
     * @Function_Meth 处理商品出库操作:
     *   1. 查找商品在源仓库的库存
     *   2. 验证库存是否充足
     *   3. 减少库存数量，如果为0则移除记录
     * @Function_Orgi 被updateStock方法调用，处理出库类型操作
     * @Function_API
     *   - Element UI Message: 显示出库错误
     */
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

    /**
     * @Function_Para 处理转调
     *   @param {Array} warehouseProducts - 仓库商品数据
     * @Function_Meth 处理商品转调操作:
     *   1. 验证源仓库库存是否充足
     *   2. 减少源仓库库存
     *   3. 增加目标仓库库存
     * @Function_Orgi 被updateStock方法调用，处理转调类型操作
     * @Function_API
     *   - Element UI Message: 显示转调错误
     */
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

    /**
     * @Function_Para 记录操作日志
     *   @param {string} status - 操作状态
     *   @param {string} message - 操作消息
     * @Function_Meth 创建并保存操作记录:
     *   1. 生成操作ID
     *   2. 组装操作数据
     *   3. 保存到localStorage
     * @Function_Orgi 被submitOperation和各处理函数调用，记录操作结果
     * @Function_API
     *   - localStorage API: 读写操作记录
     *   - Element UI Message: 显示操作消息
     */
    logOperation(status, message) {
      // 设置申请人 - 修复用户名称问题
      const user = JSON.parse(localStorage.getItem('user')) || {};
      
      // 生成唯一的操作ID
      const operationId = this.generateOperationId();
      
      const operationData = {
        id: operationId,
        ...this.operationForm,
        applicant: user.username || '未知用户', // 确保这里也正确设置了申请人
        timestamp: new Date().toISOString(),
        status
      };
      
      // 读取现有操作记录
      const operations = JSON.parse(localStorage.getItem('operations')) || [];
      
      // 检查是否已经存在相同ID的记录，避免重复添加
      const existingIndex = operations.findIndex(op => op.id === operationId);
      if (existingIndex === -1) {
        // 不存在相同ID的记录，添加新记录
        operations.push(operationData);
        localStorage.setItem('operations', JSON.stringify(operations));
      }
      
      if (status === 'ERR') {
        this.$message.error(message);
      }
    },

    /**
     * @Function_Para 重置表单
     *   无参数
     * @Function_Meth 清空并重置操作表单
     * @Function_Orgi Template引用: 重置按钮的点击事件
     * @Function_API
     *   - Element UI Form: 重置表单字段
     */
    resetForm() {
      this.$refs.operationFormRef.resetFields();
      this.operationForm.quantity = 1;
    },

    /**
     * @Function_Para 加载日志
     *   无参数
     * @Function_Meth 从localStorage加载操作记录并处理字段名称兼容性
     * @Function_Orgi 在组件created生命周期中自动调用
     * @Function_API
     *   - localStorage API: 读取操作记录
     */
    loadLogs() {
      const savedLogs = localStorage.getItem('operations');
      let logs = savedLogs ? JSON.parse(savedLogs) : [];
      
      // 兼容处理：将旧的operator字段映射到applicant
      this.logs = logs.map(log => {
        // 如果有老数据使用operator字段，则转换为applicant
        if (log.operator && !log.applicant) {
          return {
            ...log,
            applicant: log.operator
          };
        }
        return log;
      });
    },

    /**
     * @Function_Para 处理日志页大小变化
     *   @param {number} size - 新的页大小
     * @Function_Meth 更新日志每页显示记录数，并重置为第一页
     * @Function_Orgi Template引用: 日志分页控件的@size-change事件
     * @Function_API 无外部API调用
     */
    handleLogSizeChange(size) {
      this.logPageSize = size;
      this.logCurrentPage = 1;
    },

    /**
     * @Function_Para 处理日志页码变化
     *   @param {number} page - 新的页码
     * @Function_Meth 更新日志当前页码
     * @Function_Orgi Template引用: 日志分页控件的@current-change事件
     * @Function_API 无外部API调用
     */
    handleLogCurrentChange(page) {
      this.logCurrentPage = page;
    },

    /**
     * @Function_Para 滚动表格到顶部
     *   @param {string} refName - 表格引用名称
     * @Function_Meth 平滑滚动指定表格视图到顶部
     * @Function_Orgi Template引用: 日志表格的"返回顶部"按钮点击事件
     * @Function_API
     *   - DOM API: 获取表格滚动容器并执行滚动
     */
    scrollToTop(refName) {
      const tableWrapper = this.$refs[refName]?.$el.querySelector('.el-table__body-wrapper');
      if (tableWrapper) {
        tableWrapper.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    },

    /**
     * @Function_Para 获取设备信息
     *   无参数
     * @Function_Meth 分析用户代理字符串识别用户设备类型
     * @Function_Orgi 被logOperation方法调用，记录操作设备信息
     * @Function_API
     *   - navigator.userAgent: 获取浏览器用户代理信息
     */
    getDeviceInfo() {
      const ua = navigator.userAgent;
      if (ua.match(/Android/i)) return 'Android';
      if (ua.match(/iPhone|iPad|iPod/i)) return 'iOS';
      if (ua.match(/Windows/i)) return 'Windows';
      if (ua.match(/Macintosh/i)) return 'Mac';
      if (ua.match(/Linux/i)) return 'Linux';
      return 'Unknown Device';
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
/* 主容器样式 */
/* 设置操作页面的基本内边距 */
.operation {
  padding: 8px;
}

/* 卡片样式 */
/* 为表单卡片和表格卡片设置统一的圆角和背景 */
.form-card,
.table-card {
  border-radius: 8px;
  background-color: rgba(245, 245, 250, 1);
  backdrop-filter: blur(10px);
  margin-bottom: 20px;
}

/* 表单头部样式 */
/* 设置表单标题区域的边距和布局 */
.form-header {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 24px;
}

/* 操作表单样式 */
/* 设置表单的最大宽度和居中显示 */
.operation-form {
  
  max-width: 800px;
  margin: 0 auto;
}

/* 日志表格样式 */
/* 设置日志表格的高度、圆角和布局 */
.el-table {
  flex: 1;
  height: calc(99vh - 670px);
  overflow-y: auto;
  border-radius: 12px;
  margin-left: 18px;
  max-width: 98%;
}

/* 表格头部样式 */
/* 设置表格标题区域的边距和布局 */
.table-header {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 22px;
}

/* 表格标题文本样式 */
/* 设置表格标题的字体大小和粗细 */
.table-title {
  font-size: 18px;
  font-weight: bold;
}

/* 表格底部样式 */
/* 设置表格底部分页和按钮区域的布局 */
.table-footer {
  margin-top: 10px;
  padding-left: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 分页控件样式 */
/* 设置分页控件的对齐方式 */
.pagination {
  margin-left: auto;
}

/* 表单内容布局 */
/* 使用Flexbox布局组织表单左侧输入区域和右侧操作区域 */
.form-content {
  display: flex;
  gap: 10px;
}

/* 表单输入区样式 */
/* 设置表单输入区占据较大空间比例 */
.form-inputs {
  flex: 3;
}

/* 表单操作区样式 */
/* 设置表单操作按钮区域的布局、背景和内边距 */
.form-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: flex-start;
  align-items: stretch;
  background-color: rgba(245, 245, 250, 0.6);
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

.custom-hr {
  margin-bottom: 10px;
}
</style>