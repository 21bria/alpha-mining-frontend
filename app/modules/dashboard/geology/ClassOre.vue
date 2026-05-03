<template>
  <BaseDonutChart 
    v-if="chartDataOreDonut?.series?.length" 
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

const chartDataOreDonut = ref<{ labels: string[]; series: number[] } | null>(null)

async function fetchChartData() {
  try {
    const filterType = props.filterType

    let endpoint = '/api/analytics/raw/geology/ore-class/'
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

      case 'all':
        break

      default:
        console.warn('Filter type tidak dikenal:', filterType)
        return
    }

    const data = await getApi<any>(endpoint, query)

    chartDataOreDonut.value = {
      labels: data.labels,
      series: data.y_data
    }

    const total = data.y_data.reduce((a: number, b: number) => a + b, 0)
    const percents = data.labels.map((label: string, i: number) => {
      const percent = total > 0 ? ((data.y_data[i] / total) * 100) : 0
      return {
        label,
        value: data.y_data[i],
        percent: Math.round(percent)
      }
    })

    emit('update:percents', percents)
  } catch (error) {
    console.warn('Gagal fetch ore class chart:', error)
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
