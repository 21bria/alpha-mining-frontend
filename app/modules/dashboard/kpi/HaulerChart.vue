<template>
  <div class="chart-mask">
    <BarChart
      v-if="chartData"
      :series="chartData.series"
      :categories="chartData.categories"
      :colors="colors"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'
import BarChart from '@/components/ui/apex-chart/BaseBarChart.vue'

const props = defineProps<{ filterType: string }>()

const chartFilter = useChartFilterStore()
const { request } = useApi()

const colors = ['#f1b100', '#f43f5e']

interface ChartSeries {
  name: string
  type: 'bar'
  data: number[]
}

interface ChartData {
  categories: string[]
  series: ChartSeries[]
}

const chartData = ref<ChartData | null>(null)

function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

async function getApi<T = any>(url: string, extraQuery?: Record<string, any>) {
  return await request<T>(url, {
    method: 'GET',
    query: cleanQuery(extraQuery || {})
  })
}

function buildQuery() {
  const filterType = props.filterType

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
      if (chartFilter.week) {
        query.week = chartFilter.week
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

    case 'yearly':
      if (chartFilter.year) {
        query.year = chartFilter.year
      }
      break

    case 'range':
      if (chartFilter.range?.start && chartFilter.range?.end) {
        query.date_start = chartFilter.range.start
        query.date_end = chartFilter.range.end
      }
      break

    case 'all':
      break

    default:
      break
  }

  return query
}

async function fetchChartData() {
  try {
    const json = await getApi<any>(
      '/api/analytics/raw/mining/kpi/hauler/',
      buildQuery()
    )

    const rows = Array.isArray(json?.data) ? json.data : []

    chartData.value = {
      categories: rows.map((r: any) => r.unit),
      series: [
        {
          name: 'MA (%)',
          type: 'bar',
          data: rows.map((r: any) => Number(r.ma || 0))
        },
        {
          name: 'UA (%)',
          type: 'bar',
          data: rows.map((r: any) => Number(r.ua || 0))
        }
      ]
    }
  } catch (err) {
    console.warn('Gagal fetch chart KPI Hauler:', err)
    chartData.value = null
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
    chartFilter.range?.start,
    chartFilter.range?.end,
    chartFilter.iup_id
  ],
  fetchChartData,
  { immediate: true }
)
</script>

<style scoped>
.chart-mask {
  width: 100%;
  min-width: 600px;
  overflow-x: auto;
}
</style>