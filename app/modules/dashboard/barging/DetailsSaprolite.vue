<template>
  <div class="chart-mask" :class="{ scrollable: isScrollable }">
    <component 
      :is="chartComponent" 
      v-if="chartData" 
      :series="chartData.series" 
      :categories="chartData.categories"
      ore-type="SAP" 
      :colors="colors" 
      />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useChartFilterStore } from '@/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'

// Emits ke parent untuk update sapGrade
const emit = defineEmits<{ (e: 'update:sapGrade', value: any): void }>()
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

// Props dari parent
const props = defineProps<{
  filterType: string
  chartType?: 'bar' | 'area' | 'line'
}>()

const isScrollable = computed(() => {
  return !['weekly', 'yearly', 'all'].includes(props.filterType)
})

const chartFilter = useChartFilterStore()
const chartData = ref<{ categories: string[]; series: any[] } | null>(null)
const sapGrade = ref(null)

interface ChartPoint {
  x: string | number
  y: number
  goals?: {
    name: string
    value: number
    strokeColor?: string
    strokeHeight?: number
    strokeDashArray?: number
  }[]
  detail?: Detail
}

interface ChartSeries {
  name: string
  data: ChartPoint[]
  type: string
}

interface BargeDetail {
  barge_code: string
  total: number
  lim: number
  sap: number
}

interface Detail {
  label: string
  sap_plan: number
  barges: BargeDetail[]
}

const chartComponent = computed(() =>
  defineAsyncComponent(() => import('@/components/ui/apex-chart/BaseColumnsStackMarkersDetails.vue'))
)

const defaultChartType = computed(() => 'bar')

const colors = computed(() => [
  '#6caa9f',
  '#abdda4',
  '#e6f598',
  '#66c2a5',
  '#cbd39f',
  '#b7c7b8',
  '#acd2bb'
])

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
      '/api/analytics/raw/barging/chart/',
      query
    )

    const details: Detail[] = data?.details ?? []

    const bargeCodes: string[] = [
      ...new Set(details.flatMap((d) => d.barges?.map((b) => b.barge_code) ?? []))
    ]

    const bargeSeries: ChartSeries[] = bargeCodes.map((barge) => ({
      name: barge,
      type: 'bar',
      data: details.map((d) => {
        const found = d.barges?.find((b) => b.barge_code === barge)
        return {
          x: d.label,
          y: found?.sap ?? 0,
          detail: d
        }
      })
    }))

    const planSeries: ChartSeries = {
      name: 'Plan (SAP)',
      type: 'line',
      data: details.map((d) => ({
        x: d.label,
        y: d.sap_plan ?? 0
      }))
    }

    chartData.value = {
      categories: details.map((d) => String(d.label)),
      series: [...bargeSeries, planSeries]
    }
  } catch (error) {
    console.warn('Gagal fetch chart data saprolite:', error)
    chartData.value = {
      categories: [],
      series: []
    }
  }
}

async function fetchGradeOre() {
  try {
    const query = buildFilterQuery(props.filterType, chartFilter)

    const data = await getApi<any>(
      '/api/analytics/raw/inventory/grade-roa/',
      query
    )

    const sapData = data?.data?.find((item: any) => item.nama_material === 'SAP')
    sapGrade.value = sapData ?? null
    emit('update:sapGrade', sapData ?? null)
  } catch (error) {
    console.warn('Gagal fetch ore grade:', error)
    sapGrade.value = null
    emit('update:sapGrade', null)
  }
}

onMounted(() => {
  fetchChartData()
  fetchGradeOre()
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
    fetchGradeOre()
  }
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