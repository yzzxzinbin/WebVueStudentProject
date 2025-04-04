<template>
    <div class="operation">
        <el-card shadow="hover" class="form-card">
            <div class="form-header">
                <span class="table-title">越权操作申请</span>
            </div>
            <hr class="custom-hr">
            <el-form :model="operationForm" label-width="100px" class="operation-form" :rules="rules"
                ref="operationFormRef">
                <div class="modern-layout">
                    <!-- 左侧列 - 基本信息 -->
                    <div class="operation-details">
                        <h3 class="section-title">操作详情</h3>
                        <el-form-item label="操作类型" prop="type">
                            <el-select v-model="operationForm.type" placeholder="请选择操作类型" @change="handleTypeChange">
                                <el-option label="入库" value="入库"></el-option>
                                <el-option label="出库" value="出库"></el-option>
                                <el-option label="转调" value="转调"></el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item label="商品ID" prop="productId">
                            <el-autocomplete v-model="operationForm.productId" @clear="operationForm.productId = ''"
                                :fetch-suggestions="queryProduct" placeholder="请输入商品ID" @select="handleProductSelect"
                                :disabled="!operationForm.type">
                            </el-autocomplete>
                        </el-form-item>

                        <el-form-item label="数量" prop="quantity">
                            <el-input-number v-model="operationForm.quantity" :min="1" :max="9999"
                                :disabled="!operationForm.productId" controls-position="right"></el-input-number>
                        </el-form-item>

                        <el-form-item label="源仓库" prop="sourceWarehouse" v-if="operationForm.type !== '入库'">
                            <el-select v-model="operationForm.sourceWarehouse" placeholder="请选择源仓库"
                                :disabled="!operationForm.productId" filterable clearable>
                                <el-option v-for="warehouse in filteredSourceWarehouses" :key="warehouse.id"
                                    :label="warehouse.name" :value="warehouse.id"></el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item label="目标仓库" prop="targetWarehouse" v-if="operationForm.type !== '出库'">
                            <el-select v-model="operationForm.targetWarehouse" placeholder="请选择目标仓库"
                                :disabled="!operationForm.productId">
                                <el-option v-for="warehouse in allWarehouses" :key="warehouse.id"
                                    :label="warehouse.name" :value="warehouse.id"></el-option>
                            </el-select>
                        </el-form-item>
                    </div>

                    <!-- 右侧列 - 申请理由 -->
                    <!-- 右侧列 - 申请理由 -->
                    <div class="operation-details reason-section">
                        <h3 class="section-title">申请理由</h3>
                        <el-form-item prop="reason" class="reason-form-item" label-width="0px">
                            <el-input type="textarea" v-model="operationForm.reason" placeholder="请详细说明申请越权操作的理由和必要性..."
                                :rows="8" class="reason-textarea" resize="none"></el-input>
                        </el-form-item>

                        <div class="form-actions">
                            <el-button type="primary" @click="submitOperation" icon="el-icon-check">提交申请</el-button>
                            <el-button @click="resetForm" icon="el-icon-refresh-left">重置</el-button>
                        </div>
                    </div>
                </div>
            </el-form>
        </el-card>

        <!-- 待处理申请表格 -->
        <el-card ref="pendingTableCard" shadow="hover" class="table-card" style="height: calc(99vh - 590px);">
            <div class="table-header">
                <div class="header-left">
                    <span class="table-title">待处理申请</span>
                    <el-tag type="info" class="count-tag">共 {{ totalPending }} 条申请</el-tag>
                </div>
                <div class="header-right">
                    <el-radio-group v-model="viewMode" size="small">
                        <el-radio-button label="all">全部</el-radio-button>
                        <el-radio-button label="mine">我的申请</el-radio-button>
                        <el-radio-button label="approval" v-if="canApprove">待我审批</el-radio-button>
                    </el-radio-group>
                </div>
            </div>
            <el-table ref="pendingTable" :data="paginatedPending" height="tableHeight" stripe border
                highlight-current-row style="width: 100%" v-loading="loading" class="rounded-table">
                <el-table-column prop="id" label="申请ID" width="240" sortable></el-table-column>
                <el-table-column prop="type" label="操作类型" width="120" sortable>
                    <template slot-scope="{row}">
                        <el-tag :type="getOperationTagType(row.type)" size="small">{{ row.type }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="sourceWarehouse" label="源仓库" width="100">
                    <template slot-scope="{row}">{{ getWarehouseName(row.sourceWarehouse) }}</template>
                </el-table-column>
                <el-table-column prop="targetWarehouse" label="目标仓库" width="180">
                    <template slot-scope="{row}">{{ getWarehouseName(row.targetWarehouse) }}</template>
                </el-table-column>
                <el-table-column prop="applicant" label="申请人" width="100"></el-table-column>
                <el-table-column prop="reason" label="申请理由" min-width="120">
                    <!-- 修改申请理由显示方式 -->
                    <template slot-scope="{row}">
                        <div class="reason-preview" @click="showReasonDetail(row)">
                            {{ truncateReason(row.reason) }}
                            <el-button type="text" size="mini" class="view-detail-btn">
                                查看详情 <i class="el-icon-view"></i>
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="timestamp" label="申请时间" width="180" sortable>
                    <template slot-scope="{row}">{{ formatDateTime(row.timestamp) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right" align="center">
                    <template slot-scope="{row}">
                        <el-button size="mini" type="success" @click="approveRequest(row)"
                            v-if="canApproveThis(row)">批准</el-button>
                        <el-button size="mini" type="danger" @click="rejectRequest(row)"
                            v-if="canApproveThis(row)">拒绝</el-button>
                        <el-button size="mini" type="warning" @click="cancelRequest(row)"
                            v-if="isMyRequest(row)">撤销</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="table-footer">
                <div class="footer-left">
                    <el-button type="primary" plain size="mini" @click="scrollToTop('pendingTable')" class="back-to-top">
                        <i class="el-icon-top"></i> 返回顶部
                    </el-button>
                </div>
                <div class="footer-right">
                    <el-pagination class="pagination" @size-change="handleSizeChange" @current-change="handleCurrentChange"
                        :current-page="currentPage" :page-sizes="[10, 20, 50, 100]" :page-size="pageSize"
                        layout="total, sizes, prev, pager, next, jumper" :total="totalPending">
                    </el-pagination>
                </div>
            </div>
        </el-card>

        <!-- 申请理由详情弹窗 -->
        <el-dialog title="申请理由详情" :visible.sync="reasonDialogVisible" width="500px" center class="reason-dialog"
            top="15vh">
            <div v-if="currentRequest" class="reason-dialog-content">
                <div class="reason-dialog-header">
                    <div class="request-meta">
                        <div class="meta-item">
                            <span class="meta-label">申请ID:</span>
                            <span class="meta-value">{{ currentRequest.id }}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">商品ID:</span>
                            <span class="meta-value">{{ currentRequest.productId }}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">数量:</span>
                            <span class="meta-value">{{ currentRequest.quantity }}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">申请人:</span>
                            <span class="meta-value">{{ currentRequest.applicant }}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">申请时间:</span>
                            <span class="meta-value">{{ formatDateTime(currentRequest.timestamp) }}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">操作类型:</span>
                            <el-tag size="small" :type="getOperationTagType(currentRequest.type)">
                                {{ currentRequest.type }}
                            </el-tag>
                        </div>
                    </div>
                </div>
                <div class="reason-content">
                    <p>{{ currentRequest.reason }}</p>
                </div>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="reasonDialogVisible = false">关闭</el-button>
            </span>
        </el-dialog>
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
                applicant: '',
                reason: ''
            },
            warehouses: [], // 用户有权限的仓库列表
            allWarehouses: [], // 所有仓库列表
            products: [],   // 商品列表
            rules: {
                type: [{ required: true, message: '请选择操作类型', trigger: 'change' }],
                productId: [{ required: true, message: '请选择商品', trigger: 'blur' }],
                quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
                sourceWarehouse: [{ required: true, message: '请选择源仓库', trigger: 'change' }],
                targetWarehouse: [{ required: true, message: '请选择目标仓库', trigger: 'change' }],
                reason: [{ required: true, message: '请填写申请理由', trigger: 'blur' }]
            },
            pendingRequests: [], // 待处理的申请
            viewMode: 'all', // 查看模式：all-全部, mine-我的申请, approval-待我审批
            currentPage: 1,
            pageSize: 20,
            loading: false,
            // 添加新的状态
            reasonDialogVisible: false, // 申请理由弹窗显示状态
            currentRequest: null // 当前查看的申请
        };
    },
    computed: {
        /**
         * @Function_Para 过滤源仓库列表
         *   无参数
         * @Function_Meth 根据当前选择的商品筛选可用的源仓库
         *   (仅返回用户有权限的仓库)
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
         * @Function_Para 判断当前用户是否可以审批申请
         * @Function_Meth 检查用户是否是管理员或经理
         */
        canApprove() {
            const user = JSON.parse(localStorage.getItem('user')) || {};
            return user.role === 'admin' || user.role === 'manager';
        },

        /**
         * @Function_Para 获取分页后的待处理申请
         * @Function_Meth 根据查看模式和分页参数筛选待处理申请
         */
        paginatedPending() {
            // 先根据查看模式筛选
            let filtered = this.pendingRequests;
            const currentUser = JSON.parse(localStorage.getItem('user')) || {};

            if (this.viewMode === 'mine') {
                filtered = filtered.filter(req => req.applicant === currentUser.username);
            } else if (this.viewMode === 'approval' && this.canApprove) {
                filtered = filtered.filter(req => {
                    // 管理员可以审批所有申请
                    if (currentUser.role === 'admin') return true;

                    // 经理只能审批自己有权限的仓库
                    const targetWarehouseId = req.targetWarehouse;
                    const sourceWarehouseId = req.sourceWarehouse;
                    const authorizedWarehouseIds = this.$permission.getAuthorizedWarehouseIds();

                    if (req.type === '入库') {
                        return authorizedWarehouseIds.includes(targetWarehouseId);
                    } else if (req.type === '出库') {
                        return authorizedWarehouseIds.includes(sourceWarehouseId);
                    } else { // 转调
                        return authorizedWarehouseIds.includes(sourceWarehouseId) &&
                            authorizedWarehouseIds.includes(targetWarehouseId);
                    }
                });
            }

            // 然后分页
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return filtered.slice(start, end);
        },

        /**
         * @Function_Para 获取待处理申请总数
         * @Function_Meth 根据查看模式计算申请总数
         */
        totalPending() {
            // 与paginatedPending相同的过滤逻辑，但不分页
            let filtered = this.pendingRequests;
            const currentUser = JSON.parse(localStorage.getItem('user')) || {};

            if (this.viewMode === 'mine') {
                filtered = filtered.filter(req => req.applicant === currentUser.username);
            } else if (this.viewMode === 'approval' && this.canApprove) {
                filtered = filtered.filter(req => {
                    if (currentUser.role === 'admin') return true;

                    const targetWarehouseId = req.targetWarehouse;
                    const sourceWarehouseId = req.sourceWarehouse;
                    const authorizedWarehouseIds = this.$permission.getAuthorizedWarehouseIds();

                    if (req.type === '入库') {
                        return authorizedWarehouseIds.includes(targetWarehouseId);
                    } else if (req.type === '出库') {
                        return authorizedWarehouseIds.includes(sourceWarehouseId);
                    } else {
                        return authorizedWarehouseIds.includes(sourceWarehouseId) &&
                            authorizedWarehouseIds.includes(targetWarehouseId);
                    }
                });
            }

            return filtered.length;
        }
    },
    methods: {
        /**
         * @Function_Para 加载所有仓库数据
         * @Function_Meth 从localStorage加载所有仓库数据
         */
        loadAllWarehouses() {
            const savedWarehouses = localStorage.getItem('warehouses');
            this.allWarehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
        },

        /**
         * @Function_Para 加载用户有权限的仓库数据
         * @Function_Meth 从localStorage加载用户有权限的仓库数据
         */
        loadWarehouses() {
            const savedWarehouses = localStorage.getItem('warehouses');
            const allWarehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
            this.warehouses = this.$permission.filterAuthorizedWarehouses(allWarehouses);
        },

        /**
         * @Function_Para 加载商品数据
         * @Function_Meth 从localStorage加载商品数据
         */
        loadProducts() {
            const savedProducts = localStorage.getItem('products');
            this.products = savedProducts ? JSON.parse(savedProducts) : [];
        },

        /**
         * @Function_Para 加载待处理申请
         * @Function_Meth 从localStorage加载待处理的越权申请
         */
        loadPendingRequests() {
            const savedRequests = localStorage.getItem('pendingRequests') || '[]';
            this.pendingRequests = JSON.parse(savedRequests);
        },

        /**
         * @Function_Para 处理操作类型变化
         * @Function_Meth 根据操作类型重置相关字段
         */
        handleTypeChange() {
            this.operationForm.sourceWarehouse = '';
            this.operationForm.targetWarehouse = '';
            this.operationForm.productId = '';

            if (this.operationForm.type === '入库') {
                this.operationForm.sourceWarehouse = 'External';
            } else if (this.operationForm.type === '出库') {
                this.operationForm.targetWarehouse = 'External';
            }
        },

        /**
         * @Function_Para 商品搜索
         * @Function_Meth 根据输入查询匹配商品
         */
        queryProduct(queryString, callback) {
            const productMap = new Map();
            this.products.forEach(product => {
                if (!productMap.has(product.id)) {
                    productMap.set(product.id, product);
                }
            });

            const query = queryString.toLowerCase();
            const results = Array.from(productMap.values())
                .filter(product => {
                    const idMatch = product.id.toLowerCase().includes(query);
                    const nameMatch = product.name.toLowerCase().includes(query);
                    return idMatch || nameMatch;
                })
                .sort((a, b) => {
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
         * @Function_Meth 选择商品后更新表单并清除验证错误
         */
        handleProductSelect(item) {
            this.operationForm.productId = item.value;
            this.$nextTick(() => {
                this.$refs.operationFormRef.clearValidate('productId');
            });
        },

        /**
         * @Function_Para 提交越权操作申请
         * @Function_Meth 验证表单并提交越权操作申请
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
                    this.$message.error('未知商品，操作失败');
                    return;
                }

                // 设置申请人
                const user = JSON.parse(localStorage.getItem('user')) || {};
                this.operationForm.applicant = user.username || '未知用户';

                // 验证是否确实是越权操作
                const isOverride = this.isOverrideOperation();
                if (!isOverride) {
                    this.$confirm('您已拥有此操作权限，是否直接提交常规操作申请?', '提示', {
                        confirmButtonText: '是',
                        cancelButtonText: '否',
                        type: 'warning'
                    }).then(() => {
                        // 跳转到常规操作页面
                        this.$router.push('/warehouse/operation');
                    }).catch(() => {
                        // 用户选择否，继续提交越权申请
                        this.savePendingRequest();
                    });
                } else {
                    // 是越权操作，保存到待处理申请
                    this.savePendingRequest();
                }
            });
        },

        /**
         * @Function_Para 判断是否是越权操作
         * @Function_Meth 检查用户是否有权限直接执行此操作
         */
        isOverrideOperation() {
            // 获取用户有权限的仓库列表
            const authorizedWarehouseIds = this.$permission.getAuthorizedWarehouseIds();

            if (this.operationForm.type === '入库') {
                return !authorizedWarehouseIds.includes(this.operationForm.targetWarehouse);
            } else if (this.operationForm.type === '出库') {
                return !authorizedWarehouseIds.includes(this.operationForm.sourceWarehouse);
            } else { // 转调
                return !authorizedWarehouseIds.includes(this.operationForm.sourceWarehouse) ||
                    !authorizedWarehouseIds.includes(this.operationForm.targetWarehouse);
            }
        },

        /**
         * @Function_Para 保存待处理申请
         * @Function_Meth 创建新的待处理申请并保存
         */
        savePendingRequest() {
            // 生成唯一的申请ID
            const requestId = this.generateRequestId();

            // 创建申请对象
            const request = {
                id: requestId,
                ...this.operationForm,
                status: 'pending',
                timestamp: new Date().toISOString()
            };

            // 保存到localStorage
            const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
            pendingRequests.push(request);
            localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));

            // 更新本地数据
            this.pendingRequests = pendingRequests;

            // 显示成功消息
            this.$message.success('越权操作申请已提交，等待审批');

            // 重置表单
            this.resetForm();
        },

        /**
         * @Function_Para 生成请求ID
         * @Function_Meth 生成唯一的申请ID
         */
        generateRequestId() {
            const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return `OR${timestamp}${random}`;
        },

        /**
         * @Function_Para 批准申请
         * @Function_Meth 批准越权操作申请并执行操作
         */
        approveRequest(request) {
            this.$confirm('确定批准此越权操作申请?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // 执行批准操作
                const success = this.executeOperation(request);
                if (success) {
                    // 更新申请状态
                    this.updateRequestStatus(request.id, 'approved');
                    this.$message.success('已批准申请并执行操作');
                }
            }).catch(() => { });
        },

        /**
         * @Function_Para 拒绝申请
         * @Function_Meth 拒绝越权操作申请
         */
        rejectRequest(request) {
            this.$confirm('确定拒绝此越权操作申请?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // 更新申请状态
                this.updateRequestStatus(request.id, 'rejected');
                this.$message.success('已拒绝申请');
            }).catch(() => { });
        },

        /**
         * @Function_Para 撤销申请
         * @Function_Meth 撤销自己提交的越权操作申请
         */
        cancelRequest(request) {
            this.$confirm('确定撤销此申请?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // 更新申请状态
                this.updateRequestStatus(request.id, 'cancelled');
                this.$message.success('已撤销申请');
            }).catch(() => { });
        },

        /**
         * @Function_Para 更新申请状态
         * @Function_Meth 更新指定申请的状态
         */
        updateRequestStatus(requestId, status) {
            // 从localStorage获取所有申请
            const pendingRequests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');

            // 查找并更新指定申请的状态
            const index = pendingRequests.findIndex(req => req.id === requestId);
            if (index !== -1) {
                pendingRequests[index].status = status;
                pendingRequests[index].processTime = new Date().toISOString();
                pendingRequests[index].processor = (JSON.parse(localStorage.getItem('user')) || {}).username || '未知用户';

                // 如果是完成状态，将其从待处理列表移除
                // 同时添加到操作历史记录
                if (status === 'approved' || status === 'rejected' || status === 'cancelled') {
                    const completedRequest = pendingRequests.splice(index, 1)[0];

                    // 将已处理的申请添加到操作历史
                    const operations = JSON.parse(localStorage.getItem('operations') || '[]');
                    operations.push({
                        id: completedRequest.id,
                        type: completedRequest.type,
                        productId: completedRequest.productId,
                        quantity: completedRequest.quantity,
                        sourceWarehouse: completedRequest.sourceWarehouse,
                        targetWarehouse: completedRequest.targetWarehouse,
                        applicant: completedRequest.applicant,
                        timestamp: completedRequest.timestamp,
                        status: status === 'approved' ? 'SUC' : 'ERR',
                        reason: completedRequest.reason,
                        processTime: completedRequest.processTime,
                        processor: completedRequest.processor
                    });
                    localStorage.setItem('operations', JSON.stringify(operations));
                }

                // 保存更新后的待处理申请
                localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));

                // 更新本地数据
                this.pendingRequests = pendingRequests;
            }
        },

        /**
         * @Function_Para 执行操作
         * @Function_Meth 执行已批准的操作
         */
        executeOperation(request) {
            const warehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];
            let success = true;

            switch (request.type) {
                case '入库':
                    this.handleInbound(warehouseProducts, request);
                    break;
                case '出库':
                    success = this.handleOutbound(warehouseProducts, request);
                    break;
                case '转调':
                    success = this.handleTransfer(warehouseProducts, request);
                    break;
            }

            if (success) {
                localStorage.setItem('warehouseProducts', JSON.stringify(warehouseProducts));
            }
            return success;
        },

        /**
         * @Function_Para 处理入库
         * @Function_Meth 处理入库操作
         */
        handleInbound(warehouseProducts, request) {
            const existingProduct = warehouseProducts.find(
                p => p.id === request.productId &&
                    p.warehouseId === request.targetWarehouse
            );

            if (existingProduct) {
                existingProduct.quantity += parseInt(request.quantity);
            } else {
                const product = this.products.find(p => p.id === request.productId);
                warehouseProducts.push({
                    id: request.productId,
                    warehouseId: request.targetWarehouse,
                    name: product?.name || '未知商品',
                    quantity: parseInt(request.quantity),
                    location: '默认位置'
                });
            }
            return true;
        },

        /**
         * @Function_Para 处理出库
         * @Function_Meth 处理出库操作
         */
        handleOutbound(warehouseProducts, request) {
            const existingProduct = warehouseProducts.find(
                p => p.id === request.productId &&
                    p.warehouseId === request.sourceWarehouse
            );

            if (existingProduct) {
                if (existingProduct.quantity < request.quantity) {
                    this.$message.error('库存不足');
                    return false;
                }
                existingProduct.quantity -= parseInt(request.quantity);

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
         * @Function_Meth 处理转调操作
         */
        handleTransfer(warehouseProducts, request) {
            // 检查源仓库是否有足够库存
            const sourceProduct = warehouseProducts.find(
                p => p.id === request.productId &&
                    p.warehouseId === request.sourceWarehouse
            );

            if (!sourceProduct || sourceProduct.quantity < request.quantity) {
                this.$message.error('源仓库库存不足或商品不存在');
                return false;
            }

            // 减少源仓库库存
            sourceProduct.quantity -= parseInt(request.quantity);
            if (sourceProduct.quantity <= 0) {
                const index = warehouseProducts.indexOf(sourceProduct);
                warehouseProducts.splice(index, 1);
            }

            // 增加目标仓库库存
            const targetProduct = warehouseProducts.find(
                p => p.id === request.productId &&
                    p.warehouseId === request.targetWarehouse
            );

            if (targetProduct) {
                targetProduct.quantity += parseInt(request.quantity);
            } else {
                const product = this.products.find(p => p.id === request.productId);
                warehouseProducts.push({
                    id: request.productId,
                    warehouseId: request.targetWarehouse,
                    name: product?.name || '未知商品',
                    quantity: parseInt(request.quantity),
                    location: '默认位置'
                });
            }

            return true;
        },

        /**
         * @Function_Para 重置表单
         * @Function_Meth 清空并重置操作表单
         */
        resetForm() {
            this.$refs.operationFormRef.resetFields();
            this.operationForm.quantity = 1;
            this.operationForm.reason = '';
        },

        /**
         * @Function_Para 处理页大小变化
         * @Function_Meth 更新每页显示记录数，并重置为第一页
         */
        handleSizeChange(size) {
            this.pageSize = size;
            this.currentPage = 1;
        },

        /**
         * @Function_Para 处理页码变化
         * @Function_Meth 更新当前页码
         */
        handleCurrentChange(page) {
            this.currentPage = page;
        },

        /**
         * @Function_Para 滚动表格到顶部
         * @Function_Meth 平滑滚动指定表格视图到顶部
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
         * @Function_Para 获取仓库名称
         * @Function_Meth A根据仓库ID获取仓库名称
         */
        getWarehouseName(warehouseId) {
            if (!warehouseId) return '--';
            if (warehouseId === 'External') return '外部';

            const warehouse = this.allWarehouses.find(w => w.id === warehouseId);
            return warehouse ? warehouse.name : warehouseId;
        },

        /**
         * @Function_Para 获取操作类型标签样式
         * @Function_Meth 根据操作类型返回对应的标签样式
         */
        getOperationTagType(type) {
            const typeMap = {
                '入库': 'success',
                '出库': 'danger',
                '转调': 'warning'
            };
            return typeMap[type] || 'info';
        },

        /**
         * @Function_Para 格式化日期时间
         * @Function_Meth 将ISO日期字符串格式化为易读形式
         */
        formatDateTime(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        },

        /**
         * @Function_Para 判断是否是当前用户的申请
         * @Function_Meth 检查申请是否由当前用户提交
         */
        isMyRequest(request) {
            const currentUser = JSON.parse(localStorage.getItem('user')) || {};
            return request.applicant === currentUser.username;
        },

        /**
         * @Function_Para 判断当前用户是否可以审批此申请
         * @Function_Meth 检查当前用户是否有权限审批指定申请
         */
        canApproveThis(request) {
            const currentUser = JSON.parse(localStorage.getItem('user')) || {};

            // 管理员可以审批所有申请
            if (currentUser.role === 'admin') return true;

            // 经理只能审批自己有权限的仓库
            if (currentUser.role === 'manager') {
                const targetWarehouseId = request.targetWarehouse;
                const sourceWarehouseId = request.sourceWarehouse;
                const authorizedWarehouseIds = this.$permission.getAuthorizedWarehouseIds();

                if (request.type === '入库') {
                    return authorizedWarehouseIds.includes(targetWarehouseId);
                } else if (request.type === '出库') {
                    return authorizedWarehouseIds.includes(sourceWarehouseId);
                } else { // 转调
                    return authorizedWarehouseIds.includes(sourceWarehouseId) &&
                        authorizedWarehouseIds.includes(targetWarehouseId);
                }
            }

            return false;
        },

        /**
         * @Function_Para 截断理由文本
         * @param {string} reason - 完整理由
         * @Function_Meth 将长文本截断并添加省略号
         */
        truncateReason(reason) {
            if (!reason) return '无';
            return reason.length > 20 ? reason.substring(0, 20) + '...' : reason;
        },

        /**
         * @Function_Para 显示理由详情
         * @param {Object} request - 申请对象
         * @Function_Meth 显示申请理由详情弹窗
         */
        showReasonDetail(request) {
            this.currentRequest = request;
            this.reasonDialogVisible = true;
        }
    },
    created() {
        this.loadAllWarehouses();
        this.loadWarehouses();
        this.loadProducts();
        this.loadPendingRequests();
    }
};
</script>

<style scoped>
/* 主容器样式 */
.operation {
    padding: 12px;
}

/* 卡片样式 */
.form-card,
.table-card {
    border-radius: 12px;
    background-color: rgba(245, 245, 250, 1);
    backdrop-filter: blur(10px);
    margin-bottom: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.table-card {
   margin: 0;
}

/* 表单头部样式 */
.form-header {
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
}

/* 操作表单样式 */
.operation-form {
    width: 95%;
    margin: 0;
    padding-top: 5px;
    padding-left: 20px;
}

/* 现代布局 */
.modern-layout {
    display: flex;
    gap: 20px;
    width: 100%;
    padding: 0;
    justify-content: space-between;

}

/* 操作详情区域基础样式 */
.operation-details {
    flex: 1;
    min-width: 250px;
    max-width: 46%;
    padding: 10px;
    padding-bottom: 0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.5);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

/* 区域标题样式 */
.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #409EFF;
    margin-top: 0;
    margin-bottom: 10px;
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

/* 理由文本域样式 */
.reason-textarea {
    width: 100%;
    margin: 0;
}

.reason-textarea>>>.el-textarea__inner {
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    transition: all 0.3s;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 12px 15px;
    font-size: 14px;
    line-height: 1.6;
}

.reason-textarea>>>.el-textarea__inner:focus {
    border-color: #409EFF;
    box-shadow: 0 0 5px rgba(64, 158, 255, 0.2);
}

/* 禁用调整大小 */
.reason-textarea>>>textarea {
    resize: none !important;
}

.reason-form-item {
    margin :15px;
}

/* 操作按钮容器 */
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 20px;
}

.form-actions .el-button {
    padding: 10px 20px;
    border-radius: 6px;
    transition: all 0.3s;
}

.form-actions .el-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 表格头部样式 */
.table-header {
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 22px;
}

.header-left,
.header-right {
    display: flex;
    align-items: center;
}

.count-tag {
    margin-left: 15px;
}

/* 表格标题文本样式 */
.table-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

/* 自定义分隔线 - 改为简约灰色 */
.custom-hr {
    border: none;
    height: 2px;
    background-color: rgba(220, 220, 220, 0.6);
    margin: 10px 5 10px;
}

/* 表单输入美化 */
.el-select,
.el-autocomplete,
.el-input-number {
    width: 100%;
}

.el-select>>>.el-input__inner,
.el-autocomplete>>>.el-input__inner,
.el-input-number>>>.el-input__inner {
    border-radius: 6px;
    height: 40px;
    transition: all 0.3s;
}

.el-select>>>.el-input__inner:focus,
.el-autocomplete>>>.el-input__inner:focus,
.el-input-number>>>.el-input__inner:focus {
    border-color: #409EFF;
    box-shadow: 0 0 5px rgba(64, 158, 255, 0.2);
}

/* 响应式调整 */
@media (max-width: 992px) {
    .modern-layout {
        flex-direction: column;
    }

    .operation-details {
        max-width: none;
    }
}

/* 其余表格相关样式保持不变 */
.reason-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 4px 0;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.reason-preview:hover {
    background-color: rgba(64, 158, 255, 0.08);
}

.view-detail-btn {
    opacity: 0;
    transition: opacity 0.2s;
}

.reason-preview:hover .view-detail-btn {
    opacity: 1;
}

.reason-dialog>>>.el-dialog {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.reason-dialog>>>.el-dialog__header {
    background-color: #f5f7fa;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
}

.reason-dialog>>>.el-dialog__title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.reason-dialog>>>.el-dialog__body {
    padding: 20px;
}

.reason-dialog>>>.el-dialog__footer {
    padding: 12px 20px;
    border-top: 1px solid #ebeef5;
}

.reason-dialog-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.reason-dialog-header {
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
}

.request-meta {
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

.reason-content {
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

/* 表格样式优化 */
.rounded-table {
    border-radius: 8px;
    overflow: hidden;
    margin: 0 22px; /* 与标题左侧padding对齐 */
    width: calc(100% - 44px) !important;
}

.rounded-table>>>.el-table__header-wrapper,
.rounded-table>>>.el-table__body-wrapper {
    border-radius: 8px;
    overflow: hidden;
}

/* 表格底部样式优化 */
.table-footer {
    padding: 15px 22px; /* 与表格标题对齐 */
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: calc(100% - 44px);
}

.footer-left, .footer-right {
    display: flex;
    align-items: center;
}

/* 对话框关闭按钮样式 */
.reason-dialog>>>.el-dialog__headerbtn {
    transition: all 0.3s;
}

.reason-dialog>>>.el-dialog__headerbtn:hover {
    background-color: rgba(245, 108, 108, 0.9);
    border-radius: 50%;
    width: 30px;
    height: 30px;
    top: 15px;
    right: 15px;
}

.reason-dialog>>>.el-dialog__headerbtn:hover .el-dialog__close {
    color: #ffffff;
}

.reason-dialog>>>.el-dialog__close {
    transition: all 0.3s;
}
</style>
