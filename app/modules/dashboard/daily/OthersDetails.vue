<template>
  <div class="chart-mask">
    <component :is="chartComponent" v-if="chartData" 
    :series="chartData.series" 
    :categories="chartData.categories"
    :colors="colors" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, defineAsyncComponent } from 'vue'
import { useDailyFilterStore } from '@/stores/filters/daily-filter'
import { useApi } from '@/composables/useApi'

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
const emit = defineEmits<{
  (e: 'update:grandTotalNonOre', value: {plan: number; total: number; achievement:number; avg: number }): void
}>()

const chartFilter = useDailyFilterStore()

const props = defineProps<{
  material: 'ore' | 'ob' | 'waste' | 'quarry' | 'top_soil' | 'others'
}>()


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
  data: (number | ChartPoint)[]
  type?: string,
  yAxisIndex?: number,
}

interface ChartData {
  categories?: string[]
  series: ChartSeries[]
}

const chartData = ref<ChartData | null>(null)
const grandTotalNonOre = ref({ plan: 0, total: 0, achievement: 0, avg: 0 })
// Komponen chart berdasarkan tipe


const chartComponent = defineAsyncComponent(
  () => import('@/components/ui/apex-chart/BaseColumnsMarkers.vue')
)

const colors = ['#34d399', '#f43f5e']

async function fetchChartData() {
  if (!chartFilter.date) return

  try {
    const params: Record<string, any> = {
      filter_date: chartFilter.date,
      ...(chartFilter.iup_id && {
        iup_id: Array.isArray(chartFilter.iup_id)
          ? chartFilter.iup_id.join(',')
          : chartFilter.iup_id
      })
    }

    const res = await getApi(
      '/api/analytics/raw/mining/daily/chart/details/',
      params
    )

    const materialData = res[props.material]
    if (!materialData) return

    grandTotalNonOre.value =
      materialData.grand_total ?? { actual: 0, plan: 0, total: 0, achievement: 0 }

    emit('update:grandTotalNonOre', grandTotalNonOre.value)

    chartData.value = {
      categories: materialData.x_data ?? [],
      series: [
        {
          name: 'Actual',
          type: 'bar',
          data: (materialData.x_data ?? []).map((label: string, index: number) => ({
            x: label,
            y: materialData.total_actual?.[index] ?? 0,
            goals: [
              {
                name: 'Plan',
                value: materialData.total_plan?.[index] ?? 0,
                strokeColor: '#f43f5e',
                strokeHeight: 4
              }
            ]
          }))
        }
      ]
    }
  } catch (error) {
    console.warn(' Gagal fetch chart Daily Mining:', error)
  }
}

onMounted(fetchChartData)
watch(
  () => chartFilter.date,
  fetchChartData
)
</script>
<style scoped>
.chart-mask {
  width: 100%;
  /* max-width: 100%; */
  min-width: 600px; /* atau props.chartData.series.length * 40 */
  overflow-x: auto;
}

</style>
