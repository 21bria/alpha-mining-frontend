
<template>
  <div class="chart-mask">
    <ChartScrollWrapper v-if="isScrollable">
      <component 
        :is="chartComponent" 
        v-if="chartData" 
        :series="chartData.series" 
        :categories="chartData.categories"
        :colors="colors"
        :details="chartData.details"
      />
    </ChartScrollWrapper>

    <!-- fallback kalau nggak scroll -->
    <component v-else :is="chartComponent" v-if="chartData" :series="chartData.series"
      :categories="chartData.categories" :colors="colors" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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

const chartComponent = computed(() => {
  return defineAsyncComponent(() =>
    import('@/components/ui/apex-chart/grade/BaseLineColumnArea.vue')
  )
})

const colors = computed(() => {
  switch (props.filterType) {
    case 'daily':
      return ['#34d399', '#f43f5e']
    case 'weekly':
      return ['#34d399','#f5b849']
    case 'monthly':
      return ['#34d399','#f5b849']
    case 'yearly':
      return ['#34d399','#f5b849']
    default:
      return ['#34d399','#f5b849']
  }
})

// Props dari parent (opsional, jika kamu tidak pakai Pinia langsung)
const props = defineProps<{
  filterType: string
  chartType?: 'bar' | 'area' | 'line'
}>()

const isScrollable = computed(() => {
  return !['weekly', 'yearly', 'all'].includes(props.filterType)
})

interface ChartSeries {
  name: string
  data: number[]
  type: string
}

interface GradeDetail {
  label: string
  total_ore: number
  released_ore: number
  ni: number
  co: number
  fe: number
  mgo: number
  sio2: number
  sm: number
}

interface ChartData {
  categories: string[]
  series: ChartSeries[]
  details: GradeDetail[]
}

const chartFilter = useChartFilterStore()
const chartData = ref<ChartData | null>(null)

const defaultChartType = computed(() => {
  switch (props.filterType) {
    case 'daily':
    // case 'weekly':
    //   return 'bar'
    case 'monthly':
      // return 'area'
    case 'range':
    case 'yearly':
    case 'all':
      return 'bar'
    default:
      return 'bar'
  }
})

const emit = defineEmits<{
  (e: 'update:grandTotal', value: number): void
}>()

async function fetchChartData() {
  try {
    const filterType = props.filterType

    let endpoint = '/api/analytics/raw/geology/production-grade/'
    const query: Record<string, any> = {
      filter_type: filterType,
      material: 'SAP'
    }

    if (chartFilter.iup_id) {
      query.iup_id = chartFilter.iup_id
    }

    // Handle berdasarkan jenis filter
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

      case 'all':
        break

      default:
        console.warn('Filter type tidak dikenal:', filterType)
        return
    }

    const data = await getApi<any>(endpoint, query)

    const labels = data.x_data ?? []

    chartData.value = {
      categories: labels,
      series: [
        {
          name: 'Total Ore',
          type: 'bar',
          data: data.y_total_ore ?? []
        }
      ],
      details: labels.map((label: string, i: number) => ({
        label,
        total_ore: Number(data.y_total_ore?.[i] ?? 0),
        released_ore: Number(data.y_released_ore?.[i] ?? 0),
        ni: Number(data.y_data_ni?.[i] ?? 0),
        co: Number(data.y_data_co?.[i] ?? 0),
        fe: Number(data.y_data_fe?.[i] ?? 0),
        mgo: Number(data.y_data_mgo?.[i] ?? 0),
        sio2: Number(data.y_data_sio2?.[i] ?? 0),
        sm: Number(data.y_data_sm?.[i] ?? 0),
      }))
    }
    //  emit ke parent
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
    chartFilter.range.end
  ],
  fetchChartData,
  { immediate: true }
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
