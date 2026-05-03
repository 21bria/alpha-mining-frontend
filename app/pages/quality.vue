<template>
  <div class="w-full flex flex-col gap-4 px-2 py-2">
    <main class="flex flex-1 flex-col gap-4 md:gap-6">
      <!-- ROW 1 -->
      <div class="grid grid-cols-12 gap-6">
        <!-- LEFT -->
        <div class="xl:col-span-5 col-span-12">
          <div class="grid grid-cols-12 gap-4">
            <div class="xl:col-span-5 col-span-12 grid gap-4">
              <Card class="relative overflow-hidden min-h-[160px]">
                <CardFooter class="flex-col gap-2 text-sm pt-0 mt-0 mb-0">
                  <div class="flex items-center leading-none font-medium">
                    Reserves vs Production
                  </div>
                  <!-- Production -->
                  <div class="flex justify-between w-full text-xs font-medium text-muted-foreground mt-2">
                    <span>{{ formatShortNumber(reserveSummary.prod_ton) }} tons</span>
                    <span>of {{ formatShortNumber(reserveSummary.reserve_ton) }} tons</span>
                  </div>
                  <Progress :model-value="reserveSummary.percent_mined || 0" class="w-full" />
                </CardFooter>

                <CardContent class="pt-4 pb-4 border-t">
                  <div class="text-4xl font-bold text-black dark:text-white leading-snug">
                    {{ formatShortNumber(statsQuality.total_ore) || 0 }}
                  </div>

                  <p class="text-xs text-gray-500 mt-1">
                    Total Ore Quality
                  </p>

                  <!-- Limonite -->
                  <div class="group mt-4 border-t pt-4 cursor-pointer hover:bg-muted/40 transition px-2 py-2"
                    @click="openGradeDialog('LIM')">
                    <p class="text-sm text-muted-foreground mb-2 group-hover:text-primary transition">
                      Limonite
                    </p>

                    <div class="flex items-center justify-between gap-4">
                      <p class="text-lg font-bold">
                        {{ formatShortNumber(statsQuality.total_lim) || 0 }}
                        <span class="text-xs text-muted-foreground font-medium">Ton</span>
                      </p>

                      <p class="text-sm font-semibold text-yellow-500 opacity-80">
                        Ni: {{ n2(gradePds.lim?.ni) }}%
                      </p>
                    </div>

                    <div class="flex items-center justify-between mt-1">
                      <p class="text-[11px] text-muted-foreground group-hover:text-primary transition">
                        Click for detail
                      </p>
                      <span
                        class="text-xs text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition">
                        →
                      </span>
                    </div>
                  </div>

                  <!-- Saprolite -->
                  <div class="group mt-2 border-t pt-2 cursor-pointer hover:bg-muted/40 transition px-2 py-2"
                    @click="openGradeDialog('SAP')">
                    <p class="text-sm text-muted-foreground mb-2 group-hover:text-primary transition">
                      Saprolite
                    </p>

                    <div class="flex items-center justify-between gap-4">
                      <p class="text-lg font-bold">
                        {{ formatShortNumber(statsQuality.total_sap) || 0 }}
                        <span class="text-xs text-muted-foreground font-medium">Ton</span>
                      </p>

                      <p class="text-sm font-semibold text-green-500 opacity-80">
                        Ni: {{ n2(gradePds.sap?.ni) }}%
                      </p>
                    </div>

                    <div class="flex items-center justify-between mt-1">
                      <p class="text-[11px] text-muted-foreground group-hover:text-primary transition">
                        Click for detail
                      </p>
                      <span
                        class="text-xs text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition">
                        →
                      </span>
                    </div>
                  </div>
                </CardContent>

              </Card>
            </div>

            <div class="xl:col-span-7 col-span-12">
              <Card class="h-full">
                <CardContent class="flex justify-center items-center text-sm">
                  <QualityClassOre :filterType="chartFilter.type" @update:percents="(val) => oreClassPercents = val" />
                </CardContent>

                <CardFooter class="flex-col gap-2 text-sm border-t pt-4 mt-4">
                  <div class="flex items-center leading-none font-medium">
                    Ore breakdown by class
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
          </div>
        </div>

        <!-- RIGHT -->
        <div class="xl:col-span-7 col-span-12">
          <Card class="overflow-hidden rounded-2xl">
            <CardHeader class="pb-0">
              <div class="flex items-start justify-between gap-4">
                <CardTitle>Ore</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon"
                      class="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                      <EllipsisVertical class="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" class="w-36 rounded-xl p-2">
                    <!-- <DropdownMenuItem class="rounded-lg" @click="handleProductionViewDetails">
                      Details
                    </DropdownMenuItem> -->
                    <DropdownMenuItem class="rounded-lg" @click="fetchQualityStats">
                      Refresh
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
              <QualityChart :filterType="chartFilter.type" />
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- ROW 2 -->
      <div class="grid grid-cols-12 gap-6">
        <div class="xl:col-span-6 col-span-12">
          <Card class="overflow-hidden rounded-2xl">
            <Tabs v-model="activeGradeTab" class="w-full">
              <CardHeader class="pb-0">
                <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <CardTitle>{{ activeGradeTitle }}</CardTitle>

                  <div class="flex items-center justify-between gap-3">
                    <TabsList class="grid w-full grid-cols-2 xl:w-[240px]">
                      <TabsTrigger value="lim">Limonite</TabsTrigger>
                      <TabsTrigger value="sap">Saprolite</TabsTrigger>
                    </TabsList>

                  </div>
                </div>
              </CardHeader>

              <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
                <TabsContent value="lim" class="mt-0">
                  <ChartLim :filterType="chartFilter.type" />
                </TabsContent>

                <TabsContent value="sap" class="mt-0">
                  <ChartSap :filterType="chartFilter.type" />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div class="xl:col-span-6 col-span-12">
          <Card class="overflow-hidden rounded-2xl">
            <CardHeader class="pb-0">
              <div class="flex items-start justify-between gap-4">
                <CardTitle>Inventory</CardTitle>

                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon"
                      class="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                      <EllipsisVertical class="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" class="w-36 rounded-xl p-2">
                    <DropdownMenuItem class="rounded-lg" @click="fetchInventoryStats">
                      Refresh
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
              <InventoryChart :filterType="chartFilter.type" />
            </CardContent>
          </Card>
        </div>
      </div>

    </main>
  </div>

  <Dialog v-model:open="gradeDialogOpen">
    <DialogContent class="max-w-2xl">
      <!-- HEADER -->
      <div class="mb-3">
        <p class="text-sm text-muted-foreground">Total - {{ selectedMaterial }}</p>
        <p class="text-xl font-semibold">
          {{ formatShortNumber(selectedGrade?.total_ore || 0) }}
        </p>
      </div>

      <!-- GRID DETAIL -->
      <div v-if="selectedGrade" class="grid grid-cols-2 gap-3">

        <div class="rounded-xl border p-3">
          <p class="text-muted-foreground text-sm">Ni</p>
          <p class="text-sm font-medium">{{ n2(selectedGrade.ni) }}</p>
        </div>

        <div class="rounded-xl border p-3">
          <p class="text-muted-foreground text-sm">Fe</p>
          <p class="text-sm font-medium">{{ n2(selectedGrade.fe) }}</p>
        </div>

        <div class="rounded-xl border p-3">
          <p class="text-muted-foreground text-sm">MgO</p>
          <p class="text-sm font-medium">{{ n2(selectedGrade.mgo) }}</p>
        </div>

        <div class="rounded-xl border p-3">
          <p class="text-muted-foreground text-sm">SiO₂</p>
          <p class="text-sm font-medium">{{ n2(selectedGrade.sio2) }}</p>
        </div>

        <div class="rounded-xl border p-3">
          <p class="text-muted-foreground text-sm">Co</p>
          <p class="text-sm font-medium">{{ n2(selectedGrade.co) }}</p>
        </div>

        <div class="rounded-xl border p-3">
          <p class="text-muted-foreground text-sm">SM</p>
          <p class="text-sm font-medium">{{ n2(selectedGrade.sm) }}</p>
        </div>

      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, watch } from 'vue'
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

const ChartLim = defineAsyncComponent(() => import('@/modules/dashboard/geology/grade/ChartLim.vue'))
const ChartSap = defineAsyncComponent(() => import('@/modules/dashboard/geology/grade/ChartSap.vue'))


const QualityChart = defineAsyncComponent(() => import('@/modules/dashboard/geology/Chart.vue'))
const QualityClassOre = defineAsyncComponent(() => import('@/modules/dashboard/geology/ClassOre.vue'))
const InventoryChart = defineAsyncComponent(() => import('@/modules/dashboard/inventory/Chart.vue'))

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


type OreClassItem = {
  label: string
  percent: number
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


const oreClassPercents = ref<OreClassItem[]>([])

const dataList = ref<{ label: string; percent: number; value: string; color: string }[]>([])
const chartKey = ref(0)

const activeGradeTab = ref<'lim' | 'sap'>('lim')

const activeGradeTitle = computed(() =>
  activeGradeTab.value === 'lim' ? 'Grade by Limonite' : 'Grade by Saprolite'
)



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
  path: '/dashboard/detail_quality',
  query: buildFilterQuery(chartFilter),
}))

function handleProductionViewDetails() {
  router.push(productionDetailRoute.value)
}


async function fetchReserveSummary(): Promise<void> {
  try {
    reserveSummary.value = await getApi('/api/analytics/raw/mining/reserve/')
  } catch (error) {
    console.error('Gagal ambil data Reserve Summary:', error)
    reserveSummary.value = {}
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


const statsIventory = ref<Record<string, any>>({})
async function fetchInventoryStats(): Promise<void> {
  try {
    statsIventory.value = await getApi('/api/analytics/raw/inventory/summary/')
  } catch (error) {
    console.error('Gagal ambil data inventory summary:', error)
    statsIventory.value = {}
  }
}

const gradePds = ref<Record<string, any>>({})

async function fetchGradePds(): Promise<void> {
  try {

    const data = await getApi<any>(
      '/api/analytics/raw/inventory/grade-roa/',
    )

    const limData = data?.data?.find((item: any) => item.nama_material === 'LIM')
    const sapData = data?.data?.find((item: any) => item.nama_material === 'SAP')

    gradePds.value = {
      lim: limData ?? {},
      sap: sapData ?? {},
    }

  } catch (error) {
    console.warn('Gagal fetch inventory grade:', error)
    gradePds.value = {
      lim: {},
      sap: {},
    }
  }
}

const gradeDialogOpen = ref(false)
const selectedGrade = ref<Record<string, any> | null>(null)
const selectedMaterial = ref('')

function openGradeDialog(material: 'LIM' | 'SAP') {
  selectedMaterial.value = material === 'LIM' ? 'Limonite' : 'Saprolite'
  selectedGrade.value = material === 'LIM' ? gradePds.value.lim : gradePds.value.sap
  gradeDialogOpen.value = true
}

function n2(value: any) {
  return Number(value || 0).toFixed(2)
}
async function fetchAllDashboardData() {
  if (!chartFilter.type) return

  isLoading.value = true

  try {
    await Promise.all([
      fetchReserveSummary(),
      fetchQualityStats(),
      fetchInventoryStats(),
      fetchGradePds(),
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