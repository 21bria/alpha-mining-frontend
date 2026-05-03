
<template>
  <div class="chart-mask">
    <ChartScrollWrapper v-if="isScrollable">
      <component :is="chartComponent" v-if="chartData" 
        :series="chartData.series" 
        :categories="chartData.categories"
        :colors="colors" />
    </ChartScrollWrapper>

    <!-- fallback kalau nggak scroll -->
    <component v-else :is="chartComponent" v-if="chartData" 
      :series="chartData.series" 
      :categories="chartData.categories"
      :colors="colors" />
  </div>
</template>
<script setup lang="ts">
import { ref, watch, computed, defineAsyncComponent } from 'vue'
import { useChartFilterStore } from '@/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'

const props = defineProps<{
  filterType: string
  chartType?: 'bar' | 'area' | 'line'
}>()

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

const isScrollable = computed(() => {
  return !['weekly', 'yearly', 'all'].includes(props.filterType)
})

const chartComponent = computed(() => {
  switch (props.filterType) {
    case 'daily':
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseColumnsMarkers.vue'))
    case 'weekly':
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseLineColumnArea.vue'))
    case 'monthly':
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseAreaChart.vue'))
    case 'range':
    case 'yearly':
    case 'all':
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseLineColumnArea.vue'))
    default:
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseAreaChart.vue'))
  }
})

const colors = computed(() => {
  switch (props.filterType) {
    case 'daily':
      return ['#34d399', '#f43f5e']
    case 'weekly':
    case 'monthly':
    case 'yearly':
    default:
      return ['#f5b849', '#34d399']
  }
})

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

const defaultChartType = computed(() => {
  switch (props.filterType) {
    case 'monthly':
      return 'area'
    case 'range':
    case 'yearly':
    case 'all':
      return 'bar'
    default:
      return 'bar'
  }
})

async function fetchChartData() {
  try {
    const filterType = props.filterType

    let endpoint = '/api/analytics/raw/geology/ore-chart/'
    const query: Record<string, any> = {
      filter_type: filterType
    }

    if (chartFilter.iup_id) {
      query.iup_id = chartFilter.iup_id
    }

    switch (filterType) {
      case 'daily':
        endpoint = '/api/analytics/raw/mining/chart/daily/'
        if (chartFilter.date) {
          query.filter_date = chartFilter.date
        }
        break

      case 'weekly':
        if (chartFilter.year) {
          query.year = chartFilter.year
        }
        if (chartFilter.month?.value) {
          query.month = chartFilter.month.value
        }
        if (chartFilter.year && chartFilter.week) {
          // query.week = `${chartFilter.year}-${String(chartFilter.week).padStart(2, '0')}`
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

      case 'all':
        break

      default:
        console.warn('Filter type tidak dikenal:', filterType)
        return
    }

    const data = await getApi<any>(endpoint, query)

    chartData.value = {
      categories: data?.x_data ?? [],
      series: [
        {
          name: 'Limonite',
          type: props.chartType ?? defaultChartType.value,
          data: data?.y_data_lim ?? []
        },
        {
          name: 'Saprolite',
          type: props.chartType ?? defaultChartType.value,
          data: data?.y_data_sap ?? []
        }
      ]
    }
  } catch (error) {
    console.warn('Gagal fetch data chart:', error)
  }
}

watch(
  () => [
    props.filterType,
    chartFilter.iup_id,
    chartFilter.date,
    chartFilter.week,
    chartFilter.month?.value,
    chartFilter.year,
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
  min-width: 600px; /* atau props.chartData.series.length * 40 */
  overflow-x: hidden;
}

</style>
