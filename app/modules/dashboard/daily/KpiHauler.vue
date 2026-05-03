<!-- <template>
  <BarChart v-if="chartData" :series="chartData.series" :categories="chartData.categories" :colors="colors" />
</template> -->
<template>
  <div class="chart-mask">
    <component :is="BarChart" v-if="chartData" 
    :series="chartData.series" 
    :categories="chartData.categories"
    :colors="colors" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useDailyFilterStore } from '@/stores/filters/daily-filter'
import { useApi } from '@/composables/useApi'
import BarChart from '@/components/ui/apex-chart/BaseBarChart.vue'

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
// Types
interface ChartPoint {
  x: string
  y: number
  goals?: {
    name: string
    value: number
    strokeColor: string
    strokeHeight: number
  }[]
}

interface ChartSeries {
  name: string
  type: 'bar'
  data: ChartPoint[]
}

interface ChartData {
  categories: string[]
  series: ChartSeries[]
}

const chartData = ref<ChartData | null>(null)
const colors = ['#f1b100', '#f43f5e']

// Fetch chart DAILY Kpi
async function fetchChartData() {
  if (!chartFilter.date) return

  try {
    const json = await getApi('/api/analytics/raw/mining/daily/chart/kpi/hauler/', {
      filter_date: chartFilter.date,

      //IUP
      ...(chartFilter.iup_id && { iup_id: chartFilter.iup_id })
    })

    const rows = json.data ?? []

    chartData.value = {
      categories: rows.map((r: any) => r.unit),
      series: [
        {
          name: 'MA (%)',
          type: 'bar',
          data: rows.map((r: any) => r.ma)
        },
        {
          name: 'UA (%)',
          type: 'bar',
          data: rows.map((r: any) => r.ua)
        }
      ]
    }
  } catch (err) {
    console.warn('Gagal fetch chart KPI:', err)
    chartData.value = null
  }
}

// ⏱ Lifecycle
onMounted(fetchChartData)
watch(() => chartFilter.date, (val) => {
  console.log('WATCH DATE CHANGED:', val)
  fetchChartData()
})

</script>

<style scoped>
.chart-mask {
  width: 100%;
  /* max-width: 100%; */
  min-width: 600px; /* atau props.chartData.series.length * 40 */
  overflow-x: auto;
}

</style>
