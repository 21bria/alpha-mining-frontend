<template>
  <div class="chart-mask">
    <BarChart v-if="chartData" :series="chartData.series" :categories="chartData.categories" :colors="colors"
      :details="chartData.details" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'
import BarChart from '@/components/ui/apex-chart/productivity/BaseBarChart.vue'

const props = defineProps<{
  filterType: string
}>()

const emit = defineEmits<{
  summary: [value: {
    total_ore: number
    total_hours: number
    fleet: number
    productivity: number
  }]
}>()

const chartFilter = useChartFilterStore()
const { request } = useApi()

const colors = ['#f1b100']

interface ChartSeries {
  name: string
  type: 'bar'
  data: number[]
}

interface ChartData {
  categories: string[]
  series: ChartSeries[]
  details: any[]
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
      if (chartFilter.date) query.filter_date = chartFilter.date
      break

    case 'weekly':
      if (chartFilter.week) query.week = chartFilter.week
      break

    case 'monthly':
      if (chartFilter.year) query.year = chartFilter.year
      if (chartFilter.month?.value) query.month = chartFilter.month.value
      break

    case 'yearly':
      if (chartFilter.year) query.year = chartFilter.year
      break

    case 'range':
      if (chartFilter.range?.start && chartFilter.range?.end) {
        query.date_start = chartFilter.range.start
        query.date_end = chartFilter.range.end
      }
      break

    case 'all':
      break
  }

  return query
}

function emitEmptySummary() {
  emit('summary', {
    total_ore: 0,
    total_hours: 0,
    fleet: 0,
    productivity: 0
  })
}

async function fetchChartData() {
  try {
    const json = await getApi<any>(
      'api/analytics/raw/mining/summary-productivity/ore/',
      buildQuery()
    )

    const summary = json?.summary ?? {}
    const xData = Array.isArray(json?.x_data) ? json.x_data : []
    const productivity = Array.isArray(json?.productivity) ? json.productivity : []

    emit('summary', {
      total_ore: Number(summary.total_ore || 0),
      total_hours: Number(summary.total_hours || 0),
      fleet: Number(summary.fleet || 0),
      productivity: Number(summary.productivity || 0)
    })

    chartData.value = {
      categories: xData.map((v: any) => String(v)),
      series: [
        {
          name: 'Productivity',
          type: 'bar',
          data: productivity.map((v: any) => Number(v || 0))
        }
      ],
      details: xData.map((label: any, i: number) => ({
        label: String(label),
        productivity: Number(productivity[i] || 0),
        fleet: Number(json?.fleet?.[i] || 0),
        total_ore: Number(json?.total_ore?.[i] || 0),
        working_hours: Number(json?.working_hours?.[i] || 0)
      }))
    }
  } catch (err) {
    console.warn('Gagal fetch chart Productivity:', err)
    chartData.value = null
    emitEmptySummary()
  }
}

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