<template>
  <div class="w-full flex flex-col gap-4 px-2 py-2">
    <main class="flex flex-1 flex-col gap-4 md:gap-6">
      <!-- ROW 1 -->
      <div class="grid grid-cols-12 gap-6">
        <!-- LEFT -->
        <div class="xl:col-span-7 col-span-12">
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
                <p class="text-xs text-muted-foreground">
                  <NumberFlow :value="activeStat?.achievement ?? 0" suffix=" %" />
                  {{ activeLabel }}
                  vs
                  <NumberFlow :value="comparisonStat?.achievement ?? 0" suffix=" %" />
                  {{ comparisonLabel }}
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
                  {{ activeLabel }}
                  vs
                  <NumberFlow :value="comparisonStat?.achievement_non_ore ?? 0" suffix=" %" />
                  {{ comparisonLabel }}
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
                  {{ formatShortNumber(activeStat?.total_ore) || 0 }}
                </div>
                <p class="text-xs text-muted-foreground">
                  <NumberFlow :value="activeStat?.achievement_ore ?? 0" suffix=" %" />
                  {{ activeLabel }}
                  vs
                  <NumberFlow :value="comparisonStat?.achievement_ore ?? 0" suffix=" %" />
                  {{ comparisonLabel }}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card class="overflow-hidden rounded-2xl">
            <CardHeader class="pb-0">
              <div class="flex items-start justify-between gap-4">
                <CardTitle>Productions</CardTitle>

                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon"
                      class="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                      <EllipsisVertical class="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" class="w-36 rounded-xl p-2">
                    <DropdownMenuItem class="rounded-lg" @click="handleProductionViewDetails">
                      Details
                    </DropdownMenuItem>
                    <DropdownMenuItem class="rounded-lg" @click="fetchOreStats">
                      Refresh
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
              <MiningChart :filterType="chartFilter.type" />
            </CardContent>
          </Card>
        </div>

        <!-- RIGHT -->
        <div class="xl:col-span-5 col-span-12">
          <div class="grid grid-cols-12 gap-4">
            <div class="xl:col-span-7 col-span-12">
              <Card class="h-full">
                <CardContent class="flex justify-center items-center text-sm">
                  <TypeMaterials :filterType="chartFilter.type" @update:percents="(val) => oreClassPercents = val" />
                </CardContent>

                <CardFooter class="flex-col gap-2 text-sm border-t pt-4 mt-4">
                  <div class="flex items-center leading-none font-medium">
                    Material breakdown by type
                  </div>

                  <div v-if="Array.isArray(oreClassPercents) && oreClassPercents.length"
                    class="grid grid-cols-6 gap-2 text-center mt-4">
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

            <div class="xl:col-span-5 col-span-12 grid gap-4">
              <Card class="relative overflow-hidden min-h-[160px]">
                <CardHeader class="pb-2">
                  <div class="flex items-center justify-between">
                    <CardTitle class="text-sm font-medium text-gray-500">
                      Operations Overview
                    </CardTitle>
                    <div
                      class="inline-flex items-center gap-2 px-2 py-2 text-xs font-semibold text-green-600 bg-green-100 rounded-md">
                      <ArrowUpRight class="w-3 h-4" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent class="pt-1 pb-4">
                  <div class="text-4xl font-bold text-black dark:text-white leading-snug">
                    <!-- {{ formatShortNumber(fuelSummary.total_fuel) || 0 }} -->
                    {{ formatShortNumber(totalFuel) || 0 }}
                  </div>
                  <p class="text-xs text-gray-500 mt-2">
                    <!-- Fuel used in mining operations -->
                    Fuel used in all operations
                  </p>
                  <!-- Fuel Ratio -->
                  <div class="mt-4 border-t pt-4">
                    <p class="text-sm text-muted-foreground mb-3">Fuel Ratio</p>
                    <div class="flex items-center justify-between gap-4">
                      <div>
                        <p class="text-xs text-muted-foreground">ORE</p>
                        <p class="text-lg font-bold">
                          {{ fuelOreSummary.fuel_ratio_per_ton }}
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-muted-foreground">TMM</p>
                        <p class="text-lg font-bold">
                          {{ fuelSummary.fuel_ratio_per_ton }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <!-- Fleet & Productivity -->
                  <div class="mt-4 border-t pt-4">
                    <p class="text-sm text-muted-foreground mb-3">
                      Fleet & Productivity
                    </p>

                    <div class="flex items-center justify-between gap-4">
                      <!-- Fleet -->
                      <div>
                        <p class="text-xs text-muted-foreground">Fleet</p>
                        <p class="text-lg font-bold">
                          {{ productivitySummary.fleet }}
                        </p>
                      </div>

                      <!-- Productivity -->
                      <div class="text-right">
                        <p class="text-xs text-muted-foreground">Productivity</p>
                        <p class="text-lg font-bold">
                          {{ formatShortNumber(productivitySummary.productivity) }}
                          <span class="text-xs text-muted-foreground">t/h</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <!-- Weather Summary -->
                  <div class="mt-4 border-t pt-4">
                    <p class="text-sm text-muted-foreground mb-3">Weather</p>
                    <div class="grid grid-cols-3 gap-4">
                      <!-- Rainfall -->
                      <div>
                        <p class="text-xs text-muted-foreground">Rainfall</p>
                        <p class="text-base font-semibold">
                          {{ formatShortNumber(statsRainfall.milimeter) || 0 }}
                          <span class="text-xs text-muted-foreground">mm</span>
                        </p>
                      </div>
                      <!-- Rainy -->
                      <div>
                        <p class="text-xs text-muted-foreground">Rainy</p>
                        <p class="text-base font-semibold">
                          {{ formatDurationCompact(statsWeather?.rainy ?? 0) }}
                        </p>
                      </div>
                      <!-- Slippery -->
                      <div>
                        <p class="text-xs text-muted-foreground">Slippery</p>
                        <p class="text-base font-semibold">
                          {{ formatDurationCompact(statsWeather?.slippery ?? 0) }}
                        </p>
                      </div>

                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW 2 KPI -->
      <div class="grid grid-cols-12 gap-6">
        <div class="xl:col-span-7 col-span-12">
          <Card class="overflow-hidden rounded-2xl">
         <CardHeader>
              <CardTitle>Productivity</CardTitle>
            </CardHeader>

            <CardContent class="pl-2 overflow-hidden overflow-x-auto">
              <Productivity :filter-type="chartFilter.type" @summary="productivitySummary = $event" />
            </CardContent>
          </Card>
        </div>

        <div class="xl:col-span-5 col-span-12">
          <Card class="h-full w-full overflow-hidden">
               <Tabs v-model="activeKpiTab" class="w-full">
              <CardHeader class="pb-0">
                <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <CardTitle>{{ activeKpiTitle }}</CardTitle>

                  <div class="flex items-center justify-between gap-3">
                    <TabsList class="grid w-full grid-cols-2 xl:w-[240px]">
                      <TabsTrigger value="digger">Digger</TabsTrigger>
                      <TabsTrigger value="hauler">Hauler</TabsTrigger>
                    </TabsList>

                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon"
                          class="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                          <EllipsisVertical class="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" class="w-36 rounded-xl p-2">
                        <!-- <DropdownMenuItem class="rounded-lg" @click="handleFuelViewDetails">
                          Details
                        </DropdownMenuItem> -->
                        <DropdownMenuItem class="rounded-lg" @click="handleRefreshFuelCard">
                          Refresh
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
                <TabsContent value="digger" class="mt-0">
                  <KpiDigger :filterType="chartFilter.type" />
                </TabsContent>

                <TabsContent value="hauler" class="mt-0">
                  <KpiHauler :filterType="chartFilter.type" />
                </TabsContent>
              </CardContent>
            </Tabs>
            
          </Card>
        </div>
      </div>

      <!-- ROW 3 -->
      <div class="grid grid-cols-12 gap-6">
        <div class="xl:col-span-7 col-span-12">
          <Card class="overflow-hidden rounded-2xl">
            <Tabs v-model="activeFuelTab" class="w-full">
              <CardHeader class="pb-0">
                <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <CardTitle>{{ activeFuelTitle }}</CardTitle>

                  <div class="flex items-center justify-between gap-3">
                    <TabsList class="grid w-full grid-cols-2 xl:w-[240px]">
                      <TabsTrigger value="all">Fuel</TabsTrigger>
                      <TabsTrigger value="categories">Categories</TabsTrigger>
                    </TabsList>

                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon"
                          class="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                          <EllipsisVertical class="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" class="w-36 rounded-xl p-2">
                        <DropdownMenuItem class="rounded-lg" @click="handleFuelViewDetails">
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuItem class="rounded-lg" @click="handleRefreshFuelCard">
                          Refresh
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
                <TabsContent value="all" class="mt-0">
                  <!-- <FuelChart :filterType="chartFilter.type" /> -->
                  <FuelChart :filterType="chartFilter.type" @update:grandTotal="totalFuel = $event" />
                </TabsContent>

                <TabsContent value="categories" class="mt-0">
                  <FuelChartCategories :filterType="chartFilter.type" />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div class="xl:col-span-5 col-span-12">
          <Card class="overflow-hidden rounded-2xl">
            <CardHeader class="pb-0">
              <div class="flex items-start justify-between gap-4">
                <CardTitle>Rain data</CardTitle>

                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon"
                      class="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                      <EllipsisVertical class="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" class="w-36 rounded-xl p-2">
                    <DropdownMenuItem class="rounded-lg" @click="fetchRainfallData">
                      Refresh
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
              <RainfallChart :filterType="chartFilter.type" />
            </CardContent>
          </Card>
        </div>
      </div>


    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, watch } from 'vue'
import NumberFlow from '@number-flow/vue'
import { Activity, ArrowUpRight, EllipsisVertical } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'
import { formatShortNumber } from '@/utils/formatter'
import { buildFilterQuery } from '@/utils/filter-query'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Button } from '@/components/ui/button'

const { request } = useApi()
const chartFilter = useChartFilterStore()
const router = useRouter()
const route = useRoute()

type FilterType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'range' | 'all'

function syncFilterFromRoute() {
  const q = route.query

  if (!q.filter_type) return

  chartFilter.apply({
    type: String(q.filter_type) as FilterType,

    year: q.year ? Number(q.year) : undefined,

    // FIX PENTING: month = NUMBER (bukan object)
    month: q.month ? Number(q.month) : undefined,

    week: q.week ? String(q.week) : undefined,

    date: q.filter_date ? String(q.filter_date) : '',

    range: {
      start: q.date_start ? String(q.date_start) : '',
      end: q.date_end ? String(q.date_end) : ''
    },

    iup_id: q.iup_id ? String(q.iup_id) : null
  })
}

const MiningChart = defineAsyncComponent(() => import('@/modules/dashboard/mining/Chart.vue'))
const RainfallChart = defineAsyncComponent(() => import('@/modules/dashboard/rainfall/Chart.vue'))
const FuelChart = defineAsyncComponent(() => import('@/modules/dashboard/fuel/Chart.vue'))
const FuelChartCategories = defineAsyncComponent(() => import('@/modules/dashboard/fuel/Categories.vue'))
const TypeMaterials = defineAsyncComponent(() => import('@/modules/dashboard/mining/TypeMaterials.vue'))
const KpiHauler = defineAsyncComponent(() => import('@/modules/dashboard/kpi/HaulerChart.vue'))
const KpiDigger = defineAsyncComponent(() => import('@/modules/dashboard/kpi/DiggerChart.vue'))
const Productivity = defineAsyncComponent(() => import('@/modules/dashboard/kpi/Productivity.vue'))

interface DashboardSummaryStat {
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

interface WeatherStats {
  rainy: number
  slippery: number
}
const totalFuel = ref(0)

interface FuelSummary {
  total_tonnage: number
  total_bcm: number
  total_fuel: number
  fuel_ratio_per_ton: number
}

interface FuelRatioResponse {
  summary?: FuelSummary
}

interface MaterialSummaryItem {
  material: string
  ritase: number
  tonnage: number
  percentage: number
}

interface MaterialSummaryResponse {
  summary?: MaterialSummaryItem[]
  grand_total_ritase?: number
  grand_total_tonnage?: number
}

type OreClassItem = {
  label: string
  percent: number
}

const defaultFuelSummary: FuelSummary = {
  total_tonnage: 0,
  total_bcm: 0,
  total_fuel: 0,
  fuel_ratio_per_ton: 0,
}

const isLoading = ref(false)

const stats = ref<Record<string, DashboardSummaryStat>>({})
const reserveSummary = ref<Record<string, any>>({})
const statsQuality = ref<Record<string, any>>({})

const statsRainfall = ref({
  milimeter: 0,
})

const statsWeather = ref<WeatherStats>({
  rainy: 0,
  slippery: 0,
})

const fuelSummary = ref<FuelSummary>({ ...defaultFuelSummary })
const fuelOreSummary = ref<FuelSummary>({ ...defaultFuelSummary })

const materialSummary = ref<MaterialSummaryItem[]>([])
const oreClassPercents = ref<OreClassItem[]>([])

const dataList = ref<{ label: string; percent: number; value: string; color: string }[]>([])
const chartKey = ref(0)

const activeKpiTab = ref<'digger' | 'hauler'>('digger')

const activeKpiTitle = computed(() =>
  activeKpiTab.value === 'digger' ? 'KPI Digger' : 'KPI Hauler'
)

const productivitySummary = ref({
  total_ore: 0,
  total_hours: 0,
  fleet: 0,
  productivity: 0
})

const activeFuelTab = ref<'all' | 'categories'>('all')

const activeFuelTitle = computed(() =>
  activeFuelTab.value === 'all' ? 'Fuel by Daily' : 'Fuel by Categories'
)

const selectedChartType = computed(() => chartFilter.type)

const selectedKey = computed(() => {
  return (chartFilter.type?.toLowerCase?.() || '') as keyof typeof stats.value
})

const comparisonKey = computed(() => {
  switch (selectedKey.value) {
    case 'monthly':
      return 'mtd'
    case 'yearly':
      return 'ytd'
    case 'weekly':
      return 'wtd'
    case 'daily':
      return 'daily'
    case 'range':
      return 'range'
    case 'all':
      return 'all'
    default:
      return ''
  }
})

const activeStat = computed(() => stats.value[selectedKey.value] || null)
const comparisonStat = computed(() => stats.value[comparisonKey.value] || null)
const activeLabel = computed(() => activeStat.value?.label || '')
const comparisonLabel = computed(() => comparisonStat.value?.label || '')

const apiFilters = computed(() => {
  const type = chartFilter.type as FilterType | ''

  return {
    filter_type: type || null,
    year: chartFilter.year ?? null,
    month: chartFilter.month?.value ?? null,
    week: type === 'weekly' ? (chartFilter.week ?? null) : null,
    date_start: chartFilter.range?.start || null,
    date_end: chartFilter.range?.end || null,
    filter_date: chartFilter.date || null,
    iup_id: chartFilter.iup_id || null,
  }
})

function cleanQuery(params: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== null && value !== undefined && value !== ''
    })
  )
}

async function getApi<T = any>(url: string, extraQuery?: Record<string, any>) {
  return await request<T>(url, {
    method: 'GET',
    query: cleanQuery({
      ...apiFilters.value,
      ...extraQuery,
    }),
  })
}

const productionDetailRoute = computed(() => ({
  path: '/dashboard/detail_productions',
  query: buildFilterQuery(chartFilter),
}))

function handleProductionViewDetails() {
  router.push(productionDetailRoute.value)
}

function handleFuelViewDetails() {
  router.push({
    path: activeFuelTab.value === 'all'
      ? '/dashboard/detail_fuel'
      : '/dashboard/detail_fuel_ore',
    query: {
      filter_type: selectedChartType.value || undefined,
    },
  })
}

function handleRefreshFuelCard() {
  fetchFuelRatio()
  fetchFuelRatioOre()
}

async function fetchReserveSummary(): Promise<void> {
  try {
    reserveSummary.value = await getApi('/api/analytics/raw/mining/reserve/')
  } catch (error) {
    console.error('Gagal ambil data Reserve Summary:', error)
    reserveSummary.value = {}
  }
}

async function fetchOreStats(): Promise<void> {
  try {
    stats.value = await getApi<Record<string, DashboardSummaryStat>>(
      '/api/analytics/raw/mining/summary/'
    )
  } catch (error) {
    console.error('Gagal ambil data summary mines:', error)
    stats.value = {}
  }
}

async function fetchQualityStats(): Promise<void> {
  try {
    statsQuality.value = await getApi('/api/analytics/raw/geology/summary/')
  } catch (error) {
    console.error('Gagal ambil data ore summary:', error)
    statsQuality.value = {}
  }
}

async function fetchFuelRatio(): Promise<void> {
  try {
    const data = await getApi<FuelRatioResponse>('/api/analytics/raw/fuel/ratio/')
    fuelSummary.value = data?.summary || { ...defaultFuelSummary }
  } catch (error) {
    console.error('Gagal ambil fuel ratio:', error)
    fuelSummary.value = { ...defaultFuelSummary }
  }
}

async function fetchFuelRatioOre(): Promise<void> {
  try {
    const data = await getApi<FuelRatioResponse>('/api/analytics/raw/fuel/ratio-ore/')
    fuelOreSummary.value = data?.summary || { ...defaultFuelSummary }
  } catch (error) {
    console.error('Gagal ambil fuel ratio ore:', error)
    fuelOreSummary.value = { ...defaultFuelSummary }
  }
}

async function fetchMaterialSummary(): Promise<void> {
  try {
    const data = await getApi<MaterialSummaryResponse>(
      '/api/analytics/raw/mining/summary/materials/'
    )

    materialSummary.value = data?.summary || []

    dataList.value = materialSummary.value.map((item, index) => ({
      label: item.material,
      percent: Math.round(item.percentage || 0),
      value: formatShortNumber(item.tonnage || 0),
      color: index % 2 === 0 ? '#fbbf24' : '#34d399',
    }))

    chartKey.value += 1
  } catch (error) {
    console.error('Gagal ambil material summary:', error)
    materialSummary.value = []
    dataList.value = []
  }
}

async function fetchWeatherData(): Promise<void> {
  try {
    const data = await getApi<WeatherStats>('/api/analytics/raw/weather/data/weather/')
    statsWeather.value = {
      rainy: data?.rainy ?? 0,
      slippery: data?.slippery ?? 0,
    }
  } catch (error) {
    console.error('Gagal ambil data weather:', error)
    statsWeather.value = {
      rainy: 0,
      slippery: 0,
    }
  }
}

async function fetchRainfallData(): Promise<void> {
  try {
    statsRainfall.value = await getApi('/api/analytics/raw/weather/data/rainfall/')
  } catch (error) {
    console.error('Gagal ambil data rainfall:', error)
    statsRainfall.value = {
      milimeter: 0,
    }
  }
}

async function fetchAllDashboardData() {
  if (!chartFilter.type) return

  isLoading.value = true

  try {
    await Promise.all([
      fetchReserveSummary(),
      fetchOreStats(),
      fetchQualityStats(),
      fetchFuelRatio(),
      fetchFuelRatioOre(),
      fetchMaterialSummary(),
      fetchWeatherData(),
      fetchRainfallData(),
    ])
  } finally {
    isLoading.value = false
  }
}
watch(
  () => route.query,
  () => {
    syncFilterFromRoute()
  },
  { deep: true, immediate: true }
)
watch(
  () => ({ ...apiFilters.value }),
  async () => {
    await fetchAllDashboardData()
  },
  { deep: true, immediate: true }
)
</script>

<style>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>