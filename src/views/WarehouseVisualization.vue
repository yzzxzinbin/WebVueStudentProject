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
  border-radius: 8px;
}

.summary-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.3s;
  background-color: rgba(255, 255, 255, 0.8);
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
  height: 420px;
  transition: all 0.3s;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.chart-card:hover {
  transform: translateY(-2px);
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
</style>



<script>
import * as echarts from 'echarts'
import { format } from 'date-fns'

export default {
  name: 'WarehouseDashboard',
  data() {
    return {
      selectedWarehouse: '',
      productTopN: 5,
      trendDays: '7',
      warningThreshold: 80,
      thresholdOptions: [70, 75, 80, 85],
      loading: {
        product: false,
        heatmap: false,
        trend: true,
        gauge: true
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
        gauge: null
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
          color: 'var(--danger-color)',
          icon: 'el-icon-data-line',
          trend: 3.7
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
      if (this.warehouses.length === 0) return 0
      const total = this.warehouses.reduce((sum, w) => {
        const warehouseProducts = this.warehouseProducts.filter(p => p.warehouseId === w.id)
        const used = warehouseProducts.reduce((s, p) => s + p.quantity, 0)
        return sum + (used / w.capacity * 100)
      }, 0)
      return (total / this.warehouses.length).toFixed(1)
    },
    recentOperations() {
      return [...this.operations]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map(op => ({
          ...op,
          productName: this.products.find(p => p.id === op.productId)?.name || op.productId
        }))
    },
    filteredWarehouseProducts() {
      if (!this.selectedWarehouse) return this.warehouseProducts
      return this.warehouseProducts.filter(p => p.warehouseId === this.selectedWarehouse)
    }
  },
  methods: {
    async loadData() {
      try {
        this.loading = { product: true, heatmap: true, trend: true, gauge: true };
        this.warehouses = JSON.parse(localStorage.getItem('warehouses')) || [];
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.warehouseProducts = JSON.parse(localStorage.getItem('warehouseProducts')) || [];
        this.operations = JSON.parse(localStorage.getItem('operations')) || [];
      } finally {
        this.loading = { product: false, heatmap: false, trend: false, gauge: false };
        this.$nextTick(() => {
          this.updateCharts();
          this.updateTrendChart();  // 手动触发趋势图更新
          this.updateGaugeChart();  // 手动触发仪表图更新
        });
      }
    },
    initTrendChart() {
      const container = this.$refs.trendChart;
      if (!container) return;

      // 强制重绘
      container.style.display = 'none';
      container.offsetHeight; // 触发重排
      container.style.display = 'block';
      if (!this.$refs.trendChart) {
        console.error('Trend Chart container not found');
        return;
      }
      console.log('Container dimensions:', this.$refs.trendChart.clientWidth, this.$refs.trendChart.clientHeight);
      this.charts.trend = echarts.init(this.$refs.trendChart);
      this.updateTrendChart();
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
    initGaugeChart() {
      this.charts.gauge = echarts.init(this.$refs.gaugeChart)
      this.updateGaugeChart()
    },
    updateGaugeChart() {
      if (!this.charts.gauge) return;

      // 未选中仓库时显示全局使用率
      if (!this.selectedWarehouse) {
        const totalUsed = this.warehouseProducts.reduce((sum, p) => sum + p.quantity, 0);
        const totalCapacity = this.warehouses.reduce((sum, w) => sum + w.capacity, 0);
        const globalUsage = totalCapacity > 0 ? Math.min(Math.round((totalUsed / totalCapacity) * 100), 100) : 0;

        const option = {
          tooltip: {
            formatter: `全局仓库使用率: ${globalUsage}%<br/>总用量: ${totalUsed}/${totalCapacity}`
          },
          series: [{
            type: 'gauge',
            center: ['50%', '50%'],
            radius: '80%',
            min: 0,
            max: 100,
            splitNumber: 5,
            axisLine: {
              lineStyle: {
                width: 10,
                color: [
                  [0.3, '#67C23A'],
                  [0.7, '#E6A23C'],
                  [1, '#F56C6C']
                ]
              }
            },
            pointer: { itemStyle: { color: 'auto' } },
            axisTick: { distance: -10, length: 5 },
            splitLine: { distance: -10, length: 10 },
            axisLabel: { distance: -20, color: 'inherit' },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              color: 'inherit',
              fontSize: 20
            },
            data: [{
              value: globalUsage,
              name: '全局仓库使用率',
              used: totalUsed,
              capacity: totalCapacity
            }],
            title: {
              offsetCenter: [0, '80%'],
              fontSize: 14,
              color: '#666'
            },
            animationDuration: 2000
          }]
        };

        this.charts.gauge.setOption(option);
        return;
      }

      // 选中仓库时显示单个仓库的仪表盘
      const warehouse = this.warehouses.find(w => w.id === this.selectedWarehouse);
      if (!warehouse) {
        this.showEmptyChart(this.charts.gauge, '仓库数据不存在');
        return;
      }

      const used = this.warehouseProducts
        .filter(p => p.warehouseId === warehouse.id)
        .reduce((sum, p) => sum + p.quantity, 0);
      const percent = Math.min(Math.round((used / warehouse.capacity) * 100), 100);

      const option = {
        tooltip: {
          formatter: `
        <strong>${warehouse.name}</strong><br/>
        使用率: ${percent}%<br/>
        已用: ${used}/${warehouse.capacity}
      `
        },
        series: [{
          type: 'gauge',
          center: ['50%', '50%'],
          radius: '80%',
          min: 0,
          max: 100,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 10,
              color: [
                [0.3, '#67C23A'],
                [0.7, '#E6A23C'],
                [1, '#F56C6C']
              ]
            }
          },
          pointer: { itemStyle: { color: 'auto' } },
          axisTick: { distance: -10, length: 5 },
          splitLine: { distance: -10, length: 10 },
          axisLabel: { distance: -20, color: 'inherit' },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            color: 'inherit',
            fontSize: 20
          },
          data: [{
            value: percent,
            name: warehouse.name,
            used: used,
            capacity: warehouse.capacity
          }],
          title: {
            offsetCenter: [0, '80%'],
            fontSize: 14,
            color: '#666'
          },
          animationDuration: 2000
        }]
      };

      this.charts.gauge.setOption(option);
      this.loading.gauge = false;
    },
    initCharts() {
      this.charts.product = echarts.init(this.$refs.productChart)
      this.charts.heatmap = echarts.init(this.$refs.heatmapChart)
      this.updateCharts()
    },
    updateCharts() {
      this.updateProductChart()
      this.updateHeatmapChart()
      this.updateTrendChart()
      this.updateGaugeChart()
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
        if (chart) chart.resize()
      })
    }
  },
  mounted() {
    this.loadData();
    this.$nextTick(() => {
      this.initCharts();
      this.initTrendChart();  // 确保趋势图初始化
      this.initGaugeChart(); // 确保仪表图初始化
    });
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.dispose()
    })
  }
}
</script>