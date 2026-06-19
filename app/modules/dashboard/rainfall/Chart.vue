<template>
  <div class="chart-mask">
    <ChartScrollWrapper v-if="isScrollable">
      <component
        :is="chartComponent"
        v-if="chartData"
        :series="chartData.series"
        :categories="chartData.categories"
        :colors="colors"
      />
    </ChartScrollWrapper>

    <component
      v-else-if="chartData"
      :is="chartComponent"
      :series="chartData.series"
      :categories="chartData.categories"
      :colors="colors"
    />
  </div>
</template>

<script setup lang="ts">

import { ref, watch, onMounted, computed, defineAsyncComponent } from 'vue'
import { useChartFilterStore } from '@/stores/filters/chart-filter'
import ChartScrollWrapper from '@/components/ui/apex-chart/ChartScrollWrapper.vue'
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
  chartType?: 'bar' | 'area' | 'line'
}>()

const emit = defineEmits<{
  (e: 'update:grandTotal', value: number): void
}>()

const chartFilter = useChartFilterStore()
const chartData = ref<ChartData | null>(null)
const details = ref<DetailItem[]>([])

const chartComponent = computed(() => {
  switch (props.filterType) {
    case 'daily':
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseColumnsMarkers.vue'))
    case 'weekly':
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseLineColumnArea.vue'))
    case 'monthly':
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseLineColumnArea.vue'))
    case 'range':
    case 'yearly':
    case 'all':
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseLineColumnArea.vue'))
    default:
      return defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseAreaChart.vue'))
  }
})

const colors = computed(() => {
  switch (props.filterType) {
    case 'daily':
      return ['#60a5fa', '#a78bfa']
    case 'weekly':
      return ['#60a5fa', '#f43f5e', '#a78bfa']
    case 'monthly':
      return ['#60a5fa','#a78bfa','#f43f5e']
    case 'yearly':
      return ['#60a5fa', '#a78bfa']
    default:
      return ['#60a5fa', '#a78bfa']
  }
})

const isScrollable = computed(() => {
  return !['weekly', 'yearly', 'all'].includes(props.filterType)
})

interface PointDetail {
  point_name: string
  milimeter: number
}

interface DetailItem {
  label: string
  total_milimeter: number
  points: PointDetail[]
}

interface ChartSeries {
  name: string
  data: number[]
  type: string
}

interface ChartData {
  categories: string[]
  series: ChartSeries[]
}

const defaultChartType = computed(() => {
  switch (props.filterType) {
    case 'monthly':
      return 'area'
    case 'range':
    case 'yearly':
    case 'all':
      return 'bar'
    default:
      return 'bar'
  }
})

function buildSeriesFromDetails(detailRows: DetailItem[]): ChartSeries[] {
  const pointNames = [
    ...new Set(
      detailRows.flatMap((d) => (d.points ?? []).map((p) => p.point_name))
    )
  ]

  return pointNames.map((pointName) => ({
    name: pointName,
    type: props.chartType ?? defaultChartType.value,
    data: detailRows.map((d) => {
      const found = (d.points ?? []).find((p) => p.point_name === pointName)
      return Number(found?.milimeter ?? 0)
    })
  }))
}

async function fetchChartData() {
  try {
    const filterType = props.filterType

    const endpoint = '/api/analytics/raw/weather/chart-rainfall/'
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

    details.value = (data.details ?? []) as DetailItem[]

    const series = buildSeriesFromDetails(details.value)

    chartData.value = {
      categories: data.x_data ?? [],
      series
    }

    emit('update:grandTotal', data.grand_total ?? 0)
  } catch (error) {
    console.warn('Gagal fetch data chart:', error)
  }
}

onMounted(fetchChartData)

watch(
  () => [
    props.filterType,
    chartFilter.date,
    chartFilter.week,
    chartFilter.month?.value,
    chartFilter.year,
    chartFilter.range.start,
    chartFilter.range.end,
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
  overflow: hidden;
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
