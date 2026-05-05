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
import { ref, onMounted, watch, computed } from 'vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import ChartScrollWrapper from '@/components/ui/apex-chart/ChartScrollWrapper.vue'
import { defineAsyncComponent } from 'vue'
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

const props = defineProps<{
  filterType: string
}>()

const isScrollable = computed(() => {
  return !['weekly', 'yearly','all'].includes(props.filterType)
})

const emit = defineEmits<{
  (e: 'update:grandTotalNonOre', value: { plan: number; total: number; achievement: number; avg: number }): void
}>()


const chartFilter = useChartFilterStore()

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
  yAxisIndex?: number
}

interface ChartData {
  categories?: string[]
  series: ChartSeries[]
}

const chartData = ref<ChartData | null>(null)
const grandTotalNonOre = ref({ plan: 0, total: 0, achievement: 0, avg: 0 })
// Komponen chart berdasarkan tipe
const chartComponent = computed(() => {
  return props.filterType === 'monthly'
    ? defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseLineArea.vue'))
    : defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseColumnsMarkers.vue'))
})

const colors = computed(() => ['#34d399', '#f43f5e'])

const defaultChartType = computed(() => {
  return props.filterType === 'monthly' ? 'area' : 'bar'
})

async function fetchChartData() {
  try {
     const filterType = props.filterType

    const endpoint = '/api/analytics/raw/mining/chart-waste/'

    const query: Record<string, any> = {
      filter_type: filterType
    }

    // IUP wajib
    if (chartFilter.iup_id) {
      query.iup_id = chartFilter.iup_id
    }

    //  filter logic (rapi & konsisten)
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
    }

    // pakai useApi
    const data = await getApi<any>(endpoint, query)

     // simpan grand total + kirim ke parent
    grandTotalNonOre.value = data.grand_total ?? { plan: 0, total: 0, achievement: 0, avg: 0 }
    emit('update:grandTotalNonOre', grandTotalNonOre.value)


    // Kondisi berbeda untuk format data chart
    if (props.filterType === 'monthly') {
      chartData.value = {
        categories: data.x_data ?? [],
        series: [
          {
            name: 'Actual',
            type: 'area',
            yAxisIndex: 0, // Axis kiri
            data: data.total_tonnage ?? []
          },
          {
            name: 'Plan',
            type: 'line',
            yAxisIndex: 1, // Axis kanan
            data: data.total_plan ?? []
          },
        ]
      }
    } else {
      chartData.value = {
        categories: data.x_data ?? [],
        series: [
          {
            name: 'Actual',
            type: defaultChartType.value,
            data: data.x_data.map((label: string, index: number) => ({
              x: label,
              y: data.total_actual?.[index] ?? 0,
              goals: [{
                name: 'Plan',
                value: data.total_plan?.[index] ?? 0,
                strokeColor: '#f43f5e',
                strokeHeight: 4
              }]
            }))
          }
        ]
      }
    }
  } catch (error) {
    console.warn('❌ Gagal fetch chart Ore Movement:', error)
  }
}

onMounted(fetchChartData)

watch(
  () => [
    props.filterType,
    chartFilter.date,
    chartFilter.month?.value,
    chartFilter.week,
    chartFilter.year,
    chartFilter.range.start,
    chartFilter.range.end
  ],
  fetchChartData
)
</script>
<style scoped>
.chart-mask {
  width: 100%;
  min-width: 600px;
  overflow-x: hidden;
}

/* hide scrollbar semua browser */
.chart-mask :deep(*) {
  scrollbar-width: none;          /* Firefox */
  -ms-overflow-style: none;       /* IE/Edge lama */
}

.chart-mask :deep(*::-webkit-scrollbar) {
  display: none;                  /* Chrome/Safari */
}
</style>