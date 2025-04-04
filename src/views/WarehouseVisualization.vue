<template>
  <div class="visualization-container">
    <el-card shadow="hover" class="summary-card">
      <div class="summary-header">
        <div class="header-left">
          <span class="title">仓库智能分析看板</span>
          <el-tag effect="dark" type="info">
            {{ selectedWarehouse ? '单仓模式' : '全局模式' }}
          </el-tag>
        </div>
        <div class="header-actions">
          <el-select v-model="selectedWarehouse" placeholder="全部仓库" clearable @change="updateCharts"
            style="width: 200px">
            <el-option v-for="warehouse in warehouses" :key="warehouse.id" :label="warehouse.name"
              :value="warehouse.id">
              <span>{{ warehouse.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 12px">
                容量: {{ warehouse.capacity }}
              </span>
            </el-option>
          </el-select>
        </div>
      </div>

      <el-row :gutter="20" class="summary-cards">
        <el-col v-for="(card, index) in metricCards" :key="index" :xs="24" :sm="12" :md="6">
          <el-card shadow="hover" class="metric-card" :style="{ borderTop: '4px solid ' + card.color }">
            <div class="metric-content">
              <i :class="card.icon" :style="{ color: card.color }"></i>
              <div class="metric-title">{{ card.title }}</div>
              <div class="metric-value" :style="{ color: card.color }">{{ card.value }}</div>
              <div class="metric-trend">
                <span :class="card.trend >= 0 ? 'up' : 'down'">
                  <i :class="card.trend >= 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
                  {{ Math.abs(card.trend) }}%
                </span>
                <span class="trend-label">较上月</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="hover" class="chart-card" style="height: 100%;">
          <div class="chart-header">
            <div class="chart-title">近期操作记录</div>
            <el-button type="text" @click="refreshOperations" :icon="'el-icon-refresh'"></el-button>
          </div>
          <el-table :data="recentOperations" height="calc(100vh - 500px)" style="width: 100%"
            :row-class-name="tableRowClassName">
            <el-table-column prop="type" label="操作类型" width="120">
              <template #default="{ row }">
                <el-tag :type="operationTagMap[row.type]">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="productName" label="商品名称"></el-table-column>
            <el-table-column prop="quantity" label="数量" width="100" align="right">
              <template #default="{ row }">
                <span :class="row.quantity >= 0 ? 'positive' : 'negative'">
                  {{ row.quantity >= 0 ? '+' : '' }}{{ row.quantity }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="hover" class="chart-card" style="height: calc(50vh - 180px); margin-bottom: 24px;">
          <div class="chart-header">
            <div class="chart-title">商品类型分布</div>
            <el-select v-model="productTopN" size="mini" style="width: 80px" @change="updateProductChart">
              <el-option v-for="n in [5, 10, 15]" :key="n" :label="`Top ${n}`" :value="n"></el-option>
            </el-select>
          </div>
          <el-skeleton :loading="loading.product" animated>
            <template #template>
              <el-skeleton-item variant="image" style="height: calc(100% - 50px)" />
            </template>
            <div ref="productChart" class="chart-container"></div>
          </el-skeleton>
        </el-card>
        <el-card shadow="hover" class="chart-card" style="height: calc(50vh - 250px);">
          <div class="chart-header">
            <div class="chart-title">操作热力图</div>
            <el-button type="text" @click="refreshOperations" :icon="'el-icon-refresh'"></el-button>
          </div>
          <el-skeleton :loading="loading.heatmap" animated>
            <template #template>
              <el-skeleton-item variant="image" style="height: calc(100% - 50px)" />
            </template>
            <div ref="heatmapChart" class="chart-container"></div>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-header">
            <div class="chart-title">出入库趋势分析</div>
            <el-radio-group v-model="trendDays" size="mini" @change="updateTrendChart">
              <el-radio-button label="7">近7天</el-radio-button>
              <el-radio-button label="30">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <el-skeleton :loading="loading.trend" animated>
            <template #template>
              <el-skeleton-item variant="image" style="height: calc(100% - 50px)" />
            </template>
            <div ref="trendChart" class="chart-container"></div>
          </el-skeleton>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-header">
            <div class="chart-title">仓库容量预警</div>
            <el-select v-model="warningThreshold" size="mini" style="width: 120px" @change="updateGaugeChart">
              <el-option v-for="item in thresholdOptions" :key="item" :label="`警戒: ${item}%`" :value="item" />
            </el-select>
          </div>
          <el-skeleton :loading="loading.gauge" animated>
            <template #template>
              <el-skeleton-item variant="image" style="height: calc(100% - 50px)" />
            </template>
            <div ref="gaugeChart" class="chart-container"></div>
          </el-skeleton>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-header">
            <div class="chart-title">仓库库存三维视图</div>
            <div class="chart-controls">
              <!-- 仅保留仓库选择控件在顶部 -->
              <div class="warehouse-filter">
                <span class="filter-label" style="user-select: none;">选择仓库:</span>
                <el-select v-model="selectedWarehouses" multiple collapse-tags placeholder="选择仓库"
                  style="width: 260px; margin-right: 15px;" @change="handleWarehouseSelectionChange">
                  <el-option v-for="warehouse in availableWarehouses" :key="warehouse.id" :label="warehouse.name"
                    :value="warehouse.id">
                  </el-option>
                </el-select>
              </div>
              <el-button type="text" @click="refresh3DChart" :icon="'el-icon-refresh'"></el-button>
              <el-checkbox v-model="autoRotate" @change="handleAutoRotateChange">自动旋转</el-checkbox>
            </div>
          </div>

          <el-skeleton :loading="loading.scatter3d" animated>
            <template #template>
              <el-skeleton-item variant="image" style="height: calc(100% - 50px)" />
            </template>
            <div ref="scatter3dChart" class="chart-container" style="height: 700px;"></div>
          </el-skeleton>

          <!-- 将时间范围和缩放控件移至图表下方 -->
          <div class="chart-footer-controls">
            <div class="control-group">
              <div class="time-range-filter">
                <span class="filter-label" style="user-select: none;">时间范围:</span>
                <el-slider v-model="timeRangeValue" range :min="timeRangeMin" :max="timeRangeMax" :step="timeRangeStep"
                  :format-tooltip="formatTimeTooltip" @change="handleTimeRangeChange" style="width: 500px;"></el-slider>
              </div>
            </div>
            <div class="control-group">
              <div class="zoom-control">
                <span class="filter-label" style="user-select: none;">缩放范围:</span>
                <el-slider v-model="scatter3dZoom" :min="50" :max="200" @change="handleZoomChange" show-input
                  style="width: 250px;">
                </el-slider>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>




<style>
:root {
  --primary-color: #409EFF;
  --success-color: #67C23A;
  --warning-color: #E6A23C;
  --danger-color: #F56C6C;
  --info-color: #909399;
}

.visualization-container {
  background-image: url('../assets/images/aa.png');
  background-size: cover;
  background-position: center;
  padding: 20px;
  min-height: 95vh;
  border-radius: 12px;
  padding-bottom: 1px;
}

.summary-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding-bottom: 10px;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1) !important;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-header .title {
  font-size: 20px;
  font-weight: bold;
  color: inherit;
}

.summary-cards {
  margin-bottom: -20px;
}

.metric-card {
  border-radius: 12px;
  height: 140px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1) !important;
}

.metric-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
}

.metric-content i {
  font-size: 32px;
  margin-bottom: 12px;
}

.metric-title {
  font-size: 14px;
  color: var(--text-color-light);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
}

.metric-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-trend .up {
  color: var(--success-color);
}

.metric-trend .down {
  color: var(--danger-color);
}

.trend-label {
  color: var(--text-color-light);
}

.chart-row {
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 12px;
  transition: all 0.3s;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(6px);
}

.chart-card:hover {
  transform: translateY(-2px);
  background-color: rgba(255, 255, 255, 1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1) !important;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: inherit;
}

.chart-container {
  width: 100%;
  height: 250px;
}

.positive {
  color: var(--success-color);
}

.negative {
  color: var(--danger-color);
}

.el-table {

  border-radius: 8px;
}

.el-table .positive-row {
  --el-table-tr-bg-color: rgba(103, 194, 58, 0.1);
}

.el-table .negative-row {
  --el-table-tr-bg-color: rgba(245, 108, 108, 0.1);
}

@media (max-width: 768px) {
  .summary-cards .el-col {
    margin-bottom: 20px;
  }

  .chart-row .el-col {
    margin-bottom: 20px;
  }

  .metric-card {
    height: 120px;
  }

  .metric-content i {
    font-size: 24px;
  }

  .metric-value {
    font-size: 22px;
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: nowrap;
  /* 防止换行 */
}

.chart-title {
  white-space: nowrap;
  /* 防止标题换行 */
  margin-right: 16px;
  /* 标题和控件之间的间距 */
  font-size: 16px;
  font-weight: bold;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  /* 防止控件区域被压缩 */
}

/* 调整滑块样式确保可见 */
.el-slider__runway {
  background-color: #ebeef5;
  height: 4px;
  width: 100%;
}

.el-slider__bar {
  height: 4px;
  background-color: #409EFF;
}

.el-slider__button {
  width: 12px;
  height: 12px;
  border: 2px solid #409EFF;
}

/* 表格透明化样式 */
.el-table {
  background-color: transparent !important;
}

.el-table th,
.el-table tr {
  background-color: transparent !important;
}

.el-table::before {
  display: none;
  /* 移除表格底部的线 */
}

/* 表格单元格样式 */
.el-table td {
  background-color: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  /* 保留淡淡的边框 */
}

/* 表头样式 */
.el-table th {
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
}

/* 鼠标悬停效果 */
.el-table--enable-row-hover .el-table__body tr:hover>td {
  background-color: rgba(255, 255, 255, 0.4) !important;
}

/* 斑马纹效果（如果启用了） */
.el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: rgba(255, 255, 255, 0.8) !important;
}

/* 时间范围筛选器样式 */
.time-range-filter {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.filter-label {
  margin-right: 10px;
  white-space: nowrap;
  font-size: 13px;
  color: #606266;
}

/* 添加缩放控制样式 */
.zoom-control {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

/* 添加仓库筛选器样式 */
.warehouse-filter {
  display: flex;
  align-items: center;
  margin-right: 15px;
  max-width: 400px;
}

/* 添加图表底部控件样式 */
.chart-footer-controls {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-between;
}

.control-group {
  flex: 1;
  min-width: 300px;
}
</style>
<style scoped></style>


<script>
import * as echarts from 'echarts'
import { format } from 'date-fns'
import { Scatter3DChart, Line3DChart } from 'echarts-gl/charts'
import { Grid3DComponent } from 'echarts-gl/components'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  Scatter3DChart,
  Line3DChart,
  Grid3DComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

export default {
  name: 'WarehouseDashboard',
  data() {
    return {
      // 添加仓库选择相关数据
      selectedWarehouses: [], // 当前选中的仓库ID列表
      availableWarehouses: [], // 有操作记录的仓库列表
      // 添加图表视图状态存储
      chartViewState: {
        alpha: 25,        // 垂直旋转角度
        beta: 35,         // 水平旋转角度
        distance: 150,    // 视图距离
        center: [0, 0, 0] // 视图中心点
      },
      scatter3dZoom: 100, // 缩放比例，初始100%
      autoRotate: true, // 是否自动旋转
      // 添加时间范围筛选相关数据
      timeRangeValue: [0, 100], // 默认全范围，具体值会在数据加载后更新
      timeRangeMin: 0,
      timeRangeMax: 100,
      timeRangeStep: 1,
      timeRangeDates: [], // 存储时间范围对应的实际日期值
      originalScatterData: [], // 存储原始数据，用于筛选
      selectedWarehouse: '',
      productTopN: 5,
      trendDays: '7',
      warningThreshold: 80,
      thresholdOptions: [70, 75, 80, 85],
      loading: {
        product: false,
        heatmap: false,
        trend: true,
        gauge: true,
        scatter3d: true
      },
      trendData: {
        dates: [],
        in: [],
        out: []
      },
      warehouses: [],
      products: [],
      warehouseProducts: [],
      operations: [],
      operationTagMap: {
        '入库': 'success',
        '出库': 'danger',
        '调拨': 'warning',
        '盘点': 'info'
      },
      charts: {
        product: null,
        heatmap: null,
        trend: null,
        gauge: null,
        scatter3d: null
      },
      // 添加实际时间范围记录
      actualTimeRange: null,
      // 添加强制刷新标记
      forceRefreshChart: false,
    }
  },

  computed: {
    metricCards() {
      return [
        {
          title: "仓库总数",
          value: this.warehouseCount,
          color: 'var(--primary-color)',
          icon: 'el-icon-office-building',
          trend: 2.5
        },
        {
          title: "商品种类",
          value: this.productTypes,
          color: 'var(--success-color)',
          icon: 'el-icon-goods',
          trend: 8.3
        },
        {
          title: "总库存量",
          value: this.totalStock.toLocaleString(),
          color: 'var(--warning-color)',
          icon: 'el-icon-box',
          trend: -1.2
        },
        {
          title: "平均使用率",
          value: `${this.avgUsageRate}%`,
          color: this.getUsageColor(this.avgUsageRate),
          icon: 'el-icon-data-line',
          trend: 0
        }
      ]
    },

    warehouseCount() {
      return this.warehouses.length
    },

    productTypes() {
      const types = new Set()
      this.products.forEach(p => types.add(p.type))
      return types.size
    },

    totalStock() {
      return this.warehouseProducts.reduce((sum, p) => sum + p.quantity, 0)
    },

    avgUsageRate() {
      if (this.selectedWarehouse) {
        const warehouse = this.warehouses.find(w => w.id === this.selectedWarehouse);
        if (!warehouse) return 0;

        const usageData = this.warehouseUsageRates.find(w => w.id === warehouse.id);
        return usageData ? usageData.usageRate : 0;
      }

      if (this.warehouseUsageRates.length === 0) return 0;
      const total = this.warehouseUsageRates.reduce(
        (sum, w) => sum + parseFloat(w.usageRate), 0);
      return (total / this.warehouseUsageRates.length).toFixed(1);
    },

    recentOperations() {
      return [...this.operations]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8)
        .map(op => ({
          ...op,
          productName: this.products.find(p => p.id === op.productId)?.name || op.productId
        }))
    },

    filteredWarehouseProducts() {
      if (!this.selectedWarehouse) return this.warehouseProducts
      return this.warehouseProducts.filter(p => p.warehouseId === this.selectedWarehouse)
    },

    warehouseUsageRates() {
      return this.warehouses.map(warehouse => {
        const productsInWarehouse = this.warehouseProducts.filter(
          p => p.warehouseId === warehouse.id
        );
        const totalQuantity = productsInWarehouse.reduce((sum, p) => sum + p.quantity, 0);
        const usageRate = warehouse.capacity > 0
          ? Math.min((totalQuantity / warehouse.capacity) * 100, 100)
          : 0;

        return {
          id: warehouse.id,
          name: warehouse.name,
          usageRate: usageRate.toFixed(1),
          used: totalQuantity,
          capacity: warehouse.capacity
        };
      });
    }
  },

  methods: {
    async loadData() {
      try {
        this.loading = { product: true, heatmap: true, trend: true, gauge: true, scatter3d: true };
        this.warehouses = JSON.parse(localStorage.getItem('warehouses')) || [];
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.warehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];
        this.operations = JSON.parse(localStorage.getItem('operations')) || [];

        this.warehouses.forEach(w => {
          w.capacity = Number(w.capacity) || 0;
        });

        // 初始化有操作记录的仓库列表
        this.initAvailableWarehouses();
      } finally {
        this.loading = { product: false, heatmap: false, trend: false, gauge: false, scatter3d: false };
        this.$nextTick(() => {
          this.updateCharts();
          this.updateTrendChart();
          this.updateGaugeChart();
          this.updateScatter3DChart();
        });
      }
    },

    /**
     * 初始化有操作记录的仓库列表并设置默认选中
     */
    initAvailableWarehouses() {
      // 获取所有操作中涉及的仓库ID
      const warehouseIdsWithOps = new Set();
      this.operations.forEach(op => {
        if (op.sourceWarehouse && op.sourceWarehouse !== 'External') {
          warehouseIdsWithOps.add(op.sourceWarehouse);
        }
        if (op.targetWarehouse && op.targetWarehouse !== 'External') {
          warehouseIdsWithOps.add(op.targetWarehouse);
        }
      });

      // 过滤并格式化有操作的仓库列表
      this.availableWarehouses = this.warehouses.filter(w =>
        warehouseIdsWithOps.has(w.id)
      );

      // 默认选中所有有操作记录的仓库
      this.selectedWarehouses = this.availableWarehouses.map(w => w.id);
    },

    /**
     * 处理仓库选择变更
     */
    handleWarehouseSelectionChange() {
      // 保存当前视图状态
      this.saveChartViewState();

      // 标记重新加载
      this.loading.scatter3d = true;

      // 关键修改：不再重置时间范围，而是保留用户的设置
      // 仅清除actualTimeRange确保时间轴会根据新数据重新计算
      this.actualTimeRange = null;

      // 使用强制刷新模式重绘图表
      this.forceRefreshChart = true;

      // 重新渲染3D散点图
      this.updateScatter3DChart();
    },

    /**
     * 保存当前图表视图状态
     */
    saveChartViewState() {
      if (!this.charts.scatter3d) return;

      try {
        // 获取图表当前选项
        const option = this.charts.scatter3d.getOption();
        if (option && option.grid3D && option.grid3D[0] && option.grid3D[0].viewControl) {
          const viewControl = option.grid3D[0].viewControl;

          this.chartViewState = {
            alpha: viewControl.alpha,
            beta: viewControl.beta,
            distance: viewControl.distance,
            center: viewControl.center || [0, 0, 0],
            // 其他可能需要的状态
          };
        }
      } catch (err) {
        console.warn('Failed to save chart view state:', err);
      }
    },

    /**
     * 恢复保存的图表视图状态
     */
    restoreChartViewState() {
      if (!this.charts.scatter3d) return;

      try {
        // 获取当前选项状态
        const option = this.charts.scatter3d.getOption();

        // 仅当某些状态信息丢失时才需要恢复
        if (option && option.grid3D && option.grid3D[0] && option.grid3D[0].viewControl) {
          // 检查当前视图是否已经符合期望状态
          const currentViewControl = option.grid3D[0].viewControl;
          const needUpdate =
            currentViewControl.alpha !== this.chartViewState.alpha ||
            currentViewControl.beta !== this.chartViewState.beta ||
            currentViewControl.distance !== this.chartViewState.distance ||
            !this.arraysEqual(currentViewControl.center, this.chartViewState.center);

          // 仅在需要更新时才应用保存的状态
          if (needUpdate) {
            option.grid3D[0].viewControl = {
              ...option.grid3D[0].viewControl,
              alpha: this.chartViewState.alpha,
              beta: this.chartViewState.beta,
              distance: this.chartViewState.distance,
              center: this.chartViewState.center,
              // 保留自动旋转设置
              autoRotate: this.autoRotate
            };

            // 应用保存的状态但不触发完整重绘
            this.charts.scatter3d.setOption(option, false);
          }
        }
      } catch (err) {
        console.warn('Failed to restore chart view state:', err);
      }
    },

    // 新增辅助方法：检查两个数组是否相等
    arraysEqual(a, b) {
      if (!a || !b) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    },

    initCharts() {
      this.charts.product = echarts.init(this.$refs.productChart);
      this.charts.heatmap = echarts.init(this.$refs.heatmapChart);
      this.charts.trend = echarts.init(this.$refs.trendChart);
      this.charts.gauge = echarts.init(this.$refs.gaugeChart);
      this.charts.scatter3d = echarts.init(this.$refs.scatter3dChart);

      this.updateCharts();
    },

    updateCharts() {
      this.updateProductChart();
      this.updateHeatmapChart();
      this.updateTrendChart();
      this.updateGaugeChart();
      this.updateScatter3DChart();
    },

    updateTrendChart() {
      if (!this.charts.trend) return
      if (this.warehouses.length === 0 || this.warehouseProducts.length === 0) {
        this.showEmptyChart(this.charts.trend, '暂无数据');
        return;
      }
      const days = parseInt(this.trendDays)
      this.trendData = {
        dates: Array.from({ length: days }, (_, i) =>
          format(new Date(new Date().setDate(new Date().getDate() - days + i + 1)), 'MM-dd')),
        in: Array.from({ length: days }, () => Math.floor(Math.random() * 100) + 50),
        out: Array.from({ length: days }, () => Math.floor(Math.random() * 80) + 30)
      };

      const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['入库量', '出库量'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: this.trendData.dates,
          axisLabel: { rotate: 45 }
        },
        yAxis: { type: 'value', name: '数量', axisLabel: { formatter: '{value}' } },
        series: [
          {
            name: '入库量',
            type: 'line',
            smooth: true,
            data: this.trendData.in,
            itemStyle: { color: '#67C23A' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
                { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
              ])
            }
          },
          {
            name: '出库量',
            type: 'line',
            smooth: true,
            data: this.trendData.out,
            itemStyle: { color: '#F56C6C' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
                { offset: 1, color: 'rgba(245, 108, 108, 0.1)' }
              ])
            }
          }
        ]
      }

      this.charts.trend.setOption(option)
      this.loading.trend = false
    },

    updateGaugeChart() {
      if (!this.charts.gauge) return;

      if (!this.selectedWarehouse) {
        const option = {
          series: [{
            type: 'gauge',
            center: ['50%', '60%'],
            radius: '90%',
            detail: {
              formatter: '{value}%',
              offsetCenter: [0, '70%'],
              fontSize: 16,
              fontWeight: 'bold'
            },
            data: [{
              value: this.avgUsageRate,
              name: '平均使用率',
              itemStyle: {
                color: this.getUsageColor(this.avgUsageRate)
              }
            }],
            axisLine: {
              lineStyle: {
                color: [
                  [0.3, '#67C23A'],
                  [0.7, '#E6A23C'],
                  [1, '#F56C6C']
                ]
              }
            }
          }]
        };
        this.charts.gauge.setOption(option);
        return;
      }

      const warehouse = this.warehouses.find(w => w.id === this.selectedWarehouse);
      if (!warehouse) return;

      const usageData = this.warehouseUsageRates.find(w => w.id === warehouse.id);
      const usageRate = usageData ? usageData.usageRate : 0;

      const option = {
        series: [{
          type: 'gauge',
          center: ['50%', '60%'],
          radius: '90%',
          detail: {
            formatter: `{value}%\n${usageData.used}/${usageData.capacity}`,
            offsetCenter: [0, '70%'],
            fontSize: 16,
            fontWeight: 'bold',
            rich: {
              value: {
                fontSize: 24,
                color: this.getUsageColor(usageRate),
                padding: [5, 0]
              },
              ratio: {
                fontSize: 14,
                color: '#909399'
              }
            }
          },
          data: [{
            value: usageRate,
            name: warehouse.name,
            itemStyle: {
              color: this.getUsageColor(usageRate)
            }
          }],
          axisLine: {
            lineStyle: {
              color: [
                [0.3, '#67C23A'],
                [0.7, '#E6A23C'],
                [1, '#F56C6C']
              ]
            }
          },
          title: {
            show: true,
            offsetCenter: [0, '-40%'],
            fontSize: 14,
            color: '#606266'
          }
        }]
      };

      this.charts.gauge.setOption(option);
    },

    getUsageColor(rate) {
      rate = parseFloat(rate);
      if (rate < 30) return '#67C23A';
      if (rate < 70) return '#E6A23C';
      return '#F56C6C';
    },

    updateProductChart() {
      if (!this.charts.product) return

      const typeMap = {}
      this.filteredWarehouseProducts.forEach(p => {
        const product = this.products.find(prod => prod.id === p.id)
        if (product) {
          typeMap[product.type] = (typeMap[product.type] || 0) + p.quantity
        }
      })

      const sortedTypes = Object.entries(typeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, this.productTopN)

      if (sortedTypes.length === 0) {
        this.showEmptyChart(this.charts.product, '暂无商品数据')
        return
      }

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: params => `
            <div style="font-weight:bold">${params.name}</div>
            <div>数量: <b>${params.value}</b></div>
            <div>占比: <b>${params.percent}%</b></div>
          `
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          textStyle: { color: 'inherit' }
        },
        series: [{
          name: '商品类型分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#FFF',
            borderWidth: 2,
            color: params => {
              const colors = [
                new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#5B8FF9' },
                  { offset: 1, color: '#36D1DC' }
                ]),
                new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#FDB157' },
                  { offset: 1, color: '#FF9A57' }
                ]),
                new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#FF6B6B' },
                  { offset: 1, color: '#FF8E8E' }
                ]),
                new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#A181FF' },
                  { offset: 1, color: '#C4A1FF' }
                ])
              ]
              return colors[params.dataIndex % colors.length]
            }
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: { show: false },
          data: sortedTypes.map(([name, value]) => ({ name, value }))
        }]
      }
      this.charts.product.setOption(option)
    },

    updateHeatmapChart() {
      if (!this.charts.heatmap) return

      const heatmapData = this.prepareHeatmapData()

      if (heatmapData.length === 0) {
        this.showEmptyChart(this.charts.heatmap, '暂无操作数据')
        return
      }

      const dateRange = this.getHeatmapRange()

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          position: 'top',
          formatter: function (params) {
            const date = new Date(params.data[0])
            return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}<br/>
            操作次数: ${params.data[1]}`
          }
        },
        visualMap: {
          min: 0,
          max: Math.max(...heatmapData.map(item => item[1])),
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: 10,
          inRange: {
            color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
          }
        },
        calendar: {
          top: 30,
          left: 30,
          right: 30,
          cellSize: ['auto', 13],
          range: dateRange,
          itemStyle: {
            borderWidth: 0.5
          },
          yearLabel: { show: false }
        },
        series: {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: heatmapData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      }

      this.charts.heatmap.setOption(option)
    },

    prepareHeatmapData() {
      const dateCounts = {}
      this.operations.forEach(op => {
        const date = new Date(op.timestamp)
        const dateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1
      })

      return Object.entries(dateCounts).map(([dateStr, count]) => {
        return [dateStr, count]
      })
    },

    getHeatmapRange() {
      if (this.operations.length === 0) {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return [format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')]
      }

      const dates = this.operations.map(op => new Date(op.timestamp))
      const minDate = new Date(Math.min(...dates))
      const maxDate = new Date(Math.max(...dates))

      const startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
      const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0)

      return [format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')]
    },

    showEmptyChart(chartInstance, text) {
      chartInstance.setOption({
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: text,
            fill: '#C0C4CC',
            fontSize: 16,
            fontWeight: 'bold'
          }
        }
      })
    },

    refreshOperations() {
      this.loadData()
    },

    formatTime(timestamp) {
      return format(new Date(timestamp), 'yyyy-MM-dd HH:mm')
    },

    tableRowClassName({ row }) {
      return row.quantity >= 0 ? 'positive-row' : 'negative-row'
    },

    handleResize() {
      Object.values(this.charts).forEach(chart => {
        if (chart) chart.resize();
      });
    },

    refresh3DChart() {
      // 保存当前视图状态
      this.saveChartViewState();

      this.loading.scatter3d = true;

      // 重置时间范围为全范围
      this.timeRangeValue = [0, 100];
      this.actualTimeRange = null;
      this.forceRefreshChart = true;

      this.updateScatter3DChart();
    },

    /**
     * @Function_Para 根据时间范围筛选数据
     *   @param {Array} data - 原始数据点数组
     * @Function_Meth 根据用户选择的时间范围筛选数据点
     * @Function_API 无外部API调用
     */
    filterDataByTimeRange(data) {
      // 如果没有时间范围数据，直接返回原始数据
      if (!this.timeRangeDates || this.timeRangeDates.length === 0) {
        return data;
      }

      // 获取当前时间 - 始终作为参考最大值
      const nowTime = new Date().getTime();

      // 计算实际时间范围
      const minIndex = Math.floor((this.timeRangeValue[0] / 100) * this.timeRangeDates.length);
      let maxIndex = Math.floor((this.timeRangeValue[1] / 100) * this.timeRangeDates.length);

      // 确保索引在有效范围内
      const safeMinIndex = Math.max(0, Math.min(minIndex, this.timeRangeDates.length - 1));
      const safeMaxIndex = Math.max(0, Math.min(maxIndex, this.timeRangeDates.length - 1));

      // 取出时间范围
      const minTime = this.timeRangeDates[safeMinIndex];
      const originalMaxTime = this.timeRangeDates[safeMaxIndex];

      // 修复滑块结束点映射问题：确保100%对应的时间至少为当前时间或更大
      const maxTime = this.timeRangeValue[1] === 100 ? nowTime : originalMaxTime;

      // 判断是否为全范围
      const isFullRange = this.timeRangeValue[0] === 0 && this.timeRangeValue[1] === 100;
      if (isFullRange) {
        return data;
      }

      // 记录实际的时间范围，用于图表轴设置
      this.actualTimeRange = {
        min: minTime,
        max: maxTime
      };

      // 判断是否包含当前时间点
      // 关键修复点2：更精确地判断何时应该包含实时点
      const isEndAtMax = this.timeRangeValue[1] === 100;
      const isEndNearCurrent = Math.abs(nowTime - maxTime) < 60; // 1 分钟
      const includeCurrentTime = isEndAtMax || isEndNearCurrent;

      // 按仓库分组数据
      const warehouseGroups = {};
      data.forEach(item => {
        const warehouseId = item[0];
        if (!warehouseGroups[warehouseId]) {
          warehouseGroups[warehouseId] = [];
        }
        warehouseGroups[warehouseId].push(item);
      });

      // 结果数组
      let result = [];

      // 对每个仓库处理数据点
      Object.entries(warehouseGroups).forEach(([warehouseId, warehouseData]) => {
        // 按时间排序
        warehouseData.sort((a, b) => a[1] - b[1]);

        // 提取关键数据点
        const initialPoints = warehouseData.filter(item => item[5] === '初始状态');

        // 关键修复点3：确保获取所有时间区间内的点，而不只是边界点
        const beforePoints = warehouseData.filter(item => item[1] < minTime);
        const inRangePoints = warehouseData.filter(item => item[1] >= minTime && item[1] <= maxTime);
        const afterPoints = warehouseData.filter(item => item[1] > maxTime);

        const realTimePoints = warehouseData.filter(item =>
          item[5] === '实时' || (item[4] && item[4].startsWith('realtime-'))
        );

        // 存储当前仓库的数据点
        let warehouseResult = [];

        // 1. 添加起始边界点 - 如果有起始时间前的点
        let startStock = 0; // 默认库存值

        // 如果有时间范围前的点，使用最近的一个
        if (beforePoints.length > 0) {
          const lastBeforePoint = beforePoints[beforePoints.length - 1];
          startStock = lastBeforePoint[2];

          // 关键修复点4：始终包含最接近起始时间的历史点，确保连续性
          const templatePoint = [...lastBeforePoint];
          templatePoint[1] = minTime; // 设置为起始时间
          templatePoint[4] = 'boundary-start-' + warehouseId; // 自定义ID
          templatePoint[5] = '自定义范围'; // 设置状态

          warehouseResult.push(templatePoint);
        } else if (initialPoints.length > 0) {
          // 否则使用初始点
          startStock = initialPoints[0][2];

          // 创建起始边界点
          const templatePoint = initialPoints[0];
          const startBoundaryPoint = [...templatePoint];
          startBoundaryPoint[1] = minTime; // 设置时间
          startBoundaryPoint[4] = 'boundary-start-' + warehouseId; // 设置ID
          startBoundaryPoint[5] = '自定义范围'; // 设置状态

          warehouseResult.push(startBoundaryPoint);
        } else if (inRangePoints.length > 0) {
          // 如果没有之前的点，但有范围内的点，使用第一个范围内的点作为模板
          const firstInRangePoint = inRangePoints[0];
          const templatePoint = [...firstInRangePoint];
          templatePoint[1] = minTime; // 设置为起始时间
          templatePoint[4] = 'boundary-start-' + warehouseId; // 自定义ID
          templatePoint[5] = '自定义范围'; // 设置状态

          warehouseResult.push(templatePoint);
        }

        // 2. 添加范围内的所有点 - 关键修复点，确保所有在范围内的点都被添加
        warehouseResult = warehouseResult.concat(inRangePoints);

        // 3. 确定结束点处理方式

        // 计算结束库存默认值
        let endStock = startStock; // 默认使用起始库存
        if (inRangePoints.length > 0) {
          endStock = inRangePoints[inRangePoints.length - 1][2]; // 使用范围内最后一点的库存
        }

        // A. 如果应该包含当前时间点，尝试添加实时点
        if (includeCurrentTime && realTimePoints.length > 0) {
          const realTimePoint = realTimePoints[realTimePoints.length - 1];

          // 检查实时点是否已经包含在结果中
          const realTimeExists = warehouseResult.some(point =>
            point[4] === realTimePoint[4] ||
            (point[5] === '实时' && point[1] === realTimePoint[1])
          );

          if (!realTimeExists) {
            // 如果实时点已经在指定范围内，直接使用
            if (realTimePoint[1] >= minTime) {
              warehouseResult.push(realTimePoint);
            } else {
              // 否则创建一个新的实时点
              const adjustedRealTimePoint = [...realTimePoint];
              adjustedRealTimePoint[1] = maxTime; // 重要：使用我们计算的maxTime而不是默认
              adjustedRealTimePoint[4] = 'realtime-adjusted-' + warehouseId;
              warehouseResult.push(adjustedRealTimePoint);
            }
          }
        }
        // B. 如果不包含当前时间，添加自定义范围结束点
        else {
          // 修复：先检查是否有紧接在maxTime之后的点可以作为模板
          let templatePoint;
          if (afterPoints.length > 0) {
            templatePoint = [...afterPoints[0]];
          } else if (inRangePoints.length > 0) {
            templatePoint = [...inRangePoints[inRangePoints.length - 1]];
          } else if (beforePoints.length > 0) {
            templatePoint = [...beforePoints[beforePoints.length - 1]];
          } else {
            // 找个默认模板
            templatePoint = warehouseData[0] || [warehouseId, maxTime, endStock, warehouseId, '', '自定义范围', '', 0, ''];
          }

          const endBoundaryPoint = [...templatePoint];
          endBoundaryPoint[1] = maxTime; // 设置时间
          endBoundaryPoint[2] = endStock; // 设置库存
          endBoundaryPoint[4] = 'boundary-end-' + warehouseId; // 设置ID
          endBoundaryPoint[5] = '自定义范围'; // 设置状态
          warehouseResult.push(endBoundaryPoint);
        }

        // 4. 最终检查 - 确保至少有两个点并且它们之间的连线逻辑正确
        if (warehouseResult.length < 2) {
          console.log(`Warning: Warehouse ${warehouseId} has less than 2 points after filtering`);

          // 如果只有一个点(通常是起始点)，添加第二个点
          const existingPoint = warehouseResult[0] || null;

          if (existingPoint) {
            // 复制现有点，修改其时间
            const secondPoint = [...existingPoint];
            secondPoint[1] = existingPoint[1] + 3600000; // 增加1小时
            secondPoint[4] = 'generated-end-' + warehouseId;
            warehouseResult.push(secondPoint);
          } else if (realTimePoints.length > 0) {
            // 如果没有任何点但有实时点，添加实时点
            warehouseResult.push(realTimePoints[realTimePoints.length - 1]);
          } else if (warehouseData.length > 0) {
            // 添加任何可用的点
            warehouseResult.push(warehouseData[0]);
            if (warehouseData.length > 1) {
              warehouseResult.push(warehouseData[warehouseData.length - 1]);
            } else {
              // 复制并修改时间创建第二个点
              const secondPoint = [...warehouseData[0]];
              secondPoint[1] += 3600000; // 增加1小时
              secondPoint[4] = 'generated-second-' + warehouseId;
              warehouseResult.push(secondPoint);
            }
          }
        }

        // 5. 确保数据点按时间排序
        warehouseResult.sort((a, b) => a[1] - b[1]);

        // 将当前仓库的结果添加到总结果
        result = result.concat(warehouseResult);
      });

      return result;
    },

    /**
     * @Function_Para 准备3D散点图数据
     *   无参数
     * @Function_Meth 构建3D散点图所需的数据
     * @Function_Orgi 被updateScatter3DChart方法调用
     * @Function_API
     *   - localStorage API: 读取操作和仓库数据
     */
    prepareScatter3DData() {
      const operations = JSON.parse(localStorage.getItem('operations')) || [];
      // 只获取已选仓库的数据
      const warehouses = (JSON.parse(localStorage.getItem('warehouses')) || [])
        .filter(warehouse => this.selectedWarehouses.includes(warehouse.id));

      // 如果没有选择仓库，直接返回空数组
      if (warehouses.length === 0) {
        return [];
      }

      const products = JSON.parse(localStorage.getItem('products')) || [];

      // 1. 按时间排序所有操作，并只保留与已选仓库相关的操作
      const sortedOps = [...operations]
        .filter(op => {
          // 只处理成功的操作
          if (op.status !== 'SUC') return false;

          // 只保留与已选仓库相关的操作
          const relatedToSelectedWarehouses =
            (op.sourceWarehouse && this.selectedWarehouses.includes(op.sourceWarehouse)) ||
            (op.targetWarehouse && this.selectedWarehouses.includes(op.targetWarehouse));

          return relatedToSelectedWarehouses;
        })
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // 如果没有操作记录，直接返回空数组
      if (sortedOps.length === 0) {
        return [];
      }

      // 2. 初始化每个已选仓库的库存历史记录
      const warehouseHistory = {};
      warehouses.forEach(warehouse => {
        warehouseHistory[warehouse.id] = {
          name: warehouse.name,
          points: []
        };
      });

      // 3. 获取所有操作的时间范围
      const allTimes = sortedOps.map(op => new Date(op.timestamp).getTime());
      const minTime = Math.min(...allTimes);
      const maxTime = Math.max(...allTimes);

      // 3.1 创建初始时间点 - 最早操作时间之前1小时
      const initialTime = new Date(minTime);
      initialTime.setHours(initialTime.getHours() - 1);

      // 3.2 创建时间参考数组，用于时间范围滑块
      const currentTime = new Date().getTime();
      const timeRange = currentTime - initialTime.getTime();
      const timeSteps = 100;
      this.timeRangeDates = Array.from({ length: timeSteps + 1 }, (_, i) =>
        initialTime.getTime() + (timeRange * i / timeSteps)
      );

      // 4. 初始化每个仓库初始时间点的状态（初始库存为0）
      // 只为已选仓库创建初始点
      warehouses.forEach(warehouse => {
        warehouseHistory[warehouse.id].points.push({
          time: initialTime.getTime(),
          stock: 0,
          status: '初始状态',
          opId: 'initial'
        });
      });

      // 5. 重建库存变化历史
      const currentStock = {};
      warehouses.forEach(warehouse => {
        currentStock[warehouse.id] = 0;
      });

      // 处理所有操作记录 - 只处理已选仓库的操作
      sortedOps.forEach(op => {
        const opTime = new Date(op.timestamp).getTime();
        const opType = op.type;
        const quantity = op.quantity;

        // 处理不同类型的操作
        switch (opType) {
          case '入库':
            if (op.targetWarehouse && this.selectedWarehouses.includes(op.targetWarehouse)) {
              // 记录操作前的状态
              if (warehouseHistory[op.targetWarehouse]) {
                // 添加操作前的状态点，时间戳略微早于操作时间
                const lastPoint = warehouseHistory[op.targetWarehouse].points[warehouseHistory[op.targetWarehouse].points.length - 1];
                let preAdjustedTime = opTime - 1; // 操作前1毫秒

                // 确保前置点时间不会与上一个点重合
                if (lastPoint && lastPoint.time >= preAdjustedTime) {
                  preAdjustedTime = lastPoint.time + 1;
                }

                // 添加操作前状态点
                warehouseHistory[op.targetWarehouse].points.push({
                  time: preAdjustedTime,
                  stock: currentStock[op.targetWarehouse], // 使用操作前的库存
                  status: '操作前',
                  opId: 'pre-' + op.id,
                  productId: op.productId,
                  quantity: 0, // 不显示数量
                  applicant: ''
                });

                // 然后更新库存并添加操作后点
                currentStock[op.targetWarehouse] += quantity;

                let adjustedTime = opTime;
                if (lastPoint && lastPoint.time === opTime) {
                  adjustedTime = opTime + 1;
                }

                warehouseHistory[op.targetWarehouse].points.push({
                  time: adjustedTime,
                  stock: currentStock[op.targetWarehouse],
                  status: '入库',
                  opId: op.id,
                  productId: op.productId,
                  quantity: op.quantity,
                  applicant: op.applicant || op.operator
                });
              }
            }
            break;

          case '出库':
            if (op.sourceWarehouse && this.selectedWarehouses.includes(op.sourceWarehouse)) {
              // 记录操作前的状态
              if (warehouseHistory[op.sourceWarehouse]) {
                // 添加操作前的状态点
                const lastPoint = warehouseHistory[op.sourceWarehouse].points[warehouseHistory[op.sourceWarehouse].points.length - 1];
                let preAdjustedTime = opTime - 1; // 操作前1毫秒

                // 确保前置点时间不会与上一个点重合
                if (lastPoint && lastPoint.time >= preAdjustedTime) {
                  preAdjustedTime = lastPoint.time + 1;
                }

                // 添加操作前状态点
                warehouseHistory[op.sourceWarehouse].points.push({
                  time: preAdjustedTime,
                  stock: currentStock[op.sourceWarehouse], // 使用操作前的库存
                  status: '操作前',
                  opId: 'pre-' + op.id,
                  productId: op.productId,
                  quantity: 0, // 不显示数量
                  applicant: ''
                });

                // 然后更新库存并添加操作后点
                currentStock[op.sourceWarehouse] -= quantity;
                currentStock[op.sourceWarehouse] = Math.max(0, currentStock[op.sourceWarehouse]);

                let adjustedTime = opTime;
                if (lastPoint && lastPoint.time === opTime) {
                  adjustedTime = opTime + 1;
                }

                warehouseHistory[op.sourceWarehouse].points.push({
                  time: adjustedTime,
                  stock: currentStock[op.sourceWarehouse],
                  status: '出库',
                  opId: op.id,
                  productId: op.productId,
                  quantity: op.quantity,
                  applicant: op.applicant || op.operator
                });
              }
            }
            break;

          case '转调':
            // 源仓库减少库存
            if (op.sourceWarehouse && this.selectedWarehouses.includes(op.sourceWarehouse) && warehouseHistory[op.sourceWarehouse]) {
              // 添加操作前的状态点
              const lastSourcePoint = warehouseHistory[op.sourceWarehouse].points[warehouseHistory[op.sourceWarehouse].points.length - 1];
              let preAdjustedSourceTime = opTime - 1; // 操作前1毫秒

              // 确保前置点时间不会与上一个点重合
              if (lastSourcePoint && lastSourcePoint.time >= preAdjustedSourceTime) {
                preAdjustedSourceTime = lastSourcePoint.time + 1;
              }

              // 添加操作前状态点
              warehouseHistory[op.sourceWarehouse].points.push({
                time: preAdjustedSourceTime,
                stock: currentStock[op.sourceWarehouse], // 使用操作前的库存
                status: '操作前',
                opId: 'pre-source-' + op.id,
                productId: op.productId,
                quantity: 0, // 不显示数量
                applicant: ''
              });

              // 更新库存并添加操作后点
              currentStock[op.sourceWarehouse] -= quantity;
              currentStock[op.sourceWarehouse] = Math.max(0, currentStock[op.sourceWarehouse]);

              let adjustedSourceTime = opTime;
              if (lastSourcePoint && lastSourcePoint.time === opTime) {
                adjustedSourceTime = opTime + 1;
              }

              warehouseHistory[op.sourceWarehouse].points.push({
                time: adjustedSourceTime,
                stock: currentStock[op.sourceWarehouse],
                status: '转出',
                opId: op.id,
                productId: op.productId,
                quantity: op.quantity,
                applicant: op.applicant || op.operator
              });
            }

            // 目标仓库增加库存
            if (op.targetWarehouse && this.selectedWarehouses.includes(op.targetWarehouse) && warehouseHistory[op.targetWarehouse]) {
              // 添加操作前的状态点
              const lastTargetPoint = warehouseHistory[op.targetWarehouse].points[warehouseHistory[op.targetWarehouse].points.length - 1];
              let preAdjustedTargetTime = opTime - 1; // 操作前1毫秒

              // 确保前置点时间不会与上一个点重合
              if (lastTargetPoint && lastTargetPoint.time >= preAdjustedTargetTime) {
                preAdjustedTargetTime = lastTargetPoint.time + 1;
              }

              // 添加操作前状态点
              warehouseHistory[op.targetWarehouse].points.push({
                time: preAdjustedTargetTime,
                stock: currentStock[op.targetWarehouse], // 使用操作前的库存
                status: '操作前',
                opId: 'pre-target-' + op.id,
                productId: op.productId,
                quantity: 0, // 不显示数量
                applicant: ''
              });

              // 更新库存并添加操作后点
              currentStock[op.targetWarehouse] += quantity;

              let adjustedTargetTime = opTime;
              if (lastTargetPoint && lastTargetPoint.time === opTime) {
                adjustedTargetTime = opTime + 1;
              }

              warehouseHistory[op.targetWarehouse].points.push({
                time: adjustedTargetTime,
                stock: currentStock[op.targetWarehouse],
                status: '转入',
                opId: op.id,
                productId: op.productId,
                quantity: op.quantity,
                applicant: op.applicant || op.operator
              });
            }
            break;
        }
      });

      // 6. 为每个已选仓库添加最新状态数据点
      const nowTime = new Date().getTime();
      warehouses.forEach(warehouse => {
        // 计算仓库当前实际库存（从warehouseProducts中获取）
        const warehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];
        const productsInWarehouse = warehouseProducts.filter(p => p.warehouseId === warehouse.id);
        const currentTotalStock = productsInWarehouse.reduce((sum, p) => sum + p.quantity, 0);

        // 确保仓库有历史记录
        if (warehouseHistory[warehouse.id]) {
          // 检查是否需要添加实时点
          const lastPoint = warehouseHistory[warehouse.id].points[warehouseHistory[warehouse.id].points.length - 1];

          // 如果最后一个数据点距离现在超过1小时，或者库存不一致，则添加一个实时点
          const needRealTimePoint = !lastPoint ||
            (nowTime - lastPoint.time > 3600000) ||
            (currentTotalStock !== lastPoint.stock);

          if (needRealTimePoint) {
            // 如果上一条记录时间相同，添加微小偏移
            let adjustedTime = nowTime;
            if (lastPoint && lastPoint.time === nowTime) {
              adjustedTime = nowTime + 1;
            }

            warehouseHistory[warehouse.id].points.push({
              time: adjustedTime,
              stock: currentTotalStock,
              status: '实时',
              opId: 'realtime-' + warehouse.id,
              productId: '',
              quantity: 0,
              applicant: '系统'
            });
          }
        }
      });

      // 7. 转换为3D图表需要的数据格式
      let result = [];
      Object.entries(warehouseHistory).forEach(([warehouseId, history]) => {
        history.points.forEach(point => {
          result.push([
            warehouseId,
            point.time,
            point.stock,
            warehouseHistory[warehouseId].name,
            point.opId,
            point.status,
            point.productId || '',
            point.quantity || 0,
            point.applicant || ''
          ]);
        });
      });

      // 保存原始数据，用于后续筛选
      this.originalScatterData = [...result];

      return this.filterDataByTimeRange(result);
    },

    /**
     * @Function_Para 处理时间范围变化
     *   @param {Array} value - 新的时间范围值 [min, max]
     * @Function_Meth 根据时间范围筛选数据并更新图表
     * @Function_API
     *   - ECharts: 重新渲染图表
     */
    handleTimeRangeChange(value) {
      // 在更新时间范围前保存当前视图状态
      this.saveChartViewState();

      // 清除可能存在的轴范围缓存
      this.actualTimeRange = null;

      // 修复：防止时间范围发生跳跃，确保结束点在100%时对应当前时间
      if (value[1] === 100 && this.originalScatterData.length > 0) {
        // 如果拖动到100%，显式设置为当前时间
        const currentTime = new Date();
        this.$notify({
          title: '时间范围更新',
          message: `时间范围更新: ${this.formatTimeTooltip(value[0])} 至 ${format(currentTime, 'yyyy-MM-dd HH:mm')}`,
          position: 'top-left'
        });
      }

      // 更新时间范围并刷新图表
      this.timeRangeValue = value;

      // 需要强制刷新图表
      this.forceRefreshChart = true;

      // 强制图表完全重新计算数据和视图
      this.loading.scatter3d = true;
      this.updateScatter3DChart();
    },

    updateScatter3DChart() {
      if (!this.charts.scatter3d) return;

      // 在更新前保存当前视图状态（如果尚未保存）
      if (!this.chartViewState.alpha) {
        this.saveChartViewState();
      }

      // 关键修复：主动清除图表，移除所有旧内容包括"暂无数据"提示
      this.charts.scatter3d.clear();

      // 重要：确保在数据准备时记录实际时间范围
      const data = this.prepareScatter3DData().filter(item => {
        return item && item.length >= 3 && !isNaN(item[1]) && !isNaN(item[2]);
      });

      if (data.length === 0) {
        this.showEmptyChart(this.charts.scatter3d, '暂无三维数据');
        this.loading.scatter3d = false;
        return;
      }

      // 提取所有时间点，用于确保轴范围正确设置
      const allTimePoints = data.map(item => item[1]);

      // 数据的实际时间范围
      const dataMinTime = Math.min(...allTimePoints);
      const dataMaxTime = Math.max(...allTimePoints);

      // 决定使用哪个时间范围：用户设置的范围或数据的实际范围
      const minTime = this.actualTimeRange ?
        // 确保最小时间不小于数据中的最小时间
        Math.max(this.actualTimeRange.min, dataMinTime) : dataMinTime;

      const maxTime = this.actualTimeRange ?
        // 确保最大时间不大于数据中的最大时间
        Math.min(this.actualTimeRange.max, dataMaxTime) : dataMaxTime;

      // 获取所有唯一的仓库ID，但仅限于已选中的仓库
      const warehouseIds = Array.from(new Set(data.map(item => item[0])))
        .filter(id => this.selectedWarehouses.includes(id));

      // 定义一组对比鲜明的颜色，用于区分不同仓库
      const colors = [
        '#FF6B6B', // 红色
        '#4ECDC4', // 青绿色
        '#FFD166', // 黄色
        '#6A0572', // 紫色
        '#1A535C', // 深青色
        '#F76F8E', // 粉色
        '#2E86AB', // 蓝色
        '#F19A3E', // 橙色
        '#44AF69', // 绿色
        '#9984D4', // 淡紫色
        '#4B4E6D', // 靛蓝色
        '#E16036'  // 砖红色
      ];

      // 准备两组系列：一组用于散点，一组用于折线
      const scatterSeries = [];
      const lineSeries = [];

      warehouseIds.forEach((warehouseId, index) => {
        // 只处理选中的仓库
        if (!this.selectedWarehouses.includes(warehouseId)) return;

        // 过滤出该仓库的所有数据点
        const warehouseData = data.filter(item => item[0] === warehouseId);
        // 从第一个点获取仓库名（如果有）
        const warehouseName = warehouseData.length > 0 && warehouseData[0][3] ?
          warehouseData[0][3] : warehouseId;

        // 根据仓库索引获取颜色，使用循环确保颜色不会用尽
        const colorIndex = index % colors.length;
        const baseColor = colors[colorIndex];

        // 1. 添加折线系列 - 显示趋势
        lineSeries.push({
          type: 'line3D',
          name: warehouseName,
          data: warehouseData,
          lineStyle: {
            width: 6, // 增加折线宽度，提高剧烈变化处的可视性
            // 每个仓库使用不同的基础颜色
            color: baseColor,
            opacity: 0.8 // 增加透明度使线条更明显
          },
          // 不渲染折线上的点，由scatter3D负责
          symbol: 'none',
          silent: true // 使折线不响应交互
        });

        // 2. 添加散点系列 - 用于交互和展示数据点
        scatterSeries.push({
          type: 'scatter3D',
          name: warehouseName,
          data: warehouseData,
          // 为不同类型的点设置不同大小
          symbolSize: function (data) {
            const status = data[5];
            // 操作前点设置为更小的尺寸，几乎不可见
            if (status === '操作前' || (data[4] && data[4].startsWith('pre-'))) {
              return 4;  // 非常小的点
            }
            return 14; // 常规点尺寸
          },
          // 增加选中区域大小，超出实际点的显示大小，使点击更容易
          emphasis: {
            scale: 2, // 悬停时放大点
            itemStyle: {
              color: '#111111', // 黑色高亮
              opacity: 1,
              borderWidth: 2,
              borderColor: '#fff',
              shadowBlur: 30, // 增加阴影模糊半径
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          itemStyle: {
            // 设置点的颜色
            color: function (params) {
              const status = params.data[5];
              // 操作前点设置为半透明灰色
              if (status === '操作前' || (params.data[4] && params.data[4].startsWith('pre-'))) {
                return 'rgba(150, 150, 150, 0.3)';  // 半透明灰色
              }
              if (status === '初始状态') return '#999';
              if (status === '入库' || status === '转入') return '#67C23A';
              if (status === '出库' || status === '转出') return '#F56C6C';
              if (status === '实时') return '#409EFF'; // 为实时状态添加特殊颜色
              if (status === '自定义范围') return '#FF9F00'; // 为自定义范围点添加特殊颜色（橙色）
              return baseColor; // 默认使用仓库的基本颜色
            },
            // 透明度和边框
            opacity: function (params) {
              const status = params.data[5];
              // 操作前点设置为半透明
              if (status === '操作前' || (params.data[4] && params.data[4].startsWith('pre-'))) {
                return 0.3;  // 半透明
              }
              return 1; // 完全不透明
            },
            borderWidth: 1,
            borderColor: '#fff'
          }
        });
      });

      // 合并所有系列
      const allSeries = [...lineSeries, ...scatterSeries];

      // 修复关键点：使用已保存的视图状态作为初始设置，而不是硬编码的默认值
      const option = {
        backgroundColor: 'transparent',
        // 改进tooltip的交互和显示
        tooltip: {
          show: true,
          trigger: 'item', // 确保只有点击或悬停数据点时才显示tooltip
          showDelay: 50,
          enterable: true, // 允许鼠标进入提示框内部
          extraCssText: 'width:280px; white-space:normal; word-wrap:break-word;', // 允许提示框文本自动换行
          formatter: function (params) {
            if (!params.data) return '';

            // 确保获取的是实际点击的数据点的正确信息
            const data = params.data;
            const warehouseName = data[3] || data[0];
            const time = new Date(data[1]);
            const stock = data[2];
            const status = data[5] || '状态未知';
            const opId = data[4] || '未知ID';
            const productId = data[6] || '';
            const quantity = data[7] || 0;
            const applicant = data[8] || '';

            // 增强HTML格式以提高可读性
            let tooltipHtml = `
              <div style="padding: 8px; border-radius: 4px; background: rgba(50, 50, 50, 0.75); color: white;">
                <div style="font-weight:bold; color: #00bbff; font-size: 14px; border-bottom:1px solid #666; padding-bottom:5px; margin-bottom:5px">
                  ${warehouseName}仓库
                </div>
                <div style="line-height: 1.6;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #bbb;">时间:</span> 
                    <b style="margin-left: 10px;">${format(time, 'yyyy-MM-dd HH:mm:ss')}</b>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #bbb;">库存总量:</span> 
                    <b style="margin-left: 10px; color: ${stock > 100 ? '#67C23A' : stock > 50 ? '#E6A23C' : '#F56C6C'}">${stock}</b>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #bbb;">状态:</span> 
                    <b style="margin-left: 10px; color: ${status === '入库' || status === '转入' ? '#67C23A' : status === '出库' || status === '转出' ? '#F56C6C' : '#999'}">${status}</b>
                  </div>
            `;

            // 非初始状态时显示更多操作详情
            if (opId !== 'initial' && !opId.startsWith('realtime-') && !opId.startsWith('boundary-')) {
              tooltipHtml += `
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #bbb;">操作ID:</span> 
                    <span style="margin-left: 8px; font-family: monospace; font-size: 14px; color: #fff;">${opId}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #bbb;">商品ID:</span> 
                    <b style="margin-left: 10px;">${productId}</b>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #bbb;">数量:</span> 
                    <b style="margin-left: 10px; color: ${quantity > 0 ? '#67C23A' : '#F56C6C'}">${quantity}</b>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #bbb;">申请人:</span> 
                    <b style="margin-left: 10px;">${applicant}</b>
                  </div>
              `;
            } else if (status === '自定义范围') {
              tooltipHtml += `
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #bbb;">说明:</span> 
                    <b style="margin-left: 10px;">时间范围筛选边界点</b>
                  </div>
              `;
            }

            tooltipHtml += `
                </div>
              </div>
            `;

            return tooltipHtml;
          }
        },
        // 坐标轴指示器配置
        axisPointer: {
          link: { show: true },
          label: {
            show: true,
            formatter: function (params) {
              // 根据坐标轴类型格式化标签
              if (params.axisDimension === 'y') {
                // 时间轴
                return format(new Date(params.value), 'MM-dd HH:mm:ss');
              } else if (params.axisDimension === 'z') {
                // 库存数量轴 - 显示当前参考线对应的库存数量
                return params.value.toFixed(0) + '件';
              }
              return params.value;
            }
          },
          lineStyle: {
            type: 'dashed', // 设置为虚线
            width: 1.5,     // 稍微加粗
            color: 'rgba(128, 128, 128, 0.3)' // 修改为更淡的灰色，降低不透明度
          }
        },
        // 修改grid3D配置，使用保存的视图状态作为初始值
        grid3D: {
          viewControl: {
            // 使用已保存的视图状态，如果存在的话
            autoRotate: this.autoRotate,
            autoRotateSpeed: 5,
            // 使用已保存的视图距离，否则使用计算值
            distance: this.chartViewState.distance || (150 * (100 / this.scatter3dZoom)),
            // 使用已保存的方位角，否则使用默认值
            alpha: this.chartViewState.alpha || 25,
            beta: this.chartViewState.beta || 35,
            center: this.chartViewState.center || [0, 0, 0],
            // 提高交互灵敏度
            rotateSensitivity: 1.5,
            zoomSensitivity: 1.8,
            damping: 0.2,
            animation: true,
            animationDurationUpdate: 500,
            panSensitivity: 1.2
          },
          light: {
            main: {
              intensity: 1.2,
              shadow: true,
              shadowQuality: 'high',
              alpha: 30,
              beta: 40
            },
            ambient: {
              intensity: 0.4
            }
          },
          // 增强网格线
          splitLine: {
            show: true,
            lineStyle: {
              color: 'rgba(205, 205, 205, 0.5)',
              width: 1
            }
          },
          // 轴线设置
          axisLine: {
            lineStyle: {
              color: '#AAA',
              width: 2
            }
          },
          // 轴标签样式增强
          axisLabel: {
            fontSize: 12,
            textStyle: {
              color: '#555'
            }
          }
        },
        xAxis3D: {
          type: 'category',
          name: '仓库',
          data: warehouseIds,
          // 轴名称样式
          nameTextStyle: {
            color: '#5',
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        yAxis3D: {
          type: 'time',
          name: '时间',
          min: minTime,  // 关键：明确设置时间轴的最小值
          max: maxTime,  // 关键：明确设置时间轴的最大值
          scale: true,   // 允许轴自动调整以更好地显示数据
          axisLabel: {
            formatter: function (value) {
              const date = new Date(value);
              return format(date, 'MM-dd HH:mm:ss'); // 增加秒级显示
            }
          },
          // 轴名称样式
          nameTextStyle: {
            color: '#555',
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        zAxis3D: {
          type: 'value',
          name: '库存总量',
          minInterval: 1,
          // 轴名称样式
          nameTextStyle: {
            color: '#555',
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        series: allSeries
      };

      // 使用 true 作为第二个参数确保新选项完全替换旧选项
      // 这有助于解决图表显示问题
      const shouldReplaceOption = this.forceRefreshChart === true;
      this.charts.scatter3d.setOption(option, shouldReplaceOption);

      // 重置强制刷新标记
      this.forceRefreshChart = false;

      this.loading.scatter3d = false;

      // 添加点击事件处理
      this.charts.scatter3d.off('click');
      this.charts.scatter3d.on('click', this.handleChartClick);
    },

    /**
     * @Function_Para 处理图表点击事件
     *   @param {Object} params - 事件参数对象
     * @Function_Meth 显示被点击数据点的详细信息
     * @Function_API
     *   - Element UI Message: 显示点击信息
     */
    handleChartClick(params) {
      if (!params.data) return;

      // 忽略操作前状态点的点击事件
      if (params.data[5] === '操作前' || (params.data[4] && params.data[4].startsWith('pre-'))) {
        return;
      }

      const data = params.data;
      const warehouseName = data[3] || data[0];
      const time = new Date(data[1]);
      const stock = data[2];
      const status = data[5] || '状态未知';
      const opId = data[4] || '未知ID';

      let infoMessage = `${warehouseName}仓库 - ${format(time, 'yyyy-MM-dd HH:mm:ss')} - 库存: ${stock}`;

      if (data[4] !== 'initial' && !opId.startsWith('realtime-') && !opId.startsWith('boundary-')) {
        const productId = data[6] || '';
        const quantity = data[7] || 0;
        infoMessage += ` - ${status}操作: ${productId} (${quantity > 0 ? '+' : ''}${quantity})`;
        // 添加完整操作ID
        infoMessage += `\n操作ID: ${opId}`;
      } else if (status === '实时') {
        infoMessage += ` - ${status}状态: 当前库存`;
      } else if (status === '自定义范围') {
        infoMessage += ` - ${status}状态: 筛选边界点`;
      }

      this.$message({
        message: infoMessage,
        type: status === '入库' || status === '转入' ? 'success' :
          status === '出库' || status === '转出' ? 'warning' :
            status === '实时' ? 'info' :
              status === '自定义范围' ? 'info' : 'info',
        duration: 5000,
        showClose: true
      });
    },

    handleAutoRotateChange() {
      // 保存当前视图状态
      this.saveChartViewState();

      // 修复自动旋转控制功能
      if (this.charts.scatter3d) {
        const currentOption = this.charts.scatter3d.getOption();
        // 直接修改视图控制选项
        currentOption.grid3D[0].viewControl.autoRotate = this.autoRotate;
        this.charts.scatter3d.setOption(currentOption, false); // false表示不合并选项，直接替换

        // 恢复保存的视图状态
        this.$nextTick(() => {
          this.restoreChartViewState();
        });
      }
    },

    /**
     * @Function_Para 处理缩放变化
     *   @param {number} value - 新的缩放值
     * @Function_Meth 更新3D图表的缩放比例
     * @Function_API
     *   - ECharts: 直接修改图表配置选项
     */
    handleZoomChange(value) {
      // 保存当前视图状态
      this.saveChartViewState();

      this.scatter3dZoom = value;

      // 修复缩放控制功能
      if (this.charts.scatter3d) {
        const currentOption = this.charts.scatter3d.getOption();
        // 更新视图控制距离
        currentOption.grid3D[0].viewControl.distance = 150 * (100 / this.scatter3dZoom);
        this.charts.scatter3d.setOption(currentOption, false); // false表示不合并选项，直接替换

        // 恢复保存的视图状态
        this.$nextTick(() => {
          this.restoreChartViewState();
        });
      }
    },

    /**
     * @Function_Para 格式化时间范围提示
     *   @param {number} value - 滑块值
     * @Function_Meth 将滑块值转换为可读的时间格式
     * @Function_API
     *   - date-fns format: 格式化日期
     */
    formatTimeTooltip(value) {
      if (!this.timeRangeDates || this.timeRangeDates.length === 0) {
        return value;
      }

      // 将滑块值映射到对应的日期
      const index = Math.min(Math.floor((value / 100) * this.timeRangeDates.length), this.timeRangeDates.length - 1);
      const date = new Date(this.timeRangeDates[index]);
      return format(date, 'yyyy-MM-dd HH:mm');
    }
  },

  mounted() {
    this.loadData();
    this.$nextTick(() => {
      this.initCharts();
    });
    window.addEventListener('resize', this.handleResize);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.dispose();
    });
  }
}
</script>