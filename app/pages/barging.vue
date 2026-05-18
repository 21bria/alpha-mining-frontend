<template>
  <div class="w-full flex flex-col gap-4 px-2 py-2">
    <main class="flex flex-1 flex-col gap-4 md:gap-6">
      <!-- BARGING ROW -->
      <div class="grid grid-cols-12 gap-6">
        <!-- Barging Overview -->
        <div class="xl:col-span-5 col-span-12">
          <Card class="h-full rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle>Barging Overview</CardTitle>
            </CardHeader>

            <CardContent>
              <div class="grid grid-cols-12 gap-6 items-center">
                <div class="col-span-12 md:col-span-5 pr-4 md:pr-6">
                  <BaseDonutChart :series="bargingDonutSeries" :labels="donutLabels" :colors="donutColors"
                    :height="220" />
                </div>

                <div class="col-span-12 md:col-span-7">
                  <!-- LIM & SAP -->
                  <div class="grid grid-cols-2 gap-6">
                    <div>
                      <p class="text-xs text-muted-foreground">Limonite</p>
                      <p class="text-2xl font-semibold">
                        {{ formatShortNumber(statsBarging.total_lim || 0) }}
                      </p>
                    </div>

                    <div class="text-right">
                      <p class="text-xs text-muted-foreground">Saprolite</p>
                      <p class="text-2xl font-semibold">
                        {{ formatShortNumber(statsBarging.total_sap || 0) }}
                      </p>
                    </div>
                  </div>
                  <!-- divider -->
                  <div class="border-t border-muted my-4"></div>
                  <!-- 3 KPI sejajar -->
                  <div class="grid grid-cols-2 gap-6">
                    <button type="button" class="text-left group" @click="openBargeList('barging')">
                      <p class="text-xs text-muted-foreground group-hover:text-primary">
                        No. Barge
                      </p>
                      <p class="text-xl font-semibold text-primary underline-offset-4 group-hover:underline">
                        {{ statsBarging.total_barge || 0 }}
                      </p>
                      <p class="mt-1 text-[11px] text-muted-foreground group-hover:text-primary">
                        Click for detail →
                      </p>
                    </button>
                    <div class="text-right">
                      <p class="text-xs text-muted-foreground">Avg MT</p>
                      <p class="text-xl font-semibold">
                        {{ formatShortNumber(statsBarging.avg_mt || 0) }}
                      </p>
                    </div>

                    <!-- <div class="text-right">
                      <p class="text-xs text-muted-foreground">Loading Time</p>
                      <p class="text-xl font-semibold">
                        {{ statsBarging.avg_loading_time || 0 }}
                        <span class="text-xs text-muted-foreground">h</span>
                      </p>
                    </div> -->
                  </div>

                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Barging Chart -->
        <div class="xl:col-span-7 col-span-12">
          <Card class="h-full overflow-hidden rounded-2xl">
            <CardHeader class="pb-0">
              <div class="flex items-start justify-between gap-4">
                <CardTitle>Barging Chart</CardTitle>

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
                    <DropdownMenuItem class="rounded-lg" @click="fetchBargingStats">
                      Refresh
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
              <BargingChart :filterType="chartFilter.type" />
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- SELLING ROW -->
      <div class="grid grid-cols-12 gap-6">
        <!-- Selling Overview -->
        <div class="xl:col-span-5 col-span-12">
          <Card class="h-full rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle>Selling Overview</CardTitle>
            </CardHeader>

            <CardContent>
              <div class="grid grid-cols-12 gap-6 items-center">
                <div class="col-span-12 md:col-span-5 pr-4 md:pr-6">
                  <BaseDonutChart :series="sellingDonutSeries" :labels="donutLabels" :colors="donutColors"
                    :height="220" />
                </div>

                <div class="col-span-12 md:col-span-7">

                  <div class="grid grid-cols-2 gap-6">
                    <div>
                      <p class="text-xs text-muted-foreground">Limonite</p>
                      <p class="text-2xl font-semibold">{{ formatShortNumber(statsSelling.total_lim || 0) }}</p>
                    </div>

                    <div class="text-right">
                      <p class="text-xs text-muted-foreground">Saprolite</p>
                      <p class="text-2xl font-semibold">{{ formatShortNumber(statsSelling.total_sap || 0) }}</p>
                    </div>
                  </div>
                  <div class="border-t border-muted my-3"></div>

                  <div class="grid grid-cols-2 gap-6">
                    <button type="button" class="text-left group" @click="openBargeList('selling')">
                      <p class="text-xs text-muted-foreground group-hover:text-primary">
                        No. Barge
                      </p>
                      <p class="text-xl font-semibold text-primary underline-offset-4 group-hover:underline">
                        {{ statsSelling.total_barge || 0 }}
                      </p>
                      <p class="mt-1 text-[11px] text-muted-foreground group-hover:text-primary">
                        Click for detail →
                      </p>
                    </button>

                    <div class="text-right">
                      <p class="text-xs text-muted-foreground">Avg MT</p>
                      <p class="text-2xl font-semibold">{{ formatShortNumber(statsSelling.avg_mt || 0) }}</p>
                    </div>
                  </div>

                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Selling Chart -->
        <div class="xl:col-span-7 col-span-12">
          <Card class="h-full overflow-hidden rounded-2xl">
            <CardHeader class="pb-0">
              <div class="flex items-start justify-between gap-4">
                <CardTitle>Selling Chart</CardTitle>

                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon"
                      class="shrink-0 rounded-full text-muted-foreground hover:text-foreground">
                      <EllipsisVertical class="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" class="w-36 rounded-xl p-2">
                    <DropdownMenuItem class="rounded-lg" @click="handleSellingViewDetails">
                      Details
                    </DropdownMenuItem>
                    <DropdownMenuItem class="rounded-lg" @click="fetchSellingStats">
                      Refresh
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent class="pt-0 pl-2 overflow-hidden overflow-x-auto">
              <SellingChart :filterType="chartFilter.type" />
            </CardContent>
          </Card>
        </div>
      </div>

    </main>
  </div>

  <Dialog v-model:open="openBargeDialog">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ bargeDialogTitle }}</DialogTitle>
      </DialogHeader>

      <div class="max-h-[400px] overflow-y-auto rounded-md border">
        <!-- Sticky Header -->
        <div
          class="sticky top-0 z-10 grid grid-cols-4 bg-background px-3 py-2 text-xs font-medium text-muted-foreground border-b">
          <div>Barge</div>
          <div class="text-right">Tonnage</div>
          <div class="text-right">LIM</div>
          <div class="text-right">SAP</div>
        </div>

        <!-- Rows -->
        <div v-for="b in selectedBarges" :key="b.barge_code" class="grid grid-cols-4 px-3 py-2 border-b text-sm">
          <div>{{ b.barge_code }}</div>
          <div class="text-right">{{ formatShortNumber(b.tonnage) }}</div>
          <div class="text-right">{{ formatShortNumber(b.lim || 0) }}</div>
          <div class="text-right">{{ formatShortNumber(b.sap || 0) }}</div>
        </div>

        <div v-if="!selectedBarges.length" class="text-center py-4 text-sm text-muted-foreground">
          No data
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, watch } from 'vue'
import { Activity, EllipsisVertical } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import { useChartFilterStore } from '~/stores/filters/chart-filter'
import { useApi } from '@/composables/useApi'
import { formatShortNumber } from '@/utils/formatter'
import { buildFilterQuery } from '@/utils/filter-query'
import BaseDonutChart from '@/components/ui/apex-chart/BaseDonutChart.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Button } from '@/components/ui/button'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const { request } = useApi()
const router = useRouter()
const route = useRoute()
const chartFilter = useChartFilterStore()

type FilterType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'range' | 'all'

type BargeDetail = {
  barge_code: string
  tonnage: number
  lim?: number
  sap?: number
}

type BargingSellingStats = {
  total_lim: number
  total_sap: number
  total_ore: number
  total_barge?: number
  avg_mt?: number
  avg_loading_time?: number
  barges?: BargeDetail[]
}

const defaultStats: BargingSellingStats = {
  total_lim: 0,
  total_sap: 0,
  total_ore: 0,
  total_barge: 0,
  avg_mt: 0,
  avg_loading_time: 0,
}

const openBargeDialog = ref(false)
const bargeDialogTitle = ref('')
const selectedBarges = ref<any[]>([])

function openBargeList(type: 'barging' | 'selling') {
  if (type === 'barging') {
    bargeDialogTitle.value = 'Barging Barge Detail'
    selectedBarges.value = statsBarging.value?.barges || []
  } else {
    bargeDialogTitle.value = 'Selling Barge Detail'
    selectedBarges.value = statsSelling.value?.barges || []
  }

  openBargeDialog.value = true
}
const bargingDonutSeries = computed(() => [
  Number(statsBarging.value.total_lim || 0),
  Number(statsBarging.value.total_sap || 0),
])

const sellingDonutSeries = computed(() => [
  Number(statsSelling.value.total_lim || 0),
  Number(statsSelling.value.total_sap || 0),
])

const donutLabels = ['Limonite', 'Saprolite']
const donutColors = ['#f1b100', '#10b981']
const BargingChart = defineAsyncComponent(() => import('@/modules/dashboard/barging/Chart.vue'))
const SellingChart = defineAsyncComponent(() => import('@/modules/dashboard/selling/Chart.vue'))

const isLoading = ref(false)
const statsBarging = ref<BargingSellingStats>({ ...defaultStats })
const statsSelling = ref<BargingSellingStats>({ ...defaultStats })

function syncFilterFromRoute() {
  const q = route.query

  if (!q.filter_type) return

  chartFilter.apply({
    type: String(q.filter_type) as FilterType,
    year: q.year ? Number(q.year) : undefined,
    month: q.month ? Number(q.month) : undefined,
    week: q.week ? String(q.week) : undefined,
    date: q.filter_date ? String(q.filter_date) : '',
    range: {
      start: q.date_start ? String(q.date_start) : '',
      end: q.date_end ? String(q.date_end) : '',
    },
    iup_id: q.iup_id ? String(q.iup_id) : null,
  })
}

const apiFilters = computed(() => buildFilterQuery(chartFilter))

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

function handleBargingViewDetails() {
  router.push({
    path: '/dashboard/detail_barging',
    query: buildFilterQuery(chartFilter),
  })
}

function handleSellingViewDetails() {
  router.push({
    path: '/dashboard/detail_selling',
    query: buildFilterQuery(chartFilter),
  })
}

async function fetchBargingStats(): Promise<void> {
  try {
    const data = await getApi<BargingSellingStats>('/api/analytics/raw/barging/summary/')
    statsBarging.value = data || { ...defaultStats }
  } catch (error) {
    console.error('Gagal ambil data barging summary:', error)
    statsBarging.value = { ...defaultStats }
  }
}

async function fetchSellingStats(): Promise<void> {
  try {
    const data = await getApi<BargingSellingStats>('/api/analytics/raw/barging/summary-selling/')
    statsSelling.value = data || { ...defaultStats }
  } catch (error) {
    console.error('Gagal ambil data selling summary:', error)
    statsSelling.value = { ...defaultStats }
  }
}
async function fetchBargingOverview(): Promise<void> {
  try {
    const data = await getApi<BargingSellingStats>(
      '/api/analytics/raw/barging/summary-overview/'
    )

    statsBarging.value = {
      ...statsBarging.value,
      ...data,
    }
  } catch (error) {
    console.error('Gagal ambil barging overview:', error)
  }
}

async function fetchSellingOverview(): Promise<void> {
  try {
    const data = await getApi<BargingSellingStats>(
      '/api/analytics/raw/barging/summary-overview-selling/'
    )

    statsSelling.value = {
      ...statsSelling.value,
      ...data,
    }
  } catch (error) {
    console.error('Gagal ambil selling overview:', error)
  }
}

async function fetchAllDashboardData() {
  if (!chartFilter.type) return

  isLoading.value = true

  try {
    await fetchBargingStats()
    await fetchSellingStats()

    await fetchBargingOverview()
    await fetchSellingOverview()

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