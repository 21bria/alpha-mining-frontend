<template>
  <BaseDonutChart v-if="chartDataOreDonut?.series?.length" :series="chartDataOreDonut.series"
    :labels="chartDataOreDonut.labels" />
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import BaseDonutChart from '@/components/ui/apex-chart/BaseDonutChart.vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'

const emit = defineEmits(['update:percents'])
const chartFilter = useChartFilterStore()

const props = defineProps<{
  filterType: string
}>()

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

const chartDataOreDonut = ref<{ labels: string[]; series: number[] } | null>(null)

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
      '/api/analytics/raw/geology/ore-class/sap/',
      query
    )

    chartDataOreDonut.value = {
      labels: data?.labels ?? [],
      series: data?.y_data ?? []
    }

    const series = data?.y_data ?? []
    const labels = data?.labels ?? []
    const total = series.reduce((a: number, b: number) => a + b, 0)

    const percents = labels.map((label: string, i: number) => {
      const value = series[i] ?? 0
      const percent = total > 0 ? (value / total) * 100 : 0

      return {
        label,
        value,
        percent: Math.round(percent)
      }
    })

    emit('update:percents', percents)
  } catch (error) {
    console.warn('Gagal fetch chart:', error)

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
  }
)
</script>