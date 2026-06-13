<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useChartFilterStore } from "~/stores/filters/chart-filter"
import { useApi } from "@/composables/useApi"

const ChartDetail = defineAsyncComponent(
  () => import("@/modules/dashboard/mining/ChartDetail.vue"),
)

const route = useRoute()
const chartFilter = useChartFilterStore()
const { request } = useApi()

const filterType = computed(() =>
  String(route.query.filter_type || chartFilter.type || "monthly"),
)

type SeriesItem = {
  name: string
  data: number[]
}

type DetailResponse = {
  x_data: string[]
  total_actual: number[]
  total_plan: number[]
  achievement: number[]

  series_groups: Record<string, SeriesItem[]>

  series_plan_groups?: Record<string, SeriesItem[]>

  grand_total: {
    total?: number
    plan?: number
    achievement?: number
    avg?: number
    groups?: Record<string, number>
    materials?: Record<string, number>

    plan_groups?: Record<string, number>
    plan_materials?: Record<string, number>
  }
}

type ChartCard = {
  key: string
  title: string
  groupName: string
  series: SeriesItem[]
  actual: number
  plan: number
  achievement: number
}

const loading = ref(false)
const chartData = ref<DetailResponse | null>(null)

function cleanQuery(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  )
}

function formatShortNumber(num: number | string | null | undefined) {
  const n = Number(num || 0)
  return Intl.NumberFormat("en", { notation: "compact" }).format(n)
}

function safeAch(actual: number, plan: number) {
  return plan > 0 ? Number(((actual / plan) * 100).toFixed(1)) : 0
}

function buildQuery() {
  const query: Record<string, any> = {
    filter_type: filterType.value,
  }

  if (chartFilter.iup_id) {
    query.iup_id = chartFilter.iup_id
  }

  switch (filterType.value) {
    case "daily":
      if (chartFilter.date) query.filter_date = chartFilter.date
      break

    case "weekly":
      if (chartFilter.year) query.year = chartFilter.year
      if (chartFilter.week) query.week = chartFilter.week
      break

    case "monthly":
      if (chartFilter.year) query.year = chartFilter.year
      if (chartFilter.month?.value) query.month = chartFilter.month.value
      break

    case "range":
      if (chartFilter.range.start && chartFilter.range.end) {
        query.date_start = chartFilter.range.start
        query.date_end = chartFilter.range.end
      }
      break

    case "yearly":
      if (chartFilter.year) query.year = chartFilter.year
      break

    case "all":
      break
  }

  return cleanQuery(query)
}

async function fetchChartData() {
  loading.value = true

  try {
    const data = await request<DetailResponse>(
      "/api/analytics/raw/mining/chart/details/",
      {
        method: "GET",
        query: buildQuery(),
      },
    )

    chartData.value = data
  } catch (error) {
    console.warn("❌ Gagal fetch detail mining chart:", error)
    chartData.value = null
  } finally {
    loading.value = false
  }
}

/**
 * Ore = 1 card gabungan
 * Non Ore = pecah per material jadi beberapa card
 */
const cards = computed<ChartCard[]>(() => {
  const data = chartData.value
  if (!data?.series_groups) return []

  const result: ChartCard[] = []
  const xLength = data.x_data?.length ?? 0

  for (const [groupName, series] of Object.entries(data.series_groups)) {
    const normalizedGroup = groupName.toLowerCase().trim()

    // if (normalizedGroup === "ore") {
    //   const actual = Number(data.grand_total?.groups?.[groupName] ?? 0)
    //   const plan = Number(data.grand_total?.plan ?? 0)

    //   result.push({
    //     key: "ore",
    //     title: "Ore Movements",
    //     groupName,
    //     series,
    //     actual,
    //     plan,
    //     achievement: safeAch(actual, plan),
    //   })

    //   continue
    // }
    if (normalizedGroup === "ore") {
    const actualSeries = series.reduce<number[]>((acc, item) => {
        item.data.forEach((value, index) => {
        acc[index] = (acc[index] || 0) + Number(value || 0)
        })
        return acc
    }, [])

    const actual = actualSeries.reduce((sum, value) => sum + Number(value || 0), 0)
    const plan = Number(data.grand_total?.plan ?? 0)

    result.push({
        key: "ore",
        title: "Ore Movements",
        groupName,
        series: [
        {
            name: "Actual",
            data: actualSeries,
        },
        ],
        actual,
        plan,
        achievement: safeAch(actual, plan),
    })

    continue
    }
    /**
     * Non Ore dan group lainnya:
     * pecah per material.
     */
    for (const item of series) {
      const actual = item.data.reduce((sum, v) => sum + Number(v || 0), 0)

      const planSeries = data.series_plan_groups?.[groupName]?.find(
        p => p.name === item.name
        )

        const plan = planSeries
        ? planSeries.data.reduce((sum, v) => sum + Number(v || 0), 0)
        : 0

        const achievement =
        plan > 0
            ? Number(((actual / plan) * 100).toFixed(1))
            : 0

        result.push({
        key: `${groupName}-${item.name}`,
        title: `${item.name} Movements`,
        groupName,
        series: [item],
        actual,
        plan,
        achievement,
        })
    }
  }

  const orderMap: Record<string, number> = {
    ore: 1,
    "top soil": 2,
    topsoil: 2,
    ob: 3,
    waste: 4,
    quarry: 5,
    ballast: 6,
    biomass: 7,
    others: 99,
    other: 99,
  }

  result.sort((a, b) => {
    const aKey = a.title
      .replace(" Movements", "")
      .toLowerCase()
      .trim()

    const bKey = b.title
      .replace(" Movements", "")
      .toLowerCase()
      .trim()

    const aOrder = orderMap[aKey] ?? 50
    const bOrder = orderMap[bKey] ?? 50

    if (aOrder !== bOrder) return aOrder - bOrder

    return a.title.localeCompare(b.title)
  })

  return result
})
onMounted(fetchChartData)

watch(
  () => [
    filterType.value,
    chartFilter.date,
    chartFilter.month?.value,
    chartFilter.week,
    chartFilter.year,
    chartFilter.range.start,
    chartFilter.range.end,
    chartFilter.iup_id,
  ],
  fetchChartData,
)

function achievementStatus(achievement: number, plan: number) {
  if (!plan || plan <= 0) {
    return {
      textClass: "text-muted-foreground",
      badgeClass: "bg-muted text-muted-foreground",
      icon: "●",
    }
  }

  if (achievement >= 80) {
    return {
      textClass: "text-emerald-600",
      badgeClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40",
      icon: "▲",
    }
  }

  return {
    textClass: "text-red-600",
    badgeClass: "bg-red-50 text-red-600 dark:bg-red-950/40",
    icon: "▼",
  }
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <div class="mb-2">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">
        Detail Mining
      </h1>
    </div>

    <main class="flex flex-1 flex-col gap-4 md:gap-6">
      <div v-if="loading" class="text-sm text-muted-foreground">
        Loading chart detail...
      </div>

      <div
        v-else
        class="grid grid-cols-12 gap-6"
      >
        <Card
          v-for="card in cards"
          :key="card.key"
          class="col-span-12 overflow-hidden px-2 xl:col-span-6"
        >
          <CardHeader>
            <div class="flex w-full flex-col items-start justify-between gap-4 md:flex-row">
              <div class="flex flex-col gap-1">
                <CardTitle>{{ card.title }}</CardTitle>
                <p class="text-xs text-muted-foreground">
                  {{ card.groupName }}
                </p>
              </div>

              <div class="flex w-full divide-x divide-gray-300 text-sm dark:divide-gray-700 md:w-auto">
                <div class="px-4 py-2">
                  <p class="text-gray-500 dark:text-gray-400">Actual</p>
                  <p class="text-lg font-semibold text-gray-800 dark:text-white">
                    {{ formatShortNumber(card.actual) }}
                  </p>
                </div>

                <div class="px-4 py-2">
                  <p class="text-gray-500 dark:text-gray-400">Plan</p>
                  <p class="text-lg font-semibold text-gray-800 dark:text-white">
                    {{ formatShortNumber(card.plan) }}
                  </p>
                </div>

                <!-- <div class="px-4 py-2">
                  <p class="text-gray-500 dark:text-gray-400">Ach</p>
                  <p class="text-lg font-semibold text-gray-800 dark:text-white">
                    {{ formatShortNumber(card.achievement) }}%
                  </p>
                </div> -->
                <div class="px-4 py-2">
                <p class="text-gray-500 dark:text-gray-400">Ach</p>

                <div
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-lg font-semibold"
                    :class="achievementStatus(card.achievement, card.plan).badgeClass"
                >
                    <span>
                    {{ formatShortNumber(card.achievement) }}%
                    </span>

                    <span class="text-xs leading-none">
                    {{ achievementStatus(card.achievement, card.plan).icon }}
                    </span>
                </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent class="overflow-hidden overflow-x-auto">
            <ChartDetail
              :filter-type="filterType"
              :x-data="chartData?.x_data ?? []"
              :series="card.series"
              :total-actual="chartData?.total_actual ?? []"
              :total-plan="chartData?.total_plan ?? []"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>

<style>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>