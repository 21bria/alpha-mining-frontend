<template>
  <div class="w-full flex flex-col gap-4 px-5 py-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-2xl font-bold tracking-tight">
        Dashboard
      </h2>
      <div class="flex items-center space-x-2">
        <!-- <BaseDateRangePicker /> -->
        <FilterControls @apply="handleApply" />
      </div>
    </div>
    <main class="flex flex-1 flex-col gap-4 md:gap-6">
      <div class="grid grid-cols-12 gap-6">
        <!-- Kiri: Statistik dan Chart -->
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
                <!-- Perbandingan dengan progress -->
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
          <!-- 📈 Chart Area -->
          <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
            <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 overflow-hidden rounded-2xl">
              <Tabs v-model="activeTab" class="w-full">
                <CardHeader class="pb-0">
                  <div class="flex flex-col gap-4">
                    <!-- top row -->
                    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <!-- kiri -->
                      <div class="flex flex-col gap-1">
                        <CardTitle>
                          {{ activeTitle }}
                        </CardTitle>
                      </div>

                      <!-- kanan -->
                      <div class="flex flex-col items-stretch gap-4 xl:items-end">
                        <!-- tabs + dropdown -->
                        <div class="flex items-center justify-between gap-3">
                          <TabsList class="grid w-full grid-cols-4 xl:w-[360px] gap-4">
                            <TabsTrigger value="mining">
                              Mining
                            </TabsTrigger>
                            <TabsTrigger value="material">
                              Material
                            </TabsTrigger>
                            <TabsTrigger value="weather">
                              Weather
                            </TabsTrigger>
                            <TabsTrigger value="fuel">
                              Fuel  
                            </TabsTrigger>
                          </TabsList>

                          <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                              <Button variant="ghost" size="icon"
                                class="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                                <EllipsisVertical class="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" class="w-36 rounded-xl p-2">
                              <DropdownMenuItem class="rounded-lg" @click="handleViewDetails">
                                Details
                              </DropdownMenuItem>
                              <DropdownMenuItem class="rounded-lg" @click="handleRefreshCard">
                                Refresh
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <!-- summary mining -->
                        <div v-if="activeTab === 'mining'"
                          class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-3 xl:w-auto">
                          <div class="px-5 py-4 min-w-[140px]">
                            <p class="text-sm text-muted-foreground">Rainfall</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsRainfall.milimeter) || 0 }}
                              <span class="text-base">(mm)</span>
                            </p>
                          </div>

                          <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                            <p class="text-sm text-muted-foreground">Rainy</p>
                            <p class="text-lg font-semibold">
                              {{ formatDurationCompact(statsWeather?.rainy ?? 0) }}
                            </p>
                          </div>

                          <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                            <p class="text-sm text-muted-foreground">Slippery</p>
                            <p class="text-lg font-semibold">
                              {{ formatDurationCompact(statsWeather?.slippery ?? 0) }}
                            </p>
                          </div>
                        </div>

                        <!-- summary material -->
                        <div v-if="activeTab === 'material'"
                          class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-3 xl:w-auto">
                          <div class="px-5 py-4 min-w-[140px]">
                            <p class="text-sm text-muted-foreground">Limonite</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsQuality.total_lim) || 0 }}
                            </p>
                          </div>

                          <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                            <p class="text-sm text-muted-foreground">Saprolite</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsQuality.total_sap) || 0 }}
                            </p>
                          </div>

                          <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                            <p class="text-sm text-muted-foreground">Totals Ore</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsQuality.total_ore) || 0 }}
                            </p>
                          </div>
                        </div>

                        <!-- summary weather -->
                        <div v-if="activeTab === 'weather'"
                          class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-3 xl:w-auto">
                          <div class="px-5 py-4 min-w-[140px]">
                            <p class="text-sm text-muted-foreground">Rainfall</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsRainfall.milimeter) || 0 }}
                              <span class="text-base">(mm)</span>
                            </p>
                          </div>

                          <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                            <p class="text-sm text-muted-foreground">Rainy</p>
                            <p class="text-lg font-semibold">
                              {{ formatDurationCompact(statsWeather?.rainy ?? 0) }}
                            </p>
                          </div>

                          <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                            <p class="text-sm text-muted-foreground">Slippery</p>
                            <p class="text-lg font-semibold">
                              {{ formatDurationCompact(statsWeather?.slippery ?? 0) }}
                            </p>
                          </div>
                        </div>

                        <!-- summary fuel -->
                        <div  v-if="activeTab === 'fuel'"
                          class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-1 xl:w-auto">
                          <div class="px-5 py-4 min-w-[140px]">
                            <p class="text-sm text-muted-foreground">Total Fuel</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(totalFuel) || 0 }}
                            </p>
                          </div>

                        </div>

                      </div>

                    </div>
                  </div>
                </CardHeader>

                <CardContent class="pt-0">

                  <TabsContent value="mining" class="mt-0">
                    <MiningChart :filterType="chartFilter.type" />
                  </TabsContent>

                  <TabsContent value="material" class="mt-0">
                    <QualityChart :filterType="chartFilter.type" />
                  </TabsContent>

                  <TabsContent value="weather" class="mt-0">
                    <RainfallChart :filterType="chartFilter.type" />  
                  </TabsContent>

                  <TabsContent value="fuel" class="mt-0">
                    <FuelChart :filterType="chartFilter.type" @update:grandTotal="totalFuel = $event" />
                  </TabsContent>

                </CardContent>
              </Tabs>
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
                  <QualityClassOre :filterType="chartFilter.type"
                  @update:percents="(val) => oreClassPercents = val" />
                </CardContent>

                <CardFooter class="flex-col gap-2 text-sm border-t pt-4 mt-4">
                  <div class="flex items-center leading-none font-medium">
                    Ore breakdown by class
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
                <CardHeader class="pb-2">
                  <div class="flex items-center justify-between">
                    <CardTitle class="text-sm font-medium text-gray-500">Selling Update !</CardTitle>
                    <div
                      class="inline-flex items-center gap-2 px-1 py-2 text-xs font-semibold text-green-600 bg-green-100 rounded-md">
                      <ArrowUpRight class="w-3 h-4" />
                      :)
                    </div>
                  </div>
                </CardHeader>
                <CardContent class="pt-1 pb-4">
                  <div class="text-4xl font-bold text-black dark:text-white leading-snug">
                    {{ formatShortNumber(statsSelling.total_ore) || 0 }}
                  </div>

                  <p class="text-xs text-gray-500  mt-2">
                    Trending up this selling period
                  </p>
                  <p class="text-sm text-black dark:text-white mt-2 flex items-center gap-1">
                    Reserve vs Revenue :
                    <ArrowUpRight class="w-4 h-4" />
                  </p>
                  <!-- Sales -->
                  <div class="flex justify-between w-full text-xs font-medium text-muted-foreground mt-2 mb-1">
                    <span>{{ formatShortNumber(reserveSummary.sales_ton) }} tons</span>
                    <span>of {{ formatShortNumber(reserveSummary.reserve_ton) }} tons</span>
                  </div>
                  <Progress :model-value="reserveSummary.percent_sold || 0" class="w-full" />
                </CardContent>
              </Card>
              <!-- Radial Cards -->
              <OreRadialCards :data="dataList" />
            </div>
          </div>
        </div>
      </div>

      <!--  Inventory Chart  & Barging-->
      <div class="grid grid-cols-12 gap-6">
        <!-- Kiri: Inventory Chart -->
        <div class="xl:col-span-7 col-span-12">
          <!--  Chart Area  Inventory -->
          <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
            <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 overflow-hidden rounded-2xl">
              <CardHeader class="pb-0">
                <div class="flex flex-col gap-4">
                  <!-- top row -->
                  <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <!-- kiri -->
                    <div class="flex flex-col gap-1">
                      <CardTitle>
                        Inventory
                      </CardTitle>
                    </div>

                    <!-- kanan -->
                    <div class="flex flex-col items-stretch gap-4 xl:items-end">
                      <!-- dropdown -->
                      <div class="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger as-child>
                            <Button variant="ghost" size="icon"
                              class="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                              <EllipsisVertical class="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" class="w-36 rounded-xl p-2">
                            <DropdownMenuItem class="rounded-lg" @click="handleInventoryViewDetails">
                              Details
                            </DropdownMenuItem>
                            <DropdownMenuItem class="rounded-lg" @click="handleRefreshInventoryCard">
                              Refresh
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <!-- summary -->
                      <div class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-3 xl:w-auto">
                        <div class="px-5 py-4 min-w-[140px]">
                          <p class="text-sm text-muted-foreground">Limonite</p>
                          <p class="text-lg font-semibold text-gray-800 dark:text-white">
                            {{ formatShortNumber(statsIventory.lim_stock) || 0 }}
                          </p>
                        </div>

                        <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                          <p class="text-sm text-muted-foreground">Saprolite</p>
                          <p class="text-lg font-semibold text-gray-800 dark:text-white">
                            {{ formatShortNumber(statsIventory.sap_stock) || 0 }}
                          </p>
                        </div>

                        <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                          <p class="text-sm text-muted-foreground">Totals Ore</p>
                          <p class="text-lg font-semibold text-gray-800 dark:text-white">
                            {{ formatShortNumber(statsIventory.total_stock) || 0 }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
                <InventoryChart :filterType="chartFilter.type" />
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Kanan: Tabel inventory Ringkasan di sebelahnya -->
        <div class="xl:col-span-5 col-span-12">
          <div class="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
            <Card class="xxl:col-span-12 xl:col-span-12 col-span-12 overflow-hidden rounded-2xl">
              <Tabs v-model="activeBargingTab" class="w-full">
                <CardHeader class="pb-0">
                  <div class="flex flex-col gap-4">
                    <!-- top row -->
                    <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <!-- kiri -->
                      <div class="flex flex-col gap-1">
                        <CardTitle>
                          {{ activeBargingTitle }}
                        </CardTitle>
                      </div>

                      <!-- kanan -->
                      <div class="flex flex-col items-stretch gap-4 xl:items-end">
                        <!-- tabs + dropdown -->
                        <div class="flex items-center justify-between gap-3">
                          <TabsList class="grid w-full grid-cols-2 xl:w-[240px]">
                            <TabsTrigger value="barging">
                              Barging
                            </TabsTrigger>
                            <TabsTrigger value="selling">
                              Selling
                            </TabsTrigger>

                          </TabsList>

                          <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                              <Button variant="ghost" size="icon"
                                class="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                                <EllipsisVertical class="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" class="w-36 rounded-xl p-2">
                              <DropdownMenuItem class="rounded-lg" @click="handleBargingViewDetails">
                                Details
                              </DropdownMenuItem>
                              <DropdownMenuItem class="rounded-lg" @click="handleRefreshBargingCard">
                                Refresh
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <!-- summary Barging -->
                        <div v-if="activeBargingTab === 'barging'"
                          class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-3 xl:w-auto">
                          <div class="px-5 py-4 min-w-[140px]">
                            <p class="text-sm text-muted-foreground">Limonite</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsBarging.total_lim) || 0 }}
                            </p>
                          </div>

                          <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                            <p class="text-sm text-muted-foreground">Saprolite</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsBarging.total_sap) || 0 }}
                            </p>
                          </div>

                          <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                            <p class="text-sm text-muted-foreground">Totals Ore</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsBarging.total_ore) || 0 }}
                            </p>
                          </div>
                        </div>

                        <!-- summary Selling -->
                        <div v-else
                          class="grid w-full grid-cols-1 overflow-hidden rounded-2xl border sm:grid-cols-3 xl:w-auto">
                          <div class="px-5 py-4 min-w-[140px]">
                            <p class="text-sm text-muted-foreground">Limonite</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsSelling.total_lim) || 0 }}
                            </p>
                          </div>

                          <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                            <p class="text-sm text-muted-foreground">Saprolite</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsSelling.total_sap) || 0 }}
                            </p>
                          </div>

                          <div class="border-t px-5 py-4 min-w-[140px] sm:border-l sm:border-t-0">
                            <p class="text-sm text-muted-foreground">Totals Ore</p>
                            <p class="text-lg font-semibold">
                              {{ formatShortNumber(statsSelling.total_ore) || 0 }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
                  <TabsContent value="barging" class="mt-0">
                    <BargingChart :filterType="chartFilter.type" />
                  </TabsContent>
                  <TabsContent value="selling" class="mt-0">
                    <SellingChart :filterType="chartFilter.type" />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import NumberFlow from '@number-flow/vue'
import { Activity, ArrowUpRight } from 'lucide-vue-next'
import OreRadialCards from '@/components/ui/apex-chart/BaseRadialBar.vue'
import FilterControls from '@/components/filters/FilterControls.vue'
import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'
import { formatDurationCompact } from '@/utils/time'
import { formatShortNumber, formatFuelVolume } from '@/utils/formatter'
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
import { EllipsisVertical, ExternalLink, RefreshCcw } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const { request } = useApi()
const chartFilter = useChartFilterStore()
const router = useRouter()
type FilterType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'range' | 'all'

// Tabs utama: Mining vs Material Type
const activeTab = ref<'mining' | 'material' | 'weather' | 'fuel'>('mining')
const selectedChartType = computed(() => chartFilter.type)
const activeTitle = computed(() => {
  const map: Record<string, string> = {
    mining: 'Mining',
    material: 'Material Type',
    weather: 'Weather',
    fuel: 'Fuel Consumption'
  }

  return map[activeTab.value] || 'Dashboard'
})
const canViewDetail = computed(() => {
  return ['mining', 'material'].includes(activeTab.value)
})
function handleViewDetails() {
  if (!canViewDetail.value) return

  router.push({
    path: activeTab.value === 'mining' ? '/dashboard/detail_productions' : '/dashboard/detail_quality',
    query: {
      filter_type: selectedChartType.value || undefined
    }
  })
}

function handleRefreshCard() {
  if (activeTab.value === 'mining') {
    fetchWeatherData()
    fetchRainfallData()
  } else {
    fetchQualityStats()
  }
}

const MiningChart = defineAsyncComponent(() => import('@/modules/dashboard/mining/Chart.vue'))
const QualityChart = defineAsyncComponent(() => import('@/modules/dashboard/geology/Chart.vue'))
const RainfallChart = defineAsyncComponent(() => import('@/modules/dashboard/rainfall/Chart.vue'))
const FuelChart = defineAsyncComponent(() => import('@/modules/dashboard/fuel/Chart.vue'))
const QualityClassOre = defineAsyncComponent(() => import('@/modules/dashboard/geology/ClassOre.vue'))

// Barging & Selling
const activeBargingTab = ref<'selling' | 'barging'>('barging')
const isBargingTab = computed(() => activeBargingTab.value === 'barging')
const activeBargingTitle = computed(() =>
  isBargingTab.value ? 'Barging by Daily' : 'Selling by Barge'
)
const bargingDetailRoute = computed(() => ({
  path: isBargingTab.value ? '/dashboard/detail_barging' : '/dashboard/detail_selling',
  query: {
    filter_type: selectedChartType.value || undefined
  }
}))

function handleBargingViewDetails() {
  router.push(bargingDetailRoute.value)
}

function handleRefreshBargingCard() {
  if (isBargingTab.value) {
    fetchBargingStats()
  } else {
    fetchSellingStats()
  }
}

const SellingChart = defineAsyncComponent(
  () => import('@/modules/dashboard/selling/Chart.vue')
)

const BargingChart = defineAsyncComponent(
  () => import('@/modules/dashboard/barging/Chart.vue')
)
// Inventory
const inventoryDetailRoute = computed(() => ({
  path: '/inventory',
  query: {
    filter_type: selectedChartType.value || undefined
  }
}))

function handleInventoryViewDetails() {
  router.push(inventoryDetailRoute.value)
}

function handleRefreshInventoryCard() {
  fetchInventoryStats()
}
const InventoryChart = defineAsyncComponent(() => import('@/modules/dashboard/inventory/Chart.vue'))
// Handler untuk menerima event apply dari FilterControls
function handleApply(payload: {
  type: string
  year?: number
  month?: number
  week?: string
  range: { start: string; end: string }
  date: string
  iup_id?: string | null
}) {
  chartFilter.apply({
    ...payload,
    type: payload.type as FilterType
  })
}

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

interface StatsSelling {
  total_ore: number
  total_lim?: number
  total_sap?: number
}

type FuelItem = {
  label: string
  percent: number
}

type OreClassItem = {
  label: string
  percent: number
}

const isLoading = ref(false)

const totalFuel = ref(0)
const fuelCategoriesPercents = ref<FuelItem[]>([])
const oreClassPercents = ref<OreClassItem[]>([])

const stats = ref<Record<string, DashboardSummaryStat>>({})
const reserveSummary = ref<Record<string, any>>({})
const statsQuality = ref<Record<string, any>>({})
const statsGradeOre = ref<{ data: any[] }>({ data: [] })

const statsRainfall = ref({
  milimeter: 0,
})

const statsWeather = ref({
  rainy: 0,
  slippery: 0
})

const statsSelling = ref<StatsSelling>({
  total_ore: 0,
})

const statsIventory = ref<Record<string, any>>({})
const statsBarging = ref<Record<string, any>>({})

const dataList = ref<{ label: string; percent: number; value: string; color: string }[]>([])
const chartKey = ref(0)

/**
 * Tetap ada karena dipakai di template NuxtLink query
 */
// const selectedChartType = computed(() => chartFilter.type)

const selectedKey = computed(() => (chartFilter.type?.toLowerCase?.() || '') as keyof typeof stats.value)

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

/**
 * Mapping filter store -> query backend
 */
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
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
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
    const query = {
      filter_type: apiFilters.value.filter_type,
      year: chartFilter.year ?? null,
      month: chartFilter.month?.value ?? null,
      week: chartFilter.type === 'weekly' ? (chartFilter.week ?? null) : null,
      date_start: apiFilters.value.date_start,
      date_end: apiFilters.value.date_end,
      filter_date: apiFilters.value.filter_date,
      iup_id: apiFilters.value.iup_id,
    }

    stats.value = await request<Record<string, DashboardSummaryStat>>(
      '/api/analytics/raw/mining/summary/',
      {
        method: 'GET',
        query: cleanQuery(query),
      }
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

async function fetchGradeOre(): Promise<void> {
  statsGradeOre.value = { data: [] }

  try {
    statsGradeOre.value = await getApi('/api/analytics/raw/barging/summary-selling/')
  } catch (error) {
    console.error('Gagal ambil data ore grade:', error)
  }
}

async function fetchWeatherData(): Promise<void> {
  statsWeather.value = {
    rainy: 0,
    slippery: 0
  }

  try {
    const data = await getApi<WeatherStats>('/api/analytics/raw/weather/data/weather/')
    statsWeather.value = {
      rainy: data?.rainy ?? 0,
      slippery: data?.slippery ?? 0
    }
  } catch (error) {
    console.error('Gagal ambil data weather:', error)
  }
}

async function fetchRainfallData(): Promise<void> {
  statsRainfall.value = {
    milimeter: 0,
  }

  try {
    statsRainfall.value = await getApi('/api/analytics/raw/weather/data/rainfall/')
  } catch (error) {
    console.error('Gagal ambil data rainfall:', error)
  }
}

async function fetchBargingStats(): Promise<void> {
  try {
    statsBarging.value = await getApi('/api/analytics/raw/barging/summary/')
  } catch (error) {
    console.error('Gagal ambil data barging summary:', error)
    statsBarging.value = {}
  }
}

async function fetchSellingStats(): Promise<void> {
  try {
    const data = await getApi<StatsSelling>('/api/analytics/raw/barging/summary-selling/')

    statsSelling.value = data

    const totalOre = data?.total_ore || 0
    const totalLim = data?.total_lim || 0
    const totalSap = data?.total_sap || 0

    const limPercent = totalOre ? Math.round((totalLim / totalOre) * 100) : 0
    const sapPercent = totalOre ? Math.round((totalSap / totalOre) * 100) : 0

    dataList.value = [
      {
        label: 'Limonite',
        percent: limPercent,
        value: formatShortNumber(totalLim),
        color: '#fbbf24'
      },
      {
        label: 'Saprolite',
        percent: sapPercent,
        value: formatShortNumber(totalSap),
        color: '#34d399'
      }
    ]

    chartKey.value += 1
  } catch (error) {
    console.error('Gagal ambil data selling summary:', error)
    statsSelling.value = { total_ore: 0 }
    dataList.value = []
  }
}

async function fetchInventoryStats(): Promise<void> {
  try {
    statsIventory.value = await getApi('/api/analytics/raw/inventory/summary/')
  } catch (error) {
    console.error('Gagal ambil data inventory summary:', error)
    statsIventory.value = {}
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
      fetchGradeOre(),
      fetchSellingStats(),
      fetchInventoryStats(),
      fetchBargingStats(),
      fetchWeatherData(),
      fetchRainfallData(),
    ])
  } finally {
    isLoading.value = false
  }
}

watch(
  () => ({ ...apiFilters.value }),
  async () => {
    await fetchAllDashboardData()
  },
  { deep: true, immediate: true }
)
</script>z

<style>
/* global.css */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>