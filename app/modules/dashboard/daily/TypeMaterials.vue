<template>
  <BaseDonutChart
    v-if="chartData?.series?.length > 0"
    :series="chartData.series"
    :labels="chartData.labels"
  />
  <div v-else class="flex flex-col items-center gap-2 text-gray-500">
    <span class="text-sm">No data available</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import BaseDonutChart from '@/components/ui/apex-chart/BaseDonutChart.vue'
import { useApi } from '@/composables/useApi'
import { useDailyFilterStore } from '@/stores/filters/daily-filter'

const emit = defineEmits<{
  (e: 'update:percents', payload: {
    label: string
    value: number
    percent: number
  }[]): void
}>()

const chartFilter = useDailyFilterStore()
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

const chartData = ref<{
  labels: string[]
  series: number[]
}>({
  labels: [],
  series: []
})


/* 
 FETCH DATA (DAILY ONLY)
*/
async function fetchChartData() {
  try {
    if (!chartFilter.date) return

    const data = await getApi('/api/analytics/raw/mining/daily/summary/materials/', {
      filter_date: chartFilter.date,

      // IUP
      ...(chartFilter.iup_id && { iup_id: chartFilter.iup_id })
    })

    chartData.value = {
      labels: data.labels ?? [],
      series: data.y_data ?? []
    }

    // hitung persen
    const total = chartData.value.series.reduce((a, b) => a + b, 0)

    const percents = chartData.value.labels.map((label, i) => ({
      label,
      value: chartData.value.series[i] ?? 0,
      percent: total
        ? Math.round((chartData.value.series[i] / total) * 100)
        : 0
    }))

    emit('update:percents', percents)
  } catch (err) {
    console.warn('Gagal fetch ore donut daily:', err)
  }
}

onMounted(fetchChartData)

watch(
  () => chartFilter.date,
  (val) => {
    if (val) fetchChartData()
  }
)
</script>
