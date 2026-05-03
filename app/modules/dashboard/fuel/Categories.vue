<template>
  <div class="grid grid-cols-10 gap-4 items-center min-w-[720px]">
    <!-- Donut -->
    <div class="col-span-5">
     <BaseDonutChart 
      v-if="chartData.series.length" 
      :series="chartData.series" 
      :labels="chartData.labels"
      :colors="fuelChartColors"
    />
      
      <div v-else class="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
        No fuel category data
      </div>
    </div>

    <!-- List kanan -->
    <div class="col-span-5">
      <div class="rounded-xl border overflow-hidden">
        <div class="flex items-center justify-between border-b px-3 py-2">
          <p class="text-sm font-semibold">Category</p>
          <p class="text-xs text-muted-foreground">
            {{ formatShortNumber(grandTotalVolume) }} L
          </p>
        </div>

        <div class="max-h-[260px] overflow-y-auto">
          <div v-for="item in categoryRows" :key="item.category"
            class="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">
                {{ item.category }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ item.percentage.toFixed(2) }}%
              </p>
            </div>

            <div class="text-right">
              <p class="text-sm font-semibold">
                {{ formatShortNumber(item.volume) }}
              </p>
              <p class="text-xs text-muted-foreground">Liter</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import BaseDonutChart from '@/components/ui/apex-chart/BaseDonutChart.vue'
import { useApi } from '@/composables/useApi'
import { formatShortNumber } from '@/utils/formatter'

const props = defineProps<{ filterType: string }>()
const emit = defineEmits(['update:percents'])

const chartFilter = useChartFilterStore()
const { request } = useApi()

const fuelChartColors = [
  '#C3E7EF',
  '#A7DFEA',
  '#89D6E8',
  '#0E677C',
  '#45C2DB',
  '#0090BF',
  '#0172B0',
  '#023C85',
  '#2c4663',
]

type FuelCategoryItem = {
  category: string
  tonnage: number
  volume: number
  percentage: number
}

type FuelCategoryResponse = {
  summary: FuelCategoryItem[]
  labels: string[]
  y_data: number[]
  grand_total_volume: number
}

const chartData = ref<{
  labels: string[]
  series: number[]
}>({
  labels: [],
  series: []
})

const categoryRows = ref<FuelCategoryItem[]>([])
const grandTotalVolume = ref(0)

function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

async function getApi<T = any>(url: string, extraQuery?: Record<string, any>) {
  return await request<T>(url, {
    method: 'GET',
    query: cleanQuery(extraQuery || {})
  })
}

function buildQuery() {
  const filterType = props.filterType

  const query: Record<string, any> = {
    filter_type: filterType
  }

  if (chartFilter.iup_id) query.iup_id = chartFilter.iup_id

  switch (filterType) {
    case 'daily':
      if (chartFilter.date) query.filter_date = chartFilter.date
      break

    case 'weekly':
      if (chartFilter.week) query.week = chartFilter.week
      break

    case 'monthly':
      if (chartFilter.year) query.year = chartFilter.year
      if (chartFilter.month?.value) query.month = chartFilter.month.value
      break

    case 'yearly':
      if (chartFilter.year) query.year = chartFilter.year
      break

    case 'range':
      if (chartFilter.range?.start && chartFilter.range?.end) {
        query.date_start = chartFilter.range.start
        query.date_end = chartFilter.range.end
      }
      break

    case 'all':
      break
  }

  return query
}

async function fetchChartData() {
  try {
    const endpoint = '/api/analytics/raw/fuel/chart/category/'
    const data = await getApi<FuelCategoryResponse>(endpoint, buildQuery())

    const rows = Array.isArray(data?.summary) ? data.summary : []

    categoryRows.value = rows
    grandTotalVolume.value = Number(data?.grand_total_volume || 0)

    chartData.value = {
      labels: rows.map(item => item.category),
      series: rows.map(item => Number(item.volume ?? item.tonnage ?? 0))
    }

    emit(
      'update:percents',
      rows.map(item => ({
        label: item.category,
        value: Number(item.volume ?? item.tonnage ?? 0),
        percent: Math.round(Number(item.percentage || 0))
      }))
    )
  } catch (error) {
    console.warn('Gagal fetch fuel category chart:', error)

    chartData.value = { labels: [], series: [] }
    categoryRows.value = []
    grandTotalVolume.value = 0
    emit('update:percents', [])
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
    chartFilter.range?.start,
    chartFilter.range?.end,
    chartFilter.iup_id
  ],
  fetchChartData,
  { immediate: true }
)
</script>