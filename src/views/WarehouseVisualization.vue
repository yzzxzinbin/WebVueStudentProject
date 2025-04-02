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
              <div style="flex: 1; min-width: 350px; max-width: 400px; margin-left: 10px;">
                <el-slider v-model="scatter3dZoom" :min="50" :max="200" @change="handleZoomChange" show-input>
                </el-slider>
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
  min-height: 100vh;
  border-radius: 12px;
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
</style>
<style scoped></style>


<script>
import * as echarts from 'echarts'
import { format } from 'date-fns'
import { Scatter3DChart } from 'echarts-gl/charts';
import { Grid3DComponent } from 'echarts-gl/components';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Line3DChart } from 'echarts-gl/charts';
echarts.use([
  Scatter3DChart,
  Grid3DComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
  Line3DChart
]);

export default {
  name: 'WarehouseDashboard',
  data() {
    return {
      scatter3dZoom: 100, // 缩放比例，初始100%
      autoRotate: true, // 是否自动旋转
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
      }
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
          trend: 0 // 可根据需要添加趋势计算
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
      // 如果有选中的仓库，只计算该仓库的使用率
      if (this.selectedWarehouse) {
        const warehouse = this.warehouses.find(w => w.id === this.selectedWarehouse);
        if (!warehouse) return 0;

        const usageData = this.warehouseUsageRates.find(w => w.id === warehouse.id);
        return usageData ? usageData.usageRate : 0;
      }

      // 否则计算全局平均使用率
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
          ? Math.min((totalQuantity / warehouse.capacity) * 100, 100) // 不超过100%
          : 0;

        return {
          id: warehouse.id,
          name: warehouse.name,
          usageRate: usageRate.toFixed(1),
          used: totalQuantity,
          capacity: warehouse.capacity
        };
      });
    },
  },
  methods: {
    async loadData() {
      try {
        this.loading = { product: true, heatmap: true, trend: true, gauge: true, scatter3d: true };
        this.warehouses = JSON.parse(localStorage.getItem('warehouses')) || [];
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.warehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];
        this.operations = JSON.parse(localStorage.getItem('operations')) || [];

        // 确保capacity是数字类型
        this.warehouses.forEach(w => {
          w.capacity = Number(w.capacity) || 0;
        });
      } finally {
        this.loading = { product: false, heatmap: false, trend: false, gauge: false, scatter3d: false };
        this.$nextTick(() => {
          this.updateCharts();
          this.updateTrendChart();  // 手动触发趋势图更新
          this.updateGaugeChart();  // 手动触发仪表图更新
          this.updateScatter3DChart();  // 手动触发散点图更新
        });
      }
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
          format(new Date().setDate(new Date().getDate() - days + i + 1), 'MM-dd')
        ),
        in: Array.from({ length: days }, () => Math.floor(Math.random() * 100) + 50),
        out: Array.from({ length: days }, () => Math.floor(Math.random() * 80) + 30)
      }

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

      // 全局模式 - 显示平均使用率
      if (!this.selectedWarehouse) {
        const option = {
          series: [{
            type: 'gauge',
            center: ['50%', '60%'], // 调整中心位置
            radius: '90%', // 调整半径
            detail: {
              formatter: '{value}%',
              offsetCenter: [0, '70%'], // 将详情文字下移
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

      // 单个仓库模式
      const warehouse = this.warehouses.find(w => w.id === this.selectedWarehouse);
      if (!warehouse) return;

      const usageData = this.warehouseUsageRates.find(w => w.id === warehouse.id);
      const usageRate = usageData ? usageData.usageRate : 0;

      const option = {
        series: [{
          type: 'gauge',
          center: ['50%', '60%'], // 调整中心位置
          radius: '90%', // 调整半径
          detail: {
            formatter: `{value}%\n${usageData.used}/${usageData.capacity}`,
            offsetCenter: [0, '70%'], // 将详情文字下移
            fontSize: 16,
            fontWeight: 'bold',
            rich: {
              // 可以添加更丰富的文本样式
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
          // 添加标题
          title: {
            show: true,
            offsetCenter: [0, '-40%'], // 标题位置
            fontSize: 14,
            color: '#606266'
          }
        }]
      };

      this.charts.gauge.setOption(option);
    },
    // 根据使用率返回颜色
    getUsageColor(rate) {
      rate = parseFloat(rate);
      if (rate < 30) return '#67C23A';  // 绿色
      if (rate < 70) return '#E6A23C';  // 黄色
      return '#F56C6C';                 // 红色
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

      // Prepare heatmap data
      const heatmapData = this.prepareHeatmapData()

      // 如果没有数据，显示空图表提示
      if (heatmapData.length === 0) {
        this.showEmptyChart(this.charts.heatmap, '暂无操作数据')
        return
      }

      // 获取日期范围
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
      // Group operations by date
      const dateCounts = {}
      this.operations.forEach(op => {
        const date = new Date(op.timestamp)
        // 标准化日期，忽略时间部分
        const dateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1
      })

      // Convert to heatmap format
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

      // Adjust range to show full months
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
      this.loading.scatter3d = true;
      this.updateScatter3DChart();
    },
    updateScatter3DChart() {
      if (!this.charts.scatter3d) return;

      const data = this.prepareScatter3DData().filter(item => {
        return (
          item[0] &&
          !isNaN(new Date(item[1]).getTime()) &&
          !isNaN(item[2])
        );
      });

      if (data.length === 0) {
        this.showEmptyChart(this.charts.scatter3d, '暂无三维数据');
        this.loading.scatter3d = false;
        return;
      }

      const seriesData = {};
      data.forEach(item => {
        const warehouseId = item[0];
        if (!seriesData[warehouseId]) {
          seriesData[warehouseId] = {
            name: item[3],
            points: []
          };
        }
        seriesData[warehouseId].points.push(item);
      });

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          formatter: params => {
            const pointData = params.data.value || [];
            let timeStr;
            try {
              timeStr = format(new Date(pointData[1]), 'yyyy-MM-dd HH:mm');
            } catch (e) {
              timeStr = '时间数据异常';
              console.error('时间格式化错误:', pointData[1], e);
            }
            return `
          <strong>${params.seriesName}</strong><br/>
          时间: ${timeStr}<br/>
          库存总量: ${pointData[2] || 0}<br/>
          状态: ${pointData[5] || '未知'}<br/>
          操作ID: ${pointData[4] || '初始状态'}
        `;
          }
        },
        grid3D: {
          viewControl: {
            autoRotate: this.autoRotate, // 使用变量控制自动旋转
            autoRotateSpeed: 10,
            distance: 150 * (this.scatter3dZoom / 100), // 根据缩放比例调整距离
            alpha: 40,
            beta: 60,
            zoomSensitivity: 0, // 禁用鼠标缩放
            rotateSensitivity: 1 // 保持旋转灵敏度
          },
          axisPointer: {
            lineStyle: { color: '#fff' }
          }
        },
        xAxis3D: {
          type: 'category',
          name: '仓库',
          data: Object.keys(seriesData), // 仓库ID列表
          axisLabel: {
            interval: 0,
            rotate: 45,
            fontSize: 10,
            formatter: (value) => {
              return seriesData[value]?.name || value; // 显示仓库名称
            }
          }
        },
        yAxis3D: {
          type: 'time',
          name: '时间',
          axisLabel: {
            formatter: (value) => format(new Date(value), 'MM-dd HH:mm')
          }
        },
        zAxis3D: {
          type: 'value',
          name: '库存总量'
        },
        series: Object.entries(seriesData).map(([warehouseId, warehouse]) => ({
          type: 'line3D', // 关键修改：使用 line3D 替代 scatter3D
          name: warehouse.name,
          data: warehouse.points.map(point => ({
            value: point,
            itemStyle: {
              color: point[5] === '操作后' ? '#c23531' : '#61a0a8' // 颜色区分
            }
          })),
          lineStyle: {
            width: 3,
            opacity: 0.8
          },
          symbol: 'circle', // 保留散点标记
          symbolSize: 8,
          emphasis: { // 高亮样式
            lineStyle: { width: 4 },
            symbolSize: 12
          }
        }))
      };

      this.charts.scatter3d.setOption(option);
      this.loading.scatter3d = false;

    },

    prepareScatter3DData() {
      const operations = JSON.parse(localStorage.getItem('operations')) || [];
      const warehouses = JSON.parse(localStorage.getItem('warehouses')) || [];
      const products = JSON.parse(localStorage.getItem('products')) || [];

      // 1. 按时间排序所有操作
      const sortedOps = [...operations].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      // 2. 初始化每个仓库的库存历史记录
      const warehouseHistory = {};
      warehouses.forEach(warehouse => {
        warehouseHistory[warehouse.id] = {
          name: warehouse.name,
          points: []
        };
      });

      // 3. 计算初始库存状态（所有仓库初始库存为0）
      warehouses.forEach(warehouse => {
        warehouseHistory[warehouse.id].points.push({
          time: sortedOps.length > 0
            ? new Date(sortedOps[0].timestamp).getTime() - 3600000 // 第一个操作前一h
            : new Date().getTime() - 3600000, // 如果没有操作，使用当前时间前一h
          stock: 0,
          operationId: 'initial',
          status: '初始状态'
        });
      });

      // 4. 重建库存变化历史（更精确的方法）
      const currentStock = {};
      warehouses.forEach(warehouse => {
        currentStock[warehouse.id] = 0;
      });

      sortedOps.forEach(op => {
        const opTime = new Date(op.timestamp).getTime();
        const opType = op.type;
        const quantity = op.quantity;

        // 记录操作前的状态（仅用于调试，正式版本可以去掉）
        /*
        warehouses.forEach(warehouse => {
          warehouseHistory[warehouse.id].points.push({
            time: opTime - 1, // 操作前1毫秒
            stock: currentStock[warehouse.id],
            operationId: op.id,
            status: '操作前'
          });
        });
        */

        // 处理不同类型的操作
        switch (opType) {
          case '入库':
            if (op.targetWarehouse) {
              currentStock[op.targetWarehouse] = (currentStock[op.targetWarehouse] || 0) + quantity;
            }
            break;

          case '出库':
            if (op.sourceWarehouse) {
              currentStock[op.sourceWarehouse] = Math.max(0, (currentStock[op.sourceWarehouse] || 0) - quantity);
            }
            break;

          case '转调':
            if (op.sourceWarehouse && op.targetWarehouse) {
              currentStock[op.sourceWarehouse] = Math.max(0, (currentStock[op.sourceWarehouse] || 0) - quantity);
              currentStock[op.targetWarehouse] = (currentStock[op.targetWarehouse] || 0) + quantity;
            }
            break;
        }

        // 记录操作后的状态
        warehouses.forEach(warehouse => {
          warehouseHistory[warehouse.id].points.push({
            time: opTime,
            stock: currentStock[warehouse.id],
            operationId: op.id,
            status: '操作后'
          });
        });
      });

      // 5. 转换为3D图表需要的数据格式
      const result = [];
      Object.entries(warehouseHistory).forEach(([warehouseId, history]) => {
        history.points.forEach(point => {
          result.push([
            warehouseId,          // x轴: 仓库ID
            point.time,          // y轴: 时间
            point.stock,         // z轴: 库存总量
            history.name,        // 仓库名称
            point.operationId,   // 操作ID
            point.status         // 状态
          ]);
        });
      });

      return result;
    },
    // 处理缩放滑块变化
    handleZoomChange(value) {
      this.scatter3dZoom = value;
      this.updateScatter3DChart();
    },

    // 处理自动旋转切换
    handleAutoRotateChange() {
      this.updateScatter3DChart();
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