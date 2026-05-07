<template>
  <!-- <div class="chart-mask">
    <component :is="chartComponent" v-if="chartData" :series="chartData.series" :categories="chartData.categories"
      :colors="colors" :details="detailsData" />
  </div> -->
 <div class="chart-mask">
    <ChartScrollWrapper v-if="isScrollable">
      <component :is="chartComponent" 
        v-if="chartData" 
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
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'
import ChartScrollWrapper from '@/components/ui/apex-chart/ChartScrollWrapper.vue'
const { request } = useApi()

const isScrollable = computed(() => {
  return !['weekly', 'yearly', 'all'].includes(props.filterType)
})

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

const colors = computed(() => ['#3b82f6', '#f5b849', '#f43f5e'])

function buildFilterQuery(filterType: string, chartFilter: any): Record<string, any> {
  const query: Record<string, any> = {
    filter_type: filterType,
    materialFilter: 'RKEF'
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
      '/api/analytics/raw/barging/coa/mgo/',
      query
    )

    const compare = data?.compare ?? {}

    chartData.value = {
      categories: compare?.x_data ?? [],
      series: [
        {
          name: 'MgO Internal',
          type: 'column',
          data: compare?.y_split ?? []
        },
        {
          name: 'MgO Official',
          type: 'column',
          data: compare?.y_official ?? []
        }
        // {
        //   name: 'Diff',
        //   type: 'line',
        //   data: compare?.mgo_diff ?? []
        // }
      ]
    }

    detailsData.value = data?.details ?? []
  } catch (error) {
    console.warn('Gagal fetch chart data compare MgO:', error)

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
