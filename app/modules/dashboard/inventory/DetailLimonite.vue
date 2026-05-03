<template>
  <div class="chart-mask" :class="{ scrollable: isScrollable }">
    <component
    :is="chartComponent"
    v-if="chartData"
    :series="chartData.series"
    :categories="chartData.categories"
    :colors="['#f97316', '#22c55e', '#6366f1']"
  />
  </div>
</template>


<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { URL_GET_DATA } from '@/utils/api'
import { defineAsyncComponent } from 'vue'

const props = defineProps<{
  filterType: string
  chartType?: 'bar' | 'area' | 'line'
}>()

const isScrollable = computed(() => {
  return !['weekly', 'yearly','all'].includes(props.filterType)
})

const chartFilter = useChartFilterStore()
const chartData = ref<{ categories: string[]; series: any[] } | null>(null)

const chartComponent = computed(() => {
  switch (props.filterType) {
    case 'monthly':
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseLineColumnArea.vue'))
    default:
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseLineColumnArea.vue'))
  }
})

const chartTypeConfig = computed(() => {
  return props.filterType === 'monthly'
    ? { stock: 'area', selling: 'area', balance: 'line' }
    : { stock: 'bar', selling: 'bar', balance: 'line' }
})

function buildFilterParams(): URLSearchParams {
  const params = new URLSearchParams()
  params.append('filter_type', props.filterType)

  switch (props.filterType) {
    case 'daily':
      if (chartFilter.date) params.append('filter_date', chartFilter.date)
      break
    case 'weekly':
      if (chartFilter.year) params.append('year', chartFilter.year.toString())
      if (chartFilter.month) params.append('month', chartFilter.month.value.toString())
      if (chartFilter.week) {
        const week = `${chartFilter.year}-${String(chartFilter.week).padStart(2, '0')}`
        params.append('week', week)
      }
      break
    case 'monthly':
      if (chartFilter.year) params.append('year', chartFilter.year.toString())
      if (chartFilter.month) params.append('month', chartFilter.month.value.toString())
      break
    case 'range':
      if (chartFilter.range.start) params.append('date_start', chartFilter.range.start)
      if (chartFilter.range.end) params.append('date_end', chartFilter.range.end)
      break
    case 'yearly':
      if (chartFilter.year) params.append('year', chartFilter.year.toString())
      break
  }

  return params
}

async function fetchChartData() {
  try {
    const params = buildFilterParams()
    const url = `${URL_GET_DATA}dashboard/api/inventory/chart/details/?${params.toString()}`
    const response = await fetch(url)
    const data = await response.json()

    chartData.value = {
      categories: data.x_data ?? [],
      series: [
        { name: 'Production In', type: chartTypeConfig.value.stock, data: data.y_lim_in ?? [] },
        { name: 'Selling', type: chartTypeConfig.value.selling, data: data.y_lim_out ?? [] },
        { name: 'Stock Opname', type: chartTypeConfig.value.balance, data: data.y_lim_balance ?? [] }
      ]
    }
  } catch (error) {
    console.warn('❌ Gagal fetch inventory chart:', error)
  }
}

onMounted(fetchChartData)

watch(
  () => [
    props.filterType,
    chartFilter.date,
    chartFilter.week,
    chartFilter.month?.value,
    chartFilter.year,
    chartFilter.range.start,
    chartFilter.range.end
  ],
  fetchChartData
)
</script>
<style scoped>
.chart-mask {
  width: 100%;
  /* max-width: 100%; */
  min-width: 600px; /* atau props.chartData.series.length * 40 */
  overflow-x: auto;
}

</style>
