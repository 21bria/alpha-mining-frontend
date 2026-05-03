<template>
  <div class="chart-mask" :class="{ scrollable: isScrollable }">
    <component :is="BaseLineColumnArea" v-if="chartData" :series="chartData.series" :categories="chartData.categories"
      :colors="colors" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import BaseLineColumnArea from '@/components/ui/apex-chart/BaseLineColumnArea.vue'
import { useApi } from '@/composables/useApi'
const props = defineProps<{ filterType: string }>()

const chartFilter = useChartFilterStore()
const { request } = useApi()

function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

async function getApi<T = any>(url: string, extraQuery?: Record<string, any>) {
  return await request<T>(url, {
    method: 'GET',
    query: cleanQuery({
      ...extraQuery
    })
  })
}

interface ChartSeries {
  name: string
  data: number[]
  type: string
}

interface ChartData {
  categories: string[]
  series: ChartSeries[]
}

const chartData = ref<ChartData | null>(null)

const isScrollable = computed(() => {
  return !['weekly', 'yearly', 'all'].includes(props.filterType)
})

const colors = computed(() => ['#22c55e', '#f97316', '#6366f1'])

const chartTypeConfig = computed(() => {
  return props.filterType === 'monthly'
    ? { stock: 'area', selling: 'area', balance: 'line' }
    : { stock: 'bar', selling: 'bar', balance: 'line' }
})

async function fetchChartData() {
  try {
    const filterType = props.filterType
    let endpoint = '/api/analytics/raw/inventory/chart/'
    const query: Record<string, any> = {
      filter_type: filterType
    }

    if (chartFilter.iup_id) {
      query.iup_id = chartFilter.iup_id
    }

    switch (props.filterType) {
      case 'daily':
        if (chartFilter.date) query.daily = chartFilter.date
        break
      case 'weekly':
        if (chartFilter.year) {
          query.year = chartFilter.year
        }
        if (chartFilter.month?.value) {
          query.month = chartFilter.month.value
        }
        if (chartFilter.year && chartFilter.week) {
          query.week = chartFilter.week ?? null
        }
        break

      case 'monthly':
        if (chartFilter.year) {
          query.year = chartFilter.year
        }
        if (chartFilter.month?.value) {
          query.month = chartFilter.month.value
        }
        break

      case 'range':
        if (chartFilter.range.start && chartFilter.range.end) {
          query.date_start = chartFilter.range.start
          query.date_end = chartFilter.range.end
        }
        break

      case 'yearly':
        if (chartFilter.year) {
          query.year = chartFilter.year
        }
        break

    }

   const data = await getApi<any>(endpoint, query)

    chartData.value = {
      categories: data.x_data,
      series: [
        { name: 'Production In', type: chartTypeConfig.value.stock, data: data.y_data_stock },
        { name: 'Selling', type: chartTypeConfig.value.selling, data: data.y_data_out },
        { name: 'Stock Opname', type: chartTypeConfig.value.balance, data: data.y_data_balance }
      ]
    }
  } catch (error) {
    console.warn('Gagal fetch chart inventory:', error)
  }
}

onMounted(fetchChartData)
watch(
  () => [
    props.filterType,
    chartFilter.date,
    chartFilter.month?.value,
    chartFilter.year,
    chartFilter.week,
    chartFilter.range.start,
    chartFilter.range.end
  ],
    fetchChartData,
  { immediate: true }
)
</script>
<style scoped>
.chart-mask {
  width: 100%;
  /* max-width: 100%; */
  min-width: 600px;
  /* atau props.chartData.series.length * 40 */
  overflow-x: hidden;
}
</style>
