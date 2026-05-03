<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">
        Daily Dashboard
      </h2>
      
      <div class="flex items-center space-x-2">
        <FilterControls @apply="handleApply" />
      </div>
    </div>

    <main class="flex flex-1 flex-col gap-4 md:gap-6">

      <div class="grid grid-cols-12 gap-6">
        <!-- Kiri: Statistik dan Chart -->
        <div class="xl:col-span-7 col-span-12">
          <!-- Statistik Atas -->
          <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3 mb-4">
            <Card>
              <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle class="text-sm font-medium">TMM</CardTitle>
                <Activity class="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">
                  {{ formatShortNumber(activeStat?.total_actual) || 0 }}
                </div>
                <!-- Perbandingan dengan progress -->
                <p class="text-xs text-muted-foreground">
                  <NumberFlow :value="activeStat?.achievement ?? 0" suffix=" %" />
                  Daily
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle class="text-sm font-medium">Non Ore</CardTitle>
                <Activity class="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">
                  {{ formatShortNumber(activeStat?.total_non_ore) || 0 }}
                </div>
                <p class="text-xs text-muted-foreground">
                  <NumberFlow :value="activeStat?.achievement_non_ore ?? 0" suffix=" %" />
                  Daily
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle class="text-sm font-medium">Ore</CardTitle>
                <Activity class="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">
                  <!-- <NumberFlow :value="activeStat?.total_ore ?? 0" /> -->
                  {{ formatShortNumber(activeStat?.total_ore) || 0 }}
                </div>
                <p class="text-xs text-muted-foreground">
                  <NumberFlow :value="activeStat?.achievement_ore ?? 0" suffix=" %" />
                  Daily
                </p>
              </CardContent>
            </Card>
          </div>
          <!-- 📈 Chart Area -->
          <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
            <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 px-2 w-full overflow-hidden">
              <CardHeader>
                <div class="flex items-start justify-between w-full">
                  <!-- Kiri: Judul -->
                  <CardTitle>Productions</CardTitle>
                  <!-- Kanan: Tautan -->
                  <NuxtLink :to="{
                    path: '/dashboard/daily',
                    query: { filter_date: selectedDate }
                  }"
                    class="text-sm text-violet-600 hover:underline hover:text-violet-700 dark:hover:text-violet-500 transition-colors flex items-center">
                    View →
                    <i class="bi bi-box-arrow-up-right text-[0.6875rem] ml-1" />
                  </NuxtLink>
                </div>
              </CardHeader>
              <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                <ChartDaily />
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Kanan: Donut Chart dan Card Ringkasan di sebelahnya -->
        <div class="xl:col-span-5 col-span-12">
          <div class="grid grid-cols-12 gap-4">
            <!-- Donut -->
            <div class="xl:col-span-7 col-span-12">

              <Card class="h-full">
                <CardFooter class="flex-col gap-2 text-sm pt-4 mt-2 mb-2">
                  <div class="flex items-center leading-none font-medium">
                    Reserves vs Production
                  </div>
                  <!-- Production -->
                  <div class="flex justify-between w-full text-xs font-medium text-muted-foreground">
                    <span>{{ formatShortNumber(reserveSummary.prod_ton) }} tons</span>
                    <span>of {{ formatShortNumber(reserveSummary.reserve_ton) }} tons</span>
                  </div>
                  <Progress :model-value="reserveSummary.percent_mined || 0" class="w-full" />
                </CardFooter>

                <CardContent class="flex justify-center items-center text-sm border-t">
                  <TypeMaterials @update:percents="(val) => oreClassPercents = val" />
                </CardContent>

                <CardFooter class="flex-col gap-2 text-sm border-t pt-4 mt-4">
                  <div class="flex items-center leading-none font-medium">
                    Material breakdown by type
                  </div>
                  <div v-if="Array.isArray(oreClassPercents) && oreClassPercents.length"
                    class="grid grid-cols-6 sm:grid-cols-6 md:grid-cols-6 gap-2 text-center mt-4">
                    <div v-for="(item, i) in oreClassPercents" :key="i" class="p-2">
                      <p class="text-xs text-gray-500 dark:text-white/50 font-medium">
                        {{ item.label }}
                      </p>
                      <p class="text-sm font-bold text-gray-800 dark:text-white">
                        {{ item.percent }}%
                      </p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
            <!-- Card Ringkasan di sebelah Donut -->
            <div class="xl:col-span-5 col-span-12 grid gap-4">
              <Card class="relative overflow-hidden min-h-[160px]">
                <CardHeader class="pb-1">
                  <div class="flex items-center justify-between">
                    <CardTitle class="text-sm font-medium text-gray-600 dark:text-gray-300">Fuel Comsumption</CardTitle>
                    <div
                      class="inline-flex items-center gap-2 px-1 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-md">
                      <ArrowUpRight class="w-2 h-2" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent class="pt-1 pb-2">
                  <div class="text-3xl font-bold text-black dark:text-white leading-snug">
                    {{ formatNumber(fuelGrandTotal) }}
                    <span class="text-base font-bold text-gray-500 ml-0">L</span>
                  </div>

                  <p class="text-xs text-gray-500  mt-1">
                    Fuel used in mining operations
                  </p>
                  <!-- Divider -->
                  <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                  <p class="text-sm text-black dark:text-white flex items-center gap-1">
                    Fuel Ratio
                    <ArrowUpRight class="w-4 h-4 text-green-500" />
                  </p>

                  <div class="grid grid-cols-2 gap-6 mt-2">
                    <!-- ORE -->
                    <div class="flex items-center justify-between">
                      <p class="text-xs text-gray-600 dark:text-white uppercase tracking-wide">
                        ORE
                      </p>
                      <p class="text-lg font-semibold text-gray-600 dark:text-white tabular-nums">
                        {{ statsFuelRatioORE.fuel_ratio_per_ton?.toFixed(2) || 0 }}
                      </p>
                    </div>

                    <!-- TMM -->
                    <div class="flex items-center justify-between">
                      <p class="text-xs text-gray-600 dark:text-white uppercase tracking-wide">
                        TMM
                      </p>
                      <p class="text-lg font-semibold text-gray-600 dark:text-white tabular-nums">
                        {{ statsFuelRatioTMM.fuel_ratio_per_ton?.toFixed(2) || 0 }}
                      </p>
                    </div>
                  </div>

                </CardContent>
              </Card>
              <!-- Radial Cards -->
              <MaterialRadialCards :data="dataList" :stats-materials="statsMaterials"
                @select-shift="handleShiftClick" />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <!-- Kiri: Quality Chart -->
        <div class="xl:col-span-7 col-span-12">
          <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
            <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 px-2 w-full overflow-hidden">
              <CardHeader>
                <div class="flex flex-col md:flex-row justify-between items-start w-full gap-4">
                  <!-- Kiri: Judul + Link -->
                  <div class="flex flex-col gap-1">
                    <CardTitle>Hauler KPI</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                <KpiHauler />
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Kanan: Selling Chart Ringkasan di sebelahnya -->
        <div class="xl:col-span-5 col-span-12">
          <div class="grid grid-cols-12 gap-4">
            <div class="xl:col-span-12 col-span-12">
              <Card class="h-full w-full overflow-hidden">
                <CardHeader>
                  <div class="flex items-start justify-between w-full">
                    <CardTitle>Digger KPI</CardTitle>
                  </div>
                </CardHeader>
                <CardContent class="pl-2 overflow-hidden overflow-x-auto">
                  <KpiDigger />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import NumberFlow from '@number-flow/vue'
import MaterialRadialCards from '@/components/ui/apex-chart/BaseRadialBarDetail.vue'
import FilterControls from '@/components/filters/FilterDaily.vue'
import { useDailyFilterStore } from '@/stores/filters/daily-filter'
import { useApi } from '@/composables/useApi'

import ChartDaily from "@/modules/dashboard/daily/Chart.vue"
import TypeMaterials from "@/modules/dashboard/daily/TypeMaterials.vue"
import KpiHauler from "@/modules/dashboard/daily/KpiHauler.vue"
import KpiDigger from "@/modules/dashboard/daily/KpiDigger.vue"


const chartFilter = useDailyFilterStore()
const selectedDate = computed(() => chartFilter.date)
const activeStat = ref<SummaryStats | null>(null)

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

function formatNumber(val: number) {
  return new Intl.NumberFormat('id-ID').format(val || 0)
}

/* ===============================
   APPLY FILTER
================================ */

function handleApply(payload: { date: string; iup_id?: number | null }) {
  chartFilter.setDate(payload.date)
  chartFilter.setIup(payload.iup_id ?? null)
}

/* 
   AUTO REFETCH JIKA DATE BERUBAH
 */
watch(selectedDate, (val) => {
  if (!val) return
  fetchAll()
})

onMounted(() => {
  fetchAll()
})

function fetchAll() {
  fetchReserveSummary()
  fetchOreStats()
  fetchSummarybyShift()
  fetchFuelDaily()
  fetchFuelRatio()
}

/* STATES */
const isLoading = ref(false)
const reserveSummary = ref<any>({})
const statsMaterials = ref<{ detail?: Record<string, any[]>, total_ore?: number }>({
  detail: {},
  total_ore: 0
})

const dataList = ref<any[]>([])
const oreClassPercents = ref<any[]>([])

interface SummaryStats {
  label: string
  total_actual: number
  total_ore: number
  total_limonite: number
  total_saprolite: number
  total_non_ore: number
  achievement: number
  achievement_ore: number
  achievement_non_ore: number
  achievement_limonite: number
  achievement_saprolite: number
}


/* ===============================
   FETCH HELPERS
================================ */
function buildParams() {
  const params = new URLSearchParams()
  if (selectedDate.value) {
    params.append('filter_date', selectedDate.value)
  }
  return params.toString()
}

/* ===============================
   FETCH FUNCTIONS
================================ */
async function fetchReserveSummary() {
  isLoading.value = true
  try {
    reserveSummary.value = await getApi(
      '/api/analytics/raw/mining/daily/reserve/',
      {
        filter_date: selectedDate.value
      }
    )
  } finally {
    isLoading.value = false
  }
}

async function fetchOreStats() {
  isLoading.value = true
  try {
    const data = await getApi(
      '/api/analytics/raw/mining/daily/summary/mining/',
      {
        filter_date: selectedDate.value
      }
    )
    activeStat.value = data.daily
  } finally {
    isLoading.value = false
  }
}

// summary by shift grouped material
const shiftDetail = ref<any[]>([])
const showModal = ref(false)
const selectedShiftLabel = ref('')
async function fetchSummarybyShift() {
  await fetchWeatherGrouped()

  const data = await getApi(
    '/api/analytics/raw/mining/daily/summary/materials/grouped/',
    {
      filter_date: selectedDate.value
    }
  )

  statsMaterials.value = data

  const summary = data.summary_by_shift || {}
  const grandTotal = data.grand_total_tonnage || 0

  dataList.value = [
    {
      key: 'D',
      label: 'Day',
      percent: grandTotal
        ? Math.round((summary?.D?.total_tonnage || 0) / grandTotal * 100)
        : 0,
      value: formatShortNumber(summary?.D?.total_tonnage || 0),
      color: '#fbbf24',
      weather: weatherByShift.value['Day'] || { rainy: 0, slippery: 0 }
    },
    {
      key: 'N',
      label: 'Night',
      percent: grandTotal
        ? Math.round((summary?.N?.total_tonnage || 0) / grandTotal * 100)
        : 0,
      value: formatShortNumber(summary?.N?.total_tonnage || 0),
      color: '#34d399',
      weather: weatherByShift.value['Night'] || { rainy: 0, slippery: 0 }
    }
  ]
}

// event handler dari child
function handleShiftClick(payload: { key: string; label: string }) {
  selectedShiftLabel.value = payload.label
  shiftDetail.value = statsMaterials.value.detail?.[payload.key] || []  // Ambil dari parent
  showModal.value = true
  console.log('shiftDetail:', shiftDetail.value)
}

const weatherByShift = ref<Record<string, any>>({})

type WeatherKey = 'rain' | 'slippery'

async function fetchWeatherGrouped() {
  const data = await getApi( '/api/analytics/raw/mining/daily/summary/weather/grouped/',
    {
      filter_date: selectedDate.value
    }
  )

  const result: Record<string, any> = {}

  data.forEach((row: any) => {
    const shift = row.shift
    const category = row.category.toLowerCase()

    if (!result[shift]) {
      result[shift] = { rain: 0, slippery: 0 }
    }

    result[shift][category] += Number(row.duration_min)
  })

  weatherByShift.value = result
}

const fuelByShift = ref([])
const fuelGrandTotal = ref(0)


async function fetchFuelDaily() {
  const data = await getApi('/api/analytics/raw/mining/daily/summary/fuel/',
    {
      filter_date: selectedDate.value
    }
  )

  fuelByShift.value = data.by_shift
  fuelGrandTotal.value = data.grand_total
}

interface FuelRatioSummary {
  date_production?: string
  total_tonnage?: number
  total_bcm?: number
  total_fuel?: number
  fuel_ratio_per_ton?: number
}

const statsFuelRatioTMM = ref<FuelRatioSummary>({})
const statsFuelRatioORE = ref<FuelRatioSummary>({})

async function fetchFuelRatio() {
  const [tmm, ore] = await Promise.all([
    getApi('/api/analytics/raw/mining/daily/summary/fuel/ratio/', {
      filter_date: selectedDate.value
    }),
    getApi('/api/analytics/raw/mining/daily/summary/fuel/ratio/ore/', {
      filter_date: selectedDate.value
    })
  ])

  statsFuelRatioTMM.value = {
    date_production: tmm.date_production?.[0],
    total_tonnage: tmm.total_tonnage?.[0] || 0,
    total_bcm: tmm.total_bcm?.[0] || 0,
    total_fuel: tmm.total_fuel?.[0] || 0,
    fuel_ratio_per_ton: tmm.fuel_ratio_per_ton?.[0] || 0
  }

  statsFuelRatioORE.value = {
    date_production: ore.date_production?.[0],
    total_tonnage: ore.total_tonnage?.[0] || 0,
    total_bcm: ore.total_bcm?.[0] || 0,
    total_fuel: ore.total_fuel?.[0] || 0,
    fuel_ratio_per_ton: ore.fuel_ratio_per_ton?.[0] || 0
  }
}

</script>
