<!-- <template>
  <component :is="chartComponent" v-if="chartData" :series="chartData.series" :categories="chartData.categories"
    :colors="colors" />
</template> -->
<template>
  <div class="chart-mask" :class="{ scrollable: isScrollable }">
    <component :is="chartComponent" v-if="chartData" :series="chartData.series" :categories="chartData.categories"
      :colors="colors" />
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useChartFilterStore } from '@/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'

const chartComponent = computed(() =>
  props.filterType === 'monthly'
    ? defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseColumnsStackMarkers.vue'))
    : defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseColumnsStackMarkers.vue'))
)


const colors = computed(() => [
  '#e6f598',
  '#fee08b',
  '#abdda4',
  '#fdae61',
  '#6caa9f',
  '#f46d44',
  '#5e4fa2',
  '#a0aa5d',  // Cyan

])

// Props dari parent (opsional, jika kamu tidak pakai Pinia langsung)
const props = defineProps<{
  filterType: string
  chartType?: 'bar'
}>()

const isScrollable = computed(() => {
  return !['weekly', 'yearly', 'all'].includes(props.filterType)
})

interface ChartPoint {
  x: string | number
  y: number
  goals?: {
    name: string
    value: number
    strokeColor?: string
    strokeHeight?: number
    strokeDashArray?: number
  }[]
}

interface ChartSeries {
  name: string
  data: ChartPoint[]
  type: string
}

interface ChartData {
  categories: string[]
  series: ChartSeries[]
}
interface BargeDetail {
  barge_code: string
  total: number
  lim: number
  sap: number
}
interface Detail {
  label: string
  total_plan: number
  total_actual: number
  lim_actual: number
  sap_actual: number
  barges: BargeDetail[]
}

const chartFilter = useChartFilterStore()
const chartData = ref<ChartData | null>(null)
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

async function fetchChartData() {
  try {
    const filterType = props.filterType

    let endpoint = '/api/analytics/raw/barging/chart/'
    const query: Record<string, any> = {
      filter_type: filterType
    }

    if (chartFilter.iup_id) {
      query.iup_id = chartFilter.iup_id
    }

    switch (props.filterType) {
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

    // Bentuk respons dari endpoint bisa beda
    const details: Detail[] = data.details || []

    const bargeCodes: string[] = [
      ...new Set(details.flatMap(d => d.barges.map(b => b.barge_code)))
    ]

    let series: ChartSeries[] = []

    if (bargeCodes.length > 0) {
      series = bargeCodes.map(barge => ({
        name: barge,
        type: 'bar',
        data: details.map(d => {
          const found = d.barges.find(b => b.barge_code === barge)
          return {
            x: d.label,
            y: found ? found.total : 0,
            detail: d
          }
        })
      }))
    } else {
      series = [
        {
          name: 'Total Actual',
          type: 'bar',
          data: details.map(d => ({
            x: d.label,
            y: d.total_actual ?? 0,
            detail: d
          }))
        }
      ]
    }

    chartData.value = {
      categories: details.map(d => String(d.label)),
      series
    }


  } catch (error) {
    console.warn('Gagal fetch data chart:', error)
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
  overflow-x: auto;
}
</style>
