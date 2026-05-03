<template>
  <div class="chart-mask">
    <component :is="chartComponent" v-if="chartData" :series="chartData.series" :categories="chartData.categories"
      :colors="colors" :details="detailsData" />
  </div>

</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useChartFilterStore } from '@/stores/filters/chart-filter'
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
    query: cleanQuery(extraQuery ?? {})
  })
}

const props = defineProps<{
  filterType: string
  chartType?: 'bar' | 'area' | 'line'
}>()

const chartFilter = useChartFilterStore()
const chartData = ref<{ categories: string[]; series: any[] } | null>(null)
const detailsData = ref<any[]>([])

const chartComponent = computed(() =>
  defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseColumnCoa.vue'))
)

const defaultChartType = computed(() => 'bar')

const colors = computed(() => ['#3b82f6', '#f5b849', '#f43f5e'])

function buildFilterQuery(filterType: string, chartFilter: any): Record<string, any> {
  const query: Record<string, any> = {
    filter_type: filterType,
    materialFilter: 'HPAL'
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
      '/api/analytics/raw/barging/coa/ni/',
      query
    )

    const compare = data?.compare ?? {}

    chartData.value = {
      categories: compare?.x_data ?? [],
      series: [
        {
          name: 'Ni Internal',
          type: 'column',
          data: compare?.y_split ?? []
        },
        {
          name: 'Ni Official',
          type: 'column',
          data: compare?.y_official ?? []
        }
        // {
        //   name: 'Diff',
        //   type: 'line',
        //   data: compare?.ni_diff ?? []
        // }
      ]
    }

    detailsData.value = data?.details ?? []
  } catch (error) {
    console.warn('Gagal fetch chart data compare NI:', error)

    chartData.value = {
      categories: [],
      series: []
    }

    detailsData.value = []
  }
}

onMounted(() => {
  fetchChartData()
})

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

<style scoped>
.chart-mask {
  width: 100%;
  /* max-width: 100%; */
  min-width: 600px; /* atau props.chartData.series.length * 40 */
  overflow-x: auto;
}

</style>
