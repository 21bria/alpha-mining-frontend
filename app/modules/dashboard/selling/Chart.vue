
<template>
  <div class="chart-mask" :class="{ scrollable: isScrollable }">
    <component
      :is="chartComponent"
      v-if="chartData"
      :series="chartData.series"
      :categories="chartData.categories"
      :colors="colors"
      :details="detailsData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useChartFilterStore } from '@/stores/filters/chart-filter'
import { defineAsyncComponent } from 'vue'
import { useApi } from '@/composables/useApi'
const props = defineProps<{
  filterType: string
  chartType?: 'bar' | 'area' | 'line'
}>()

const chartFilter = useChartFilterStore()
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
const isScrollable = computed(() => {
  return !['weekly', 'yearly','all'].includes(props.filterType)
})

interface ChartSeries {
  name: string
  data: number[]
  type: string
}

interface ChartData {
  categories: string[]
  series: ChartSeries[]
}

const chartData = ref<ChartData | null>(null)

interface DetailItem {
  label: string
  total_actual: number
  lim_actual: number
  sap_actual: number
  barges: string[]
}

const detailsData = ref<DetailItem[]>([])
// Komponen chart berdasarkan tipe
const chartComponent = computed(() =>
  props.filterType === 'monthly'
    ? defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseStackedColumns.vue'))
    : defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseStackedColumns.vue'))
)

const colors = computed(() => ['#f5b849', '#34d399','#f43f5e'])
// const colors = computed(() => ['#fee08b', '#abdda4','#d53e4e'])

const defaultChartType = computed(() =>
  // props.filterType === 'monthly' ? 'area' : 'bar'
  props.filterType === 'monthly' ? 'bar' : 'bar'
)

async function fetchChartData() {
  try {
    const filterType = props.filterType

    let endpoint = '/api/analytics/raw/barging/chart-selling/'
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


    // chartData.value = {
    //   categories: data.summary.x_data ?? [],
    //   series: [
    //     {
    //       name: 'Limonite',
    //       type: props.chartType ?? defaultChartType.value,
    //       data: data.summary.y_data_lim ?? []
    //     },
    //     {
    //       name: 'Saprolite',
    //       type: props.chartType ?? defaultChartType.value,
    //       data: data.summary.y_data_sap ?? []
    //     }
    //   ]
    // }
    chartData.value = {
      categories: data.summary.x_data ?? [],
      series: [
        {
          name: 'Limonite',
          type: 'bar',
          data: data.summary.y_data_lim ?? []
        },
        {
          name: 'Saprolite',
          type: 'bar',
          data: data.summary.y_data_sap ?? []
        },
        // {
        //   name: 'LIM Plan',
        //   type: 'line',
        //   data: data.summary.y_plan_lim ?? []
        // },
        // {
        //   name: 'SAP Plan',
        //   type: 'line',
        //   data: data.summary.y_plan_sap ?? []
        // },
        // {
        //   name: 'Total Plan',
        //   type: 'line',
        //   data: data.summary.y_plan_total ?? []
        // }
      ]
    }



    // Simpan details untuk tabel atau tooltip
    detailsData.value = data.details ?? []
  } catch (error) {
    console.warn('Gagal fetch chart selling:', error)
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
<style scoped>
.chart-mask {
  width: 100%;
  /* max-width: 100%; */
  min-width: 600px; /* atau props.chartData.series.length * 40 */
  overflow-x: auto;
}

</style>
