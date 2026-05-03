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
import { ref, watch, onMounted, computed, defineAsyncComponent } from 'vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'
const emit = defineEmits<{ (e: 'update:limGrade', value: any): void }>()

const { request } = useApi()

function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

async function getApi<T = any>(url: string, extraQuery?: Record<string, any>) {
  return await request<T>(url, {
    method: 'GET',
    query: cleanQuery(extraQuery ?? {})
  })
}

const props = defineProps<{
  filterType: string
  chartType?: 'bar' | 'area' | 'line'
}>()

const isScrollable = computed(() => {
  return !['weekly', 'yearly', 'all'].includes(props.filterType)
})

const chartFilter = useChartFilterStore()
const chartData = ref<{ categories: string[]; series: any[] } | null>(null)
const limGrade = ref(null)

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
      return ['#f5b849', '#34d399']
    case 'monthly':
      return ['#f5b849', '#34d399']
    case 'yearly':
      return ['#f5b849', '#34d399']
    default:
      return ['#f5b849', '#34d399']
  }
})

const defaultChartType = computed(() => {
  switch (props.filterType) {
    case 'daily':
    case 'weekly':
      return 'bar'
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

function createSeries(name: string, data: number[] | undefined) {
  return {
    name,
    type: (props.chartType ?? defaultChartType.value) as 'bar' | 'area' | 'line',
    data: data ?? []
  }
}

function buildFilterQuery(filterType: string, chartFilter: any): Record<string, any> {
  const query: Record<string, any> = {
    filter_type: filterType
  }

  if (chartFilter.iup_id) {
    query.iup_id = chartFilter.iup_id
  }

  switch (filterType) {
    case 'daily':
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
      if (chartFilter.week) {
        query.week = `${chartFilter.year}-${String(chartFilter.week).padStart(2, '0')}`
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
      if (chartFilter.range?.start) {
        query.date_start = chartFilter.range.start
      }
      if (chartFilter.range?.end) {
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
  }

  return cleanQuery(query)
}

async function fetchChartData() {
  try {
    const query = buildFilterQuery(props.filterType, chartFilter)

    const data = await getApi<any>(
      '/api/analytics/raw/geology/ore-chart/detail/',
      query
    )

    chartData.value = {
      categories: data?.x_data ?? [],
      series: [
        createSeries('Limonite', data?.y_lim ?? [])
      ]
    }
  } catch (error) {
    console.warn('Gagal fetch chart:', error)
  }
}

async function fetchGradeOre() {
  try {
    const query = buildFilterQuery(props.filterType, chartFilter)

    const data = await getApi<any>(
      '/api/analytics/raw/inventory/grade-roa/',
      query
    )

    const limData = data?.data?.find((item: any) => item.nama_material === 'LIM')
    limGrade.value = limData ?? null
    emit('update:limGrade', limData ?? null)
  } catch (error) {
    console.warn('Gagal fetch ore grade:', error)
  }
}

onMounted(() => {
  fetchChartData()
  fetchGradeOre()
})

watch(
  () => [
    props.filterType,
    chartFilter.iup_id,
    chartFilter.date,
    chartFilter.week,
    chartFilter.month?.value,
    chartFilter.year,
    chartFilter.range?.start,
    chartFilter.range?.end
  ],
  () => {
    fetchChartData()
    fetchGradeOre()
  }
)
</script>

<style scoped>
.chart-mask {
  width: 100%;
  min-width: 600px; /* atau props.chartData.series.length * 40 */
  overflow-x: auto;
}
</style>