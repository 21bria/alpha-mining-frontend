<template>
  <BaseDonutChart
    v-if="chartDataOreDonut.series.length"
    :series="chartDataOreDonut.series"
    :labels="chartDataOreDonut.labels"
    :colors="ChartColors"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import BaseDonutChart from '@/components/ui/apex-chart/BaseDonutChart.vue'
import { useApi } from '@/composables/useApi'

const props = defineProps<{ filterType: string }>()
const emit = defineEmits(['update:percents'])

const chartFilter = useChartFilterStore()
const { request } = useApi()

const ChartColors = [
      "#00bd7d",
      "#f7339a",
      "#00bba7",
      "#fe9900",
      "#fb2c37",
      "#615fff",
]

type MaterialSummaryItem = {
  material: string
  ritase: number
  tonnage: number
  percentage: number
}

type MaterialSummaryResponse = {
  summary: MaterialSummaryItem[]
  grand_total_ritase: number
  grand_total_tonnage: number
}

const chartDataOreDonut = ref<{
  labels: string[]
  series: number[]
}>({
  labels: [],
  series: []
})

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
    const endpoint = '/api/analytics/raw/mining/summary/materials/'
    const query = buildQuery()

    const data = await getApi<MaterialSummaryResponse>(endpoint, query)
    const rows = Array.isArray(data?.summary) ? data.summary : []

    const labels = rows.map(item => item.material)
    const series = rows.map(item => Number(item.tonnage || 0))

    chartDataOreDonut.value = {
      labels,
      series
    }

    const percents = rows.map(item => ({
      label: item.material,
      value: Number(item.tonnage || 0),
      percent: Math.round(Number(item.percentage || 0))
    }))

    emit('update:percents', percents)
  } catch (error) {
    console.warn('Gagal fetch material grouped chart:', error)

    chartDataOreDonut.value = {
      labels: [],
      series: []
    }

    emit('update:percents', [])
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